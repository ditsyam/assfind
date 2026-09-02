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

## 5. Google Workspace Integration (Docs & Slides)

ReflectAI connects with Google Workspace APIs to export reflection journals and AI syntheses:

- **Google Docs**: Automatically generates structured executive reflection briefs complete with mood metrics, summary, takeaways, actionable items, and full conversation transcripts.
- **Google Slides**: Generates 4-slide presentation decks (Executive Summary, Emotional Resonance, Key Insights, Action Plan) ready for weekly reflection reviews.
- **Drive Browser**: Inspect and launch recent Google Docs and Google Slides directly from your connected Google Workspace account.

---

## 6. Gemini Deep Research Agent (`deep-research-preview-04-2026`)

ReflectAI integrates Google's Gemini Deep Research Agent using the Interactions API to execute long-running, multi-step autonomous investigations with citations and auto-visualization:

### Features
- **Background Interaction Creation**: Initiates asynchronous research tasks (`background: true`) via `ai.interactions.create`.
- **Status Polling**: Periodically queries `ai.interactions.get(sessionId)` until status reaches `completed` or `failed`.
- **Multi-Step Aggregation**: Extracts reasoning thoughts, search queries, and model output chunks to render interactive timeline streams.
- **Journal Integration**: 1-click insertion of completed deep research reports directly into personal journal reflections.
- **Resilient Fallback Ladder**: If the preview interaction capacity is saturated, automatically cascades through the fallback model hierarchy without disruption.

### Python SDK Reference Implementation

```python
import os
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client()

def run_deep_research(prompt_query: str):
    print(f"🚀 Starting Deep Research for: '{prompt_query}'...")
    interaction = client.interactions.create(
        agent="deep-research-preview-04-2026",
        input=prompt_query,
        background=True,
        agent_config={
            "type": "deep-research",
            "visualization": "auto",
            "thinking_summaries": "auto",
        }
    )
    
    interaction_id = interaction.id
    while True:
        status_check = client.interactions.get(interaction_id=interaction_id)
        if status_check.status in ["completed", "COMPLETED"]:
            print("\n=== RESEARCH COMPLETE ===")
            print(status_check.output_text)
            break
        elif status_check.status in ["failed", "FAILED"]:
            print("\n❌ Deep Research process failed.")
            break
        time.sleep(5)
```

---

## 7. Google Scholar & Academic Indexing (`scholarly` + `pandas`)

ReflectAI includes built-in scientific literature indexing and researcher profile inspection powered by Google Scholar schemas and Python's `scholarly` library:

- **Researcher Profile Inspection (`cek_indeks_peneliti.py`)**: Resolves researcher profiles (`scholarly.search_author`), extracts complete academic metrics (`scholarly.fill`) including Affiliation, Total Citations (`citedby`), h-index, i10-index, and top publications.
- **Bibliographic Extraction (`cari_karya_ilmiah.py`)**: Queries academic journals, citations, publication years, venues, and canonical DOI links.
- **Automated CSV Export**: Exports indexed datasets directly to `hasil_indeks_scholar.csv` matching Pandas DataFrame tabular structures.
- **Journal Integration**: 1-click citation, author profile, and paper import to journal reflection notes.

### Researcher Profile Inspection (`cek_indeks_peneliti.py`)
```python
from scholarly import scholarly

def cek_indeks_peneliti(nama_peneliti):
    print(f"Mencari profil: {nama_peneliti}...")
    
    # Cari penulis berdasarkan nama
    search_query = scholarly.search_author(nama_peneliti)
    
    try:
        # Ambil hasil pertama yang paling cocok
        author = next(search_query)
        
        # Isi data profil secara lengkap (termasuk isi sitasi dan indeks)
        full_author_profile = scholarly.fill(author)
        
        print("\n=== DATA PROFIL GOOGLE SCHOLAR ===")
        print(f"Nama       : {full_author_profile['name']}")
        print(f"Afiliasi   : {full_author_profile.get('affiliation', 'Tidak ada')}")
        print(f"Total Sitasi: {full_author_profile.get('citedby', 0)}")
        print(f"h-index    : {full_author_profile.get('hindex', 0)}")
        print(f"i10-index  : {full_author_profile.get('i10index', 0)}")
        
        print("\n=== 3 PUBLIKASI TERATAS ===")
        for i, pub in enumerate(full_author_profile['publications'][:3]):
            judul = pub['bib'].get('title', 'No Title')
            print(f"{i+1}. {judul}")
            
    except StopIteration:
        print("Profil peneliti tidak ditemukan.")

if __name__ == "__main__":
    cek_indeks_peneliti("Andrew Ng")
```

### Academic Literature Search (`cari_karya_ilmiah.py`)
```python
from scholarly import scholarly
import pandas as pd

def cari_karya_ilmiah(keyword, jumlah_hasil=5):
    print(f"Mencari artikel dengan kata kunci: '{keyword}'...\n")
    search_query = scholarly.search_pubs(keyword)
    data_artikel = []
    
    for i in range(jumlah_hasil):
        try:
            artikel = next(search_query)
            info = {
                "Judul": artikel['bib'].get('title', 'Tidak ada judul'),
                "Penulis": ", ".join(artikel['bib'].get('author', [])),
                "Tahun": artikel['bib'].get('pub_year', 'Tidak diketahui'),
                "Jurnal/Publisher": artikel['bib'].get('venue', 'Tidak diketahui'),
                "Jumlah Sitasi": artikel.get('num_citations', 0),
                "Link": artikel.get('pub_url', 'Tidak ada link')
            }
            data_artikel.append(info)
        except StopIteration:
            break
            
    df = pd.DataFrame(data_artikel)
    df.to_csv("hasil_indeks_scholar.csv", index=False)
    print("✅ Data berhasil disimpan ke 'hasil_indeks_scholar.csv'")
```

---

## 8. Local Development

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
