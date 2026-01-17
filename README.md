# Collaborative Document Annotation System

A full-stack MERN (MongoDB, Express, React, Node.js) application for collaborative document annotation with real-time synchronization.

![CollabDoc](https://img.shields.io/badge/MERN-Stack-green) ![License](https://img.shields.io/badge/license-MIT-blue)

## 🚀 Features

- **Document Upload & Storage**: Upload text (`.txt`, `.md`, `.html`, `.json`, `.xml`) and PDF files
- **Annotation System**: Select text and add annotations/comments with precise character-based positioning
- **Real-Time Collaboration**: Multiple users can annotate simultaneously with live updates via Socket.io
- **Overlapping Annotations**: Support for multiple annotations on the same text range
- **Duplicate Prevention**: Compound index prevents exact duplicate annotations
- **Virtualized Lists**: Efficient rendering of 1000+ annotations using react-window
- **User Management**: JWT authentication, collaborator invitations

## 🏗️ Architecture

```
CollabDoc/
├── backend/                 # Express API + Socket.io server
│   ├── src/
│   │   ├── api/             # Controllers, routes, middleware
│   │   ├── config/          # Configuration management
│   │   ├── models/          # MongoDB schemas
│   │   ├── socket/          # Socket.io handlers
│   │   └── utils/           # Helper functions
│   └── uploads/             # Uploaded files storage
├── frontend/                # React + Vite application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── contexts/        # React context providers
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API and Socket services
│   │   └── types/           # TypeScript definitions
└── common/                  # Shared types
```

## 📊 Schema Design

### Performance Optimizations

| Collection | Indexes | Purpose |
|------------|---------|---------|
| users | `email`, `username` | Fast lookup by unique identifiers |
| documents | `owner`, `collaborators`, `createdAt` | Efficient document listing |
| annotations | `(documentId, startOffset, endOffset, userId)` | **Compound index for O(1) duplicate detection** |
| annotations | `(documentId, createdAt)` | Fast annotation loading |

### Annotation Schema
```typescript
{
  documentId: ObjectId,      // Indexed for fast queries
  userId: ObjectId,
  startOffset: Number,       // Character-based positioning
  endOffset: Number,
  selectedText: String,
  comment: String,
  color: String,
  isResolved: Boolean,
  createdAt: Date
}
```

## 🔧 Performance Features

### Backend
1. **Compound Index** - O(1) duplicate annotation detection
2. **Lean Queries** - `.lean()` for read-only operations
3. **Connection Pooling** - Mongoose default pool
4. **Streaming Uploads** - Multer for file handling
5. **Early Validation** - Fail fast with express-validator

### Frontend
1. **Virtualization** - react-window for 1000+ annotations
2. **Debounced Selection** - 100ms debounce on text selection
3. **Optimistic Updates** - Immediate UI feedback
4. **Segment-Based Rendering** - Efficient overlapping annotation display
5. **Memoized Components** - React.memo for expensive renders

## 🛡️ Edge Case Handling

| Scenario | Solution |
|----------|----------|
| Overlapping annotations | Segments with stacked opacity rendering |
| Duplicate annotations | Compound index + pre-save validation |
| Concurrent edits | Last-write-wins + real-time sync |
| Large documents | Virtualized list + pagination |
| Network disconnect | Socket.io auto-reconnect + room rejoin |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/vivekraj123456/collabdoc.git
cd collabdoc
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Configure environment variables**
```bash
# Backend (.env)
cp .env.example .env
# Edit with your MongoDB URI and JWT secret

# Frontend (.env)
cp .env.example .env
```

5. **Start MongoDB** (if running locally)
```bash
mongod
```

6. **Start the development servers**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

7. **Open the app**
Navigate to `http://localhost:5173`

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/auth/me` | Get current user |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload document |
| GET | `/api/documents` | List user's documents |
| GET | `/api/documents/:id` | Get document content |
| DELETE | `/api/documents/:id` | Delete document |
| POST | `/api/documents/:id/collaborators` | Add collaborator |

### Annotations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents/:docId/annotations` | Get annotations |
| POST | `/api/documents/:docId/annotations` | Create annotation |
| PUT | `/api/annotations/:id` | Update annotation |
| DELETE | `/api/annotations/:id` | Delete annotation |

## 🔌 Socket.io Events

### Client → Server
- `join-document` - Join document room
- `leave-document` - Leave document room
- `create-annotation` - Create annotation (broadcasts to room)
- `update-annotation` - Update annotation
- `delete-annotation` - Delete annotation

### Server → Client
- `annotation-created` - New annotation from another user
- `annotation-updated` - Updated annotation
- `annotation-deleted` - Deleted annotation
- `user-joined` - User joined document
- `user-left` - User left document
- `active-users` - List of active users

## 🌐 Deployment

### Quick Start - Deploy to Vercel + Railway/Render

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step instructions.**

#### TL;DR - 3 Services to Deploy:

1. **Database**: MongoDB Atlas (free tier)
   - https://www.mongodb.com/cloud/atlas
   - Create cluster and user
   - Copy connection string

2. **Backend**: Railway or Render
   - Railway: https://railway.app (recommended - $5/month credit)
   - Render: https://render.com (free but sleeps after 15 min)
   - Deploy with GitHub, set environment variables

3. **Frontend**: Vercel (always free)
   - https://vercel.com
   - Deploy from GitHub
   - Set `VITE_API_URL` and `VITE_SOCKET_URL`

#### Environment Variables

**Backend** (`MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, etc.)
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/collabdoc
JWT_SECRET=generate-strong-random-key
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Frontend** (Vercel)
```
VITE_API_URL=https://your-backend.railway.app/api
VITE_SOCKET_URL=https://your-backend.railway.app
```

### Additional Resources
- Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Troubleshooting: See DEPLOYMENT.md section
- Docker support: Backend includes `Dockerfile` for containerization

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 License

MIT License - see [LICENSE](LICENSE)

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Built with ❤️ using the MERN Stack
