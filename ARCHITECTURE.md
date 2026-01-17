# 🏗️ CollabDoc Deployment Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│                  https://yourapp.vercel.app                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         │ WebSocket (Socket.io)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  VERCEL CDN & HOSTING                        │
│             React + Vite Frontend Application                │
│                                                              │
│  - Static asset delivery (CSS, JS, images)                 │
│  - Automatic HTTPS                                         │
│  - Edge caching for fast load times                        │
│  - Automatic deployments from GitHub                       │
│                                                              │
│  Cost: ✅ FREE (always)                                    │
│  Region: Global CDN                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        │ API Requests                   │ WebSocket
        │ /api/documents                 │ Connection
        │ /api/annotations               │
        │                                 │
        ↓                                 ↓
┌─────────────────────────────────────────────────────────────┐
│           RAILWAY or RENDER (Backend)                       │
│        Express.js + Node.js + Socket.io                      │
│                                                              │
│  URL: https://backend.railway.app (or .onrender.com)       │
│                                                              │
│  - RESTful API endpoints                                   │
│  - Real-time WebSocket communication                       │
│  - File upload handling & processing                       │
│  - JWT authentication                                      │
│  - Document text extraction                                │
│    * PDF parsing (pdf-parse)                              │
│    * DOCX extraction (mammoth)                            │
│    * XLSX parsing (xlsx)                                  │
│  - Annotation management                                  │
│                                                              │
│  Railway Cost: ~$5-10/month (has free credits)            │
│  Render Cost: $7/month (always-on) or free (sleeps)      │
│  Auto-scaling: ✅ Supported                               │
│  Uptime: 99%+ guaranteed                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ TCP Connection
                         │ (Port 27017)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              MONGODB ATLAS (Database)                        │
│                                                              │
│  - User accounts & authentication                          │
│  - Document metadata & content                             │
│  - Annotations & comments                                  │
│                                                              │
│  Collections:                                              │
│  ├── users (indexed: email, username)                     │
│  ├── documents (indexed: owner, collaborators)            │
│  └── annotations (compound index for O(1) lookup)         │
│                                                              │
│  Free Tier: 512MB storage, 3 shared nodes                 │
│  Monthly Cost: FREE (or $9+ for larger)                   │
│  Backup: Automatic daily backups                          │
│  Replication: 3-node replica set                          │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Registration/Login
```
Browser → Vercel (React)
         → Railway Backend (/api/auth/register)
         → MongoDB (user document)
         ← JWT token
← Display dashboard
```

### 2. Document Upload
```
Browser → Select File
        → Vercel (upload form)
        → Railway Backend (/api/documents/upload)
        → File Processing:
          * PDF → pdf-parse → extract text
          * DOCX → mammoth → extract text
          * XLSX → xlsx → extract data
          * TXT/MD/JSON/XML → read as UTF-8
        → MongoDB (save document + content)
        ← Document ID
← Display in editor
```

### 3. Real-Time Annotation
```
Browser A → Select text
          → Vercel (React component)
          → Railway Backend (Socket.io)
          → Create annotation
          → MongoDB (save)
          → Socket.io broadcast
          ← Browser B, C, D all see update instantly
```

## Deployment Timeline

### Phase 1: Preparation (5 min)
```
1. Create MongoDB Atlas account
   → mongodb.com/cloud/atlas
   → Create free M0 cluster
   → Create database user
   → Copy connection string

2. Generate JWT secret
   → openssl rand -base64 32
   → Save securely
```

### Phase 2: Backend Deployment (10 min)
```
1. Go to railway.app (recommended)
2. Connect GitHub repository
3. Select /backend folder
4. Set environment variables:
   - MONGODB_URI
   - JWT_SECRET
   - FRONTEND_URL (temp)
   - NODE_ENV=production
5. Deploy
6. Copy Railway URL
```

### Phase 3: Frontend Deployment (10 min)
```
1. Go to vercel.com
2. Import GitHub repository
3. Select /frontend folder
4. Build command: npm run build
5. Output directory: dist
6. Set environment variables:
   - VITE_API_URL=<your-railway-url>/api
   - VITE_SOCKET_URL=<your-railway-url>
7. Deploy
8. Copy Vercel URL
```

### Phase 4: Configuration (5 min)
```
1. Go back to Railway dashboard
2. Update FRONTEND_URL to Vercel URL
3. Redeploy backend
4. Test on Vercel URL
```

**Total Time: ~30 minutes from start to live! 🚀**

## Environment Variables Summary

### Production Backend (.env)
```
NODE_ENV=production
PORT=5000 (auto-set by platform)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/collabdoc
JWT_SECRET=<32-char random string>
FRONTEND_URL=https://yourapp.vercel.app
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/tmp/uploads
```

### Production Frontend (.env)
```
VITE_API_URL=https://backend.railway.app/api
VITE_SOCKET_URL=https://backend.railway.app
```

## File Structure in Production

### Vercel (Frontend)
```
/
├── index.html (58 KB)
├── assets/
│   ├── index-[hash].js (283 KB → 92 KB gzipped)
│   └── index-[hash].css (20 KB → 4.6 KB gzipped)
└── (Total ~305 KB uncompressed, ~97 KB gzipped)
```

### Railway/Render (Backend)
```
/app
├── dist/
│   ├── index.js (compiled main)
│   ├── api/
│   ├── config/
│   ├── models/
│   ├── socket/
│   └── utils/
├── node_modules/
├── uploads/ (ephemeral - /tmp/uploads)
└── package.json
```

### MongoDB Atlas (Database)
```
collabdoc/
├── users
│   ├── _id
│   ├── email (indexed)
│   ├── username (indexed)
│   ├── password (hashed)
│   └── createdAt
├── documents
│   ├── _id
│   ├── owner (indexed)
│   ├── collaborators (indexed)
│   ├── content
│   ├── fileType
│   └── createdAt (indexed)
└── annotations
    ├── _id
    ├── documentId (compound index)
    ├── userId (compound index)
    ├── startOffset (compound index)
    ├── endOffset (compound index)
    ├── selectedText
    ├── comment
    └── createdAt (indexed)
```

## Performance Metrics

### Frontend (Vercel)
- Build time: ~2 seconds
- First Contentful Paint: <1s
- Time to Interactive: <2s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1

### Backend (Railway/Render)
- Startup time: <2s
- API response: <100ms (typical)
- Database query: <50ms (typical)
- Socket.io latency: <50ms (local network)

### Database (MongoDB)
- Query performance: O(1) for duplicate detection (compound index)
- Write performance: <50ms
- Connection pooling: Up to 5 concurrent connections

## Security Layers

```
Browser (HTTPS)
    ↓
Vercel CDN (HTTPS, auto-redirects HTTP)
    ↓
Railway Backend (HTTPS, JWT validation)
    ├─ CORS: Only from vercel.app domain
    ├─ Helmet: Security headers
    ├─ Rate limiting: Ready for implementation
    └─ Input validation: express-validator
    ↓
MongoDB (Connection string with password)
    ├─ Authentication: User/password
    ├─ Network access: IP whitelist
    ├─ Encryption: In transit (TLS)
    └─ Backups: Automatic daily
```

## Scaling Strategy

### Current Setup (Free/Cheap)
- Vercel: Auto-scales (free tier)
- Railway: Shared container (~$5/month)
- MongoDB: 512MB free cluster

### Recommended Upgrade
- Vercel: Pro $20/month (priority support)
- Railway: Dedicated instance (~$10/month)
- MongoDB: M2 Shared cluster $9/month (1GB)

### Enterprise Scale
- Vercel: Enterprise (custom)
- Railway: Dedicated infrastructure (custom)
- MongoDB: M10+ Dedicated cluster (starting $57/month)

## Disaster Recovery

```
GitHub Repository (Main backup)
    ↓ (automatic deployments)
Vercel (Frontend auto-deployed)
Railway (Backend auto-deployed)
    ↓
MongoDB Atlas (Automatic daily backups)
    ↓ (32-day backup retention)
On-demand restore available
```

---

**Your CollabDoc is deployment-ready!** 🚀

See DEPLOY_START_HERE.md for the quick 3-step deployment guide.
