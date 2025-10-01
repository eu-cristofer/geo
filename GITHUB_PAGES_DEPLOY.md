# 🚀 GitHub Pages Deployment - Step by Step

## Quick Setup (5 minutes)

### Step 1: Get MapTiler API Key
1. Go to https://www.maptiler.com/cloud/
2. Sign up for free account (100k map loads/month)
3. Go to **Account → Keys**
4. Copy your API key

### Step 2: Enable GitHub Pages
1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/geo`
2. Click **Settings** (top menu)
3. Click **Pages** (left sidebar)
4. Under "Source", select **GitHub Actions**

![GitHub Pages Settings](https://docs.github.com/assets/cb-47267/images/help/pages/publishing-source-drop-down.png)

### Step 3: Add MapTiler Secret
1. In your repo, go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `VITE_MAPTILER_KEY`
4. Value: (paste your MapTiler API key)
5. Click **Add secret**

### Step 4: Push Your Code
```bash
# Add all files
git add .

# Commit changes
git commit -m "Deploy map to GitHub Pages"

# Push to main branch
git push origin main
```

### Step 5: Wait for Deployment
1. Go to **Actions** tab in your GitHub repo
2. Watch the "Deploy Web App" workflow run
3. Wait ~2-3 minutes for build to complete
4. Your site will be live at:
   ```
   https://YOUR_USERNAME.github.io/geo/
   ```

---

## ✅ Verification Checklist

After deployment:
- [ ] Visit your GitHub Pages URL
- [ ] Map loads and displays correctly
- [ ] Can click on points to see information
- [ ] Map controls (zoom, pan) work
- [ ] Legend is visible

---

## 🔄 Updating Your Site

Every time you push to the main branch, GitHub Pages will automatically rebuild and redeploy:

```bash
# Make changes to your code
# Then:
git add .
git commit -m "Update map data"
git push origin main
```

The site will update in ~2-3 minutes.

---

## 🛠️ Troubleshooting

### Issue: Map shows but is blank
**Solution:** Check that your MapTiler API key is correctly added as a secret.

### Issue: 404 errors for assets
**Solution:** The `base` path in `vite.config.ts` is already set to `/geo/`. If your repo has a different name, update it:
```typescript
base: '/YOUR_REPO_NAME/',
```

### Issue: Workflow fails
**Solution:** 
1. Check the Actions tab for error details
2. Ensure `VITE_MAPTILER_KEY` secret is set
3. Ensure all files in `web/` directory are committed

### Issue: Changes not showing up
**Solution:**
1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Wait a few minutes for CDN to update

---

## 📊 Monitoring

- **Build Status**: Check the Actions tab
- **Site URL**: Listed in Settings → Pages
- **API Usage**: Check MapTiler dashboard for tile usage

---

## 🎯 Next Steps

1. **Custom Domain** (optional):
   - Buy domain from Namecheap, Google Domains, etc.
   - Add DNS records
   - Configure in Settings → Pages → Custom domain

2. **Analytics** (optional):
   - Add Google Analytics
   - Add Plausible Analytics
   - Monitor visitor traffic

3. **SEO**:
   - The meta tags are already configured in `index.html`
   - Submit to Google Search Console

---

## 📞 Need Help?

- GitHub Pages Docs: https://docs.github.com/pages
- MapTiler Support: https://www.maptiler.com/support/
- Vite Docs: https://vitejs.dev/

---

**Your map is now live on the web! 🎉**

