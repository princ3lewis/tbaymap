
# Run and deploy the app

This repo uses Next.js with Firebase App Hosting.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `NEXT_PUBLIC_GEMINI_API_KEY` in `.env.local` if you want Gemini features
3. Add Google Cloud credentials to `.env.local`:
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key`
   - `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your-map-id` (optional, for custom map styling)
   - `NEXT_PUBLIC_FIREBASE_API_KEY=...`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID=...`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...`
   - `NEXT_PUBLIC_FIREBASE_APP_ID=...`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...` (optional)
4. Run the app:
   `npm run dev`

Routes:
- `/` marketing + waitlist
- `/live` authenticated app experience
- `/login` and `/signup` for auth

## Firebase App Hosting

Create a backend (one time):

```
firebase apphosting:backends:create --app 1:149108270482:web:11e3b3a0a94cd3f4580d4b --backend tbaymap-web --primary-region northamerica-northeast1 --root-dir .
```

Trigger a rollout:

```
firebase apphosting:rollouts:create tbaymap-web --project tbaymap
```

## Firebase Auth

Enable Email/Password authentication in Firebase Console before using `/login` and `/signup`.

## Firestore Data Shape

Create a Firestore collection named `events` with documents shaped like:

```json
{
  "title": "Community Barbecue",
  "description": "Celebrating local culture with food and storytelling.",
  "category": "Food",
  "location": { "lat": 48.37, "lng": -89.26 },
  "creator": "Sarah",
  "time": "Saturday, 1:00 PM",
  "participants": 24,
  "maxParticipants": 50,
  "isSpiritMarker": false,
  "createdAt": "serverTimestamp()"
}
```

`createdAt` is required for sorting; use `serverTimestamp()` when writing events.

Create a Firestore collection named `waitlist` with documents shaped like:

```json
{
  "name": "Jordan Smith",
  "email": "jordan@email.com",
  "deviceType": "Bracelet",
  "interests": ["Sports", "Community"],
  "community": "Thunder Bay",
  "notes": "Interested in youth programming.",
  "consent": true,
  "source": "home-page",
  "createdAt": "serverTimestamp()"
}
```
# tbaymap
