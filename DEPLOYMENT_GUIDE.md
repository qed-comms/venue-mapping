# 🚀 Deployment Guide: Vercel

Your "Venue Mapping AI" application is now configured for deployment! Follow these steps to take it live.

## 1. Prerequisites
- A [GitHub](https://github.com) account.
- A [Vercel](https://vercel.com) account.
- A **Cloud PostgreSQL Database**.
    - *Why?* Your local database (localhost) cannot be accessed by Vercel.
    - *Recommendation:* Use **Neon.tech** (Free Tier), **Supabase**, or **Vercel Postgres**.

## 2. Cloud Database Setup (Neon.tech Example)
1.  Go to [Neon.tech](https://neon.tech) and sign up.
2.  Create a new project.
3.  Copy the **Connection String** (e.g., `postgresql+asyncpg://user:pass@ep-xyz.aws.neon.tech/dbname`).
    - **IMPORTANT**: Ensure it starts with `postgresql+asyncpg://` so your backend can use it. If it says `postgres://`, just change it to `postgresql+asyncpg://`.

## 3. GitHub Setup
1.  Initialize a git repo if you haven't:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```
2.  Create a new repository on GitHub.
3.  Push your code:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
    git push -u origin main
    ```

## 4. Vercel Deployment
1.  Go to [Vercel Dashboard](https://vercel.com/dashboard) -> **Add New...** -> **Project**.
2.  Import your GitHub repository.
3.  **Configure Project**:
    - **Framework Preset**: select "Other" (or leave default, Vercel detects config).
    - **Root Directory**: Leave as `./` (root).
4.  **Environment Variables**:
    Add the following variables (copy values from your local `.env` or new cloud values):
    - `DATABASE_URL`: Your **Cloud** database URL (Step 2).
    - `SECRET_KEY`: A random long string (e.g., generate one with `openssl rand -hex 32`).
    - `OPENAI_API_KEY`: Your OpenAI key.
    - `CORS_ORIGINS`: Set to your Vercel domain once you know it (e.g., `https://your-project.vercel.app`), or allow all for testing.
5.  Click **Deploy**.

## 5. Post-Deployment (Database Migration)
Since the cloud database is empty, you need to run migrations.
You can run this locally pointing to the cloud DB:

```bash
# In your local terminal
cd backend
source venv/bin/activate
# Temporarily set the cloud URL to run migration
export DATABASE_URL="postgresql+asyncpg://user:pass@ep-xyz.../dbname"
alembic upgrade head
```

## 6. Verify
Visit your Vercel URL.
- Application should load.
- Login with the default user (if you seeded the cloud DB) or register a new one.

## Troubleshooting
- **Frontend works, Backend 404s**: Check `window.API_BASE` logic in `frontend/app.js` (it should auto-detect).
- **Database Connection Error**: Check your `DATABASE_URL` in Vercel settings. Ensure it uses `postgresql+asyncpg`.
