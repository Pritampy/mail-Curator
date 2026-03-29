# Kinetic - Gmail Inbox Cleaner PWA

A swipe-based Gmail inbox cleaner with analytics, filters, rules, snooze, and bulk operations.

## Features

- **Swipe-based email processing** - Right to delete, left to skip
- **Analytics Dashboard** - Track processed emails, daily activity, milestones
- **Smart Filters** - Auto-categorize emails
- **Scheduled Rules** - Set up automated cleanup rules
- **Snooze Feature** - Temporarily hide emails
- **Bulk Operations** - Multi-select and batch operations
- **Quick Replies** - Save and use canned responses

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: Google OAuth 2.0 (Gmail API)
- **Deployment**: Firebase (frontend), Render (backend)

## Prerequisites

- Node.js 20+
- MongoDB Atlas account
- Google Cloud Console project with Gmail API enabled

## Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file:
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   MONGODB_URI=your_mongodb_uri
   APP_URL=http://localhost:5173
   SESSION_SECRET=your_session_secret
   ```

3. **Set up Google OAuth:**
   - Go to Google Cloud Console
   - Enable Gmail API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:5173` to authorized redirect URIs

4. **Run locally:**
   ```bash
   npm run dev
   ```

## Deployment

### Frontend (Firebase)
```bash
firebase login
firebase use <project-id>
firebase deploy --only hosting
```

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use these settings:
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm run start`
   - Environment: Node

## API Endpoints

- `GET /api/user` - Get current user
- `GET /api/emails` - Fetch emails from Gmail
- `POST /api/emails/:id/delete` - Delete an email
- `POST /api/emails/:id/skip` - Skip an email
- `GET /api/stats` - Get analytics stats
- `GET /api/filters` - Get filters
- `POST /api/filters` - Create filter
- `GET /api/rules` - Get rules
- `POST /api/rules` - Create rule
- `GET /api/snoozes` - Get snoozed emails
- `POST /api/snooze` - Snooze an email

## License

MIT
