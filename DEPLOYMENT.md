# Deployment Guide - DadTime

## Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   npm run build
   vercel --prod
   ```

3. **Follow the prompts:**
   - Link to existing project or create new
   - Confirm settings
   - Wait for deployment

4. **Your app will be live at:** `https://your-app.vercel.app`

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**
   ```bash
   npm run build
   netlify deploy --prod
   ```

3. **Follow the prompts**

### Option 3: GitHub Pages

1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json scripts:**
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

### Option 4: Cloudflare Pages

1. **Go to:** https://pages.cloudflare.com/
2. **Connect your GitHub repo**
3. **Build settings:**
   - Build command: `npm run build`
   - Output directory: `dist`
4. **Deploy!**

## Environment Variables

Before deploying, set these environment variables in your hosting platform:

### Optional (Supabase Backend):
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional (AI Features):
```
VITE_OPENAI_API_KEY=your_openai_api_key
```

**Note:** Without these, the app still works fully - it just won't have cloud sync or AI features.

## Post-Deployment Checklist

After deploying:

1. [ ] Visit your deployed URL
2. [ ] Open Safari on iPhone
3. [ ] Tap Share → Add to Home Screen
4. [ ] Test app in standalone mode
5. [ ] Test offline mode (turn off wifi/data)
6. [ ] Test all features work
7. [ ] Check service worker registered (DevTools)

## Deployment Settings

### Vercel
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Netlify
- Build Command: `npm run build`
- Publish Directory: `dist`
- Functions Directory: (leave empty)

### Cloudflare Pages
- Build Command: `npm run build`
- Build Output Directory: `/dist`
- Root Directory: `/`

## Custom Domain (Optional)

### Vercel
```bash
vercel domains add yourdomain.com
```

### Netlify
1. Go to Domain settings
2. Add custom domain
3. Update DNS records

## Testing Deployment Locally

Test production build locally before deploying:

```bash
npm run build
npm run preview
```

Then visit `http://localhost:4173`

## Troubleshooting

### Build Fails
- Check all dependencies installed: `npm install`
- Check TypeScript errors: `npm run lint`
- Try clearing cache: `rm -rf node_modules dist && npm install`

### Service Worker Not Working
- Must be HTTPS (not HTTP)
- Check `public/sw.js` exists
- Check browser console for registration errors

### Icons Not Showing
- Run: `npm run generate:all`
- Check `public/` folder has all PNGs
- Clear browser cache

## Performance After Deployment

Your deployed app will have:
- ⚡ Lighthouse score 90+
- 🚀 First Contentful Paint < 1.5s
- 📦 Bundle size < 500KB (gzipped)
- 🔄 Offline mode enabled
- 📱 Installable as app

## Next Steps After Deployment

1. **Share the URL** with test users
2. **Monitor performance** in Vercel/Netlify analytics
3. **Set up error tracking** (optional - Sentry)
4. **Add analytics** (optional - Plausible, Fathom)
5. **Collect feedback** from users

## Support

If deployment fails:
1. Check build logs in hosting platform
2. Ensure all required files exist
3. Verify environment variables set
4. Test build locally first
