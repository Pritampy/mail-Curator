# External Integrations

**Analysis Date:** 2026-03-28

## APIs & External Services

**AI & Machine Learning:**
- Google Gemini AI - AI-powered email processing suggestions
  - SDK: `@google/genai` ^1.29.0
  - API Key: `GEMINI_API_KEY` environment variable
  - Usage: Not actively invoked in current code (imported but may be for future features)
  - Injected at runtime by AI Studio platform

**Google APIs:**
- Gmail API - Email access and management
  - SDK: `googleapis` ^171.4.0
  - Auth: OAuth2 via `google.auth.OAuth2`
  - Scopes:
    - `https://www.googleapis.com/auth/gmail.modify` - Read/modify emails
    - `https://www.googleapis.com/auth/userinfo.profile` - User profile
    - `https://www.googleapis.com/auth/userinfo.email` - User email
  - Features used:
    - List inbox messages (`gmail.users.messages.list`)
    - Get message details (`gmail.users.messages.get`)
    - Delete/trash messages (`gmail.users.messages.trash`)
    - Get user info (`oauth2.userinfo.get`)

## Authentication & Identity

**Auth Provider: Google OAuth2**
- Implementation: Custom OAuth2 flow in `server.ts` (lines 26-86)
- Client ID: `GOOGLE_CLIENT_ID` environment variable
- Client Secret: `GOOGLE_CLIENT_SECRET` environment variable
- Callback URL: `${APP_URL}/auth/callback`
- Token storage: Server-side session via `cookie-session`
- Session config:
  - Name: `session`
  - Keys: `['kinetic-secret-key']` (hardcoded, should be env var)
  - Max age: 24 hours
  - Secure: true
  - SameSite: none

**API Endpoints:**
- `GET /api/auth/url` - Returns Google OAuth consent URL
- `GET /auth/callback` - OAuth callback handler, exchanges code for tokens
- `GET /api/user` - Returns authenticated user info
- `POST /api/logout` - Clears session

## Data Storage

**Session Storage:**
- In-memory array `sessionActions` in `server.ts` (line 23)
- Stores email actions (delete/skip) with timestamps
- Not persistent - resets on server restart

**Session Data:**
- Google OAuth tokens stored in encrypted cookies via `cookie-session`
- No database required

## Environment Configuration

**Required env vars:**
- `GOOGLE_CLIENT_ID` - OAuth2 client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - OAuth2 client secret
- `GEMINI_API_KEY` - Gemini API key for AI features
- `APP_URL` - Application URL (e.g., https://your-app.run.app)
- `NODE_ENV` - Set to "production" for production builds

**Optional env vars:**
- `DISABLE_HMR` - Set to "true" to disable Vite HMR

## Webhooks & Callbacks

**Incoming:**
- `GET /auth/callback` - Google OAuth redirect endpoint
- Handles OAuth code exchange

**Outgoing:**
- Google OAuth authorization URL - Redirects user to Google consent screen
- Gmail API calls - REST API to Google's servers

## Security Considerations

**Current setup:**
- OAuth tokens stored server-side in session cookies
- CORS enabled (default configuration)
- Session cookies use `secure: true` and `sameSite: 'none'`

**Potential concerns:**
- Hardcoded session key `'kinetic-secret-key'` in `server.ts` line 36 - should be environment variable
- No CSRF protection on OAuth flow
- No rate limiting on API endpoints

---

*Integration audit: 2026-03-28*
