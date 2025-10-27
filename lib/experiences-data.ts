// Single source of truth for all experiences and concierge services

export type ExperienceCategory = 'adventure' | 'water' | 'nature' | 'wellness' | 'concierge'

export interface Experience {
  id: string
  name: string
  category: ExperienceCategory
  shortDescription: string
  fullDescription: string
  duration?: string
  inclusions: string[]
  highlights: string[]
  icon: string
  image?: string
  seasonal?: boolean
  seasonalNote?: string
}

export const categories = {
  adventure: {
    name: 'Adventures',
    icon: '🏄',
    description: 'Thrilling activities for adrenaline seekers',
    color: 'orange'
  },
  water: {
    name: 'Water Activities',
    icon: '🌊',
    description: 'Dive, fish, and surf in the Pacific',
    color: 'blue'
  },
  nature: {
    name: 'Nature Tours',
    icon: '🌿',
    description: 'Explore Costa Rica\'s incredible biodiversity',
    color: 'green'
  },
  wellness: {
    name: 'Wellness & Relaxation',
    icon: '💆',
    description: 'Rejuvenate your body and mind',
    color: 'purple'
  },
  concierge: {
    name: 'Concierge Services',
    icon: '🍽️',
    description: 'Personalized services for a seamless stay',
    color: 'gold'
  }
} as const

export const experiences: Experience[] = [
  // ADVENTURE EXPERIENCES
  {
    id: 'atv-tour',
    name: 'ATV Tour',
    category: 'adventure',
    shortDescription: 'Off-road adventure through forests and beaches',
    fullDescription: 'Experience the thrill of riding through Costa Rica\'s diverse terrain. Navigate forest trails, cross rivers, and cruise along pristine beaches on your own ATV with an expert guide leading the way.',
    duration: '~2 hours',
    inclusions: ['ATV rental', 'Professional guide', 'Safety equipment', 'Water'],
    highlights: ['Beach riding', 'Forest trails', 'River crossings', 'Scenic viewpoints'],
    icon: '🏍️',
    image: '/images/experiences/atv-tour.jpg'
  },
  {
    id: 'canopy-tour',
    name: 'Canopy Tour',
    category: 'adventure',
    shortDescription: 'High-flying zip-line course with hanging bridges',
    fullDescription: 'Soar through the treetops on an exhilarating zip-line adventure. Experience the rainforest from a bird\'s eye view as you glide between platforms and cross hanging bridges high above the forest floor.',
    duration: '~3 hours',
    inclusions: ['All equipment', 'Professional guides', 'Snacks', 'Water'],
    highlights: ['Multiple zip-lines', 'Hanging bridges', 'Rainforest views', 'Safety briefing'],
    icon: '🪂',
    image: '/images/experiences/canopy-tour.jpg'
  },
  {
    id: 'atv-canopy-combo',
    name: 'ATV + Canopy Combo',
    category: 'adventure',
    shortDescription: 'Best of both worlds: ATV adventure and canopy zip-lines',
    fullDescription: 'Maximize your adventure with this half-day combination tour. Start with an exciting ATV ride through diverse terrain, then take to the skies on our thrilling zip-line canopy tour.',
    duration: '~5 hours',
    inclusions: ['ATV rental', 'Zip-line equipment', 'Guides', 'Snacks', 'Water'],
    highlights: ['Two adventures in one', 'Forest and beach', 'Aerial views', 'Full day excitement'],
    icon: '⚡',
    image: '/images/experiences/combo-tour.jpg'
  },
  {
    id: 'horseback-riding',
    name: 'Horseback Riding',
    category: 'adventure',
    shortDescription: 'Gentle ride along beaches and mountains',
    fullDescription: 'Explore Costa Rica\'s stunning landscapes on horseback. Our experienced guides match you with the perfect horse for your skill level, whether you\'re a beginner or experienced rider.',
    duration: '~2 hours',
    inclusions: ['Horse rental', 'Professional guide', 'Safety equipment', 'Water'],
    highlights: ['Beach riding', 'Mountain trails', 'All skill levels', 'Scenic views'],
    icon: '🐴',
    image: '/images/experiences/horseback.jpg'
  },
  {
    id: 'turtle-tours',
    name: 'Turtle Tours',
    category: 'nature',
    shortDescription: 'Evening tour to witness nesting turtles',
    fullDescription: 'Experience the magic of sea turtle nesting season. Watch in awe as these ancient creatures come ashore to lay their eggs on the Pacific coast beaches under the stars.',
    duration: '~3 hours',
    inclusions: ['Transportation', 'Expert guide', 'Beach access'],
    highlights: ['Nesting turtles', 'Conservation education', 'Night beach walk', 'Rare wildlife'],
    icon: '🐢',
    seasonal: true,
    seasonalNote: 'Available July-November during nesting season',
    image: '/images/experiences/turtle-tour.jpg'
  },
  {
    id: 'animal-sanctuary',
    name: 'Animal Sanctuary + Zip Line',
    category: 'nature',
    shortDescription: 'Wildlife sanctuary visit followed by zip-lining',
    fullDescription: 'Start your day meeting rescued wildlife at a local sanctuary, learning about conservation efforts. Then experience the rainforest from above on an exciting zip-line adventure.',
    duration: '~4 hours',
    inclusions: ['Sanctuary entrance', 'Zip-line equipment', 'Guides', 'Lunch'],
    highlights: ['Rescued animals', 'Conservation education', 'Zip-line adventure', 'Full experience'],
    icon: '🦥',
    image: '/images/experiences/sanctuary.jpg'
  },
  {
    id: 'rincon-waterfall',
    name: 'Rincón de la Vieja Waterfall & Hike',
    category: 'nature',
    shortDescription: 'Explore volcanic terrain and swim in Oropéndola Waterfall',
    fullDescription: 'Hike through the stunning Rincón de la Vieja National Park, home to volcanic hot springs, bubbling mud pots, and the spectacular Oropéndola Waterfall where you can swim in crystal-clear waters.',
    duration: 'Full day',
    inclusions: ['Park entrance', 'Professional guide', 'Lunch', 'Transportation'],
    highlights: ['Volcanic landscape', 'Waterfall swim', 'Hot springs', 'Diverse wildlife'],
    icon: '🌋',
    image: '/images/experiences/rincon.jpg'
  },
  {
    id: 'rio-celeste',
    name: 'Rio Celeste Waterfall Hike',
    category: 'nature',
    shortDescription: 'Hike to the famous turquoise waterfall',
    fullDescription: 'Discover one of Costa Rica\'s most stunning natural wonders. The Rio Celeste gets its brilliant turquoise color from a natural chemical reaction, creating an otherworldly landscape you won\'t forget.',
    duration: 'Full day',
    inclusions: ['Park entrance', 'Professional guide', 'Lunch', 'Transportation'],
    highlights: ['Turquoise waterfall', 'Rainforest hike', 'Unique geology', 'Photo opportunities'],
    icon: '💎',
    image: '/images/experiences/rio-celeste.jpg'
  },
  {
    id: 'rincon-all-day',
    name: 'All-Day Adventure (Rincón de la Vieja)',
    category: 'adventure',
    shortDescription: 'Multi-activity day: bridges, canopy, horseback, hot springs',
    fullDescription: 'The ultimate adventure day! Experience hanging bridges, zip-lining, horseback riding, volcanic mud baths, and natural hot springs all in one incredible day at Rincón de la Vieja.',
    duration: 'Full day',
    inclusions: ['All activities', 'Equipment', 'Guides', 'Lunch', 'Transportation'],
    highlights: ['5 activities in one', 'Hot springs', 'Mud bath', 'Complete adventure'],
    icon: '🎢',
    image: '/images/experiences/rincon-all-day.jpg'
  },
  {
    id: 'monteverde',
    name: 'Monteverde Cloud Forest Adventure',
    category: 'nature',
    shortDescription: 'Experience the cloud forest\'s biodiversity and hanging bridges',
    fullDescription: 'Journey to the mystical Monteverde Cloud Forest. Walk among the clouds on hanging bridges, spot rare wildlife, and immerse yourself in one of the world\'s most unique ecosystems.',
    duration: 'Full day',
    inclusions: ['Park entrance', 'Hanging bridges', 'Professional guide', 'Lunch', 'Transportation'],
    highlights: ['Cloud forest', 'Hanging bridges', 'Rare wildlife', 'Unique ecosystem'],
    icon: '☁️',
    image: '/images/experiences/monteverde.jpg'
  },
  {
    id: 'arenal-volcano',
    name: 'Arenal Volcano & Rainforest Adventure',
    category: 'nature',
    shortDescription: 'Visit Arenal volcano with waterfall, bridges, and hot springs',
    fullDescription: 'Explore the iconic Arenal Volcano region. Choose from activities like La Fortuna waterfall, hanging bridges, rainforest hikes, and relax in natural volcanic hot springs.',
    duration: 'Full day',
    inclusions: ['Activities of choice', 'Park entrances', 'Guide', 'Lunch', 'Transportation'],
    highlights: ['Arenal Volcano', 'Hot springs', 'Waterfall', 'Customizable activities'],
    icon: '🏔️',
    image: '/images/experiences/arenal.jpg'
  },
  
  // WATER ACTIVITIES
  {
    id: 'deep-sea-fishing',
    name: 'Deep Sea Fishing',
    category: 'water',
    shortDescription: 'Charter boat fishing for marlin, tuna, and mahi-mahi',
    fullDescription: 'Experience world-class sportfishing in the Pacific. Charter a 27ft or 29ft boat and fish for marlin, sailfish, tuna, mahi-mahi, and more with experienced captains.',
    duration: 'Half day or full day',
    inclusions: ['Boat charter', 'Captain & crew', 'Equipment', 'Bait', 'Drinks'],
    highlights: ['Big game fish', 'Experienced crew', 'All equipment', 'Flexible duration'],
    icon: '🎣',
    image: '/images/experiences/fishing.jpg'
  },
  {
    id: 'scuba-diving',
    name: 'Scuba Diving',
    category: 'water',
    shortDescription: 'Dive at Catalina Islands with professional guides',
    fullDescription: 'Explore the underwater world at the famous Catalina Islands. Suitable for all levels from beginners to advanced divers, with professional PADI-certified guides.',
    duration: '~4 hours',
    inclusions: ['Equipment rental', 'Professional guide', 'Boat transportation', 'Snacks'],
    highlights: ['Catalina Islands', 'All skill levels', 'Marine life', 'PADI certified'],
    icon: '🤿',
    image: '/images/experiences/diving.jpg'
  },
  {
    id: 'estuary-tours',
    name: 'Estuary Tours',
    category: 'nature',
    shortDescription: 'Quiet boat ride through mangroves spotting wildlife',
    fullDescription: 'Glide peacefully through the mangrove estuaries, spotting crocodiles, monkeys, exotic birds, and other wildlife in their natural habitat. Perfect for nature lovers and photographers.',
    duration: '~3 hours',
    inclusions: ['Boat tour', 'Expert naturalist guide', 'Binoculars', 'Drinks'],
    highlights: ['Crocodiles', 'Monkeys', 'Bird watching', 'Peaceful nature'],
    icon: '🚤',
    image: '/images/experiences/estuary.jpg'
  },
  {
    id: 'palo-verde',
    name: 'Palo Verde National Park Boat Tour',
    category: 'nature',
    shortDescription: 'River safari to see crocodiles, birds, and monkeys',
    fullDescription: 'Take a river safari through Palo Verde National Park, one of Central America\'s most important wetlands. See massive crocodiles, hundreds of bird species, and playful monkeys.',
    duration: '~5 hours',
    inclusions: ['Boat tour', 'Park entrance', 'Naturalist guide', 'Lunch', 'Transportation'],
    highlights: ['Wetland ecosystem', 'Large crocodiles', 'Bird paradise', 'Monkey sightings'],
    icon: '🦜',
    image: '/images/experiences/palo-verde.jpg'
  },
  {
    id: 'white-water-rafting',
    name: 'White Water Rafting',
    category: 'water',
    shortDescription: 'Raft Class III/IV rapids on Tenorio River',
    fullDescription: 'Experience the thrill of white water rafting on the Tenorio River. Navigate exciting Class III and IV rapids with professional guides ensuring your safety and fun.',
    duration: '~4 hours',
    inclusions: ['All equipment', 'Professional guides', 'Safety briefing', 'Lunch', 'Transportation'],
    highlights: ['Class III/IV rapids', 'Scenic river', 'Professional guides', 'Adventure thrill'],
    icon: '🛟',
    image: '/images/experiences/rafting.jpg'
  },
  {
    id: 'surf-lessons',
    name: 'Surf Lessons',
    category: 'water',
    shortDescription: 'Learn to surf with bilingual instructors',
    fullDescription: 'Learn to ride the waves with experienced bilingual instructors. Perfect for beginners, we provide all equipment and teach you the fundamentals of surfing in a safe, fun environment.',
    duration: '~2 hours',
    inclusions: ['Surfboard rental', 'Bilingual instructor', 'Rash guard', 'Water'],
    highlights: ['Beginner friendly', 'All equipment', 'Professional instruction', 'Local beaches'],
    icon: '🏄',
    image: '/images/experiences/surfing.jpg'
  },
  
  // WELLNESS & RELAXATION
  {
    id: 'yoga-classes',
    name: 'Yoga Classes',
    category: 'wellness',
    shortDescription: 'Personalized yoga sessions in your villa or by the beach',
    fullDescription: 'Start your day with rejuvenating yoga. Our certified instructors offer personalized sessions tailored to your level, whether in the comfort of your villa or on the beach at sunrise.',
    duration: '~1 hour',
    inclusions: ['Certified instructor', 'Yoga mats', 'Personalized session'],
    highlights: ['Private instruction', 'Villa or beach', 'All levels', 'Flexible scheduling'],
    icon: '🧘',
    image: '/images/experiences/yoga.jpg'
  },
  {
    id: 'massage-services',
    name: 'Massage Services',
    category: 'wellness',
    shortDescription: 'Luxurious massages in-room or on your terrace',
    fullDescription: 'Indulge in a professional massage without leaving your villa. Choose from Swedish, deep tissue, hot stone, or couples massage, performed by licensed therapists.',
    duration: '~1-2 hours',
    inclusions: ['Licensed therapist', 'Massage table', 'Premium oils', 'Music'],
    highlights: ['In-villa service', 'Multiple styles', 'Professional therapists', 'Ultimate relaxation'],
    icon: '💆',
    image: '/images/experiences/massage.jpg'
  },
  
  // CONCIERGE SERVICES
  {
    id: 'airport-transfer',
    name: 'Airport Transfers',
    category: 'concierge',
    shortDescription: 'Hassle-free pickup from Liberia or Tamarindo',
    fullDescription: 'Start and end your vacation stress-free with our reliable airport transfer service. We provide comfortable, air-conditioned transportation to and from Liberia or Tamarindo airports.',
    inclusions: ['Professional driver', 'Air-conditioned vehicle', 'Meet & greet', 'Luggage assistance'],
    highlights: ['Reliable service', 'Both airports', 'Comfortable vehicles', 'Stress-free travel'],
    icon: '✈️',
    image: '/images/experiences/airport.jpg'
  },
  {
    id: 'vehicle-rentals',
    name: 'Vehicle Rentals',
    category: 'concierge',
    shortDescription: 'Cars, golf carts, scooters, and motorcycles',
    fullDescription: 'Explore the area at your own pace. We arrange rentals for cars, golf carts, scooters, and motorcycles, all from trusted local providers with insurance included.',
    inclusions: ['Vehicle of choice', 'Insurance', 'Delivery to villa', 'Local support'],
    highlights: ['Multiple options', 'Delivered to you', 'Insured vehicles', 'Flexible duration'],
    icon: '🚗',
    image: '/images/experiences/rentals.jpg'
  },
  {
    id: 'babysitting',
    name: 'Professional Babysitting',
    category: 'concierge',
    shortDescription: 'Babysitters for children 1 month and older',
    fullDescription: 'Enjoy a romantic dinner or adult time knowing your children are in safe, caring hands. Our professional babysitters are experienced, background-checked, and available with 48-hour notice.',
    inclusions: ['Professional babysitter', 'Background checked', 'Flexible hours'],
    highlights: ['Experienced caregivers', 'All ages', 'Flexible scheduling', 'Peace of mind'],
    icon: '👶',
    image: '/images/experiences/babysitting.jpg'
  },
  {
    id: 'restaurant-reservations',
    name: 'Restaurant Reservations',
    category: 'concierge',
    shortDescription: 'Hand-picked romantic dinners and special celebrations',
    fullDescription: 'Let us secure reservations at the best local restaurants. We know the hidden gems and can arrange special setups for anniversaries, birthdays, or romantic dinners.',
    inclusions: ['Reservation service', 'Restaurant recommendations', 'Special requests coordination'],
    highlights: ['Local expertise', 'Special occasions', 'Best restaurants', 'Personalized service'],
    icon: '🍽️',
    image: '/images/experiences/restaurant.jpg'
  },
  {
    id: 'grocery-delivery',
    name: 'Grocery Delivery',
    category: 'concierge',
    shortDescription: 'Groceries delivered before arrival or during stay',
    fullDescription: 'Arrive to a fully stocked kitchen. Send us your shopping list and we\'ll have fresh groceries waiting for you, or arrange delivery anytime during your stay.',
    inclusions: ['Shopping service', 'Delivery to villa', 'Fresh products', 'Flexible timing'],
    highlights: ['Pre-arrival stocking', 'Fresh groceries', 'Local products', 'Convenient service'],
    icon: '🛒',
    image: '/images/experiences/grocery.jpg'
  },
  {
    id: 'flower-arrangements',
    name: 'Flower Arrangements & Decoration',
    category: 'concierge',
    shortDescription: 'Custom floral designs for special occasions',
    fullDescription: 'Celebrate special moments with beautiful flower arrangements. Perfect for anniversaries, birthdays, proposals, or surprise romantic setups in your villa.',
    inclusions: ['Custom arrangements', 'Fresh flowers', 'Villa setup', 'Special requests'],
    highlights: ['Special occasions', 'Custom designs', 'Romantic setups', 'Fresh flowers'],
    icon: '💐',
    image: '/images/experiences/flowers.jpg'
  },
  {
    id: 'photo-sessions',
    name: 'Photo Sessions',
    category: 'concierge',
    shortDescription: 'Professional photography to capture vacation memories',
    fullDescription: 'Capture your Costa Rica memories with a professional photo session. Our photographers know the best locations and lighting for stunning family portraits and candid shots.',
    duration: '~1-2 hours',
    inclusions: ['Professional photographer', 'Edited digital photos', 'Location scouting', 'Multiple outfit changes'],
    highlights: ['Professional quality', 'Beautiful locations', 'Family memories', 'Digital delivery'],
    icon: '📸',
    image: '/images/experiences/photos.jpg'
  },
  {
    id: 'cooking-classes',
    name: 'Cooking Classes',
    category: 'wellness',
    shortDescription: 'Private cooking lessons with a local chef',
    fullDescription: 'Learn to prepare authentic Costa Rican dishes with a private cooking class in your villa. Our local chefs share traditional recipes and techniques you can recreate at home.',
    duration: '~2 hours',
    inclusions: ['Professional chef', 'All ingredients', 'Recipes', 'Meal to enjoy'],
    highlights: ['Authentic recipes', 'Hands-on learning', 'Local cuisine', 'Take-home skills'],
    icon: '👨‍🍳',
    image: '/images/experiences/cooking.jpg'
  },
  {
    id: 'private-chef',
    name: 'Gourmet Chef Services',
    category: 'concierge',
    shortDescription: 'Private in-villa chef preparing multi-course meals',
    fullDescription: 'Enjoy restaurant-quality dining in the comfort of your villa. Our gourmet chefs prepare multi-course meals tailored to your preferences, dietary needs, and special occasions.',
    duration: 'Flexible',
    inclusions: ['Professional chef', 'Fresh ingredients', 'Custom menu', 'Service & cleanup'],
    highlights: ['Fine dining', 'Custom menus', 'Special occasions', 'In-villa service'],
    icon: '🍷',
    image: '/images/experiences/chef.jpg'
  },
  {
    id: 'bartender-services',
    name: 'Personal Bartender Services',
    category: 'concierge',
    shortDescription: 'Bartender for private events or cocktail hours',
    fullDescription: 'Elevate your villa gathering with a professional bartender. Perfect for cocktail hours, parties, or special celebrations. We provide the mixology expertise and flair.',
    duration: 'Flexible',
    inclusions: ['Professional bartender', 'Bar setup', 'Custom cocktails', 'Service'],
    highlights: ['Expert mixology', 'Custom drinks', 'Party service', 'Professional flair'],
    icon: '🍹',
    image: '/images/experiences/bartender.jpg'
  },
  {
    id: 'beach-rentals',
    name: 'Beach Equipment Rentals',
    category: 'concierge',
    shortDescription: 'Beach chairs, umbrellas, and coolers delivered',
    fullDescription: 'Enjoy your beach day in comfort. We deliver beach chairs, umbrellas, coolers, and other equipment to your favorite beach spot, and pick them up when you\'re done.',
    inclusions: ['Beach chairs', 'Umbrellas', 'Coolers', 'Delivery & pickup'],
    highlights: ['Convenient delivery', 'Quality equipment', 'Beach comfort', 'Hassle-free'],
    icon: '🏖️',
    image: '/images/experiences/beach.jpg'
  }
]

// Helper functions
export function getExperiencesByCategory(category: ExperienceCategory): Experience[] {
  return experiences.filter(exp => exp.category === category)
}

export function getExperienceById(id: string): Experience | undefined {
  return experiences.find(exp => exp.id === id)
}

export function getAllCategories(): ExperienceCategory[] {
  return Object.keys(categories) as ExperienceCategory[]
}

export function getFeaturedExperiences(count: number = 4): Experience[] {
  // Return a curated selection for homepage teaser
  return [
    experiences.find(e => e.id === 'atv-canopy-combo'),
    experiences.find(e => e.id === 'private-chef'),
    experiences.find(e => e.id === 'scuba-diving'),
    experiences.find(e => e.id === 'massage-services'),
  ].filter(Boolean).slice(0, count) as Experience[]
}
