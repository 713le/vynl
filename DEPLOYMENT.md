# Vynl - Vercel & Supabase Deployment Guide

## ✅ Completed Steps
- ✅ Code pushed to GitHub
- ✅ API structure ready for Vercel
- ✅ Environment files created

---

## 📋 Step 1: Set up Supabase Database

### Create Supabase Account & Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub (recommended) or email
3. Click "New Project"
   - **Name**: `vynl`
   - **Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
   - Click "Create new project"

### Get Your Connection Credentials
4. Wait for the project to initialize (~2-3 min)
5. Go to **Settings → Database**
6. Under "Connection pooling" or standard connection:
   - Copy the connection string or note down:
     - `Host`
     - `Port` (usually 5432)
     - `Database` (usually "postgres")
     - `User` (usually "postgres")
     - `Password` (the one you created)

### Initialize Your Database Locally (Important!)
7. In your terminal, navigate to the server directory:
   ```bash
   cd /Users/angelina/Documents/Vynl/server
   npm install
   ```

8. Create a `.env` file in the server folder with your Supabase credentials:
   ```
   POSTGRES_HOST=xxx.db.supabase.co
   POSTGRES_PORT=5432
   POSTGRES_DBNAME=postgres
   POSTGRES_USERNAME=postgres
   POSTGRES_PASSWORD=your-password
   ```

9. Run the app once to initialize tables:
   ```bash
   npm run dev
   ```
   
   You should see:
   ```
   Server running on http://localhost:3000
   ```

10. Then stop the server (Ctrl+C). Your database tables are now created!

---

## 🚀 Step 2: Deploy to Vercel

### Connect GitHub to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (or sign in if you have an account)
3. Click "Import Project"
4. Select "GitHub" as the source
5. Search for `vynl` and import the repository

### Configure Environment Variables
6. After importing, you'll see a form for environment variables
7. Add these variables (from your Supabase credentials):
   ```
   POSTGRES_HOST=xxx.db.supabase.co
   POSTGRES_PORT=5432
   POSTGRES_DBNAME=postgres
   POSTGRES_USERNAME=postgres
   POSTGRES_PASSWORD=your-password
   ```

8. Click "Deploy"

### Wait for Deployment
9. Vercel will build and deploy your app
   - Frontend: `https://your-vynl.vercel.app`
   - API: `https://your-vynl.vercel.app/api/*`

10. Check the deployment status. Once it says "✅ Production", click "Visit" to test!

---

## 🔗 Step 3: Update Frontend API URL

After deployment, update your frontend to use the production API:

1. In the Vercel dashboard, go to your project settings
2. Under "Environment Variables", add:
   ```
   VITE_API_URL=https://your-vynl.vercel.app
   ```
   (Replace `your-vynl` with your actual Vercel project name)

3. Redeploy by going to Deployments → click the latest one → click "Redeploy"

---

## 🧪 Testing Your Deployment

1. Visit your Vercel URL: `https://your-vynl.vercel.app`
2. Try signing up for a new account
3. Try logging in
4. Rate an album
5. Check that your data is saved

---

## 📚 API Architecture Explanation

### Frontend → API Flow
```
React Frontend (static files)
    ↓
    └→ /api/* routes
    ↓
Express Backend (serverless function)
    ↓
PostgreSQL (Supabase)
```

- **Frontend**: Deployed as static site in `frontend/dist/`
- **Backend**: Express app in `api/index.js` runs as serverless function
- **Database**: Supabase PostgreSQL
- All served from same Vercel domain (no CORS issues!)

### Why This Works
- Vercel automatically detects `/api/` folder and converts it to serverless functions
- Your Express app becomes multiple serverless function handlers
- Frontend calls `/api/*` and Vercel routes to the serverless function
- No need for separate backend deployment!

---

## 🆘 Troubleshooting

### "Cannot connect to database"
- Check that Supabase credentials are correct in Vercel env vars
- Make sure you ran `npm run dev` locally to initialize tables

### "Frontend shows blank page"
- Check browser console for errors (F12 → Console)
- Make sure `VITE_API_URL` is set correctly in Vercel

### "API returns 404"
- Your routes might not be exported properly
- Check that `api/index.js` has all your Express routes

### Database Connection Pooling (for production)
- Supabase offers "Connection Pooling" with PgBouncer
- Use this for serverless (handles many quick connections)
- Settings → Database → Connection string (choose "Connection Pooler")

---

## 📝 Commands Reference

```bash
# Local development - backend
cd server && npm run dev

# Local development - frontend  
cd frontend && npm run dev

# Build frontend for production
cd frontend && npm run build

# Push changes to GitHub
git add .
git commit -m "description"
git push
```

---

## ✨ You're All Set!

Your full-stack Vynl app is now deployed on Vercel with Supabase as your database!

**URLs to remember:**
- 🌐 App URL: `https://your-vynl.vercel.app`
- 📊 Supabase Dashboard: `https://supabase.com/dashboard/projects`
- ⚙️ Vercel Settings: `https://vercel.com/dashboard`

Happy coding! 🎵
