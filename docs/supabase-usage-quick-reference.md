# Supabase Cached Egress - Quick Reference

## Current Status
- **Free Tier Limit:** 5 GB/month
- **Your Usage:** 5.56 GB (0.56 GB overage)
- **Status:** ⚠️ Exceeding limit

## Immediate Actions

### 1. Check Current Usage
Visit your Supabase dashboard:
```
https://supabase.com/dashboard/project/{PROJECT_ID}/usage
```

Find your PROJECT_ID from:
- `NEXT_PUBLIC_SUPABASE_URL` environment variable
- Example: `https://abcdefgh.supabase.co` → PROJECT_ID is `abcdefgh`

### 2. Set Up Alerts ⚠️ (Critical)
1. Go to: Project Settings → Usage
2. Set email alerts at:
   - 80% (4 GB)
   - 90% (4.5 GB)  
   - 100% (5 GB)

### 3. Identify High Usage Days
Check the daily usage graph to see which days had spikes:
- Review what happened on those days
- Check if there were any deployments or traffic spikes
- Identify which features were used most

## Quick Wins to Reduce Egress

### ✅ Already Implemented (in this update)
1. **Extended API Cache Times** - `/api/characters` now caches for 24 hours (was 1 hour)
2. **Image Optimization** - Next.js image optimization configured for WebP/AVIF
3. **Documentation** - Complete optimization guide created

### 🔄 Immediate Actions You Can Take

#### 1. Review Image Preloading
Check `lib/preload-assets.ts` and `components/CharacterIconSelector.tsx`:
- Only preload essential images
- Avoid preloading entire character icon sets
- Use lazy loading for non-critical images

#### 2. Optimize Character Icons API
The `/api/characters` route is already optimized, but ensure:
- Client-side code doesn't call it unnecessarily
- Character lists are cached in React state/context
- Only refetch when game type changes

#### 3. Review Storage Usage
Check your Supabase Storage:
1. Go to: Storage → Buckets
2. Check sizes of:
   - `public images` (character icons)
   - `scoreboard-public` (user uploads)
3. Consider:
   - Compressing large images
   - Converting to WebP format
   - Removing unused images

#### 4. Enable CDN Caching
If using Netlify/Vercel:
- Ensure CDN caching is enabled
- Review `netlify.toml` for cache headers
- Verify cache headers are being applied

## Monitoring

### Daily Checklist
- [ ] Check usage in Supabase dashboard
- [ ] Review any alerts received
- [ ] Monitor daily usage trend

### Weekly Review
- [ ] Identify usage patterns
- [ ] Review image storage sizes
- [ ] Check for unnecessary API calls
- [ ] Audit preloading strategies

## Emergency Measures (If Still Over Limit)

### Option 1: Move Static Assets
Move character icons to external CDN:
- Vercel Blob Storage
- Cloudflare R2
- AWS S3 + CloudFront

Keep user-uploaded content in Supabase.

### Option 2: Upgrade Plan
If usage is legitimate:
- **Pro Plan:** $25/month, 50 GB cached egress
- **Team Plan:** $599/month, 200 GB cached egress

### Option 3: Implement Aggressive Caching
- Service Worker for offline caching
- IndexedDB for persistent storage
- Longer cache TTLs (already implemented for API routes)

## Understanding Your Usage

Based on your codebase, main sources:

1. **Storage Images (Primary)**
   - Character icons: `public images` bucket
   - User uploads: `scoreboard-public` bucket
   - Locations: Scoreboard displays, character selectors

2. **API Responses**
   - Character list API responses
   - Scoreboard data queries
   - User profile data

## Resources

- **Full Guide:** `docs/supabase-egress-optimization.md`
- **Usage Monitor:** `lib/supabase/usage-monitor.ts` (optional)
- **Supabase Docs:** https://supabase.com/docs/guides/platform/usage-based-pricing

## Next Steps

1. ✅ **Today:** Set up usage alerts in Supabase dashboard
2. ✅ **Today:** Review usage graphs to identify patterns
3. **This Week:** Audit image preloading in your components
4. **This Week:** Review and optimize image sizes in storage
5. **Ongoing:** Monitor usage daily until below limit

