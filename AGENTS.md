# ReflectAI Custom Directives & System Governance

This document defines persistent rules and architectural directives for ReflectAI, covering Google Maps Platform integration, Role-Based Access Control (RBAC) Admin Security, and External Notification Delivery.

---

## 1. Google Maps Platform Directive

### Purpose & Scope
Guides how ReflectAI securely interacts with Google Maps Platform APIs (Maps JavaScript API, Places API New, and Geocoding API) to enable location-aware journal reflections.

### Key Retrieval & Secret Management
1. **Zero Hardcoding Rule**: Raw Google Maps API keys must **never** be hardcoded in client or server code.
2. **Environment Variable Hierarchy**:
   - Client-side Map Rendering: `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`
   - Server-side Geocoding & Proxying: `process.env.GOOGLE_MAPS_API_KEY` or Google Cloud Secret Manager (`projects/$PROJECT_ID/secrets/GOOGLE_MAPS_API_KEY/versions/latest`).
   - Development & Prototyping: If no production key is supplied, provide a seamless fallback to the Google Maps Demo Key workflow without crashing the user interface.
3. **Usage Attribution**: Set internal usage attribution ID `gmp_mcp_codeassist_v1_aistudio` on all `<APIProvider>` and Map components.
4. **Security & Restrictions**:
   - Recommend restricting production keys by HTTP Referrer (`https://your-domain.com/*`, `localhost:3000/*`).
   - Restrict API scope specifically to *Maps JavaScript API*, *Places API (New)*, and *Geocoding API*.
5. **Terms of Service & AI Training Guardrail**:
   - Map and Place data must originate from Google Maps Platform APIs, never hallucinated by LLM memory.
   - Google Maps Content (lat/lng, addresses, business reviews) must **never** be used to train or fine-tune AI models.
   - Coordinates may only be cached locally for up to 30 consecutive calendar days.

---

## 2. Admin Role & RBAC (Role-Based Access Control) Directive

### Purpose & Scope
Defines how AI and backend systems formulate and enforce security checks for elevated administrative privileges.

### Role Hierarchy & Schema
- `admin`: Full administrative access (telemetry inspection, audit logs, user role assignment, security rule auditing).
- `editor`: Can review community reflections or shared content.
- `member` / `user`: Standard isolated user space (can only read/write their own `/users/{userId}/...` documents).

### Security Checks & Enforcement Protocols
1. **Server-Side Token & Role Verification**:
   - Every administrative API endpoint (`/api/admin/*`) MUST verify the caller's authorization before executing actions.
   - Validate Firebase Auth JWT token custom claims (`request.auth.token.admin == true`) or query the user's role document in Firestore with cached validation.
   - For internal microservices, accept an explicit `x-admin-key` header verified against `process.env.ADMIN_SECRET_KEY`.
2. **Zero Insecure Defaults**:
   - Administrative capabilities MUST NEVER default to open or permissive states.
   - Reject unauthenticated requests with `401 Unauthorized` and insufficient-role requests with `403 Forbidden`.
3. **Audit Logging**:
   - All administrative actions (granting admin roles, purging telemetry, triggering bulk notifications) MUST record an immutable audit log entry containing `actorId`, `action`, `targetId`, `timestamp`, and `ipHash`.

---

## 3. External Notifications API Directive (Slack / Discord / Email)

### Purpose & Scope
Governs the dispatch of automated notifications to external communication platforms when specific journal entries are parsed or synthesized.

### Authentication & Credential Storage
1. Webhook URLs (Slack, Discord) and SMTP/API keys must be securely stored in backend environment variables or encrypted user settings documents.
2. Webhook URLs must undergo URL sanitization to prevent Server-Side Request Forgery (SSRF) — explicitly block `localhost`, `127.0.0.1`, and private IP ranges (`10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`).

### Payload Schemas

#### A. Slack Webhook (Block Kit Schema)
```json
{
  "text": "ReflectAI Insight: High Emotional Resonance",
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "🧠 ReflectAI Journal Dispatch", "emoji": true }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Title:*\n<Journal Title>" },
        { "type": "mrkdwn", "text": "*Mood:*\n<Mood Tag>" },
        { "type": "mrkdwn", "text": "*Sentiment Score:*\n<Score>/10" }
      ]
    },
    {
      "type": "section",
      "text": { "type": "mrkdwn", "text": "*Summary:*\n<Generated Summary>" }
    }
  ]
}
```

#### B. Discord Webhook (Embeds Schema)
```json
{
  "username": "ReflectAI Notifier",
  "avatar_url": "https://raw.githubusercontent.com/google/material-design-icons/master/png/action/lightbulb/materialicons/48dp/2x/baseline_lightbulb_black_48dp.png",
  "embeds": [
    {
      "title": "🧠 ReflectAI Reflection Synthesized",
      "description": "<Executive Summary>",
      "color": 5793266,
      "fields": [
        { "name": "Title", "value": "<Title>", "inline": true },
        { "name": "Mood", "value": "<Mood>", "inline": true },
        { "name": "Sentiment", "value": "<Score>/10", "inline": true },
        { "name": "Key Takeaways", "value": "<Bullet Points>", "inline": false }
      ],
      "footer": { "text": "ReflectAI Automated Dispatch" },
      "timestamp": "<ISO-Timestamp>"
    }
  ]
}
```

#### C. Email Notification Schema
```json
{
  "to": "user@example.com",
  "subject": "[ReflectAI] Daily Reflection Synthesis: <Title>",
  "html": "<div style='font-family:sans-serif;'><h2>ReflectAI Synthesis</h2><p><strong>Summary:</strong> <Summary></p></div>"
}
```

### Event Triggers & Error Recovery
- Triggers: Configurable by user (e.g., Mood = 'Overwhelmed', Sentiment <= 3 or >= 9, Tags containing 'Urgent', or Action Items generated).
- Asynchronous Non-Blocking: Notification dispatch runs asynchronously in the background so that UI journal saving is never delayed.
- Retry & Resilience: Automatic exponential retry (max 3 attempts) on transient HTTP 5xx errors; graceful error logging on HTTP 4xx webhook errors.
