/**
 * EcoEats — Supabase seed script
 * Run once: node src/scripts/seedSupabase.js
 * Set SUPABASE_URL and SUPABASE_SERVICE_KEY in your shell first:
 *   export SUPABASE_URL=https://xxx.supabase.co
 *   export SUPABASE_SERVICE_KEY=your_service_role_key
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const RESTAURANTS = [
  { name: 'The Green Bowl', description: 'Plant-forward bowls and wraps made with seasonal, locally-sourced produce. Zero single-use plastic.', category: 'healthy', cuisine_type: 'Health Food', tags: ['vegan','organic','gluten-free options'], address: 'Lane 5, North Main Road, Koregaon Park, Pune 411001', lat: 18.5362, lng: 73.8937, rating: 4.6, review_count: 134, delivery_time_min: 25, delivery_fee: 0, minimum_order: 200, is_open: true, is_eco_certified: true, eco_rating: 9.2, carbon_footprint_per_order: 380, packaging_type: 'Compostable', image_url: 'https://source.unsplash.com/featured/?salad,bowl,healthy-food', menu_categories: ['Bowls','Wraps','Drinks'] },
  { name: 'Mitti Cafe', description: 'Wholesome thalis and comfort food. Certified B-Corp.', category: 'indian', cuisine_type: 'Indian Thali', tags: ['vegetarian','thali','social enterprise'], address: 'FC Road, Shivajinagar, Pune 411005', lat: 18.5195, lng: 73.8418, rating: 4.8, review_count: 289, delivery_time_min: 30, delivery_fee: 30, minimum_order: 150, is_open: true, is_eco_certified: true, eco_rating: 8.8, carbon_footprint_per_order: 450, packaging_type: 'Biodegradable', image_url: 'https://source.unsplash.com/featured/?thali,indian-food', menu_categories: ['Thali','Starters','Desserts'] },
  { name: 'Wholesome Kitchen', description: 'Cold-pressed juices, overnight oats, and nourish plates.', category: 'cafe', cuisine_type: 'Cafe & Health', tags: ['vegan','gluten-free','cold-pressed'], address: 'Baner Road, Baner, Pune 411045', lat: 18.5590, lng: 73.7868, rating: 4.4, review_count: 98, delivery_time_min: 20, delivery_fee: 0, minimum_order: 250, is_open: true, is_eco_certified: true, eco_rating: 9.5, carbon_footprint_per_order: 210, packaging_type: 'Reusable jars', image_url: 'https://source.unsplash.com/featured/?acai,smoothie-bowl', menu_categories: ['Juices','Bowls','Snacks'] },
  { name: 'Terracotta Kitchen', description: 'Wood-fired pizzas and pastas. Ingredients sourced within 100km.', category: 'continental', cuisine_type: 'Italian', tags: ['wood-fired','local sourcing','vegetarian options'], address: 'Kalyani Nagar, Pune 411006', lat: 18.5460, lng: 73.9009, rating: 4.5, review_count: 176, delivery_time_min: 35, delivery_fee: 50, minimum_order: 350, is_open: true, is_eco_certified: false, eco_rating: 6.4, carbon_footprint_per_order: 720, packaging_type: 'Recyclable', image_url: 'https://source.unsplash.com/featured/?pizza,wood-fired', menu_categories: ['Pizzas','Pastas','Salads','Desserts'] },
  { name: 'Biryani House Aundh', description: 'Slow-cooked dum biryani using heritage rice varieties.', category: 'indian', cuisine_type: 'Biryani & Kebabs', tags: ['biryani','halal','dum-cooked'], address: 'ITI Road, Aundh, Pune 411007', lat: 18.5594, lng: 73.8078, rating: 4.3, review_count: 312, delivery_time_min: 40, delivery_fee: 40, minimum_order: 200, is_open: true, is_eco_certified: false, eco_rating: 5.1, carbon_footprint_per_order: 1100, packaging_type: 'Recyclable', image_url: 'https://source.unsplash.com/featured/?biryani,indian-rice', menu_categories: ['Biryani','Kebabs','Sides','Drinks'] },
  { name: 'Roots Organic Cafe', description: 'Certified organic cafe. Mushroom bowls, millet khichdi, turmeric lattes.', category: 'cafe', cuisine_type: 'Organic Cafe', tags: ['organic','vegan','millet','certified'], address: 'Paud Road, Kothrud, Pune 411038', lat: 18.5074, lng: 73.8077, rating: 4.7, review_count: 143, delivery_time_min: 28, delivery_fee: 0, minimum_order: 200, is_open: true, is_eco_certified: true, eco_rating: 9.8, carbon_footprint_per_order: 180, packaging_type: 'Compostable', image_url: 'https://source.unsplash.com/featured/?organic,cafe,coffee', menu_categories: ['Mains','Drinks','Bakes'] },
  { name: 'Viman Veg', description: 'Pure vegetarian — traditional Maharashtrian and Gujarati fare.', category: 'indian', cuisine_type: 'Maharashtrian', tags: ['pure-veg','traditional','no-onion-garlic'], address: 'Viman Nagar Road, Viman Nagar, Pune 411014', lat: 18.5679, lng: 73.9143, rating: 4.2, review_count: 87, delivery_time_min: 30, delivery_fee: 30, minimum_order: 150, is_open: false, is_eco_certified: false, eco_rating: 7.0, carbon_footprint_per_order: 390, packaging_type: 'Biodegradable', image_url: 'https://source.unsplash.com/featured/?maharashtrian-food,veg-thali', menu_categories: ['Thali','Snacks','Sweets'] },
  { name: 'Street Bites Wakad', description: 'Elevated street food in compostable packaging.', category: 'street', cuisine_type: 'Street Food', tags: ['street food','vegetarian','quick bites'], address: 'Wakad Road, Wakad, Pune 411057', lat: 18.5995, lng: 73.7627, rating: 4.1, review_count: 204, delivery_time_min: 20, delivery_fee: 20, minimum_order: 100, is_open: true, is_eco_certified: false, eco_rating: 6.8, carbon_footprint_per_order: 320, packaging_type: 'Compostable', image_url: 'https://source.unsplash.com/featured/?street-food,pav-bhaji', menu_categories: ['Pav Dishes','Chaat','Drinks'] },
]

const MENU_ITEMS_BY_RESTAURANT = {
  'The Green Bowl': [
    { name: 'Buddha Bowl', description: 'Quinoa, roasted chickpeas, avocado, tahini dressing', price: 320, category: 'Bowls', is_vegetarian: true, is_vegan: true, carbon_footprint: 180, eco_score: 9, is_best_seller: true, is_available: true, image_url: 'https://source.unsplash.com/featured/?buddha-bowl,quinoa' },
    { name: 'Pesto Grain Bowl', description: 'Brown rice, grilled zucchini, cherry tomatoes, basil pesto', price: 280, category: 'Bowls', is_vegetarian: true, is_vegan: false, carbon_footprint: 210, eco_score: 8, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?grain-bowl' },
    { name: 'Rainbow Wrap', description: 'Spinach tortilla, hummus, roasted peppers, cucumber, sprouts', price: 240, category: 'Wraps', is_vegetarian: true, is_vegan: true, carbon_footprint: 150, eco_score: 9, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?wrap,hummus' },
    { name: 'Falafel Wrap', description: 'House-made falafel, tzatziki, pickled onion, romaine', price: 260, category: 'Wraps', is_vegetarian: true, is_vegan: false, carbon_footprint: 190, eco_score: 8, is_best_seller: true, is_available: true, image_url: 'https://source.unsplash.com/featured/?falafel' },
    { name: 'Cold-Pressed Greens', description: 'Spinach, cucumber, green apple, ginger, lemon', price: 180, category: 'Drinks', is_vegetarian: true, is_vegan: true, carbon_footprint: 60, eco_score: 10, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?green-juice' },
    { name: 'Watermelon Mint Cooler', description: 'Fresh watermelon, mint, lime, zero added sugar', price: 140, category: 'Drinks', is_vegetarian: true, is_vegan: true, carbon_footprint: 40, eco_score: 10, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?watermelon-juice' },
  ],
  'Mitti Cafe': [
    { name: 'Full Thali', description: 'Dal, sabzi, rice, roti, papad, pickle, salad, dessert', price: 220, category: 'Thali', is_vegetarian: true, is_vegan: false, carbon_footprint: 420, eco_score: 8, is_best_seller: true, is_available: true, image_url: 'https://source.unsplash.com/featured/?thali' },
    { name: 'Mini Thali', description: 'Dal, one sabzi, rice, 2 rotis, salad', price: 160, category: 'Thali', is_vegetarian: true, is_vegan: false, carbon_footprint: 310, eco_score: 8, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?dal,roti' },
    { name: 'Paneer Tikka', description: 'House-marinated paneer, tandoor grilled, mint chutney', price: 280, category: 'Starters', is_vegetarian: true, is_vegan: false, carbon_footprint: 380, eco_score: 6, is_best_seller: true, is_available: true, image_url: 'https://source.unsplash.com/featured/?paneer-tikka' },
    { name: 'Gulab Jamun (2 pcs)', description: 'Classic milk-solid dumplings in rose-scented syrup', price: 90, category: 'Desserts', is_vegetarian: true, is_vegan: false, carbon_footprint: 120, eco_score: 5, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?gulab-jamun' },
  ],
  'Roots Organic Cafe': [
    { name: 'Millet Khichdi', description: 'Foxtail millet, moong dal, turmeric, ghee, seasonal veg', price: 240, category: 'Mains', is_vegetarian: true, is_vegan: false, carbon_footprint: 160, eco_score: 10, is_best_seller: true, is_available: true, image_url: 'https://source.unsplash.com/featured/?khichdi,millet' },
    { name: 'Mushroom & Spinach Bowl', description: 'Sautéed wild mushrooms, wilted spinach, brown rice, tahini', price: 290, category: 'Mains', is_vegetarian: true, is_vegan: true, carbon_footprint: 190, eco_score: 10, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?mushroom-bowl' },
    { name: 'Turmeric Latte', description: 'Organic turmeric, oat milk, ashwagandha, cinnamon', price: 180, category: 'Drinks', is_vegetarian: true, is_vegan: true, carbon_footprint: 50, eco_score: 10, is_best_seller: true, is_available: true, image_url: 'https://source.unsplash.com/featured/?turmeric-latte' },
    { name: 'Sourdough with Almond Butter', description: 'House 72-hour sourdough, raw almond butter, banana slices', price: 200, category: 'Bakes', is_vegetarian: true, is_vegan: true, carbon_footprint: 130, eco_score: 9, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?sourdough' },
  ],
  'Street Bites Wakad': [
    { name: 'Pav Bhaji', description: 'Spiced mashed vegetable curry, 2 buttered pav, chopped onion', price: 120, category: 'Pav Dishes', is_vegetarian: true, is_vegan: false, carbon_footprint: 280, eco_score: 7, is_best_seller: true, is_available: true, image_url: 'https://source.unsplash.com/featured/?pav-bhaji' },
    { name: 'Vada Pav', description: 'Crispy spiced potato fritter, green & tamarind chutney, pav', price: 60, category: 'Pav Dishes', is_vegetarian: true, is_vegan: true, carbon_footprint: 180, eco_score: 8, is_best_seller: true, is_available: true, image_url: 'https://source.unsplash.com/featured/?vada-pav' },
    { name: 'Dahi Puri', description: '6 crispy puris, chilled spiced dahi, chutney, sev', price: 100, category: 'Chaat', is_vegetarian: true, is_vegan: false, carbon_footprint: 160, eco_score: 8, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?dahi-puri' },
    { name: 'Aam Panna', description: 'Raw mango, roasted cumin, black salt — chilled', price: 80, category: 'Drinks', is_vegetarian: true, is_vegan: true, carbon_footprint: 30, eco_score: 10, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?mango-drink' },
  ],
  'Terracotta Kitchen': [
    { name: 'Margherita Wood-Fired', description: 'San Marzano tomato, buffalo mozzarella, fresh basil, EVOO', price: 420, category: 'Pizzas', is_vegetarian: true, is_vegan: false, carbon_footprint: 580, eco_score: 6, is_best_seller: true, is_available: true, image_url: 'https://source.unsplash.com/featured/?margherita-pizza' },
    { name: 'Truffle Mushroom Pizza', description: 'Truffle oil, cremini mushrooms, fontina, arugula', price: 520, category: 'Pizzas', is_vegetarian: true, is_vegan: false, carbon_footprint: 620, eco_score: 6, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?mushroom-pizza' },
    { name: 'Cacio e Pepe', description: 'Tonnarelli pasta, pecorino romano, cracked black pepper', price: 380, category: 'Pastas', is_vegetarian: true, is_vegan: false, carbon_footprint: 490, eco_score: 6, is_best_seller: true, is_available: true, image_url: 'https://source.unsplash.com/featured/?pasta' },
    { name: 'Tiramisu', description: 'House-made, mascarpone, espresso-soaked ladyfingers, cocoa', price: 240, category: 'Desserts', is_vegetarian: true, is_vegan: false, carbon_footprint: 310, eco_score: 5, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?tiramisu' },
  ],
  'Biryani House Aundh': [
    { name: 'Chicken Dum Biryani', description: 'Free-range chicken, sella rice, saffron, caramelised onions, raita', price: 380, category: 'Biryani', is_vegetarian: false, is_vegan: false, carbon_footprint: 1050, eco_score: 3, is_best_seller: true, is_available: true, image_url: 'https://source.unsplash.com/featured/?chicken-biryani' },
    { name: 'Veg Dum Biryani', description: 'Seasonal vegetables, basmati rice, whole spices', price: 280, category: 'Biryani', is_vegetarian: true, is_vegan: true, carbon_footprint: 420, eco_score: 7, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?veg-biryani' },
    { name: 'Dal Makhani', description: 'Black lentils slow-cooked 12 hours, butter, cream', price: 220, category: 'Sides', is_vegetarian: true, is_vegan: false, carbon_footprint: 350, eco_score: 6, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?dal-makhani' },
  ],
  'Wholesome Kitchen': [
    { name: 'Acai Power Bowl', description: 'Acai blend, banana, granola, chia seeds, seasonal fruit', price: 380, category: 'Bowls', is_vegetarian: true, is_vegan: true, carbon_footprint: 190, eco_score: 9, is_best_seller: true, is_available: true, image_url: 'https://source.unsplash.com/featured/?acai-bowl' },
    { name: 'Overnight Oats', description: 'Rolled oats, almond milk, flax seeds, seasonal berries', price: 220, category: 'Bowls', is_vegetarian: true, is_vegan: true, carbon_footprint: 140, eco_score: 9, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?overnight-oats' },
    { name: 'Detox Green Juice', description: 'Kale, cucumber, celery, lemon, ginger', price: 200, category: 'Juices', is_vegetarian: true, is_vegan: true, carbon_footprint: 50, eco_score: 10, is_best_seller: true, is_available: true, image_url: 'https://source.unsplash.com/featured/?green-juice' },
    { name: 'Golden Turmeric Latte', description: 'Oat milk, turmeric, black pepper, cinnamon, honey', price: 180, category: 'Juices', is_vegetarian: true, is_vegan: false, carbon_footprint: 70, eco_score: 9, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?turmeric-latte' },
  ],
  'Viman Veg': [
    { name: 'Maharashtrian Thali', description: 'Puran poli, amti, bhakri, usal, koshimbir, sheera', price: 200, category: 'Thali', is_vegetarian: true, is_vegan: false, carbon_footprint: 360, eco_score: 8, is_best_seller: true, is_available: true, image_url: 'https://source.unsplash.com/featured/?maharashtrian-thali' },
    { name: 'Misal Pav', description: 'Spiced sprouted lentil curry, farsan, fresh onion, pav', price: 120, category: 'Snacks', is_vegetarian: true, is_vegan: true, carbon_footprint: 200, eco_score: 9, is_best_seller: true, is_available: true, image_url: 'https://source.unsplash.com/featured/?misal-pav' },
    { name: 'Modak (4 pcs)', description: 'Steamed rice flour dumplings, coconut-jaggery filling', price: 140, category: 'Sweets', is_vegetarian: true, is_vegan: false, carbon_footprint: 160, eco_score: 7, is_best_seller: false, is_available: true, image_url: 'https://source.unsplash.com/featured/?modak' },
  ],
}

const ECO_TIPS = [
  { tip: 'Ordering a plant-based meal saves an average of 2.5kg CO₂ compared to a chicken dish — equivalent to charging your phone 300 times.', category: 'carbon', impact: 'high' },
  { tip: 'Restaurants using compostable packaging reduce landfill contribution by up to 80% vs standard plastic containers.', category: 'packaging', impact: 'high' },
  { tip: 'Choosing a restaurant within 3km can cut delivery carbon footprint in half compared to cross-city orders.', category: 'delivery', impact: 'medium' },
  { tip: 'Lentils produce 43 times less greenhouse gas than beef per gram of protein. Dal makhani over a burger is one of the easiest climate swaps.', category: 'food choice', impact: 'high' },
  { tip: 'Consolidating deliveries with friends can reduce per-person delivery emissions by 60-70%.', category: 'delivery', impact: 'medium' },
]

async function seed() {
  console.log('Seeding restaurants...')
  const { data: restaurants, error: rErr } = await supabase
    .from('restaurants').insert(RESTAURANTS).select()
  if (rErr) { console.error('restaurants failed:', rErr.message); process.exit(1) }
  console.log(`✓ ${restaurants.length} restaurants inserted`)

  console.log('Seeding eco tips...')
  const { error: tErr } = await supabase.from('eco_tips').insert(ECO_TIPS)
  if (tErr) { console.error('eco tips failed:', tErr.message); process.exit(1) }
  console.log('✓ eco tips inserted')

  console.log('Seeding menu items...')
  const nameToId = Object.fromEntries(restaurants.map(r => [r.name, r.id]))
  const allItems = []
  for (const [restaurantName, items] of Object.entries(MENU_ITEMS_BY_RESTAURANT)) {
    const restaurantId = nameToId[restaurantName]
    if (!restaurantId) continue
    items.forEach(item => allItems.push({ ...item, restaurant_id: restaurantId, allergens: [] }))
  }
  const { error: mErr } = await supabase.from('menu_items').insert(allItems)
  if (mErr) { console.error('menu items failed:', mErr.message); process.exit(1) }
  console.log(`✓ ${allItems.length} menu items inserted`)

  console.log('\n✅ Supabase seeded successfully!')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
