# Publishing V-Connect Online (Deployment Guide)

To publish your entire project online, you need to move from your local environment to the cloud. Here are the **complete, step-by-step procedures** to get your database, backend, and frontend live on the internet for free.

## Step 1: Create a Cloud PostgreSQL Database ☁️
Right now, your application relies on a local SQLite file (`dev.db`). Online servers require a centralized database. **Supabase** is the best free option for this.

1. Go to **[supabse.com](https://supabase.com/)** and create a free account.
2. Click **New Project**, name it `vignan-connect`, and set a strong database password (save this password).
3. Once the database is created, go to **Project Settings** > **Database**.
4. Scroll down to find your **Connection string (URI)**. It will look something like this:
   `postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres`

## Step 2: Connect Your Project to the Cloud Database 🔌
Before you upload your code, you must configure it to connect to your new Supabase database.

1. In your `backend/.env` file, replace your current database URL with the one you copied from Supabase:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres"
   ```
2. In your `backend/prisma/schema.prisma` file, change your database provider from `sqlite` to `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Push your database structure to the cloud by running these commands in your `backend` folder:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```
   *(If you'd like, provide me your Supabase Connection String and I can do all of Step 2 for you automatically right now!)*

## Step 3: Publish Your Backend (NestJS API) 🚀
We will use **Render** to host your backend server for free. Before starting this step, make sure you push all your latest code (including the changes from Step 2) to your **GitHub repository**.

1. Go to **[render.com](https://render.com/)**, create an account, and click **New +** > **Web Service**.
2. Connect your GitHub account and select your `vignan_connect` repository.
3. Configure your Web Service with these exact settings:
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm run start:prod`
4. Scroll down to **Environment Variables** and add your `.env` variables:
   - `DATABASE_URL` (Your Supabase Connection String)
   - `PORT` = `4000`
   - `NODE_ENV` = `production`
   - `JWT_ACCESS_SECRET` = `(make up a strong secret code)`
   - `JWT_REFRESH_SECRET` = `(make up a strong secret code)`
5. Click **Create Web Service**. It will take about 5-10 minutes to build. Once it's finished, Render will give you a live URL (e.g., `https://vconnect-api.onrender.com`).

## Step 4: Publish Your Frontend (Next.js App) 🌐
We will use **Vercel** to host the website interface for free.

1. Copy the live backend URL you just got from Render (e.g., `https://vconnect-api.onrender.com/api`).
2. Go to **[vercel.com](https://vercel.com/)**, create an account, and click **Add New** > **Project**.
3. Import your `vignan_connect` GitHub repository.
4. Configure your Vercel Project with these settings:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `web` 
5. Under **Environment Variables**, you must tell the frontend where to find the live backend API. Add this key:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://vconnect-api.onrender.com/api` (Use YOUR exact Render URL here, ending in `/api`)
6. Click **Deploy**. Vercel will install the frontend and give you a live webpage link (e.g., `https://vignan-connect.vercel.app`) in about 2 minutes.
