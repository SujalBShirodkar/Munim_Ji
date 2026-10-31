# Paytm Payment Gateway Sandbox Testing Guide

This guide details how **Munim Ji** integrates with the **Paytm Payment Gateway (Staging / Sandbox)** for real payment and refund flows.

---

## 1. Sandbox Architecture & Credentials

Munim Ji connects to the Paytm staging environment using official Paytm APIs wrapped behind an extensible `PaymentProvider` interface.

### Environment Variables
Configure these in `.env`:

```env
# Options: 'mock' (simulated offline development) or 'sandbox' (real Paytm staging)
PAYMENTS_MODE=sandbox
PAYTM_MID=YOUR_STAGING_MID
PAYTM_MERCHANT_KEY=YOUR_STAGING_KEY
PAYTM_WEBSITE=WEBSTAGING
PAYTM_INDUSTRY_TYPE=Retail
PAYTM_HOST=https://securegw-stage.paytm.in
PAYTM_CALLBACK_URL=http://localhost:8000/payments/paytm/callback
PAYTM_WEBHOOK_URL=http://localhost:8000/payments/paytm/webhook
```

> **Real-Money Safety Guard:**
> `ALLOW_PRODUCTION=false` is enforced at application startup in `backend/app/core/config.py`. Any attempt to point `PAYTM_HOST` to `securegw.paytm.in` (production) will intentionally abort backend startup unless `ALLOW_PRODUCTION=true`.

---

## 2. Test Payment Flows

### Flow A: Customer → Merchant QR Payment (`/pay/[merchantId]`)
1. Open `http://localhost:3000/pay/merchant_sharma_001`.
2. Select an amount (e.g., ₹100, ₹500) and click **"Pay with Paytm"**.
3. Backend calls `POST /payments/paytm/initiate`, generates a base64-encoded HMAC-SHA256 signature, and obtains a `txnToken`.
4. The client invokes Paytm JS Checkout (or mock checkout if `PAYMENTS_MODE=mock`).
5. On completion, Paytm calls the webhook `POST /payments/paytm/webhook`:
   - Checks signature verification.
   - Confirms status via Paytm Order Status API (`https://securegw-stage.paytm.in/v3/order/status`).
   - Inserts the new transaction into the MongoDB `transactions` collection.
   - **Auto-Repayment Trigger:** If the merchant has an active credit loan, **20% of this payment** is automatically deducted toward the loan balance!
   - Simulates the Paytm Soundbox voice announcement: *"Paytm par ₹100 prapt hue"*.

### Flow B: Pooled Buying Group Order Payment (`/pool/[id]`)
1. Open `http://localhost:3000/pool/go_sugar_active_001`.
2. Click **"Confirm & Pay via Paytm Sandbox"**.
3. A modal presents the explicit consent sheet with transparent price breakdowns:
   - 8 Bags @ ₹2,000/bag = ₹16,000
   - Proportional Delivery Share = ₹25
   - Total Payable = ₹16,025
   - Estimated Bachat vs Single shop rate = ₹1,175
4. Upon clicking confirm, a unique order ID (`GO-go_sugar_act-0001-xxxx`) is generated and signed.
5. On successful webhook callback, the member status transitions to `paid`.
6. Once all participating members have paid, the group order transitions to `CONFIRMED`.

### Flow C: Refund on Expiry / Failure
If a pooled order does not reach minimum order quantity (MOQ) before the deadline:
1. The state machine transitions the group order to `REFUNDING`.
2. Backend triggers the Paytm Refund API (`POST https://securegw-stage.paytm.in/refund/apply`) with a unique `refId` for each paid member.
3. Once confirmed, member status transitions to `refunded`.

---

## 3. Paytm Test Payment Instruments

When testing on Paytm staging (`https://securegw-stage.paytm.in`), use standard Paytm test credentials:

| Payment Mode | Test Details | OTP / PIN |
|---|---|---|
| **Paytm Test Wallet** | Mobile: `7777777777` | OTP: `489871` |
| **Test Netbanking** | Any Bank from staging dropdown | Any credentials |
| **Test UPI** | `success@paytm` or `any@upi` | Any 4/6 digit MPIN |
| **Test Debit/Credit Card** | Card: `4111 1111 1111 1111`, CVV: `123`, Expiry: `12/28` | OTP: `489871` |

---

## 4. Local Webhook Forwarding with ngrok / cloudflared

To receive asynchronous server-to-server callbacks from Paytm's staging servers on your local machine:
```bash
# Using ngrok
ngrok http 8000

# Copy the generated https forwarding URL and set in .env:
PAYTM_WEBHOOK_URL=https://<your-ngrok-subdomain>.ngrok-free.app/payments/paytm/webhook
```

