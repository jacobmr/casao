# Casa O Experiences - Superdesign Strategy

**Date:** October 27, 2025  
**Philosophy:** Experiences are a PRIMARY conversion driver, not an afterthought

---

## 🎯 Core Insight

**OLD THINKING:** Book lodging → Add experiences as upsell  
**NEW THINKING:** Sell complete vacation packages → Lodging + Experiences = Unforgettable Stay

### Why This Matters

- **Differentiation:** Every property has beds. Not every property curates world-class experiences.
- **Higher perceived value:** $2000 lodging feels expensive. $2000 for lodging + ATV + zip-line + private chef feels like a steal.
- **Emotional connection:** People book vacations for memories, not mattresses.
- **Conversion driver:** Experiences create urgency and excitement that drives booking decisions.

---

## 📐 Complete User Journey

### **Phase 1: Discovery (Homepage)**

```
Hero Section
  ↓
"Your Complete Costa Rica Experience" Teaser
  - 3-4 Featured Experiences (with photos)
  - "Explore All Adventures & Services" CTA
  ↓
Property Details
  ↓
"Check Availability" Button
```

**Goal:** Plant the seed that this is more than just a rental

---

### **Phase 2: Exploration (/experiences page)**

```
Stunning hero image of adventure
  ↓
"Curate Your Perfect Vacation"
  ↓
Categorized Experiences:
  🏄 Adventures (ATV, Canopy, Horseback, etc.)
  🌊 Water Activities (Diving, Fishing, Surfing)
  🌿 Nature Tours (Waterfalls, Wildlife, Cloud Forest)
  💆 Wellness (Yoga, Massage, Spa)
  🍽️ Concierge (Chef, Transport, Babysitting)
  ↓
Each with:
  - Beautiful photo
  - Compelling description
  - Duration & highlights
  - "Book Your Stay" CTA
```

**Goal:** Build excitement and mental commitment to experiences

---

### **Phase 3: Booking Intent (Calendar Modal)**

```
Click "Check Availability" from anywhere
  ↓
Modal opens with calendar
  ↓
Select dates
  ↓
"Book This!" button
```

**Goal:** Capture dates and move to enhancement

---

### **Phase 4: Enhancement (/enhance page)**

```
"Enhance Your Stay - Select Your Experiences"
  ↓
Same experiences but with checkboxes
  ↓
Real-time discount notification:
  "Select 2+ experiences → Save 5% on lodging!"
  ↓
Sticky "Continue to Checkout" button
```

**Goal:** Convert interest into selections with discount incentive

---

### **Phase 5: Checkout (Handoff)**

```
Branded handoff page shows:
  - Dates & property
  - Selected experiences
  - Discount applied
  - "Securing your reservation..."
  ↓
Redirect to Blue Zone Guesty
```

**Goal:** Reinforce value and complete booking

---

## 🎨 Design System

### Public Experiences Page (/experiences)

**Layout:**

```
┌─────────────────────────────────────────┐
│  Hero Image (Full width, 60vh)          │
│  "Your Costa Rica Adventure Awaits"     │
│  Overlay text + "Start Planning" CTA    │
├─────────────────────────────────────────┤
│  Introduction Section                   │
│  "We don't just offer a place to stay.  │
│   We curate unforgettable experiences." │
├─────────────────────────────────────────┤
│  🏄 ADVENTURES                          │
│  ┌──────┐ ┌──────┐ ┌──────┐            │
│  │ ATV  │ │Canopy│ │Horse │            │
│  │ Tour │ │ Tour │ │back  │            │
│  └──────┘ └──────┘ └──────┘            │
│  ... (grid of cards with images)        │
├─────────────────────────────────────────┤
│  🌊 WATER ACTIVITIES                    │
│  (similar grid)                         │
├─────────────────────────────────────────┤
│  🌿 NATURE TOURS                        │
│  (similar grid)                         │
├─────────────────────────────────────────┤
│  💆 WELLNESS & RELAXATION               │
│  (similar grid)                         │
├─────────────────────────────────────────┤
│  🍽️ CONCIERGE SERVICES                 │
│  (similar grid)                         │
├─────────────────────────────────────────┤
│  CTA Section                            │
│  "Ready to Book Your Complete Vacation?"│
│  [Check Availability] button            │
└─────────────────────────────────────────┘
```

**Card Design:**

```
┌─────────────────────┐
│                     │
│   [Photo 16:9]      │
│                     │
├─────────────────────┤
│ 🏍️ ATV Tour        │
│                     │
│ Off-road adventure  │
│ through forests and │
│ beaches             │
│                     │
│ ⏱️ ~2 hours         │
│ ✓ Guide included    │
│ ✓ All equipment     │
│                     │
│ [Learn More →]      │
└─────────────────────┘
```

---

### In-Booking Enhancement Page (/enhance)

**Layout:**

```
┌─────────────────────────────────────────┐
│  Enhance Your Stay                      │
│  Select experiences for your trip       │
│  Feb 15-20, 2025                        │
├─────────────────────────────────────────┤
│  💰 SPECIAL OFFER                       │
│  Select 2+ experiences → Save 5% on     │
│  your lodging ($XXX savings!)           │
├─────────────────────────────────────────┤
│  🏄 Adventures & Tours                  │
│  ☐ ATV Tour - Off-road adventure (~2h)  │
│  ☐ Canopy Tour - Zip-line course        │
│  ☐ Horseback Riding - Beach & mountains │
│  ... (compact list)                     │
├─────────────────────────────────────────┤
│  🍽️ Concierge Services                 │
│  ☐ Airport Transfer - Hassle-free       │
│  ☐ Private Chef - Gourmet meals         │
│  ☐ Massage - In-villa relaxation        │
│  ... (compact list)                     │
├─────────────────────────────────────────┤
│  [Continue to Checkout] (sticky)        │
└─────────────────────────────────────────┘
```

**Compact List Item:**

```
☐ ATV Tour
  Off-road adventure through forests and beaches
  ~2 hours • Guide & equipment included
```

---

## 🏗️ Technical Architecture

### File Structure

```
/app/
  /experiences/
    page.tsx              # Public browsing page
    layout.tsx            # Experiences-specific layout
  /enhance/
    page.tsx              # In-booking selection page

/components/
  /experiences/
    experience-card.tsx   # Card for public page
    experience-list-item.tsx  # Checkbox item for enhance page
    category-section.tsx  # Reusable category container
    discount-banner.tsx   # 5% discount notification

/lib/
  experiences-data.ts     # Single source of truth for all experiences
  discount-calculator.ts  # Calculate 5% discount logic

/public/
  /images/
    /experiences/
      atv-tour.jpg
      canopy-tour.jpg
      ... (all experience images)
```

---

### Data Structure

```typescript
// lib/experiences-data.ts

export interface Experience {
  id: string;
  name: string;
  category: "adventure" | "water" | "nature" | "wellness" | "concierge";
  shortDescription: string;
  fullDescription: string;
  duration?: string;
  inclusions: string[];
  highlights: string[];
  icon: string;
  image?: string;
  seasonal?: boolean;
  seasonalNote?: string;
}

export const experiences: Experience[] = [
  {
    id: "atv-tour",
    name: "ATV Tour",
    category: "adventure",
    shortDescription: "Off-road adventure through forests and beaches",
    fullDescription:
      "Experience the thrill of riding through Costa Rica's diverse terrain. Navigate forest trails, cross rivers, and cruise along pristine beaches on your own ATV with an expert guide leading the way.",
    duration: "~2 hours",
    inclusions: [
      "ATV rental",
      "Professional guide",
      "Safety equipment",
      "Water",
    ],
    highlights: [
      "Beach riding",
      "Forest trails",
      "River crossings",
      "Scenic viewpoints",
    ],
    icon: "🏍️",
    image: "/images/experiences/atv-tour.jpg",
  },
  // ... 28 more experiences
];

export const categories = {
  adventure: {
    name: "Adventures",
    icon: "🏄",
    description: "Thrilling activities for adrenaline seekers",
  },
  water: {
    name: "Water Activities",
    icon: "🌊",
    description: "Dive, fish, and surf in the Pacific",
  },
  nature: {
    name: "Nature Tours",
    icon: "🌿",
    description: "Explore Costa Rica's incredible biodiversity",
  },
  wellness: {
    name: "Wellness & Relaxation",
    icon: "💆",
    description: "Rejuvenate your body and mind",
  },
  concierge: {
    name: "Concierge Services",
    icon: "🍽️",
    description: "Personalized services for a seamless stay",
  },
};
```

---

## 🎯 Component Specifications

### 1. Experience Card (Public Page)

```typescript
// components/experiences/experience-card.tsx

interface ExperienceCardProps {
  experience: Experience
  onBookClick?: () => void
}

export function ExperienceCard({ experience, onBookClick }: ExperienceCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-48 w-full">
        <Image
          src={experience.image || '/images/placeholder.jpg'}
          alt={experience.name}
          fill
          className="object-cover"
        />
        {experience.seasonal && (
          <Badge className="absolute top-2 right-2">Seasonal</Badge>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{experience.icon}</span>
          <h3 className="font-semibold text-lg">{experience.name}</h3>
        </div>

        <p className="text-muted-foreground text-sm mb-3">
          {experience.shortDescription}
        </p>

        {experience.duration && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            {experience.duration}
          </div>
        )}

        <div className="space-y-1 mb-4">
          {experience.inclusions.slice(0, 3).map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={onBookClick}
          variant="outline"
          className="w-full"
        >
          Book Your Stay
        </Button>
      </CardContent>
    </Card>
  )
}
```

---

### 2. Experience List Item (Enhance Page)

```typescript
// components/experiences/experience-list-item.tsx

interface ExperienceListItemProps {
  experience: Experience
  selected: boolean
  onToggle: (id: string) => void
}

export function ExperienceListItem({
  experience,
  selected,
  onToggle
}: ExperienceListItemProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
      onClick={() => onToggle(experience.id)}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0 mt-1">
        <div className={cn(
          "h-5 w-5 rounded border-2 flex items-center justify-center",
          selected
            ? "bg-primary border-primary"
            : "border-muted-foreground"
        )}>
          {selected && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{experience.icon}</span>
          <h4 className="font-semibold">{experience.name}</h4>
        </div>

        <p className="text-sm text-muted-foreground mb-2">
          {experience.shortDescription}
        </p>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {experience.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {experience.duration}
            </span>
          )}
          {experience.inclusions.slice(0, 2).map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-600" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

### 3. Discount Banner

```typescript
// components/experiences/discount-banner.tsx

interface DiscountBannerProps {
  selectedCount: number
  lodgingTotal: number
}

export function DiscountBanner({ selectedCount, lodgingTotal }: DiscountBannerProps) {
  const discountApplies = selectedCount >= 2
  const discountAmount = discountApplies ? lodgingTotal * 0.05 : 0

  if (selectedCount === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-blue-600" />
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-100">
              Special Offer: Save 5% on Your Stay
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Select 2 or more experiences to unlock your discount
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (selectedCount === 1) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              You're almost there!
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Select 1 more experience to save 5% on your lodging
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3">
        <PartyPopper className="h-6 w-6 text-green-600" />
        <div>
          <p className="font-semibold text-green-900 dark:text-green-100">
            🎉 Discount Unlocked!
          </p>
          <p className="text-sm text-green-700 dark:text-green-300">
            You've selected {selectedCount} experiences — Save ${discountAmount.toFixed(2)} (5%) on your lodging!
          </p>
        </div>
      </div>
    </div>
  )
}
```

---

## 🔄 Updated User Flows

### Flow A: Discovery → Experiences → Booking

```
1. Land on homepage
2. See "Featured Experiences" teaser
3. Click "Explore All Adventures"
4. Browse /experiences page
5. Get excited about ATV + Canopy + Chef
6. Click "Book Your Stay"
7. Calendar modal opens
8. Select dates
9. Click "Book This!"
10. /enhance page loads with checkboxes
11. Select ATV + Canopy + Chef (3 items)
12. See "Save 5% - $100 off!" banner
13. Click "Continue to Checkout"
14. Handoff page shows selections
15. Redirect to Guesty
```

### Flow B: Direct Booking → Discover Experiences

```
1. Land on homepage
2. Click "Check Availability"
3. Calendar modal opens
4. Select dates
5. Click "Book This!"
6. /enhance page loads
7. Discover all the experiences
8. Select 2+ items
9. Get 5% discount
10. Continue to checkout
```

### Flow C: Navigation → Experiences

```
1. Click "Experiences" in main nav
2. Browse /experiences page
3. Click "Book Your Stay" on any card
4. Calendar modal opens
5. Continue normal flow
```

---

## 📱 Mobile Optimization

### Public Experiences Page

- **Hero:** 50vh on mobile (not 60vh)
- **Cards:** Single column on mobile, 2 cols on tablet, 3-4 cols on desktop
- **Images:** Lazy load after first 3
- **Sticky CTA:** "Book Your Stay" button floats at bottom

### Enhance Page

- **Banner:** Collapsible on mobile after first view
- **List items:** Full width, larger tap targets
- **Sticky footer:** Shows selected count + "Continue" button

---

## 🎨 Visual Design Guidelines

### Photography

- **High quality:** Professional photos only
- **Action shots:** People enjoying experiences (with permission)
- **Diverse:** Show different ages, groups, solo travelers
- **Authentic:** Real Costa Rica, not stock photos

### Color Psychology

- **Green:** Nature, wellness, available
- **Blue:** Water activities, trust, calm
- **Orange:** Adventure, energy, excitement
- **Pink:** Booked/unavailable (softer than red)
- **Gold:** Premium, concierge services

### Typography

- **Headings:** Font-serif (elegant, vacation feel)
- **Body:** Sans-serif (readable, modern)
- **CTAs:** Bold, high contrast

---

## 📊 Success Metrics

### Public Experiences Page

- **Page views:** Track visits to /experiences
- **Time on page:** Measure engagement
- **CTA clicks:** "Book Your Stay" conversion rate
- **Scroll depth:** How far users scroll

### Enhance Page

- **Selection rate:** % who select at least 1 experience
- **Average selections:** Mean number of items selected
- **Discount redemption:** % who select 2+ (get discount)
- **Completion rate:** % who continue to checkout

### Overall

- **Booking conversion:** Compare before/after experiences launch
- **Average booking value:** Lodging + perceived experience value
- **Guest satisfaction:** Post-stay survey about experience interest

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Today)

- [x] Create experiences data structure
- [ ] Build public /experiences page
- [ ] Add "Experiences" to navigation
- [ ] Create homepage teaser section

### Phase 2: Booking Integration (Today)

- [ ] Build /enhance page with checkboxes
- [ ] Implement discount logic
- [ ] Update calendar "Book This!" to go to /enhance
- [ ] Update handoff to include selections

### Phase 3: Polish (Tomorrow)

- [ ] Add experience images
- [ ] Implement lazy loading
- [ ] Add animations/transitions
- [ ] Mobile testing & optimization

### Phase 4: Enhancement (Next Week)

- [ ] Add testimonials/reviews
- [ ] Implement filtering (by category, duration)
- [ ] Add "Recommended packages" (pre-selected bundles)
- [ ] Analytics tracking

---

## 💡 Future Enhancements

### Smart Recommendations

```typescript
// Based on booking dates, suggest seasonal experiences
if (bookingMonth === "July" || bookingMonth === "August") {
  highlight("turtle-tours"); // Nesting season
}

// Based on group size
if (guests >= 6) {
  highlight("private-chef", "beach-rentals");
}

// Based on stay duration
if (nights >= 7) {
  suggest("multi-day-packages");
}
```

### Package Deals

```
"Adventure Seeker Package"
  ✓ ATV Tour
  ✓ Canopy Tour
  ✓ White Water Rafting
  Save 10% on lodging + experiences

"Relaxation Retreat"
  ✓ Daily Yoga
  ✓ 2 Massages
  ✓ Private Chef (1 night)
  Save 10% on lodging + experiences
```

### Social Proof

```
⭐⭐⭐⭐⭐ "The ATV tour was incredible!"
- Sarah M., Feb 2025

📸 Guest photos from recent experiences
🏆 "Most Popular" badges on top experiences
```

---

## ✅ Definition of Done

### Public Experiences Page

- [ ] All 29 experiences displayed
- [ ] Categorized and filterable
- [ ] Beautiful imagery
- [ ] Mobile responsive
- [ ] Fast loading (<2s)
- [ ] SEO optimized
- [ ] "Book Your Stay" CTAs work

### Enhance Page

- [ ] All experiences with checkboxes
- [ ] Discount banner works
- [ ] Selection state persists
- [ ] Integrates with handoff
- [ ] Mobile optimized
- [ ] Accessible (keyboard nav, screen readers)

### Integration

- [ ] Navigation includes "Experiences"
- [ ] Homepage teaser section
- [ ] Calendar → Enhance flow works
- [ ] Handoff includes selections
- [ ] Analytics tracking active

---

**Let's build the most compelling vacation rental experience in Costa Rica! 🌴**
