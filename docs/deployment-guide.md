# Munim Ji — Production & Cloud Deployment Guide

This guide walks you through deploying **Munim Ji** step-by-step so that judges, teammates, or merchants can access the live web application on their phones or browsers.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │              Vercel Edge CDN                 │
                      │         (Next.js 14 Frontend PWA)            │
                      │       https://munim-ji.vercel.app            │
                      └──────────────────────┬───────────────────────┘
                                             │ HTTPS & WSS
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │              Render / Railway                │
                      │           (FastAPI Python 3.12)              │
                      │      https://munim-ji-api.onrender.com       │
                      └──────────────────────┬───────────────────────┘
                                             │ Motor async connection
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │           MongoDB Atlas (AWS Mumbai)         │
                      │            Shared M0 (Free Tier)             │
                      └──────────────────────────────────────────────┘
```

---

## Method 1: The Modern Serverless Cloud (Fastest & Free)

This is the recommended hackathon setup:
- **Database**: MongoDB Atlas (Free M0 Cluster)
- **Backend**: Render.com (Free Python Web Service)
- **Frontend**: Vercel (Free Next.js Hosting)

Estimated time: **12–15 minutes**.

---

### Step 1: Set Up MongoDB Atlas (Free Database)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up / log in.
2. Click **Create Deployment** → choose **M0 (Free)**.
3. Provider: **AWS** | Region: **ap-south-1 (Mumbai)** (or closest region).
4. Under **Security Quickstart**:
   - Create a database user (e.g. Username: `munim_admin`, Password: generate a strong password and save it).
   - Under **IP Access List**: Select **Allow Access from Anywhere** (`0.0.0.0/0`) so Render and Vercel can connect.
5. Click **Connect** → choose **Drivers (Python 3.12)**.
6. Copy the connection string. It will look like:
   ```
   mongodb+srv://munim_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
   *(Replace `<password>` with your actual password).*

---

### Step 2: Seed the Remote Cloud Database

Before launching the backend, seed the initial Sharma General Store demo data and ₹8,400 yesterday sales:

1. On your local machine, open your `.env` file (or set the environment variable in your terminal):
   ```bash
   MONGO_URI="mongodb+srv://munim_admin:<password>@cluster0.abcde.mongodb.net/munim_ji?retryWrites=true&w=majority"
   ```
2. Run the seed script locally pointing to Atlas:
   ```bash
   python scripts/seed.py
   ```
   *Output confirmation:*
   ```
   [OK] Database seeded successfully!
   - Merchant: Sharma Chai & General Store (ID: merchant_sharma_001)
   - Yesterday Sales Total: ₹8,400.00 (34 transactions)
   ```

---

### Step 3: Deploy the Backend on Render.com

1. Push your code to a GitHub repository:
   ```bash
   git add .
   git commit -m "Munim Ji complete release"
   git push origin main
   ```
2. Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Fill in the service configuration:
   - **Name**: `munim-ji-api`
   - **Region**: Singapore or Frankfurt (choose closest)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. Click **Environment Variables** and add the following keys:

| Key | Value |
|---|---|
| `ENVIRONMENT` | `production` |
| `ALLOW_PRODUCTION` | `false` |
| `MONGO_URI` | `mongodb+srv://munim_admin:<password>@cluster0.abcde.mongodb.net/munim_ji?retryWrites=true&w=majority` |
| `MONGO_DB_NAME` | `munim_ji` |
| `JWT_SECRET` | *(Generate a 32+ character random string)* |
| `JWT_ALGORITHM` | `HS256` |
| `JWT_EXPIRES_MINUTES` | `1440` |
| `GROQ_API_KEY` | *(Your Groq API key)* |
| `GROQ_MODEL_MAIN` | `llama-3.3-70b-versatile` |
| `GROQ_MODEL_FAST` | `llama-3.1-8b-instant` |
| `DEEPGRAM_API_KEY` | *(Your Deepgram API key)* |
| `CARTESIA_API_KEY` | *(Your Cartesia API key)* |
| `CARTESIA_VOICE_ID` | `a0e99841-438c-4a64-b679-ae501e7d6091` |
| `PAYMENTS_MODE` | `mock` *(or `sandbox` if using real Paytm staging MID)* |
| `CORS_ORIGINS` | `["*"]` |

6. Click **Create Web Service**.
7. Wait 2–3 minutes for build and deployment.
8. Copy your Render backend URL (e.g. `https://munim-ji-api.onrender.com`).
9. Test health check in your browser: `https://munim-ji-api.onrender.com/health` → returns `{"status": "healthy"}`.

---

### Step 4: Deploy the Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New...** → **Project**.
2. Select your GitHub repository.
3. In the project setup screen:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select **`frontend`**.
4. In **Environment Variables**, add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://munim-ji-api.onrender.com` *(Your Render backend URL)* |
| `NEXT_PUBLIC_WS_URL` | `wss://munim-ji-api.onrender.com` |
| `NEXT_PUBLIC_PAYMENTS_MODE` | `mock` *(or `sandbox`)* |

5. Click **Deploy**.
6. Vercel will build all static and dynamic pages in ~60 seconds.
7. You will receive a live URL: `https://munim-ji.vercel.app`!

---

## Method 2: Single-Server VPS (Docker Compose)

If you have a Linux VPS (DigitalOcean Droplet, AWS EC2, Hetzner, Linode, or any Ubuntu 22.04/24.04 server):

### 1. SSH into your VPS
```bash
ssh root@your-server-ip
```

### 2. Install Docker & Docker Compose
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 3. Clone Repository & Configure Environment
```bash
git clone https://github.com/vsv/munim-ji.git
cd munim_ji
cp .env.example .env
nano .env # update your keys and set MONGO_URI=mongodb://mongo:27017
```

### 4. Build and Start All 3 Services
```bash
docker compose up -d --build
```

### 5. Seed Database inside Container
```bash
docker compose exec backend python scripts/seed.py
```

### 6. Set Up Nginx / Caddy with Free SSL (Automatic HTTPS)
Install Caddy for zero-configuration automatic Let's Encrypt SSL:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

Create `/etc/caddy/Caddyfile`:
```caddy
yourdomain.com {
    # Frontend Next.js app
    reverse_proxy localhost:3000
}

api.yourdomain.com {
    # Backend FastAPI
    reverse_proxy localhost:8000
}
```

Restart Caddy:
```bash
sudo systemctl restart caddy
```

---

## Post-Deployment Verification Checklist

Once deployed, run through this 1-minute live verification:

- [ ] **Web App Loads**: Open your frontend domain on mobile Safari / Chrome.
- [ ] **Login with Demo Phone**: Enter `+919876543210` with OTP `123456`.
- [ ] **Soundbox Audio**: Tap the soundbox icon on the top card to hear *"Paytm par 100 rupaye prapt hue"*.
- [ ] **Voice / Text Assistant**: Go to `/ask` and submit *"Kal ki bikri kitni thi?"* → Verifies that backend responds with ₹8,400.
- [ ] **Out-of-Scope Guardrail**: Ask *"Aaj mausam kaisa hai?"* → Assistant declines politely: *"Maaf kijiye, main iska uttar nahi de sakta..."*.
- [ ] **What-If Simulator**: Go to `/whatif` → Check that Low/Base/High margin ranges recompute dynamically.
- [ ] **Pooled Buying**: Go to `/pool` → Open Sugar Pool → Test Paytm checkout confirmation.
- [ ] **Instant Credit Repayment**: Open customer pay page at `/pay/merchant_sharma_001` and pay ₹100 → Check that the 20% auto-deduction updates the loan balance.

