# 🔧 GitHub Pages Deployment Fix

## Current Issues Fixed

✅ Removed npm cache dependency (was causing errors)  
✅ Added data file copy step  
✅ Updated workflow to use `npm install` instead of `npm ci`  

## Step-by-Step Setup

### 1. Enable GitHub Pages

1. Go to your repository: https://github.com/eu-cristofer/geo
2. Click **Settings** (top right)
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**, select: **GitHub Actions**

![GitHub Pages Settings](https://docs.github.com/assets/cb-47267/mw-1440/images/help/pages/publishing-source-drop-down.webp)

### 2. Add MapTiler Secret

1. Still in Settings, go to **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `VITE_MAPTILER_KEY`
4. Value: Your MapTiler API key (get from https://www.maptiler.com/cloud/)
5. Click **Add secret**

### 3. Push the Fixed Workflow

```bash
cd /Users/cristofer/GitHub/geo
git add .github/workflows/deploy.yml
git commit -m "Fix GitHub Pages deployment"
git push origin main
```

### 4. Monitor Deployment

1. Go to **Actions** tab in your repo
2. Watch the "Deploy Web App" workflow run
3. When complete (✅ green), your site will be at:
   
   **https://eu-cristofer.github.io/geo/**

### 5. Troubleshooting

If it still fails, check:

**A. Workflow Errors**
- Go to Actions tab
- Click on failed workflow
- Click on the failing job to see logs

**B. Common Issues:**

| Error | Solution |
|-------|----------|
| `npm ci` fails | ✅ Already fixed in new workflow |
| 401 unauthorized | Add VITE_MAPTILER_KEY secret |
| 404 on deployed site | Check base path in `vite.config.ts` |
| Data not loading | Verify data file exists in `public/data/` |

**C. Manual Build Test**

Test locally before pushing:
```bash
cd web
npm install
npm run build
npm run preview
```

Visit http://localhost:4173 to verify

### 6. Verify Settings

**In `web/vite.config.ts`:**
```typescript
base: '/geo/',  // Must match your repo name!
```

**In `web/src/main.ts`:**
```typescript
const response = await fetch('/data/apelos_clean.geojson');  // Correct path
```

**Data file location:**
```
web/public/data/apelos_clean.geojson  ✅ Correct
```

## Quick Deploy Commands

```bash
# 1. Ensure data is in place
cp processed_data/apelos_clean.geojson web/public/data/

# 2. Test build locally
cd web && npm run build && npm run preview

# 3. If it works, commit and push
cd ..
git add .
git commit -m "Fix GitHub Pages deployment"
git push origin main
```

## Expected Result

After successful deployment:
- ✅ Workflow completes in ~2-3 minutes
- ✅ Site available at: https://eu-cristofer.github.io/geo/
- ✅ Map loads with your appeal data
- ✅ Auto-deploys on every push to main

## Alternative: Deploy to Vercel (Easier!)

If GitHub Pages continues to have issues, Vercel is much easier:

```bash
cd web
npm install -g vercel
vercel --prod
```

Follow prompts, add your VITE_MAPTILER_KEY when asked, done! 🚀

## Still Not Working?

1. **Check GitHub Actions logs** for specific errors
2. **Verify you enabled GitHub Pages** in Settings
3. **Confirm secret is added** with exact name `VITE_MAPTILER_KEY`
4. **Try Vercel instead** - it's more reliable for beginners

## Next Steps After Success

1. ✅ Verify site loads at https://eu-cristofer.github.io/geo/
2. 🎨 Customize colors and content
3. 📱 Test on mobile devices
4. 🔗 Share your live map!

---

**Need more help?** Check the full deployment guide: [DEPLOYMENT.md](DEPLOYMENT.md)

