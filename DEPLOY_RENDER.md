# 🚀 Deploying PayLoop Campus on Render

This guide outlines how to deploy the entire PayLoop stack (**PostgreSQL Database**, **Node.js Express Backend**, **Python AI Microservice**, and **Next.js Frontend**) to [Render](https://render.com).

---

## ⚡ Method 1: 1-Click Deployment via Render Blueprint (Recommended)

A pre-configured [`render.yaml`](../render.yaml) is included in the project root. Render will automatically read this file and set up all services and connect their environment variables together.

### Step 1: Push your code to GitHub
Make sure your repository has the latest code pushed to your GitHub remote (`main` branch):
```bash
git add .
git commit -m "Configure project for Render deployment"
git push origin main
```

### Step 2: Create a Blueprint on Render
1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Click the **"New +"** button at the top right.
3. Select **"Blueprint"**.
4. Connect your GitHub account and select your repository (`fintech-payment-project`).
5. Render will detect [`render.yaml`](../render.yaml) and display the resources it will provision:
   - 🗄️ **`payloop-db`** (PostgreSQL Database)
   - 🧠 **`payloop-ai`** (FastAPI Python AI Microservice)
   - ⚙️ **`payloop-api`** (Express & Prisma Backend API)
   - 🌐 **`payloop-web`** (Next.js Frontend)
6. Click **"Apply"** / **"Create Blueprint"**.

Render will provision the database, build all services, push the Prisma database schema, and deploy!

---

## 🛠️ Method 2: Manual Setup on Render

If you prefer to configure each service manually in the Render dashboard:

### 1. Create the PostgreSQL Database
1. In Render, click **New +** -> **PostgreSQL**.
2. **Name:** `payloop-db`
3. **Database:** `payloop_campus`
4. **User:** `payloop`
5. **Plan:** Free
6. Click **Create Database**.
7. Copy the **Internal Database URL** (e.g., `postgresql://payloop:...@dpg-...-a:5432/payloop_campus`).

---

### 2. Deploy the Python AI Service (Optional, but recommended)
1. Click **New +** -> **Web Service**.
2. Connect your repository.
3. Settings:
   - **Name:** `payloop-ai`
   - **Root Directory:** `payloop-campus/apps/ai-service`
   - **Environment:** `Python`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `NODE_ENV` = `production`
5. Click **Create Web Service**. Note the public URL (e.g. `https://payloop-ai.onrender.com`).

---

### 3. Deploy the Backend API
1. Click **New +** -> **Web Service**.
2. Connect your repository.
3. Settings:
   - **Name:** `payloop-api`
   - **Root Directory:** `payloop-campus`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build --workspace=apps/api && npx --workspace=apps/api prisma db push && npm run db:seed --workspace=apps/api`
   - **Start Command:** `npm run start --workspace=apps/api`
4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `DATABASE_URL` = *(Paste the Internal Database URL from Step 1)*
   - `JWT_SECRET` = *(Click Generate or enter a random 32+ character string)*
   - `CORS_ORIGIN` = `*` *(or your frontend onrender URL)*
   - `AI_SERVICE_URL` = *(Your `payloop-ai` URL from Step 2, or leave default)*
5. Click **Create Web Service**. Note the public URL (e.g. `https://payloop-api.onrender.com`).

---

### 4. Deploy the Next.js Frontend
1. Click **New +** -> **Web Service**.
2. Connect your repository.
3. Settings:
   - **Name:** `payloop-web`
   - **Root Directory:** `payloop-campus`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build --workspace=apps/web`
   - **Start Command:** `npm run start --workspace=apps/web`
4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `NEXT_PUBLIC_API_URL` = *(Paste the backend API URL from Step 3, e.g., `https://payloop-api.onrender.com`)*
5. Click **Create Web Service**.

---

## 🔑 Default Demo Accounts

Once seeded, you can log in to the deployed application with:

| Role | Email | Password |
|---|---|---|
| **Student** | `student@payloop.demo` | `Demo@123456` |
| **Merchant** | `merchant@payloop.demo` | `Demo@123456` |
| **Admin** | `admin@payloop.demo` | `Demo@123456` |

---

## 💡 Render Free Tier Notes
- Free tier instances spin down after 15 minutes of inactivity and take ~30–50 seconds to wake up on the first request.
- Ensure your frontend points to `https://<your-backend-api-name>.onrender.com` in `NEXT_PUBLIC_API_URL`.
