# EcoEats

EcoEats is a sustainable food delivery web application that connects users with eco-certified local restaurants while making the environmental impact of every order visible and meaningful.

## What It Does

- Browse and order from eco-certified restaurants in Pune
- See the carbon footprint of every dish before you order
- Track how much CO₂ you've saved compared to average food delivery
- View your personal environmental impact over time, with a shareable card

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage, Hosting) — free Spark plan
- **Maps**: React Leaflet + OpenStreetMap (no API key required)
- **Geocoding**: Nominatim API (free, no API key required)
- **PWA**: vite-plugin-pwa with Workbox

## Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project (free Spark plan)

### Setup

1. Clone the repo
   ```
   git clone https://github.com/MaitreyeeDeshmukh/EcoEats.git
   cd EcoEats
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a Firebase project at https://console.firebase.google.com
   Enable: Authentication (Email/Password + Google), Firestore, Storage, Hosting

4. Create a `.env` file in the project root:
   ```
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. Deploy Firestore rules and indexes
   ```
   firebase deploy --only firestore
   ```

6. Seed the database (run once — temporarily set Firestore rules to allow writes first)
   ```
   node src/scripts/seedFirestore.js
   ```

7. Start dev server
   ```
   npm run dev
   ```

8. Build for production
   ```
   npm run build
   ```

9. Deploy to Firebase Hosting
   ```
   firebase deploy --only hosting
   ```

## Carbon Calculation Methodology

**Baseline**: Average food delivery order = 2,400g CO₂
(Accounts for packaging, last-mile transport, and food production)

| Food type | CO₂ per dish |
|---|---|
| Plant-based | 100–300g |
| Mixed vegetarian | 300–600g |
| Meat dishes | 600–1,100g |

- **Carbon saved** = max(0, 2,400g − order total carbon)
- **Trees equivalent** = carbon saved ÷ 21,000g (absorbed per tree per year)
- **Driving equivalent** = carbon saved ÷ 192g (CO₂ per km driven)

## Project Structure

```
src/
  components/
    ui/          Button, Input, Badge, Card, Modal, Toast, Spinner, Skeleton
    layout/      Navbar, Footer, PageWrapper, MobileDrawer
    features/    RestaurantCard, MenuItemCard, OrderStatusTracker, EcoBadge, ReviewCard, CartItem
  pages/         One file per route
  hooks/         useAuth, useCart, useOrders, useRestaurants, useToast
  context/       AuthContext, CartContext, ToastContext
  services/      auth.js, restaurants.js, menuItems.js, orders.js, reviews.js, users.js
  utils/         carbonCalculator.js, formatters.js, validators.js, geocode.js
  constants/     routes.js, categories.js
  scripts/       seedFirestore.js
```

## License

MIT
