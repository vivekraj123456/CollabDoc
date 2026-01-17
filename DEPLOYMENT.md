# Deployment Guide - CollabDoc

This guide explains how to deploy CollabDoc to production using Vercel (frontend) and Railway/Render (backend).

## 🏗️ Architecture

- **Frontend**: React + Vite → **Vercel** (free tier available)
- **Backend**: Express.js + Socket.io → **Railway** or **Render** (free tier available)
- **Database**: MongoDB → **MongoDB Atlas** (free tier available)

## 📋 Prerequisites

1. **GitHub Account** - For deploying from repositories
2. **Vercel Account** - https://vercel.com (free)
3. **Railway or Render Account** - https://railway.app or https://render.com (free tiers available)
4. **MongoDB Atlas Account** - https://www.mongodb.com/cloud/atlas (free cluster available)

## 🚀 Deployment Steps

### Step 1: Set Up MongoDB Atlas (Database)

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Start Free"
3. Create a new organization and project
4. Create a free M0 cluster
5. Create a database user:
   - Go to "Database Access" → "Add New Database User"
   - Set username and auto-generate password
   - Copy the connection string
6. Whitelist your IP:
   - Go to "Network Access" → "Add IP Address"
   - Add `0.0.0.0/0` (allow all IPs) for development
7. Copy your MongoDB connection string - you'll need it for both frontend and backend deployment

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/collabdoc
```

### Step 2: Deploy Backend to Railway

#### Option A: Deploy with Railway CLI

1. Install Railway CLI: https://docs.railway.app/guides/cli
2. Clone/prepare your repo
3. Run:
   ```bash
   railway login
   railway init
   railway link
   ```
4. Set environment variables:
   ```bash
   railway variable set MONGODB_URI=mongodb+srv://...
   railway variable set JWT_SECRET=your-super-secret-key
   railway variable set FRONTEND_URL=https://your-frontend-url.vercel.app
   railway variable set NODE_ENV=production
   ```
5. Deploy:
   ```bash
   railway up
   ```

#### Option B: Deploy with GitHub (Recommended)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub account and select the CollabDoc repository
4. Configure:
   - Root directory: `backend`
   - Add environment variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: Generate a strong secret (use `openssl rand -base64 32`)
     - `FRONTEND_URL`: Your Vercel deployment URL
     - `NODE_ENV`: production
5. Click "Deploy"
6. Copy your deployment URL (e.g., `https://your-app-name.up.railway.app`)

**Note:** Railway charges small fees based on usage. Free tier provides ~$5/month credit.

### Step 3: Deploy Backend to Render (Free Alternative)

If Railway's pricing concerns you, Render offers a free tier:

1. Go to https://render.com
2. Click "New" → "Web Service"
3. Connect GitHub account and select the repository
4. Configure:
   - Name: `collabdoc-backend`
   - Root directory: `backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Environment variables (same as Railway):
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `FRONTEND_URL`
     - `NODE_ENV=production`
5. Deploy (free tier starts automatically)
6. Copy your service URL (e.g., `https://collabdoc-backend.onrender.com`)

**Note:** Render's free tier automatically spins down after 15 minutes of inactivity. Upgrade to "Starter" ($7/month) for always-on service.

### Step 4: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - Framework: **Vite**
   - Root directory: `frontend`
   - Build command: `npm run build` (should be auto-detected)
   - Output directory: `dist` (should be auto-detected)
5. Add Environment Variables:
   - `VITE_API_URL`: `https://your-backend-url/api` (Railway or Render URL)
   - `VITE_SOCKET_URL`: `https://your-backend-url` (without /api)
6. Click "Deploy"
7. Your frontend is now live at `https://your-project-name.vercel.app`

## 🔧 Configuration Reference

### Frontend Environment Variables (Vercel)

Create these in Vercel project settings:

```
VITE_API_URL=https://your-backend-url.railway.app/api
VITE_SOCKET_URL=https://your-backend-url.railway.app
```

### Backend Environment Variables (Railway/Render)

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/collabdoc
JWT_SECRET=your-secret-key-min-32-characters
FRONTEND_URL=https://your-frontend-name.vercel.app
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/tmp/uploads
```

## 🔒 Security Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Use strong MongoDB Atlas credentials
- [ ] Enable password protection on MongoDB
- [ ] Whitelist only necessary IPs in MongoDB Network Access (or use VPN)
- [ ] Use HTTPS for all connections
- [ ] Set FRONTEND_URL to your actual Vercel domain
- [ ] Enable CORS only for your Vercel domain in backend

## 🧪 Testing Your Deployment

After deployment:

1. Navigate to your Vercel frontend URL
2. Try creating an account
3. Upload a document
4. Create annotations
5. Check browser console for any API errors

## 🐛 Troubleshooting

### "Cannot connect to backend"
- Check that `VITE_API_URL` in Vercel matches your backend URL
- Verify backend is running on Railway/Render
- Check CORS settings in backend `src/index.ts`

### "Socket.io connection failed"
- Ensure `VITE_SOCKET_URL` is correct in frontend
- Check backend Socket.io CORS configuration
- Verify backend FRONTEND_URL environment variable

### "MongoDB connection error"
- Verify connection string format
- Ensure MongoDB Atlas whitelist includes all IPs (0.0.0.0/0)
- Test connection string locally first

### "Uploads not persisting"
- Railway/Render use ephemeral filesystems
- Uploaded files are lost after service restarts
- **Solution**: Implement S3/cloud storage (future enhancement)

## 💾 File Storage Notes

Currently, file uploads are stored in the `/tmp` directory on Railway/Render. These files are **temporary and will be lost** when the service restarts or goes idle.

### Future Enhancement: Cloud Storage
To persist file uploads, implement:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage
- Cloudinary

Update the `document.controller.ts` to save files to cloud storage instead of local filesystem.

## 📊 Recommended Upgrades

| Service | Free Tier | Recommended Tier | Cost |
|---------|-----------|------------------|------|
| Vercel | Yes, always free | Pro for priority support | $20/month |
| Railway | $5/month credit | Based on usage | ~$5-10/month |
| Render | Limited (spins down) | Starter (always-on) | $7/month |
| MongoDB Atlas | 512MB free cluster | Shared M2 cluster | $9/month |

**Total for always-on deployment: ~$25-30/month**

## 🔄 Continuous Deployment

Both Vercel and Railway/Render support automatic deployments from GitHub:
- Push to `main` branch → Automatic deployment
- No manual steps required after first setup
- Check deployment logs in each platform's dashboard

## 📚 Additional Resources

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/

## ❓ Questions?

If you encounter issues:
1. Check the deployment logs in Vercel/Railway/Render dashboard
2. Verify all environment variables are set correctly
3. Test locally first before deploying
