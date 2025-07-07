# Railway Environment Configuration

## Backend Service Environment Variables

Set these in your Railway backend service:

```
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters-long-for-production
DATABASE_URL=postgresql://username:password@host:port/database
CORS_ORIGIN=https://your-frontend-url.up.railway.app
PORT=3001
```

## Frontend Service Environment Variables

Set these in your Railway frontend service:

```
VITE_API_URL=https://your-backend-url.up.railway.app
VITE_APP_NAME=Comment System
VITE_ENVIRONMENT=production
```

## Railway Setup Steps

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Create a new project:**
   ```bash
   railway new
   ```

4. **Add PostgreSQL Database:**
   - In Railway dashboard: New Service → Database → PostgreSQL
   - This automatically creates DATABASE_URL

5. **Create Backend Service:**
   - In Railway dashboard: New Service → GitHub Repo
   - Select your repository
   - Set service name: "backend"
   - Set dockerfile: "railway.dockerfile"

6. **Create Frontend Service:**
   - In Railway dashboard: New Service → GitHub Repo
   - Select your repository
   - Set service name: "frontend"
   - Set dockerfile: "frontend.railway.dockerfile"

7. **Deploy:**
   ```bash
   # Deploy both services
   .\deploy-railway.ps1
   
   # Or deploy individually
   railway up --service backend --dockerfile railway.dockerfile
   railway up --service frontend --dockerfile frontend.railway.dockerfile
   ```

## Troubleshooting

- **Database Connection:** Make sure DATABASE_URL is set correctly
- **CORS Issues:** Update CORS_ORIGIN with your frontend URL
- **Build Failures:** Check Dockerfile paths and dependencies
- **Health Checks:** Ensure your services respond to health check endpoints
