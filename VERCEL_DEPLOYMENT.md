# Vercel Deployment Guide

## ✅ Code Pushed to GitHub

Repository: `casao` (or your repo name)
Branch: `main`

---

## A) Environment Variables for Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these **6 variables**:

```
GUESTY_BASE_URL=https://booking.guesty.com/api
GUESTY_CLIENT_ID=0oar5x3tmjD6hF3Ay5d7
GUESTY_CLIENT_SECRET=Za1CCofPzDMsOrTuuoU76hwxoYZHNDMpP1-zw7prUuLE8OxTOLhk4Vutea9kYO9J
GUESTY_OAUTH_TOKEN_URL=https://booking.guesty.com/oauth2/token
GUESTY_PROPERTY_ID=688a8aae483ff0001243e891
GUESTY_OAUTH_SCOPE=booking_engine:api
```

**Important**: Set these for **Production**, **Preview**, and **Development** environments.

---

## B) Images

✅ **Already included in repo!**

- 39 property photos in `/public/images/`
- Will deploy automatically with the site
- Accessible at: `https://your-site.vercel.app/images/en-properties-688a8aae483ff0001243e891/001.jpg`

---

## C) Build Settings

Vercel should auto-detect Next.js, but verify:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x or higher

---

## D) After Deployment

1. Visit your Vercel URL
2. Test these pages:
   - `/` - Home (if exists)
   - `/book` - Booking calendar
   - `/book/payment?quoteId=test` - Payment page

3. Check that:
   - ✅ Calendar loads
   - ✅ Images display
   - ✅ API calls work
   - ✅ No console errors

---

## E) Troubleshooting

### "API Error" or "Not Authorized"
- Check environment variables are set correctly
- Redeploy after adding env vars

### "Images not loading"
- Images are in `/public/images/` - should work automatically
- Check browser console for 404s

### "Build failed"
- Check build logs in Vercel
- Might need to clear cache and redeploy

---

## F) v0 Design

Once deployed, use this URL in v0:
- **Live Site**: `https://your-project.vercel.app`
- **v0 Prompt**: See `V0_PROMPT.md`

---

## Quick Deploy Checklist

- [x] Code pushed to GitHub
- [ ] Create Vercel project
- [ ] Connect GitHub repo
- [ ] Add 6 environment variables
- [ ] Deploy
- [ ] Test `/book` page
- [ ] Get Vercel URL
- [ ] Use URL with v0 for redesign

---

**You're ready to deploy!** 🚀
