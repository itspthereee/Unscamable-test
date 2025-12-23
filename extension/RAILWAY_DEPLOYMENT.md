# Deploy to Railway

## Quick Deployment Steps

### 1. Prepare Your Repository
```bash
cd c:\Users\creep\Documents\GitHub\Unscamable
git add .
git commit -m "Add Railway deployment files"
git push
```

### 2. Deploy to Railway

#### Option A: Using Railway CLI (Recommended)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
cd extension
railway init

# Deploy
railway up
```

#### Option B: Using Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `Unscamable` repository
6. Railway will auto-detect the Flask app
7. Click "Deploy"

### 3. Get Your Railway URL
After deployment:
1. Go to your project dashboard
2. Click on your service
3. Go to "Settings" tab
4. Under "Domains", click "Generate Domain"
5. Copy the URL (e.g., `https://your-app.railway.app`)

### 4. Update Chrome Extension

Update `popup.js` line 44:
```javascript
// Change from:
const serverResponse = await fetch('http://localhost:5000/analyze', {

// To:
const serverResponse = await fetch('https://your-app.railway.app/analyze', {
```

Update `manifest.json`:
```json
"host_permissions": ["https://your-app.railway.app/*"]
```

### 5. Reload Extension
1. Go to `chrome://extensions/`
2. Click "Reload" button on your extension

## Files Created for Railway

- ✅ `requirements.txt` - Python dependencies
- ✅ `Procfile` - Tells Railway how to run the app
- ✅ `railway.toml` - Railway configuration
- ✅ Updated `app.py` - Added PORT environment variable support

## Environment Variables (Optional)

In Railway dashboard, you can add:
- `PYTHON_VERSION` = `3.11` (if needed)
- Any API keys or secrets

## Monitoring

- View logs in Railway dashboard
- Check deployment status
- Monitor resource usage

## Cost

- Railway offers free tier with 500 hours/month
- More than enough for this project
- Upgrades available if needed

## Troubleshooting

### Deployment fails
- Check Railway logs in dashboard
- Verify all files are committed to git
- Ensure `requirements.txt` is in the correct directory

### CORS errors
- Verify CORS is enabled in `app.py`
- Check Railway URL is correct in extension
- Update `manifest.json` permissions

### Extension can't connect
- Make sure Railway domain is generated
- Check if app is running in Railway dashboard
- Verify URL in `popup.js` is correct
