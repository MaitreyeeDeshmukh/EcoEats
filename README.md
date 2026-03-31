# EcoEats 🌿

**Sustainable food delivery — order from eco-certified restaurants, see the carbon footprint of every meal.**

🔗 **GitHub**: https://github.com/MaitreyeeDeshmukh/EcoEats
🌐 **Live app**: https://your-firebase-project-id.web.app *(deploy steps below)*

---

## What It Does

- Browse and order from eco-certified restaurants in Pune
- See the CO₂ footprint of every dish before you order
- Track how much carbon you've saved compared to average delivery
- View your personal environmental impact — download a shareable card
- Full PWA — works offline, installable on mobile

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Firebase Firestore, Auth, Storage, Hosting (free Spark plan) |
| Maps | React Leaflet + OpenStreetMap (no API key) |
| Geocoding | Nominatim API (free, no API key) |
| PWA | vite-plugin-pwa + Workbox |
| Icons | Phosphor Icons |
| Carbon card export | html2canvas |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/MaitreyeeDeshmukh/EcoEats.git
cd EcoEats
npm install
```

### 2. Create a Firebase project

1. Go to https://console.firebase.google.com → **Create project**
2. Enable these services:
   - **Authentication** → Sign-in methods: Email/Password + Google
   - **Firestore Database** → Start in production mode
   - **Storage** → Default bucket
   - **Hosting**

### 3. Add your Firebase config

Create a `.env.local` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> Find these values in Firebase Console → Project Settings → Your apps → Web app config.

### 4. Deploy Firestore rules and indexes

```bash
firebase login
firebase use --add          # select your project
firebase deploy --only firestore
```

### 5. Seed the database (run once)

> Temporarily set Firestore rules to allow all writes, run seed, then re-deploy secure rules.

```bash
node src/scripts/seedFirestore.js
```

This seeds: **8 Pune restaurants**, **40+ menu items** with carbon data, **5 eco tips**.

### 6. Run locally

```bash
npm run dev
```

App runs at http://localhost:5173

### 7. Build and deploy to Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

Your live URL will be: **https://your-project-id.web.app**

---

## Pages

| Route | Page |
|---|---|
| `/` | Landing — hero, how it works, featured restaurants, impact counter |
| `/explore` | Browse restaurants — search, filters, list/map toggle |
| `/restaurant/:id` | Menu, eco badge, reviews, add to cart |
| `/cart` | Cart, address, COD payment, carbon summary |
| `/order/:id` | Order status tracker, map, carbon impact |
| `/profile` | Eco score, order history, saved addresses |
| `/impact` | Monthly CO₂ chart, vs-average comparison, shareable card |
| `/login` `/signup` | Auth with Google OAuth |

---

## Carbon Calculation

| Food type | CO₂ per dish |
|---|---|
| Plant-based | 100–300g |
| Mixed vegetarian | 300–600g |
| Meat dishes | 600–1,100g |

- **Baseline**: 2,400g CO₂ per average delivery order
- **Saved** = max(0, 2,400 − your order's total carbon)
- **Trees equivalent** = saved ÷ 21,000g (per tree per year)
- **Driving avoided** = saved ÷ 192g (CO₂ per km)

---

## Project Structure

```
src/
  components/
    ui/          Button, Input, Badge, Card, Modal, Toast, Spinner, Skeleton
    layout/      Navbar, Footer, PageWrapper, MobileDrawer
    features/    RestaurantCard, MenuItemCard, CartItem, OrderStatusTracker, EcoBadge, ReviewCard
  pages/         One file per route (lazy-loaded)
  context/       AuthContext, CartContext, ToastContext
  hooks/         useAuth, useCart, useOrders, useRestaurants, useToast
  services/      auth.js, restaurants.js, menuItems.js, orders.js, reviews.js, users.js
  utils/         carbonCalculator.js, formatters.js, validators.js, geocode.js
  constants/     routes.js, categories.js
  scripts/       seedFirestore.js
```

---

## License

MIT — built by Maitreyee Deshmukh
