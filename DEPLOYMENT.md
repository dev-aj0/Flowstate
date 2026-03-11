# Deployment Guide

## Frontend Deployment (Vercel)

The Next.js frontend is ready to deploy on Vercel. The build should work after removing the `outputFileTracingRoot` config.

### Environment Variables

Set these in your Vercel project settings:

```
NEXT_PUBLIC_WS_URL=wss://your-backend-domain.com/ws
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

**Important:** 
- Use `wss://` (secure WebSocket) in production, not `ws://`
- Replace `your-backend-domain.com` with your actual backend URL
- Replace `your-app.vercel.app` with your actual Vercel URL (for Open Graph images)

### Deployment Steps

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_WS_URL=wss://your-backend-domain.com/ws`
   - `NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app`
4. **Create and add `og-image.png`** (1200x630px) to the `public/` folder for link previews
5. Deploy

## Backend Deployment

The Python backend **cannot** run on Vercel. You need to deploy it separately.

### Recommended Platforms

1. **Railway** (Recommended)
   - Easy Python deployment
   - Automatic HTTPS
   - WebSocket support

2. **Render**
   - Free tier available
   - WebSocket support
   - Easy setup

3. **Fly.io**
   - Good for WebSocket apps
   - Global edge deployment

4. **DigitalOcean App Platform**
   - Simple deployment
   - WebSocket support

### Backend Environment Variables

Set these in your backend deployment platform:

**Required for Production:**
- `ALLOWED_ORIGINS` - Comma-separated list of frontend URLs
  ```
  ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app
  ```

**Optional:**
- `PORT` - Server port (defaults to 8001, most platforms set this automatically)

### Backend Deployment Steps (Railway Example)

1. Create a new Railway project
2. Connect your GitHub repository
3. Set the root directory to `backend/`
4. Railway will auto-detect Python and install dependencies
5. Set the start command: `python main.py` or `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Get your Railway URL (e.g., `https://your-app.railway.app`)
7. Update `NEXT_PUBLIC_WS_URL` in Vercel to: `wss://your-app.railway.app/ws`

## Important Notes

1. **WebSocket Protocol**: Always use `wss://` in production (secure WebSocket)

2. **CORS Configuration**: The backend now uses the `ALLOWED_ORIGINS` environment variable. Set it in your backend deployment platform:
   ```
   ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
   ```
   This allows both local development and production frontend to connect.

3. **Muse Headset**: The backend will work without a Muse headset (it will wait for connection), but real EEG data requires:
   - Muse 2 headset
   - BlueMuse or Muse Direct running
   - LSL stream active

## Troubleshooting

### Frontend shows "Backend disconnected"
- This means the browser cannot reach the Python backend over the WebSocket (separate from Muse/BlueMuse status)
- Check that backend is deployed and running
- Verify `NEXT_PUBLIC_WS_URL` is set correctly in Vercel
- Ensure backend CORS allows your frontend domain
- Check backend logs for errors

### WebSocket connection fails
- Ensure you're using `wss://` (not `ws://`) in production
- Check that your backend platform supports WebSockets
- Verify the backend URL is correct

### Build fails on Vercel
- Check that `next.config.ts` doesn't have `outputFileTracingRoot` pointing to parent directories
- Ensure all dependencies are in `package.json`
- Check build logs for specific errors

