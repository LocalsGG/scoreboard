# Supabase Cached Egress Optimization Guide

## Understanding Cached Egress

**Cached Egress** refers to outgoing traffic from Supabase that is served from cache hits. This includes:
- API responses (database queries)
- Storage requests (images, files)
- Edge Functions

**Free Tier Limit:** 5 GB/month

## Monitoring Usage

### 1. Supabase Dashboard
- Visit: `https://supabase.com/dashboard/project/{PROJECT_ID}/usage`
- Check "Cached Egress" metric
- View daily breakdown to identify spikes

### 2. Set Up Alerts
1. Go to Project Settings → Usage
2. Set up email alerts at:
   - 80% of limit (4 GB)
   - 90% of limit (4.5 GB)
   - 100% of limit (5 GB)

### 3. Programmatic Monitoring (Optional)
Use the `usage-monitor.ts` utility to track requests in your application.

## Current Usage Patterns in Your App

Based on codebase analysis, your main sources of cached egress are:

1. **Storage Images** (Primary source)
   - Character icons from `public images` bucket
   - User-uploaded logos and character icons
   - Locations: `CharacterIconSelector`, `LogoSelector`, scoreboard displays

2. **API Responses**
   - Character list API (`/api/characters`)
   - Scoreboard data queries
   - User profile queries

## Optimization Strategies

### 1. Image Optimization ✅ (Partially Implemented)

**Current State:**
- Using Next.js Image component with remote patterns configured
- Basic caching headers on API routes

**Recommended Improvements:**

#### A. Optimize Image Sizes
```typescript
// In next.config.ts - add image optimization
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, "").split("/")[0] || "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ['image/avif', 'image/webp'], // Use modern formats
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};
```

#### B. Implement Lazy Loading
Already using lazy loading in some places, but ensure all non-critical images use it:
```typescript
<Image
  src={imageUrl}
  alt="Description"
  loading="lazy" // Always lazy load non-critical images
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### 2. CDN Caching Enhancement

**Current:** Basic cache headers on `/api/characters`

**Recommended:** Add more aggressive caching for static assets:

```typescript
// For character images list API
headers: {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800", // 24 hours, stale for 7 days
  "CDN-Cache-Control": "public, s-maxage=86400",
}
```

### 3. Client-Side Caching

**Current:** Basic in-memory cache via `useCachedFetch`

**Recommended:** Enhance with:
- Service Worker for offline caching
- IndexedDB for persistent storage of frequently accessed data
- Request deduplication

### 4. Reduce Image Preloading

**Current:** `preloadImages` function preloads images in batches

**Recommendation:** Only preload critical assets:
- Logo images on scoreboard (required)
- Character icons currently visible (not all)
- Avoid preloading entire character sets

### 5. Request Deduplication

Implement request deduplication to prevent multiple identical requests:

```typescript
// Example: lib/request-dedup.ts
const pendingRequests = new Map<string, Promise<any>>();

export async function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }
  
  const promise = fetcher();
  pendingRequests.set(key, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(key);
  }
}
```

### 6. Optimize Character Icons API

**Current:** Returns full list of characters every time

**Optimizations:**
- Cache the character list response on the server
- Only fetch when game type changes
- Use React Query with longer stale times

### 7. Use Supabase RLS Policies

Ensure Row Level Security is properly configured to:
- Prevent unauthorized access (reduces unnecessary requests)
- Allow efficient queries (use indexes)

### 8. Image Format Optimization

**Recommendations:**
- Convert images to WebP format (smaller file sizes)
- Use SVG for logos when possible (smaller, scalable)
- Optimize PNG/JPEG images before upload

## Immediate Actions

1. **Check Current Usage**
   ```bash
   # Visit Supabase dashboard and check usage graphs
   # Identify days with spikes
   ```

2. **Review Image Loading**
   - Check browser DevTools Network tab
   - Identify frequently loaded large images
   - Optimize those specific images

3. **Audit Character Icon Loading**
   - Ensure only visible icons are loaded
   - Implement virtualization for large lists
   - Cache character metadata separately from images

4. **Set Up Monitoring**
   - Configure Supabase usage alerts
   - Monitor daily usage trends
   - Set up custom alerts at 80% and 90%

## Emergency Measures (If Approaching Limit)

1. **Temporary Image Hosting**
   - Move static images to Vercel Blob, Cloudflare R2, or AWS S3
   - Update image URLs to new CDN
   - Keep user-uploaded images in Supabase (necessary for dynamic content)

2. **Reduce Cache Times**
   - Temporarily reduce cache durations
   - Force cache revalidation less frequently

3. **Limit Features**
   - Disable non-essential image preloading
   - Reduce image sizes in selectors
   - Implement image compression on upload

## Long-Term Solutions

1. **Upgrade Plan** (if usage is legitimate)
   - Pro plan: $25/month, 50 GB cached egress
   - Team plan: $599/month, 200 GB cached egress

2. **Hybrid Storage Strategy**
   - Static assets: External CDN (Vercel Blob, Cloudflare R2)
   - Dynamic assets: Supabase Storage
   - Use Supabase only for user-generated content

3. **Implement Aggressive Caching**
   - Service Worker with Cache API
   - IndexedDB for offline support
   - Intelligent cache invalidation

## Monitoring Checklist

- [ ] Set up Supabase usage alerts (80%, 90%, 100%)
- [ ] Review usage graphs weekly
- [ ] Audit image sizes monthly
- [ ] Monitor cache hit rates
- [ ] Track API response sizes
- [ ] Review storage bucket sizes

## Resources

- [Supabase Usage Documentation](https://supabase.com/docs/guides/platform/usage-based-pricing)
- [Next.js Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)
- [CDN Caching Best Practices](https://web.dev/http-cache/)

