# Performance Analysis: Hero Image Loading

## 🐌 Current Issue

**Problem:** First hero image loads very slowly on initial page visit

**Current Implementation:**
```tsx
// components/hero-carousel.tsx
<Image
  src={`/images/property/${String(index + 1).padStart(3, "0")}.jpg`}
  alt={`Casa Vistas - View ${index + 1}`}
  fill
  className="object-cover"
  priority={index < 3}  // ✅ Good: First 3 images have priority
  quality={85}
  sizes="100vw"
/>
```

## 🔍 Root Causes

### 1. **Image Size**
- Likely large file sizes (need to check actual images)
- Full resolution images for all devices
- No responsive image optimization

### 2. **All 39 Images Rendered**
- All 39 images are in the DOM (hidden with opacity)
- Browser must download/parse all images
- Wastes bandwidth and memory

### 3. **No Blur Placeholder**
- No visual feedback while loading
- Feels slower than it is

### 4. **Possible CDN Issues**
- Images served from Vercel (good)
- But no additional CDN optimization

## ✅ Solutions (In Priority Order)

### **QUICK WIN #1: Add Blur Placeholder** (5 min)
```tsx
<Image
  src={`/images/property/${String(index + 1).padStart(3, "0")}.jpg`}
  alt={`Casa Vistas - View ${index + 1}`}
  fill
  className="object-cover"
  priority={index === 0}  // Only first image
  quality={85}
  sizes="100vw"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Generate this
/>
```

**Impact:** Immediate perceived performance improvement

---

### **QUICK WIN #2: Lazy Load Non-Visible Images** (10 min)
```tsx
{/* Only render first 3 images initially */}
{Array.from({ length: TOTAL_IMAGES }).map((_, index) => {
  // Only render current, previous, and next images
  const shouldRender = 
    index === currentIndex || 
    index === (currentIndex - 1 + TOTAL_IMAGES) % TOTAL_IMAGES ||
    index === (currentIndex + 1) % TOTAL_IMAGES;
    
  if (!shouldRender) return null;
  
  return (
    <div key={index} ...>
      <Image ... />
    </div>
  );
})}
```

**Impact:** Reduces initial DOM size from 39 images to 3 images

---

### **MEDIUM WIN #3: Optimize Image Files** (30 min)
```bash
# Use sharp or imagemin to optimize
npm install sharp

# Script to optimize all images
node scripts/optimize-images.js
```

**Optimizations:**
- Convert to WebP (50-80% smaller)
- Resize to max needed dimensions (e.g., 1920x1080)
- Compress with quality 80-85
- Generate multiple sizes for responsive loading

**Impact:** 50-70% reduction in file size

---

### **BIG WIN #4: Implement Progressive Loading** (45 min)
```tsx
// Load low-res placeholder first, then high-res
const [imageLoaded, setImageLoaded] = useState(false);

<Image
  src={`/images/property/${String(index + 1).padStart(3, "0")}.jpg`}
  alt={`Casa Vistas - View ${index + 1}`}
  fill
  className={cn(
    "object-cover transition-opacity duration-300",
    imageLoaded ? "opacity-100" : "opacity-0"
  )}
  priority={index === 0}
  quality={85}
  sizes="100vw"
  onLoadingComplete={() => setImageLoaded(true)}
/>
```

---

### **ADVANCED #5: Use CDN with Image Optimization** (60 min)
Options:
- **Cloudinary** (free tier: 25GB/month)
- **Imgix** (free tier: 1000 images)
- **Cloudflare Images** ($5/month for 100k images)

**Benefits:**
- Automatic format conversion (WebP, AVIF)
- Automatic resizing
- Global CDN
- Lazy loading
- Quality optimization

---

## 📊 Expected Results

### Current Performance:
- First image: ~3-5 seconds (estimated)
- Perceived load time: Slow
- Total DOM: 39 images

### After Quick Wins (#1 + #2):
- First image: ~2-3 seconds
- Perceived load time: Fast (blur placeholder)
- Total DOM: 3 images
- **Time to implement:** 15 minutes

### After All Optimizations:
- First image: < 1 second
- Perceived load time: Instant
- Total DOM: 3 images
- File sizes: 50-70% smaller
- **Time to implement:** 2-3 hours

---

## 🎯 Recommended Approach

### **Phase 1: Quick Wins (Today - 15 min)**
1. Add blur placeholder to first image
2. Lazy load non-visible images
3. Only set priority on first image

**Result:** Immediate improvement, minimal effort

### **Phase 2: Image Optimization (This Week - 30 min)**
1. Optimize all 39 images
2. Convert to WebP
3. Resize to appropriate dimensions

**Result:** 50-70% faster loading

### **Phase 3: Advanced (Future - 60 min)**
1. Implement CDN
2. Progressive loading
3. Responsive images

**Result:** Professional-grade performance

---

## 🛠️ Implementation Code

### Blur Placeholder Generator
```bash
# Generate blur placeholder
npm install plaiceholder

# In build script
import { getPlaiceholder } from "plaiceholder";

const { base64 } = await getPlaiceholder("/images/property/001.jpg");
```

### Lazy Loading Component
```tsx
function LazyImage({ src, index, currentIndex, ...props }) {
  const shouldLoad = Math.abs(index - currentIndex) <= 1;
  
  if (!shouldLoad) {
    return <div className="absolute inset-0 bg-muted" />;
  }
  
  return <Image src={src} {...props} />;
}
```

---

## 📈 Metrics to Track

**Before:**
- Largest Contentful Paint (LCP): ?
- Time to Interactive (TTI): ?
- First Contentful Paint (FCP): ?

**Target:**
- LCP: < 2.5s
- TTI: < 3.5s
- FCP: < 1.8s

**Tools:**
- Lighthouse (Chrome DevTools)
- WebPageTest.org
- Vercel Analytics

---

## 💡 Additional Recommendations

1. **Preload first image:**
```tsx
// In app/layout.tsx or page.tsx
<link
  rel="preload"
  as="image"
  href="/images/property/001.jpg"
  fetchpriority="high"
/>
```

2. **Use loading="eager" for first image only**

3. **Consider using a video instead of carousel:**
   - Single MP4 file (smaller than 39 images)
   - Autoplay with muted
   - Better perceived performance

4. **Add skeleton loader:**
   - Show placeholder while loading
   - Matches final layout
   - Reduces layout shift

---

## 🎯 Priority Order for Today

1. ✅ **Blur placeholder** (5 min) - Biggest perceived impact
2. ✅ **Lazy load images** (10 min) - Reduces initial load
3. ✅ **Priority only on first** (2 min) - Focuses resources
4. ⏳ **Optimize images** (30 min) - Do later this week

**Total time for quick wins: 17 minutes**
**Expected improvement: 40-50% faster perceived load**
