# ReflectAI - User-Authenticated Journal & Reflection Assistant

A private, AI-augmented journaling web application that integrates Google's **Gemini 3.6 Flash API** with **Cloud Firestore**, **Firebase Authentication**, **Google Maps Platform**, and **Outbound Webhook Notifications (Slack / Discord)**. Built with an Express + Vite full-stack architecture, owner-isolated database security rules, role-based access control (RBAC), and resilient automated fallback ladders.

---

## Architecture & Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **User Identity** | Firebase Authentication | Federated Google Sign-In (no passwords stored or managed) |
| **Backend Database** | Cloud Firestore | User-isolated document storage for reflections and structured insights |
| **AI Processing Engine** | Gemini 3.6 Flash API | Contextual multi-turn reflections, sentiment analysis, and summaries |
| **Location Services** | Google Maps Platform | Server-proxied geocoding and interactive Sanctuary mapping |
| **Integrations & Alerts** | Webhooks / Notifications | SSRF-safe outbound alerts for Slack, Discord, and custom HTTP endpoints |
| **Secret Management** | Google Cloud Secret Manager | Dynamic API key injection without client exposure |
| **Hosting & Runtime** | Google Cloud Run (Node.js/Express) | Scalable, containerized full-stack deployment |

---

## 1. Prerequisites & GCP Setup

Ensure you have the Google Cloud SDK (`gcloud`) installed and configured with your project.

```bash
# Set your active GCP project
gcloud config set project YOUR_PROJECT_ID

# Enable the required Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 2. Secret Management Setup

Store your Gemini API key and Google Maps API key securely in Google Cloud Secret Manager and grant access to the Cloud Run service account.

```bash
# 1. Create and populate the GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. (Optional) Create GOOGLE_MAPS_API_KEY secret
gcloud secrets create GOOGLE_MAPS_API_KEY --replication-policy="automatic"
echo -n "YOUR_MAPS_API_KEY" | gcloud secrets versions add GOOGLE_MAPS_API_KEY --data-file=-

# 3. Retrieve your GCP Project Number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')

# 4. Grant the default Cloud Run compute service account permission to access the secrets
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding GOOGLE_MAPS_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Cloud Firestore Security Configuration

Deploy owner-bound security rules to ensure zero cross-user data leakage.

### `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /journals/{journalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy the rules via Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

---

## 4. Google Cloud Run Deployment

Deploy the containerized full-stack application directly to Google Cloud Run with secret binding:

```bash
# Deploy to Cloud Run
gcloud run deploy reflectai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest,GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_API_KEY:latest \
  --set-env-vars NODE_ENV=production
```

### Mandatory Verification Label

Register the service for automated challenge verification:

```bash
gcloud run services update reflectai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 5. Local Development

```bash
# Install dependencies
npm install

# Run the unified Express + Vite dev server
npm run dev

# Build the production bundle
npm run build

# Start the compiled production server
npm start
```
