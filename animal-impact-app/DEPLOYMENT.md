# 🚀 Deployment Guide

This guide covers deploying the Animal Impact app to three different cloud platforms.

## 🚄 Railway (Recommended)

Railway is the best choice for this full-stack app because it supports SQLite persistence and has excellent TypeScript/Bun support.

### Prerequisites
- GitHub account
- Railway account (free tier available)

### Step 1: Prepare Repository
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/yourusername/animal-impact-app.git
git push -u origin main
```

### Step 2: Deploy to Railway
1. Visit [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `animal-impact-app` repository
4. Railway will auto-detect the Node.js project

### Step 3: Configure Environment Variables
In Railway dashboard → Variables tab, add:
```
NODE_ENV=production
JWT_SECRET=your-super-secure-production-jwt-secret-minimum-32-characters
PORT=3001
DATABASE_PATH=/app/data/animal_impact.db
```

### Step 4: Configure Build Settings
Railway should auto-detect, but verify:
- **Build Command**: `npm run build && npm run db:init`
- **Start Command**: `npm run start:prod`

### Step 5: Enable Persistent Storage
1. Go to your service → Settings → Volumes
2. Add a new volume:
   - **Mount Path**: `/app/data`
   - **Size**: 1GB (plenty for SQLite)

### Railway Deployment Complete! 🎉
Your app will be available at: `https://your-app-name.railway.app`

---

## ☁️ DigitalOcean App Platform

DigitalOcean is great for more control and traditional deployment.

### Step 1: Prepare for Deployment
Create a `app.yaml` file for DigitalOcean:

```yaml
name: animal-impact-app
services:
- name: api
  source_dir: /
  github:
    repo: yourusername/animal-impact-app
    branch: main
  run_command: npm run start
  build_command: npm run build && npm run db:init
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: JWT_SECRET
    value: your-super-secure-production-jwt-secret
    type: SECRET
  - key: DATABASE_PATH
    value: /app/data/animal_impact.db
  routes:
  - path: /
```

### Step 2: Deploy
1. Visit [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Create new app from GitHub
3. Select your repository
4. Configure build settings as above
5. Deploy!

**Note**: DigitalOcean's SQLite persistence may require additional configuration for production use.

---

## 🔺 Vercel (Frontend + Serverless Functions)

Vercel requires splitting the app into frontend and serverless functions due to its architecture.

### Limitations
- No persistent SQLite storage (use external database)
- Serverless functions have execution time limits
- More complex setup required

### Alternative: Use PostgreSQL with Vercel
If you want to use Vercel, consider switching to PostgreSQL:

1. Set up a PostgreSQL database (Supabase, Neon, or Vercel Postgres)
2. Update database connection in `database.ts`
3. Deploy frontend to Vercel with API routes

### Vercel Configuration
Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ]
}
```

---

## 🐳 Docker Deployment (Any Platform)

Use the included `Dockerfile` for containerized deployment:

### Build and Run Locally
```bash
# Build the Docker image
docker build -t animal-impact-app .

# Run the container
docker run -p 3001:3001 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secure-secret \
  -v $(pwd)/data:/app/data \
  animal-impact-app
```

### Deploy to Cloud Providers
The Docker image can be deployed to:
- **Google Cloud Run**
- **AWS ECS/Fargate**
- **Azure Container Instances**
- **Heroku** (with container registry)

---

## 🔧 Production Configuration

### Security Checklist
- ✅ Strong JWT secret (minimum 32 characters)
- ✅ HTTPS enabled (handled by platforms)
- ✅ Rate limiting configured
- ✅ Environment variables for secrets
- ✅ Database file permissions secured

### Monitoring Setup
```javascript
// Add to server.ts for basic monitoring
app.get('/api/status', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
```

### Database Backup (Railway/DigitalOcean)
```bash
# Backup command (run via SSH or container exec)
cp /app/data/animal_impact.db /app/data/backup_$(date +%Y%m%d_%H%M%S).db

# Restore command
cp /app/data/backup_YYYYMMDD_HHMMSS.db /app/data/animal_impact.db
```

---

## 🎯 Recommended Platform Choice

1. **Railway** - Best for this project (SQLite support, easy setup, good pricing)
2. **DigitalOcean** - Good for learning and more control
3. **Vercel** - Only if you switch to PostgreSQL/external database

---

## 🔗 Post-Deployment

After deployment:
1. Test the demo login: `johndoe@gmail.com` / `password123`
2. Verify all API endpoints work
3. Check database persistence by adding data and restarting
4. Monitor logs for any errors
5. Set up custom domain (optional)

### Custom Domain Setup
Most platforms support custom domains:
- **Railway**: Project Settings → Domains
- **DigitalOcean**: App Settings → Domains
- **Vercel**: Project Settings → Domains

---

## ⚡ Quick Deploy Commands

### Railway (fastest)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### Docker + Railway
```bash
# Deploy with Railway CLI
railway login
railway link
railway up --dockerfile
```

---

**Choose Railway for the easiest deployment experience!** 🚄