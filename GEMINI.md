# ReflectAI Gemini Directives & System Directives

## Custom Instructions for Model Interactions

1. **Google Maps Platform Interactions**:
   - Safely retrieve and utilize Google Maps API keys (`process.env.GOOGLE_MAPS_API_KEY` or `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`).
   - Ground geographical points using official Google Maps API endpoints; never fabricate real-world coordinates or place details from training memory.
   - Attach usage attribution ID `gmp_mcp_codeassist_v1_aistudio` to Maps instances.
   - Enforce 30-day maximum coordinate caching rule and restrict API keys to designated referrers.

2. **Admin Role & RBAC Security Directives**:
   - Enforce role-based access control checking (`admin`, `editor`, `member`).
   - Validate identity and elevated privileges before fulfilling administrative actions.
   - Enforce audit trail logging for all administrative policy alterations.

3. **External Notification API Directives**:
   - Validate webhook targets against SSRF vulnerabilities (reject private/internal IP blocks).
   - Format notification payloads using standard Slack Block Kit, Discord Embeds, and Email HTML templates.
   - Handle network failures gracefully with exponential backoff and non-blocking asynchronous dispatch.
