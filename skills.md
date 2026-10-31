# skills.md — Munim Ji Decision Log

Living record of **what we used, why we used it, and what we gave up**.
Team VsV · Paytm AI Hackathon · Problem: *Merchant Growth AI*.

Format: **Decision → What we used → Why → Alternatives → Trade-offs/Risks**
Append new entries at the bottom as the build progresses.

---

## A. Changes vs. the shortlisted solution deck

| Deck said | We use now | Reason |
|---|---|---|
| PostgreSQL | **MongoDB (Motor)** | Team choice; flexible schemas for evolving merchant/quote documents; native `2dsphere` geo queries for shop matching |
| Bhashini / AI4Bharat voice | **Deepgram (STT) + Cartesia (TTS)** | Team choice; production-grade streaming APIs, low latency, easy WebSocket integration |
| "Tool-calling LLM" (unspecified) | **Groq** | Very low inference latency, which matters most in a voice loop; supports tool calling |
| Payments not specified | **Paytm Payment Gateway sandbox** | Needed for real, testable payment flows (group-order payments, customer→merchant payments, refunds) |

---

## B. Decisions

### 1. Principle: LLM explains, code calculates
- **What:** All numbers come from deterministic Python tools (pandas / OR-Tools / ledger code). The LLM only selects tools and phrases the result.
- **Why:** Merchants make money decisions on these numbers; hallucinated figures destroy trust. Also makes outputs testable.
- **Alternatives:** Letting the LLM reason over raw data (rejected — inconsistent, un-auditable).
- **Trade-off:** More tool engineering up front; far safer and easier to verify.

### 2. Frontend: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Framer Motion, as a PWA
- **Why:** Matches the deck (React/Next.js); PWA gives an installable, app-like feel for merchants with no store install; Tailwind + shadcn speed up a polished, custom design; Framer Motion powers the signature animations (Munim orb, count-ups).
- **Alternatives:** React Native/Flutter (better native feel, but slower to build and demo in a hackathon), plain React SPA (loses SSR/routing conveniences).
- **Trade-off:** PWA mic/audio quirks on iOS Safari; mitigated by text fallback.

### 3. Backend: Python 3.11 + FastAPI (async)
- **Why:** Python is the natural home for pandas, scikit-learn and OR-Tools; FastAPI gives async I/O (needed for WebSocket voice streaming), Pydantic validation and auto OpenAPI docs.
- **Alternatives:** Node/Express (would need a separate Python service for analytics/optimization).
- **Trade-off:** Two languages across the stack (TS + Python); accepted for the data/optimization libraries.

### 4. Database: MongoDB with Motor
- **Why:** Team requirement; document model suits nested items in transactions, tiered supplier quotes, and group-order state history; `$geoNear` + `2dsphere` handles "shops within 5 km" matching.
- **Money handling:** integers in **paise** to avoid float errors.
- **Alternatives:** PostgreSQL + PostGIS (stronger transactions/joins — the original plan).
- **Trade-off / Risk:** Multi-document consistency (e.g., payment + member status + ledger) must be handled carefully → use idempotency keys, unique indexes, and Mongo transactions (replica set) for critical flows. `docker-compose` runs Mongo as a single-node replica set to enable transactions.

### 5. LLM: Groq (tool-calling, Llama 3.x 70B-class), with a smaller model for cheap routing
- **Why:** Lowest latency in the voice loop; native function calling; good Hindi/Hinglish for short responses.
- **Config:** Model IDs from env (`GROQ_MODEL_MAIN`, `GROQ_MODEL_FAST`) because Groq rotates models.
- **Guardrails:** Strict JSON output schema, max 4 tool calls/turn, timeout, injection-safe prompts, `merchant_id` injected server-side.
- **Alternatives:** Larger proprietary models (higher quality but slower/costlier for real-time voice).
- **Risk:** Model quality variance in code-switched Hindi → clarify-on-low-confidence behaviour.

### 6. Speech-to-Text: Deepgram (streaming WebSocket, Nova-3 class)
- **Why:** Streaming interim results give instant on-screen transcript; endpointing for hands-free turn-taking; supports Hindi and English-India.
- **Design:** Browser → backend WebSocket → Deepgram (backend holds the API key; never expose it to the client).
- **Risk:** Noisy shop environments reduce accuracy (also called out in the deck) → confidence threshold, clarification prompts, push-to-talk, text fallback, and per-turn STT metrics stored for evaluation.

### 7. Text-to-Speech: Cartesia (streaming, Sonic family)
- **Why:** Very low time-to-first-audio and natural voices; streaming lets us start playback before the full sentence is generated.
- **Design:** Only `spoken_text` (≤2 short sentences) is synthesized; `display_text` carries detail. Supports barge-in.
- **Risk:** Hindi/Hinglish voice quality depends on chosen voice → pick and test voices early; fallback to browser `speechSynthesis` if the API fails.

### 8. Payments: Paytm Payment Gateway (staging) behind a `PaymentProvider` interface
- **What:** Initiate Transaction → JS Checkout → checksum-verified callback/webhook → Transaction Status confirm → Refund API for failed pools.
- **Why:** Real sandbox flows make the pooled-buying and credit-repayment demos genuine. The interface keeps Paytm swappable and allows a `mock` mode for offline UI work.
- **Security decisions:** server-side checksum generation/verification, always confirm via Status API, amount match, idempotency by order/txn ID, redacted integration logs, staging-host guard.
- **Funds model (MVP):** collect each member's share only after they confirm; auto-refund everyone if the group fails by the deadline. *Production would require a compliant escrow/nodal arrangement — documented as future work.*
- **Risk:** Paytm API parameters evolve → builder must follow current official docs and log deviations here.

### 9. Customer-pay page (`/pay/[merchantId]`)
- **Why:** The sandbox has no real shoppers. A public pay page lets us generate genuine sandbox transactions + webhooks to power sales analytics and the credit auto-repayment demo.
- **Trade-off:** Demo-only surface; clearly labelled "Sandbox".

### 10. Pooled buying: geo matching + OR-Tools optimizer + explicit state machine
- **Matching:** same SKU/unit/grade, within radius (default 5 km), compatible delivery window, active quote coverage.
- **Optimizer (OR-Tools CP-SAT/MIP):** choose supplier/tier and per-merchant quantities to minimize landed cost subject to MOQ, per-merchant limits, delivery fee split proportional to quantity.
- **State machine:** `OPEN → THRESHOLD_MET → AWAITING_CONFIRMATION → PAYMENT_PENDING → CONFIRMED → DISPATCHED → DELIVERED → SETTLED` (+ `EXPIRED / CANCELLED / REFUNDING`).
- **Why:** Money + multiple parties = explicit states and logged transitions prevent inconsistent outcomes; optimizer gives defensible, explainable savings.
- **Consent:** each merchant must tap **Confirm & Pay**; voice can only open the card.
- **Savings labelling:** *Illustrative* before delivery, *Measured* after (baseline cost − actual group cost incl. fees).

### 11. What-If Simulator: deterministic engine with ranges
- **What:** pandas on merchant history; fall back to category elasticity ranges (`elasticity.yaml`) when data is thin. Always return Low/Base/High + assumptions + missing data + confidence.
- **Why:** Honest uncertainty (as the deck promises) instead of fake point predictions; editable assumptions build understanding and trust.
- **Alternatives:** ML forecasting (rejected for MVP — insufficient per-merchant data; scikit-learn used only where data supports).

### 12. Instant Credit: simulated NBFC (`MockNBFC`) with real repayment mechanics
- **What:** transparent eligibility rules → Key Facts Statement → consent → mock disbursal → auto-deduct **20% of each successful payment** via the payment webhook, idempotent per payment.
- **Why:** Real lending needs a regulated partner; the MVP proves the *mechanics and UX* without pretending to lend real money. Visible "Demo — no real loan" tags.
- **Illustrative math:** `days ≈ outstanding / (rate × avg daily collections)` → 5,000 / (0.20 × 8,400) ≈ 2.98 ≈ ~3 days.
- **Risk:** Regulatory/compliance needs (RBI digital lending norms, partner contracts) are out of scope; documented as future work.

### 13. Design direction: "Digital Khata"
- **What:** Pro-fintech layout (bottom nav, card-first, big numerals) with a distinct identity: ledger-ruled cards, turmeric Munim Ji orb docked in the nav, rupee-coin progress rings, "Bachat" ribbons, Hinglish microcopy.
- **Why:** Must feel as trustworthy as Paytm/PhonePe/GPay yet recognisable and different; the ledger metaphor connects with how small merchants already think (khata/bahi).
- **Accessibility:** large tap targets, high contrast, Devanagari font, language toggle, icon+label, voice alternatives for key actions.
- **Alternatives:** Cloning a mainstream payment-app look (rejected — undifferentiated; could imply Paytm endorsement).

### 14. Security & privacy baseline
- JWT in httpOnly cookies, RBAC, merchant-scoped queries, rate limiting, consent + audit logs, hashed customer refs, masked PII in logs, transient audio only, secrets via env.
- **Why:** Payments + credit + personal data demand it, and the deck emphasizes consent and authorized data use.

### 15. Infra: docker-compose (mongo replica set, backend, frontend) + seed script
- **Why:** One-command setup for judges/teammates; deterministic demo data including **yesterday = ₹8,400** so the headline demo line is true to the DB.

### 16. Testing strategy
- pytest for analytics, simulator, optimizer, state machine, Paytm checksum, webhook idempotency, repayment math; Playwright smoke tests for the 4 headline flows.
- **Why:** Money paths and numbers must be provably correct; demos must not break on stage.

---

## C. Assumptions (update as they change)
- Item-level sales are partly merchant-entered or simulated, since payment records alone don't contain product detail (the deck's own problem statement).
- Supplier quotes are seeded/entered via the supplier portal; no real supplier integrations.
- Sandbox money is not real; settlements are simulated.
- Deepgram, Cartesia, Groq model/voice IDs and Paytm API details must be verified against current docs at build time.

## D. Open questions / Future work
- Real NBFC + RBI-compliant digital lending flow; real escrow for pooled funds.
- Regional languages (Marathi, Gujarati, Tamil, etc.); noisy-environment STT benchmarking.
- Fraud checks for collusive pools; supplier KYC and ratings from real deliveries.
- Munim Pro billing (₹149/month test price), commissions, brand partnerships.

## E. Build-time log (builder appends below)
<!-- Date · Decision · What · Why · Alternatives · Trade-offs -->

### 2026-10-31 · Scaffold & Portable Runtimes
- **Decision:** Bundled portable Node.js v20.18 and portable MongoDB v7.0.14 into `.tools/` for automated local execution.
- **Why:** The local host environment lacked global Node/MongoDB in system PATH; bundling portable runtimes provides guaranteed one-command execution without requiring host administrative installs.
- **Alternatives:** Requiring manual user software installs (rejected — friction for judges).
- **Trade-off:** Slightly larger initial workspace footprint (~500MB); zero setup friction.

### 2026-10-31 · Payment Integration & Sandbox Fallback
- **Decision:** Implemented `PaytmProvider` supporting both real Paytm Staging via HMAC-SHA256 signature verification and a clearly labelled offline mock mode (`PAYMENTS_MODE=mock`).
- **Why:** Allows full end-to-end testing of payments, group order settlements, and customer auto-repayments even when third-party staging credentials or network firewalls fluctuate.
- **Security Check:** Implemented strict production host block in `backend/app/core/config.py` (`ALLOW_PRODUCTION=false` aborts on `securegw.paytm.in`).

### 2026-10-31 · Guaranteed Yesterday Sales ₹8,400 Seed Determinism
- **Decision:** Structured `scripts/seed.py` with 34 realistic transactions distributed over peak morning, afternoon, and evening hours strictly summing to 840,000 paise (₹8,400.00).
- **Why:** Fulfills hackathon acceptance criteria #2: *"Asking 'Kal ki bikri kitni thi?' returns ₹8,400 from the DB"*.

### 2026-10-31 · Optimization Formulation (Google OR-Tools)
- **Decision:** Used OR-Tools MIP solver (`SCIP`/`GLOP`) in `services/pooling/optimizer.py` to evaluate tiered wholesale quotes and allocate per-merchant quantity and delivery fee shares.
- **Why:** Provides mathematically defensible volume pricing with fair proportional delivery fee splits and guaranteed positive merchant savings.

### 2026-10-31 · Frontend PWA Design Language ("Digital Khata")
- **Decision:** Built custom CSS ledger-ruling (`.khata-card`, `.khata-margin`), turmeric Munim Ji orb, Rupee-coin progress rings, and dual-style "Bachat" ribbons (Measured vs Illustrative).
- **Why:** Delivers a pro fintech appearance that feels distinct from mainstream apps while resonating with traditional Indian merchant bahi-khata mental models.
