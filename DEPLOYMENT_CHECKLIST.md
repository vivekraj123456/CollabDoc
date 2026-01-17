# 🚀 CollabDoc Deployment Checklist

Use this checklist to ensure your deployment is successful!

## ✅ Pre-Deployment Setup

- [ ] **Code is committed to GitHub**
  - All changes pushed to `main` branch
  - No uncommitted changes

- [ ] **Environment variables prepared**
  - [ ] JWT_SECRET generated (use `openssl rand -base64 32`)
  - [ ] MongoDB Atlas account created
  - [ ] MongoDB connection string copied
  - [ ] Frontend URL will be known (after Vercel deploy)
  - [ ] Backend URL will be known (after Railway/Render deploy)

## 📦 Step 1: Deploy Database (MongoDB Atlas)

- [ ] Create MongoDB Atlas account
- [ ] Create free M0 cluster
- [ ] Create database user
- [ ] Copy connection string
- [ ] Whitelist all IPs (0.0.0.0/0) for development
- [ ] Save connection string somewhere safe

## 🔧 Step 2: Deploy Backend

### Option A: Railway (Recommended)
- [ ] Create Railway account
- [ ] Connect GitHub account to Railway
- [ ] Create new project from GitHub repo
- [ ] Set root directory to `backend`
- [ ] Set environment variables:
  - [ ] `MONGODB_URI` = Your MongoDB connection string
  - [ ] `JWT_SECRET` = Strong random key
  - [ ] `FRONTEND_URL` = `https://temp-url.vercel.app` (update later)
  - [ ] `NODE_ENV` = `production`
- [ ] Deploy
- [ ] Copy deployment URL (e.g., `https://collabdoc-backend.up.railway.app`)
- [ ] Save the URL

### Option B: Render
- [ ] Create Render account
- [ ] Connect GitHub account
- [ ] Create new Web Service
- [ ] Set root directory to `backend`
- [ ] Set build command: `npm install && npm run build`
- [ ] Set start command: `npm start`
- [ ] Set environment variables (same as Railway)
- [ ] Deploy
- [ ] Copy service URL
- [ ] Save the URL

## 🎨 Step 3: Deploy Frontend (Vercel)

- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Set root directory to `frontend`
- [ ] Build command should be `npm run build`
- [ ] Output directory should be `dist`
- [ ] Set environment variables:
  - [ ] `VITE_API_URL` = `https://your-backend-url/api`
  - [ ] `VITE_SOCKET_URL` = `https://your-backend-url`
- [ ] Deploy
- [ ] Copy frontend URL (e.g., `https://collabdoc.vercel.app`)

## 🔄 Step 4: Update Backend Environment

Go back to Railway/Render and update:
- [ ] `FRONTEND_URL` = Your Vercel deployment URL

## 🧪 Step 5: Test Deployment

Open your Vercel frontend URL and test:

### Basic Functionality
- [ ] Page loads without errors
- [ ] Can register new account
- [ ] Can login with account
- [ ] Can upload document (PDF or text file)
- [ ] Document content is displayed
- [ ] Can select text and create annotation
- [ ] Annotation appears on page

### API Connection
- [ ] Check browser console (F12) for any errors
- [ ] Check Network tab - API requests should go to backend URL
- [ ] Socket.io connection should be established

### Backend Logs
- [ ] Check Railway/Render logs for any errors
- [ ] Should see "Connected to MongoDB" message
- [ ] Should see "Socket.io: Enabled" message

## 🐛 Troubleshooting

If something doesn't work:

1. **"Cannot connect to backend"**
   - Check `VITE_API_URL` and `VITE_SOCKET_URL` in Vercel
   - Verify backend is running on Railway/Render dashboard
   - Check CORS settings in backend logs

2. **"Socket.io connection failed"**
   - Verify `VITE_SOCKET_URL` matches backend URL
   - Check backend logs for CORS issues
   - Clear browser cache and try again

3. **"MongoDB connection error"**
   - Check MongoDB connection string is correct
   - Verify IP whitelist in MongoDB Atlas
   - Check `MONGODB_URI` environment variable is set

4. **"File upload fails"**
   - Check file size is under 10MB
   - Check backend logs for upload errors
   - Verify file permissions on backend

5. **"Annotations not appearing"**
   - Check browser console for JavaScript errors
   - Verify Socket.io is connected (look for Socket.io connection log)
   - Check backend logs for annotation creation errors

## 📊 Deployment Summary

| Component | Platform | Status |
|-----------|----------|--------|
| Frontend | Vercel | `https://your-url.vercel.app` |
| Backend | Railway/Render | `https://your-backend-url` |
| Database | MongoDB Atlas | Connected |

## 🎯 Post-Deployment

- [ ] Monitor backend logs for errors (first 24 hours)
- [ ] Test with real users
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Consider upgrading to paid tiers if needed:
  - Railway: ~$5-10/month
  - Vercel: Pro $20/month (for priority support)
  - MongoDB: $9-99/month for better performance
  - Render: $7/month for always-on (from free)

## 📞 Need Help?

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions
- Check service docs:
  - Vercel: https://vercel.com/docs
  - Railway: https://docs.railway.app
  - Render: https://render.com/docs
  - MongoDB Atlas: https://www.mongodb.com/docs/atlas

---

**Last Updated:** January 2026
**Status:** ✅ Deployment Ready
