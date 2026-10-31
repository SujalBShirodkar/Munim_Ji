# Munim Ji — AI Business Partner for Every Paytm Merchant

> **Paytm AI Hackathon 2026** · Problem Track: *Merchant Growth AI* (Difficulty: Medium)  
> **Team VsV:** Vansh Kothari, Sujal Shirodkar, Vaibhav Gala  
> **Tagline:** *From digital payments to intelligent business growth.*  
> **Core Loop:** **UNDERSTAND → DECIDE → ACT → MEASURE**

---

## 1. What is Munim Ji?

For millions of Indian kiranas, chai stalls, and small retailers, accepting digital payments via the Paytm QR & Soundbox has become second nature. But while large retail chains have CFOs, inventory analysts, and bulk procurement power, small merchants remain on their own.

**Munim Ji** ("munim" = traditional Indian shop accountant) transforms Paytm from a payment utility into a **trusted, voice-first business partner**.

```
                ┌───────────────────────────────────────┐
                │          UNDERSTAND (Voice)           │
                │  "Kal ki bikri kitni thi?" → ₹8,400   │
                └──────────────────┬────────────────────┘
                                   │
                                   ▼
                ┌───────────────────────────────────────┐
                │          DECIDE (Simulator)           │
                │ "Chai ₹2 mehngi karu toh kya hoga?"   │
                │   → Low/Base/High Uncertainty Ranges  │
                └──────────────────┬────────────────────┘
                                   │
                                   ▼
                ┌───────────────────────────────────────┐
                │             ACT (Execute)             │
                │ • Pooled Buying (Save ₹45/bag)        │
                │ • Instant Credit (Auto-repays 20%)    │
                └──────────────────┬────────────────────┘
                                   │
                                   ▼
                ┌───────────────────────────────────────┐
                │         MEASURE (Impact & ROI)        │
                │   ✓ Measured vs ✦ Illustrative Bachat │
                └───────────────────────────────────────┘
```

---

## 2. Core Pillars & Architecture

| Pillar | Capability | Technical Engine |
|---|---|---|
| **Daily Partner** | Voice-first assistant for sales summaries, settlements, inventory alerts, and briefings | Groq (Llama 3.3 70B tool calling), Deepgram Nova-3 (STT), Cartesia (TTS) |
| **What-If Simulator** | Decision support for price adjustments and extended hours with uncertainty ranges | Python + pandas + category elasticity models (`config/elasticity.yaml`) |
| **Pooled Buying** | Aggregates demand from nearby shops within 5 km to unlock wholesale tiered pricing | Google OR-Tools (MIP / CP-SAT), MongoDB 2dsphere geo-queries |
| **Instant Credit** | Working capital advance that repays itself via **20% auto-deduction** on QR sales | Simulated NBFC partner (`MockNBFC`), Paytm Webhook integration, idempotent ledger |
| **Savings Dashboard** | Measurable proof of value separating **Measured** vs **Illustrative** savings | Deterministic savings ledger with full audit traceability |

---

## 3. Technology Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion (Mobile-first PWA with desktop dashboard view)
- **Backend:** Python 3.12 + FastAPI (async, Pydantic v2 models, modular routers)
- **Database:** MongoDB 7.0 (with Motor async driver, 2dsphere geo indexes)
- **LLM:** Groq API (function/tool calling loop, deterministic fallback)
- **Voice Pipeline:** Deepgram live STT, Cartesia streaming TTS
- **Payments:** Paytm Payment Gateway Sandbox (Initiate Transaction, Status API, Refund API, Webhooks with HMAC-SHA256 signature verification)
- **Optimization:** Google OR-Tools

---

## 4. Quick Start (Run Locally in 1 Command)

### Prerequisites
- Python 3.11+
- Node.js 18+ (or use portable `.tools/node` included)
- MongoDB 7.0 (or run via Docker)

### Option A: Windows 1-Click Startup (Fastest)

If you are on Windows, helper batch files are preconfigured in the project root:

```cmd
:: 1-click start MongoDB, Backend, and Frontend in separate windows
run_all.bat
```

Or run individual services:
- `start_mongo.bat` — Starts the bundled local MongoDB on port 27017
- `seed_data.bat` — Seeds the database (Sharma Store, ₹8,400 yesterday sales)
- `start_backend.bat` — Starts FastAPI server on http://localhost:8000
- `start_frontend.bat` — Starts Next.js app on http://localhost:3000

### Option B: Standard Manual Startup

```bash
# 1. Clone repository & install backend dependencies
git clone https://github.com/vsv/munim-ji.git
cd munim-ji
pip install -r backend/requirements.txt

# 2. Seed database (creates Sharma Store with yesterday = ₹8,400)
python scripts/seed.py

# 3. Start Backend Server (runs on http://localhost:8000)
$env:PYTHONPATH="backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# 4. In a second terminal, start Frontend (runs on http://localhost:3000)
cd frontend
npm install
npm run dev
```

### Option C: Docker Compose

```bash
docker compose up --build
# In a separate terminal run the seed script:
python scripts/seed.py
```

Open **`http://localhost:3000`** in your browser. Demo login credentials:  
- **Phone:** `+919876543210`  
- **Demo OTP:** `123456`  

---

## 5. Live Demo Walkthrough (Acceptance Verification)

1. **Morning Voice Briefing:**
   - Tap the audio button on the bulletin card on the Home screen.
   - Munim Ji speaks: *"Namaste Sharma ji! Kal Paytm par ₹8,400 ki bikri hui..."*
   - Matches the database records down to the exact rupee.
2. **UNDERSTAND (Voice Assistant):**
   - Navigate to `/ask` and ask: *"Kal ki bikri kitni thi?"*
   - Spoken response: *"Kal ke Paytm transactions ₹8,400 the, jisme kul 34 bikriyan hui thi."*
3. **DECIDE (What-If Simulator):**
   - Ask: *"Agar main chai ₹2 mehngi kar du toh kya hoga?"*
   - Open `/whatif`: Review the 3-scenario range: **Conservative (₹1,050) / Base (₹1,220) / Optimistic (₹1,360)**.
   - Adjust price and elasticity sliders to see live recomputation.
4. **ACT (Pooled Buying & Paytm Sandbox Checkout):**
   - Open `/pool/go_sugar_active_001` (Sugar pool: 9/12 shops joined, 72/100 bags met).
   - Tap **"Confirm & Pay via Paytm Sandbox"**:
   - Explicit consent sheet shows ₹16,025 total payable with ₹1,175 estimated bachat.
   - Complete checkout via Paytm Sandbox.
5. **ACT & MEASURE (Instant Credit & 20% Auto-Repayment):**
   - Open `/credit`: Pre-approved limit ₹5,000, current balance ₹3,320.
   - Open `/pay/merchant_sharma_001` in another tab and simulate a customer paying ₹100 via Paytm.
   - The soundbox announces: *"Paytm par ₹100 prapt hue"*.
   - The Paytm webhook fires and **auto-deducts 20% (₹20)** toward the credit loan!
   - Refresh `/credit`: Outstanding immediately drops from ₹3,320 to ₹3,300!
6. **MEASURE (Savings Dashboard):**
   - Open `/savings`: Shows **✓ Measured Savings** (₹1,968 from delivered tea group) and **✦ Illustrative Savings** (₹45/bag from active sugar pool).

---

## 6. What is Real vs. Mocked

- **Real & Tested:**
  - Full Next.js PWA + FastAPI async architecture
  - MongoDB 2dsphere geo-matching & compound indexing
  - Google OR-Tools wholesale quantity & tier optimization
  - Deterministic Python/pandas analytics tools
  - Paytm Payment Gateway staging integration (signature generation, status API, webhooks)
  - 20% auto-deduction repayment ledger & idempotency
- **Mocked / Simulated (By Design):**
  - **NBFC Partner:** Real lending requires an RBI-regulated entity. `MockNBFC` simulates the exact Key Facts Statement and repayment mechanics with visible *"Demo — no real loan"* badges.
  - **SMS OTP:** Demo accepts `123456` to avoid SMS provider costs.
  - **Supplier Dispatch:** Manual actions in the `/supplier` portal simulate distributor warehouse dispatches.

---

## 7. Security & Compliance Baseline

- **Strict Staging Guard:** Backend aborts startup if pointed to production Paytm hosts without `ALLOW_PRODUCTION=true`.
- **Server-Side Checksums:** All Paytm transactions and webhooks are validated on the backend.
- **Scoping & Consent:** LLM cannot invent or inject merchant IDs. Explicit merchant confirmation is mandatory for joins and loans.
- **Audit Logging:** Every state transition, payment, and consent write is permanently recorded in `audit_logs`.

---

## 8. Documentation Links

- [Step-by-Step Cloud & VPS Deployment Guide](file:///docs/deployment-guide.md)
- [Paytm Sandbox Testing Guide](file:///docs/paytm-testing.md)
- [4-Minute Live Demo Script](file:///docs/demo-script.md)
- [Decision Log & Skills Sheet](file:///skills.md)

---
*Built with ❤️ by Team VsV for the Paytm AI Hackathon 2026.*
