# Munim Ji — 4-Minute Hackathon Live Demo Script

**Team:** VsV (Vansh Kothari, Sujal Shirodkar, Vaibhav Gala)  
**Problem Track:** Paytm AI Hackathon — Merchant Growth AI  
**Core Loop:** UNDERSTAND → DECIDE → ACT → MEASURE  

---

## Act 1: The Merchant Reality (0:00 – 0:45)
- **Setting the Scene:** Small kirana / tea stall merchant ("Sharma Chai & General Store", Andheri East).
- **The Problem:** He takes 50+ Paytm QR payments a day, but has no CFO. Big supermarkets get 15-20% bulk purchase discounts from FMCG distributors while he buys single bags at full retail price.
- **Show Home Screen:** Point out the "Digital Khata" design language (ledger-ruling, turmeric Munim Ji orb, Hindi/English toggle).
- **Morning Voice Briefing:** Tap the audio button on the bulletin card:
  - *"Namaste Sharma ji! Kal Paytm par ₹8,400 ki bikri hui..."*
  - Point to the live screen: yesterday's sales total = **exactly ₹8,400** from deterministic database records.

---

## Act 2: UNDERSTAND — Voice Assistant (0:45 – 1:30)
- Navigate to `/ask` or tap the central Turmeric Munim Ji Orb.
- **Voice / Text Interaction 1:**
  - Ask: *"Kal ki bikri kitni thi?"*
  - **Spoken response:** *"Kal ke Paytm transactions ₹8,400 the, jisme kul 34 bikriyan hui thi."*
  - Show the latency metrics chip (LLM latency ~300ms, total ~1.1s).
  - Highlight the core principle: The LLM did not do math; Python/pandas deterministic tools queried MongoDB and the LLM merely phrased the answer.

---

## Act 3: DECIDE — What-If Simulator (1:30 – 2:30)
- **Voice / Text Interaction 2:**
  - Ask: *"Agar main chai ₹2 mehngi kar du toh kya hoga?"*
  - Munim Ji replies: *"Chai ₹2 badhane par aapka rozana munafa ₹1,050 se ₹1,360 ke beech rehne ka anuman hai."*
  - Automatically pops up the **"Open What-If Simulator"** card.
- **Open `/whatif`:**
  - Show the 3-scenario range chart: **Conservative (₹1,050) / Base (₹1,220) / Optimistic (₹1,360)**.
  - Explain: *"We never show a single fake point prediction. We show honest uncertainty ranges."*
  - Move the Price Slider from +₹2 to +₹3: watch all three scenarios recalculate live!
  - Show the **Model Assumptions** and **"What data would make this better?"** panel.

---

## Act 4: ACT — Pooled Buying & Paytm Sandbox Payment (2:30 – 3:30)
- **Voice / Text Interaction 3:**
  - Ask: *"Cheeni ke liye group order hai kya?"*
  - Munim Ji replies: *"12 dukaano ke saath cheeni ka group order khula hai, jisme ₹45 per bag bachat hogi."*
- **Open `/pool/go_sugar_active_001`:**
  - Show the Rupee-coin progress ring: **9/12 shops • 72/100 bags met (72%)**.
  - Show the Google OR-Tools optimization: allocated wholesale tier unlocks ₹2,000/bag vs ₹2,150 single shop price.
  - Tap **"Confirm & Pay via Paytm Sandbox"**:
  - Show the explicit **Consent & Price Breakdown Sheet** (8 bags @ ₹2,000 + ₹25 delivery share = ₹16,025 payable, saving ₹1,175).
  - Tap Pay: Paytm sandbox checkout initiates, verifies checksum, marks member as `paid`.

---

## Act 5: ACT & MEASURE — Instant Credit & Real Repayment (3:30 – 4:30)
- **Voice / Text Interaction 4:**
  - Ask: *"Mujhe ₹5,000 chahiye"*
  - Munim Ji opens the Instant Credit card.
- **Show `/credit`:**
  - Explain: Working capital that repays itself. Pre-approved limit ₹5,000 based on past 90 days sales.
  - Show the **Key Facts Statement (KFS)** modal and transparent rules ("Why this limit?").
  - Current balance: **₹5,000 limit → ₹3,320 outstanding**.
  - Clear math shown: `₹3,320 / (20% × ₹8,400 daily avg) ≈ 2.0 days clearance`.
- **Trigger Live Customer QR Payment:**
  - Open `/pay/merchant_sharma_001` in another tab or phone.
  - Customer pays ₹100 via Paytm Sandbox.
  - Paytm Soundbox speaks: *"Paytm par ₹100 prapt hue"*.
  - Show the instant webhook impact: **20% (₹20) was auto-deducted** toward Sharma ji's credit loan!
  - Refresh `/credit`: outstanding immediately drops from ₹3,320 to ₹3,300!
- **Show `/savings` (MEASURE):**
  - Highlight the clear separation between **✓ Measured Savings** (₹1,968 from delivered tea group) and **✦ Illustrative Savings** (₹45/bag from active sugar pool).
  - Conclude: *"From digital payments to intelligent business growth."*

