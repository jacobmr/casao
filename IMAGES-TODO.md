# Experience Images - TODO

## Current Status
✅ **Fixed 404 errors** - Using gradient backgrounds with large emoji icons instead of missing image files
✅ **Looks good** - Colorful gradient (blue to green) with emoji overlay creates attractive cards
✅ **No broken links** - All cards display properly

## Future Enhancement: Real Photos

When you're ready to add real photos, here's what to do:

### Option 1: Use Your Own Photos
1. Take or source high-quality photos for each experience
2. Save them in `/public/images/experiences/`
3. Name them according to experience IDs (e.g., `atv-tour.jpg`)
4. Update `/lib/experiences-data.ts` - the `image` field is already set up

### Option 2: Use Stock Photos (Recommended for Now)
I can help you source free stock photos from:
- **Unsplash** - High-quality, free for commercial use
- **Pexels** - Great travel/adventure photos
- **Pixabay** - Wide variety

### Required Images (29 total)

#### Adventures (5)
- `atv-tour.jpg` - ATV on beach/forest trail
- `canopy-tour.jpg` - Zip-lining through trees
- `atv-canopy-combo.jpg` - Combined adventure shot
- `horseback-riding.jpg` - Horse on beach
- `rincon-all-day.jpg` - Volcano/hot springs

#### Nature Tours (6)
- `turtle-tours.jpg` - Sea turtle on beach
- `animal-sanctuary.jpg` - Sloth or wildlife
- `rincon-waterfall.jpg` - Waterfall/volcanic landscape
- `rio-celeste.jpg` - Turquoise waterfall
- `monteverde.jpg` - Cloud forest/hanging bridges
- `arenal-volcano.jpg` - Arenal volcano view
- `estuary.jpg` - Mangrove/boat tour
- `palo-verde.jpg` - Wetlands/birds

#### Water Activities (4)
- `deep-sea-fishing.jpg` - Fishing boat/catch
- `scuba-diving.jpg` - Underwater scene
- `white-water-rafting.jpg` - Rafting action
- `surf-lessons.jpg` - Surfing/beach

#### Wellness (3)
- `yoga-classes.jpg` - Yoga on beach/terrace
- `massage-services.jpg` - Spa/massage setting
- `cooking-classes.jpg` - Cooking/kitchen

#### Concierge (11)
- `airport-transfer.jpg` - Vehicle/airport
- `vehicle-rentals.jpg` - Car/golf cart
- `babysitting.jpg` - Family-friendly scene
- `restaurant-reservations.jpg` - Restaurant/dining
- `grocery-delivery.jpg` - Fresh produce/groceries
- `flower-arrangements.jpg` - Tropical flowers
- `photo-sessions.jpg` - Camera/beach photography
- `private-chef.jpg` - Chef preparing food
- `bartender-services.jpg` - Cocktails/bar
- `beach-rentals.jpg` - Beach chairs/umbrellas

### Image Specifications
- **Format:** JPG or WebP (WebP preferred for performance)
- **Size:** 800x600px minimum (4:3 aspect ratio)
- **Quality:** High resolution, well-lit, professional
- **Style:** Bright, inviting, action-oriented
- **Rights:** Must have permission to use (own photos or licensed stock)

### How to Update When Ready
1. Add images to `/public/images/experiences/`
2. The code is already set up to use them
3. Just deploy and they'll appear automatically

## Current Implementation
The cards now show:
- Beautiful gradient background (blue → green)
- Large emoji icon (🏍️, 🤿, 🌿, etc.)
- Slight dark overlay for depth
- Seasonal badges when applicable

This looks professional and works well until real photos are added!

---

**Want me to source stock photos for you?** I can find appropriate images from Unsplash/Pexels and prepare them for you to download.
