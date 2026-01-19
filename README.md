
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
- `/admin` admin console (requires admin access)
- `/admin/assembly` assembly station with 3D model + build steps

## Firebase App Hosting

Create a backend (one time):

```
firebase apphosting:backends:create --app 1:149108270482:web:11e3b3a0a94cd3f4580d4b --backend tbaymap-web --primary-region us-central1 --root-dir .
```

Trigger a rollout:

```
firebase apphosting:rollouts:create tbaymap-web --project tbaymap
```

Deploy Firestore rules:

```
firebase deploy --only firestore:rules --project tbaymap
```

## Firebase Auth

Enable Email/Password authentication in Firebase Console before using `/login` and `/signup`.

Admin access is managed in the `/admin` console and stored in the `admins` collection. Seed your first admin by creating a document whose ID is the admin's email.

## Operations playbook

Manufacturing and encoding instructions live in `docs/production-playbook.md`.
Hardware selection and assembly guidance live in `docs/hardware-setup.md`.

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

Create a Firestore collection named `devices` with documents shaped like:

```json
{
  "deviceId": "device_8f91b6",
  "serial": "TB-250118-AB12",
  "label": "Bracelet-014",
  "type": "Bracelet",
  "status": "online",
  "battery": 82,
  "batchId": "TBAY-2025-01",
  "lifecycle": "encoding",
  "assignedTo": "Jordan",
  "firmware": "1.0.4",
  "keyId": "key-001",
  "notes": "Pilot unit",
  "stages": {
    "firmware_flash": {
      "status": "pass",
      "updatedAt": "serverTimestamp()",
      "updatedBy": "admin@tbaytechservice.com",
      "notes": "v1.0.4"
    }
  },
  "lastSeen": "serverTimestamp()",
  "createdAt": "serverTimestamp()"
}
```

Create a Firestore collection named `admins` with documents shaped like:

```json
{
  "email": "admin@tbaytechservice.com",
  "addedBy": "admin@tbaytechservice.com",
  "createdAt": "serverTimestamp()"
}
```

Use the admin email as the document ID (e.g. `admins/admin@tbaytechservice.com`) so rules can validate admin access.

Make sure your first admin account exists in Firebase Auth before adding the admin document.

Create a Firestore collection named `batches` with documents shaped like:

```json
{
  "name": "TBAY-2025-01",
  "status": "in_progress",
  "targetCount": 120,
  "notes": "Pilot run for February.",
  "createdAt": "serverTimestamp()"
}
```

Create a Firestore collection named `inventory` with documents shaped like:

```json
{
  "name": "GPS Module",
  "sku": "GPS-NEO6M",
  "supplier": "Adafruit",
  "category": "Electronics",
  "onHand": 48,
  "reorderPoint": 20,
  "unitCost": 16.5,
  "leadTimeDays": 14,
  "location": "Shelf A2",
  "notes": "Preferred supplier",
  "createdAt": "serverTimestamp()",
  "updatedAt": "serverTimestamp()"
}
```

Create a Firestore collection named `purchase_orders` with documents shaped like:

```json
{
  "supplier": "Adafruit",
  "status": "ordered",
  "items": [
    { "sku": "GPS-NEO6M", "name": "GPS Module", "qty": 50, "unitCost": 16.5 }
  ],
  "orderedAt": "serverTimestamp()",
  "expectedAt": "serverTimestamp()",
  "notes": "Express shipping",
  "createdAt": "serverTimestamp()"
}
```

Create a Firestore collection named `firmware_releases` with documents shaped like:

```json
{
  "version": "1.0.4",
  "status": "released",
  "checksum": "sha256:...",
  "notes": "GPS lock improvements",
  "createdAt": "serverTimestamp()"
}
```

Create a Firestore collection named `qa_reports` with documents shaped like:

```json
{
  "deviceId": "device_8f91b6",
  "result": "pass",
  "summary": "All sensors within tolerance",
  "issues": "",
  "createdBy": "admin@tbaytechservice.com",
  "createdAt": "serverTimestamp()"
}
```

Create a Firestore collection named `shipments` with documents shaped like:

```json
{
  "carrier": "UPS",
  "tracking": "1Z999AA10123456784",
  "status": "shipped",
  "deviceIds": ["device_8f91b6", "device_1029df"],
  "recipientName": "Jordan Smith",
  "address": "123 Main St, Thunder Bay, ON",
  "notes": "Leave at front desk",
  "createdAt": "serverTimestamp()"
}
```
# tbaymap
