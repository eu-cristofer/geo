# 🚀 Quick Deploy Reference

## One-Command Deployment

### Vercel (Recommended)
```bash
cd web && npx vercel --prod
```
**→ Deployed in ~60 seconds!**

### Netlify
```bash
cd web && npx netlify-cli deploy --prod
```

### Docker
```bash
cd web && docker-compose up -d
```

### GitHub Pages
```bash
# 1. Enable GitHub Pages in repo Settings → Pages → Source: GitHub Actions
# 2. Add VITE_MAPTILER_KEY secret in Settings → Secrets → Actions
# 3. Push to main branch:
git add . && git commit -m "Deploy to GitHub Pages" && git push
```
**→ Auto-deploys on every push to main!**

---

## Setup Checklist

- [ ] Node.js 20+ installed
- [ ] Get MapTiler API key from https://www.maptiler.com/cloud/
- [ ] Copy `web/env.example` to `web/.env`
- [ ] Add your API key to `.env`
- [ ] Run `npm install` in `web/` directory

---

## Platform Comparison

| Platform | Setup Time | Free Tier | Auto Deploy | Custom Domain |
|----------|-----------|-----------|-------------|---------------|
| **Vercel** | 2 min | ✅ 100GB | ✅ | ✅ |
| **Netlify** | 2 min | ✅ 100GB | ✅ | ✅ |
| **GitHub Pages** | 5 min | ✅ 100GB | ✅ | ✅ |
| **Docker** | 10 min | - | - | ✅ |

---

## Essential Commands

### Development
```bash
cd web
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Deployment
```bash
# Vercel
vercel                    # Deploy preview
vercel --prod            # Deploy production

# Netlify
netlify deploy           # Deploy preview
netlify deploy --prod    # Deploy production

# Docker
docker-compose up -d     # Start
docker-compose down      # Stop
docker-compose logs -f   # View logs
```

### Troubleshooting
```bash
npm run type-check       # Check TypeScript errors
rm -rf node_modules && npm install  # Fresh install
npm run build            # Test production build
```

---

## Environment Variables

**Required:**
- `VITE_MAPTILER_KEY` - Get from https://www.maptiler.com/cloud/

**Platform-specific setup:**

**Vercel:**
```bash
vercel env add VITE_MAPTILER_KEY production
```

**Netlify:**
```bash
netlify env:set VITE_MAPTILER_KEY your_key
```

**GitHub Actions:**
- Repository → Settings → Secrets → Actions
- Add `VITE_MAPTILER_KEY`

---

## URLs After Deployment

- **Vercel**: `https://your-project.vercel.app`
- **Netlify**: `https://your-site.netlify.app`
- **GitHub Pages**: `https://username.github.io/geo/`
- **Custom Domain**: Configure in platform settings

---

## Next Steps After Deploy

1. ✅ Test your live site
2. 🎨 Add custom domain (optional)
3. 📊 Enable analytics
4. 🔒 Verify HTTPS is working
5. 📱 Test on mobile devices
6. 🚀 Share with the world!

---

## Common Issues & Fixes

**Map not loading?**
→ Check API key in environment variables

**Build failing?**
→ Run `npm run type-check` and fix errors

**404 on refresh?**
→ Configure SPA fallback (included in configs)

**Slow performance?**
→ Check Lighthouse score: `npm run build && npx lighthouse http://localhost:4173`

---

## Need Help?

📖 Full Guide: [DEPLOYMENT.md](DEPLOYMENT.md)
📱 Web Docs: [web/README.md](web/README.md)
🐛 Issues: [GitHub Issues](https://github.com/yourusername/geo/issues)

---

**Happy Deploying! 🎉**

*Choose your platform above and deploy in minutes!*

