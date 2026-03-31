/**
 * EcoEats — Firestore seed script
 * Run once: node src/scripts/seedFirestore.js
 *
 * Requires: VITE_ env vars set in .env or exported in shell.
 * Uses the client SDK with temporary permissive rules (seed, then re-deploy secure rules).
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, writeBatch, doc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const RESTAURANTS = [
  {
    name: 'The Green Bowl',
    description: 'Plant-forward bowls and wraps made with seasonal, locally-sourced produce. Zero single-use plastic.',
    category: 'healthy',
    cuisineType: 'Health Food',
    tags: ['vegan', 'organic', 'gluten-free options'],
    address: 'Lane 5, North Main Road, Koregaon Park, Pune 411001',
    location: { lat: 18.5362, lng: 73.8937 },
    rating: 4.6,
    reviewCount: 134,
    deliveryTimeMin: 25,
    deliveryFee: 0,
    minimumOrder: 200,
    isOpen: true,
    isEcoCertified: true,
    ecoRating: 9.2,
    carbonFootprintPerOrder: 380,
    packagingType: 'Compostable',
    imageURL: 'https://source.unsplash.com/featured/?salad,bowl,healthy-food',
    menuCategories: ['Bowls', 'Wraps', 'Drinks'],
  },
  {
    name: 'Mitti Cafe',
    description: 'Wholesome thalis and comfort food employing people with disabilities. Certified B-Corp.',
    category: 'indian',
    cuisineType: 'Indian Thali',
    tags: ['vegetarian', 'thali', 'social enterprise'],
    address: 'FC Road, Shivajinagar, Pune 411005',
    location: { lat: 18.5195, lng: 73.8418 },
    rating: 4.8,
    reviewCount: 289,
    deliveryTimeMin: 30,
    deliveryFee: 30,
    minimumOrder: 150,
    isOpen: true,
    isEcoCertified: true,
    ecoRating: 8.8,
    carbonFootprintPerOrder: 450,
    packagingType: 'Biodegradable',
    imageURL: 'https://source.unsplash.com/featured/?thali,indian-food',
    menuCategories: ['Thali', 'Starters', 'Desserts'],
  },
  {
    name: 'Wholesome Kitchen',
    description: 'Cold-pressed juices, overnight oats, and nourish plates for the health-conscious.',
    category: 'cafe',
    cuisineType: 'Cafe & Health',
    tags: ['vegan', 'gluten-free', 'cold-pressed'],
    address: 'Baner Road, Baner, Pune 411045',
    location: { lat: 18.5590, lng: 73.7868 },
    rating: 4.4,
    reviewCount: 98,
    deliveryTimeMin: 20,
    deliveryFee: 0,
    minimumOrder: 250,
    isOpen: true,
    isEcoCertified: true,
    ecoRating: 9.5,
    carbonFootprintPerOrder: 210,
    packagingType: 'Reusable jars',
    imageURL: 'https://source.unsplash.com/featured/?acai,smoothie-bowl',
    menuCategories: ['Juices', 'Bowls', 'Snacks'],
  },
  {
    name: 'Terracotta Kitchen',
    description: 'Wood-fired pizzas and pastas in Kalyani Nagar. Ingredients sourced within 100km.',
    category: 'continental',
    cuisineType: 'Italian',
    tags: ['wood-fired', 'local sourcing', 'vegetarian options'],
    address: 'Kalyani Nagar, Pune 411006',
    location: { lat: 18.5460, lng: 73.9009 },
    rating: 4.5,
    reviewCount: 176,
    deliveryTimeMin: 35,
    deliveryFee: 50,
    minimumOrder: 350,
    isOpen: true,
    isEcoCertified: false,
    ecoRating: 6.4,
    carbonFootprintPerOrder: 720,
    packagingType: 'Recyclable',
    imageURL: 'https://source.unsplash.com/featured/?pizza,wood-fired',
    menuCategories: ['Pizzas', 'Pastas', 'Salads', 'Desserts'],
  },
  {
    name: 'Biryani House Aundh',
    description: 'Slow-cooked dum biryani using heritage rice varieties and free-range meat.',
    category: 'indian',
    cuisineType: 'Biryani & Kebabs',
    tags: ['biryani', 'halal', 'dum-cooked'],
    address: 'ITI Road, Aundh, Pune 411007',
    location: { lat: 18.5594, lng: 73.8078 },
    rating: 4.3,
    reviewCount: 312,
    deliveryTimeMin: 40,
    deliveryFee: 40,
    minimumOrder: 200,
    isOpen: true,
    isEcoCertified: false,
    ecoRating: 5.1,
    carbonFootprintPerOrder: 1100,
    packagingType: 'Recyclable',
    imageURL: 'https://source.unsplash.com/featured/?biryani,indian-rice',
    menuCategories: ['Biryani', 'Kebabs', 'Sides', 'Drinks'],
  },
  {
    name: 'Viman Veg',
    description: 'Pure vegetarian restaurant near Viman Nagar. Traditional Maharashtrian and Gujarati fare.',
    category: 'indian',
    cuisineType: 'Maharashtrian',
    tags: ['pure-veg', 'traditional', 'no-onion-garlic'],
    address: 'Viman Nagar Road, Viman Nagar, Pune 411014',
    location: { lat: 18.5679, lng: 73.9143 },
    rating: 4.2,
    reviewCount: 87,
    deliveryTimeMin: 30,
    deliveryFee: 30,
    minimumOrder: 150,
    isOpen: false,
    isEcoCertified: false,
    ecoRating: 7.0,
    carbonFootprintPerOrder: 390,
    packagingType: 'Biodegradable',
    imageURL: 'https://source.unsplash.com/featured/?maharashtrian-food,veg-thali',
    menuCategories: ['Thali', 'Snacks', 'Sweets'],
  },
  {
    name: 'Roots Organic Cafe',
    description: 'Certified organic cafe in Kothrud. Mushroom bowls, millet khichdi, and turmeric lattes.',
    category: 'cafe',
    cuisineType: 'Organic Cafe',
    tags: ['organic', 'vegan', 'millet', 'certified'],
    address: 'Paud Road, Kothrud, Pune 411038',
    location: { lat: 18.5074, lng: 73.8077 },
    rating: 4.7,
    reviewCount: 143,
    deliveryTimeMin: 28,
    deliveryFee: 0,
    minimumOrder: 200,
    isOpen: true,
    isEcoCertified: true,
    ecoRating: 9.8,
    carbonFootprintPerOrder: 180,
    packagingType: 'Compostable',
    imageURL: 'https://source.unsplash.com/featured/?organic,cafe,coffee',
    menuCategories: ['Mains', 'Drinks', 'Bakes'],
  },
  {
    name: 'Street Bites Wakad',
    description: 'Elevated street food — pav bhaji, vada pav, and chole bhature — in compostable packaging.',
    category: 'street',
    cuisineType: 'Street Food',
    tags: ['street food', 'vegetarian', 'quick bites'],
    address: 'Wakad Road, Wakad, Pune 411057',
    location: { lat: 18.5995, lng: 73.7627 },
    rating: 4.1,
    reviewCount: 204,
    deliveryTimeMin: 20,
    deliveryFee: 20,
    minimumOrder: 100,
    isOpen: true,
    isEcoCertified: false,
    ecoRating: 6.8,
    carbonFootprintPerOrder: 320,
    packagingType: 'Compostable',
    imageURL: 'https://source.unsplash.com/featured/?street-food,pav-bhaji',
    menuCategories: ['Pav Dishes', 'Chaat', 'Drinks'],
  },
]

const MENU_ITEMS = {
  'The Green Bowl': [
    { name: 'Buddha Bowl', description: 'Quinoa, roasted chickpeas, avocado, tahini dressing', price: 320, category: 'Bowls', isVegetarian: true, isVegan: true, carbonFootprint: 180, ecoScore: 9, isBestSeller: true, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?buddha-bowl,quinoa' },
    { name: 'Pesto Grain Bowl', description: 'Brown rice, grilled zucchini, cherry tomatoes, basil pesto', price: 280, category: 'Bowls', isVegetarian: true, isVegan: false, carbonFootprint: 210, ecoScore: 8, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?grain-bowl,pesto' },
    { name: 'Rainbow Wrap', description: 'Spinach tortilla, hummus, roasted peppers, cucumber, sprouts', price: 240, category: 'Wraps', isVegetarian: true, isVegan: true, carbonFootprint: 150, ecoScore: 9, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?wrap,hummus' },
    { name: 'Falafel Wrap', description: 'House-made falafel, tzatziki, pickled onion, romaine', price: 260, category: 'Wraps', isVegetarian: true, isVegan: false, carbonFootprint: 190, ecoScore: 8, isBestSeller: true, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?falafel,wrap' },
    { name: 'Cold-Pressed Greens', description: 'Spinach, cucumber, green apple, ginger, lemon', price: 180, category: 'Drinks', isVegetarian: true, isVegan: true, carbonFootprint: 60, ecoScore: 10, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?green-juice,cold-pressed' },
    { name: 'Watermelon Mint Cooler', description: 'Fresh watermelon, mint, lime, zero added sugar', price: 140, category: 'Drinks', isVegetarian: true, isVegan: true, carbonFootprint: 40, ecoScore: 10, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?watermelon-juice' },
  ],
  'Mitti Cafe': [
    { name: 'Full Thali', description: 'Dal, sabzi, rice, roti, papad, pickle, salad, dessert', price: 220, category: 'Thali', isVegetarian: true, isVegan: false, carbonFootprint: 420, ecoScore: 8, isBestSeller: true, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?thali,indian-vegetarian' },
    { name: 'Mini Thali', description: 'Dal, one sabzi, rice, 2 rotis, salad', price: 160, category: 'Thali', isVegetarian: true, isVegan: false, carbonFootprint: 310, ecoScore: 8, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?dal,roti' },
    { name: 'Paneer Tikka', description: 'House-marinated paneer, tandoor grilled, mint chutney', price: 280, category: 'Starters', isVegetarian: true, isVegan: false, carbonFootprint: 380, ecoScore: 6, isBestSeller: true, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?paneer-tikka' },
    { name: 'Mixed Veg Soup', description: 'Seasonal vegetables, coriander, light spices', price: 120, category: 'Starters', isVegetarian: true, isVegan: true, carbonFootprint: 80, ecoScore: 9, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?vegetable-soup' },
    { name: 'Gulab Jamun (2 pcs)', description: 'Classic milk-solid dumplings in rose-scented syrup', price: 90, category: 'Desserts', isVegetarian: true, isVegan: false, carbonFootprint: 120, ecoScore: 5, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?gulab-jamun,dessert' },
  ],
  'Wholesome Kitchen': [
    { name: 'Acai Power Bowl', description: 'Acai blend, banana, granola, chia seeds, seasonal fruit', price: 380, category: 'Bowls', isVegetarian: true, isVegan: true, carbonFootprint: 190, ecoScore: 9, isBestSeller: true, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?acai-bowl' },
    { name: 'Overnight Oats', description: 'Rolled oats, almond milk, flax seeds, seasonal berries', price: 220, category: 'Bowls', isVegetarian: true, isVegan: true, carbonFootprint: 140, ecoScore: 9, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?overnight-oats' },
    { name: 'Detox Green Juice', description: 'Kale, cucumber, celery, lemon, ginger', price: 200, category: 'Juices', isVegetarian: true, isVegan: true, carbonFootprint: 50, ecoScore: 10, isBestSeller: true, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?green-juice,detox' },
    { name: 'Golden Turmeric Latte', description: 'Oat milk, turmeric, black pepper, cinnamon, honey', price: 180, category: 'Juices', isVegetarian: true, isVegan: false, carbonFootprint: 70, ecoScore: 9, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?turmeric-latte' },
    { name: 'Almond Energy Balls (4 pcs)', description: 'Dates, almonds, coconut, raw cocoa — no refined sugar', price: 160, category: 'Snacks', isVegetarian: true, isVegan: true, carbonFootprint: 90, ecoScore: 9, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?energy-balls,dates' },
  ],
  'Terracotta Kitchen': [
    { name: 'Margherita Wood-Fired', description: 'San Marzano tomato, buffalo mozzarella, fresh basil, EVOO', price: 420, category: 'Pizzas', isVegetarian: true, isVegan: false, carbonFootprint: 580, ecoScore: 6, isBestSeller: true, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?margherita-pizza,wood-fired' },
    { name: 'Truffle Mushroom Pizza', description: 'Truffle oil, cremini mushrooms, fontina, arugula', price: 520, category: 'Pizzas', isVegetarian: true, isVegan: false, carbonFootprint: 620, ecoScore: 6, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?mushroom-pizza,truffle' },
    { name: 'Cacio e Pepe', description: 'Tonnarelli pasta, pecorino romano, cracked black pepper', price: 380, category: 'Pastas', isVegetarian: true, isVegan: false, carbonFootprint: 490, ecoScore: 6, isBestSeller: true, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?cacio-e-pepe,pasta' },
    { name: 'Arugula & Parmesan Salad', description: 'Wild arugula, shaved parmesan, lemon vinaigrette, pine nuts', price: 280, category: 'Salads', isVegetarian: true, isVegan: false, carbonFootprint: 180, ecoScore: 8, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?arugula-salad,parmesan' },
    { name: 'Tiramisu', description: 'House-made, mascarpone, espresso-soaked ladyfingers, cocoa', price: 240, category: 'Desserts', isVegetarian: true, isVegan: false, carbonFootprint: 310, ecoScore: 5, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?tiramisu,dessert' },
  ],
  'Biryani House Aundh': [
    { name: 'Chicken Dum Biryani', description: 'Free-range chicken, sella rice, saffron, caramelised onions, raita', price: 380, category: 'Biryani', isVegetarian: false, isVegan: false, carbonFootprint: 1050, ecoScore: 3, isBestSeller: true, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?chicken-biryani' },
    { name: 'Veg Dum Biryani', description: 'Seasonal vegetables, basmati rice, whole spices, caramelised onions', price: 280, category: 'Biryani', isVegetarian: true, isVegan: true, carbonFootprint: 420, ecoScore: 7, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?veg-biryani,rice' },
    { name: 'Seekh Kebab (4 pcs)', description: 'Minced lamb, fresh herbs, charcoal grilled', price: 320, category: 'Kebabs', isVegetarian: false, isVegan: false, carbonFootprint: 890, ecoScore: 2, isBestSeller: true, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?seekh-kebab,grilled' },
    { name: 'Dal Makhani', description: 'Black lentils slow-cooked 12 hours, butter, cream', price: 220, category: 'Sides', isVegetarian: true, isVegan: false, carbonFootprint: 350, ecoScore: 6, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?dal-makhani' },
    { name: 'Masala Chaas', description: 'Spiced buttermilk, roasted cumin, coriander', price: 80, category: 'Drinks', isVegetarian: true, isVegan: false, carbonFootprint: 60, ecoScore: 8, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?lassi,buttermilk' },
  ],
  'Viman Veg': [
    { name: 'Maharashtrian Thali', description: 'Puran poli, amti, bhakri, usal, koshimbir, sheera', price: 200, category: 'Thali', isVegetarian: true, isVegan: false, carbonFootprint: 360, ecoScore: 8, isBestSeller: true, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?maharashtrian-thali' },
    { name: 'Misal Pav', description: 'Spiced sprouted lentil curry, farsan, fresh onion, pav', price: 120, category: 'Snacks', isVegetarian: true, isVegan: true, carbonFootprint: 200, ecoScore: 9, isBestSeller: true, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?misal-pav' },
    { name: 'Modak (4 pcs)', description: 'Steamed rice flour dumplings, coconut-jaggery filling', price: 140, category: 'Sweets', isVegetarian: true, isVegan: false, carbonFootprint: 160, ecoScore: 7, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?modak,indian-sweet' },
  ],
  'Roots Organic Cafe': [
    { name: 'Millet Khichdi', description: 'Foxtail millet, moong dal, turmeric, ghee, seasonal veg', price: 240, category: 'Mains', isVegetarian: true, isVegan: false, carbonFootprint: 160, ecoScore: 10, isBestSeller: true, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?khichdi,millet' },
    { name: 'Mushroom & Spinach Bowl', description: 'Sautéed wild mushrooms, wilted spinach, brown rice, tahini', price: 290, category: 'Mains', isVegetarian: true, isVegan: true, carbonFootprint: 190, ecoScore: 10, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?mushroom-bowl,spinach' },
    { name: 'Turmeric Latte', description: 'Organic turmeric, oat milk, ashwagandha, cinnamon', price: 180, category: 'Drinks', isVegetarian: true, isVegan: true, carbonFootprint: 50, ecoScore: 10, isBestSeller: true, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?golden-milk,turmeric' },
    { name: 'Sourdough with Almond Butter', description: 'House 72-hour sourdough, raw almond butter, banana slices', price: 200, category: 'Bakes', isVegetarian: true, isVegan: true, carbonFootprint: 130, ecoScore: 9, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?sourdough,almond-butter' },
  ],
  'Street Bites Wakad': [
    { name: 'Pav Bhaji', description: 'Spiced mashed vegetable curry, 2 buttered pav, chopped onion', price: 120, category: 'Pav Dishes', isVegetarian: true, isVegan: false, carbonFootprint: 280, ecoScore: 7, isBestSeller: true, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?pav-bhaji' },
    { name: 'Vada Pav', description: 'Crispy spiced potato fritter, green & tamarind chutney, pav', price: 60, category: 'Pav Dishes', isVegetarian: true, isVegan: true, carbonFootprint: 180, ecoScore: 8, isBestSeller: true, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?vada-pav' },
    { name: 'Chole Bhature', description: 'Spiced white chickpea curry, 2 deep-fried bhature, pickle', price: 150, category: 'Pav Dishes', isVegetarian: true, isVegan: true, carbonFootprint: 350, ecoScore: 7, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?chole-bhature' },
    { name: 'Dahi Puri', description: '6 crispy puris, chilled spiced dahi, chutney, sev', price: 100, category: 'Chaat', isVegetarian: true, isVegan: false, carbonFootprint: 160, ecoScore: 8, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?dahi-puri,chaat' },
    { name: 'Aam Panna', description: 'Raw mango, roasted cumin, black salt — chilled', price: 80, category: 'Drinks', isVegetarian: true, isVegan: true, carbonFootprint: 30, ecoScore: 10, isBestSeller: false, isAvailable: true, imageURL: 'https://source.unsplash.com/featured/?mango-drink' },
  ],
}

const ECO_TIPS = [
  {
    tip: 'Ordering a plant-based meal saves an average of 2.5kg CO₂ compared to a chicken dish — the equivalent of charging your phone 300 times.',
    category: 'carbon',
    impact: 'high',
  },
  {
    tip: 'Restaurants using compostable packaging reduce landfill contribution by up to 80% compared to standard plastic containers.',
    category: 'packaging',
    impact: 'high',
  },
  {
    tip: 'Choosing a restaurant within 3km of your location can cut the delivery carbon footprint in half compared to cross-city orders.',
    category: 'delivery',
    impact: 'medium',
  },
  {
    tip: 'Lentils produce 43 times less greenhouse gas than beef per gram of protein. Dal makhani over a burger is one of the easiest climate swaps you can make.',
    category: 'food choice',
    impact: 'high',
  },
  {
    tip: 'Ordering with friends and consolidating deliveries to one address can reduce per-person delivery emissions by 60-70%.',
    category: 'delivery',
    impact: 'medium',
  },
]

async function seed() {
  const batch = writeBatch(db)
  const restaurantIds = {}

  console.log('Seeding restaurants...')
  for (const r of RESTAURANTS) {
    const ref = doc(collection(db, 'restaurants'))
    restaurantIds[r.name] = ref.id
    batch.set(ref, { ...r, createdAt: new Date() })
  }

  console.log('Seeding eco tips...')
  for (const tip of ECO_TIPS) {
    const ref = doc(collection(db, 'ecoTips'))
    batch.set(ref, tip)
  }

  await batch.commit()
  console.log('Restaurants and eco tips committed.')

  console.log('Seeding menu items...')
  for (const [restaurantName, items] of Object.entries(MENU_ITEMS)) {
    const restaurantId = restaurantIds[restaurantName]
    if (!restaurantId) continue
    for (const item of items) {
      await addDoc(collection(db, 'menuItems'), {
        ...item,
        restaurantId,
        allergens: [],
        createdAt: new Date(),
      })
    }
  }

  console.log('Done! Firestore seeded successfully.')
  process.exit(0)
}

seed().catch(err => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
