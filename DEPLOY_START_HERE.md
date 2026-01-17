# 🚀 START HERE - Deployment Guide

**Your CollabDoc project is now Vercel-ready!** Follow this guide to deploy in 30 minutes.

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│   Your Browser                          │
│   https://yourapp.vercel.app            │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│   Vercel (Frontend)                     │
│   React + Vite                          │
│   ✅ Always FREE                        │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│   Railway/Render (Backend)              │
│   Express.js + Socket.io                │
│   💰 Railway: $5-10/month               │
│   💰 Render: $7/month (or free limited) │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│   MongoDB Atlas (Database)              │
│   🆓 Free tier: 512MB storage           │
│   💰 Shared: $9/month                   │
└─────────────────────────────────────────┘
```

## ⏱️ Quick Start (3 Steps)

### Step 1: Set Up Database (5 minutes)
Go to https://www.mongodb.com/cloud/atlas
- Create account
- Create free cluster
- Create user (username + password)
- Copy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/collabdoc`
- **Save this string** - you'll need it for backend deployment

### Step 2: Deploy Backend (10 minutes)
Choose **Railway** (easier, has free credit) or **Render** (free but sleeps)

**Railway:**
1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your CollabDoc repository
5. Configure:
   - Root directory: `backend`
   - Environment variables:
     ```
     MONGODB_URI=<paste your MongoDB connection string>
     JWT_SECRET=<generate random: openssl rand -base64 32>
     NODE_ENV=production
     FRONTEND_URL=https://temp.vercel.app (update later)
     ```
6. Click Deploy
7. **Copy your Railway URL** (e.g., `https://collabdoc-backend.up.railway.app`)

**Render:**
1. Go to https://render.com
2. Sign in with GitHub
3. Click "New" → "Web Service"
4. Select CollabDoc repository
5. Configure same as Railway above
6. Click Deploy
7. **Copy your Render URL**

### Step 3: Deploy Frontend (10 minutes)
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Select your CollabDoc repository
5. Configure:
   - Framework: **Vite**
   - Root directory: `frontend`
   - Environment variables:
     ```
     VITE_API_URL=https://your-backend-url/api
     VITE_SOCKET_URL=https://your-backend-url
     ```
     (Replace with your Railway/Render URL from Step 2)
6. Click Deploy
7. **Your app is live!** 🎉

## 🔄 Update Backend with Frontend URL
Go back to Railway/Render settings and update:
```
FRONTEND_URL=https://your-vercel-url.vercel.app
```

## ✅ Verify It Works
1. Open your Vercel URL
2. Register a new account
3. Upload a PDF or text file
4. Select text and create an annotation
5. Check browser Console (F12) for errors
6. All should work! 🚀

## 📚 Full Documentation
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete step-by-step guide with screenshots
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Checkbox guide to verify everything
- **[backend/.env.example](backend/.env.example)** - Backend configuration options
- **[frontend/.env.example](frontend/.env.example)** - Frontend configuration options

## 🛠️ Run Locally First (Optional)
Before deploying to production, test locally:

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Open http://localhost:5173
```

## 🆘 Troubleshooting

### "Cannot connect to backend"
- Check VITE_API_URL in Vercel settings
- Verify backend is running on Railway/Render dashboard
- Check backend logs for errors

### "Socket.io connection failed"
- Verify VITE_SOCKET_URL is correct
- Check backend FRONTEND_URL matches Vercel URL
- Clear browser cache and reload

### "MongoDB connection error"
- Verify connection string is correct
- Check MongoDB Atlas IP whitelist (should allow 0.0.0.0/0)
- Verify credentials in connection string

### "Port is already in use"
- Local only - another process is using the port
- Kill the process or use different PORT in .env

## 💰 Cost Breakdown

| Service | Free Tier | Recommended |
|---------|-----------|-------------|
| **Vercel** | ✅ Always free | Always free |
| **Railway** | $5/month credit | $5-10/month |
| **Render** | Limited (sleeps) | $7/month (always-on) |
| **MongoDB** | 512MB free | $9/month (1GB) |
| **Total** | ~$5/month | ~$25/month |

## 🎯 Next Steps

1. ✅ Read this file (you're doing it!)
2. 📖 Read [DEPLOYMENT.md](DEPLOYMENT.md) for details
3. 🗂️ Use [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) to track progress
4. 🚀 Deploy to MongoDB Atlas
5. 🚀 Deploy to Railway/Render
6. 🚀 Deploy to Vercel
7. ✨ Your app is live!

## 📞 Questions?

- Vercel docs: https://vercel.com/docs
- Railway docs: https://docs.railway.app
- Render docs: https://render.com/docs
- MongoDB docs: https://www.mongodb.com/docs/atlas

---

**You've got this! 💪**

Deploy your app in 30 minutes and start collaborating! 🎉
