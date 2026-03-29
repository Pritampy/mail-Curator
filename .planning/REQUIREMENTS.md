# Requirements

**Phase:** 01 - Gmail PWA Core Features

---

### GMAIL-01: Swipe-Based Email Processing

**Description:** User can process emails via swipe gestures - right swipe deletes (trashes) the email, left swipe skips it.

**Acceptance Criteria:**
- [ ] Right swipe triggers delete action
- [ ] Left swipe triggers skip action
- [ ] Swipe threshold of 100px triggers action
- [ ] Visual feedback during swipe (rotation, color overlay)

---

### GMAIL-02: Optimistic UI Updates

**Description:** UI updates immediately when user swipes, before backend confirms the action.

**Acceptance Criteria:**
- [ ] Card removed from stack immediately on swipe
- [ ] Previous state stored for potential undo
- [ ] Rollback on API failure with error message

---

### GMAIL-03: Undo Functionality

**Description:** User can undo the last action (delete or skip) within a session.

**Acceptance Criteria:**
- [ ] Undo button available after each action
- [ ] Single level undo (last action only)
- [ ] Visual indicator when undo is available

---

### GMAIL-04: Email Batch Preloading

**Description:** Preload next batch of emails when current batch is low to ensure smooth UX.

**Acceptance Criteria:**
- [ ] Load 20 emails initially
- [ ] Preload next batch when 5 emails remaining
- [ ] Loading indicator during batch fetch

---

### GMAIL-05: MongoDB Persistence

**Description:** Store all email actions in MongoDB Atlas for analytics and persistence.

**Acceptance Criteria:**
- [ ] Email action model: {emailId, sender, subject, action, timestamp, userId}
- [ ] CRUD operations for action history
- [ ] Query support for stats aggregation

---

### GMAIL-06: REST API Endpoints

**Description:** Modular backend API with Gmail integration and MongoDB storage.

**Acceptance Criteria:**
- [ ] GET /api/emails - Fetch inbox emails
- [ ] POST /api/delete - Delete (trash) email
- [ ] POST /api/skip - Skip email
- [ ] GET /api/stats - Get processing stats (total, deleted, skipped, rate)

---

### GMAIL-07: Error Handling & States

**Description:** Proper loading, error, and edge case handling throughout the app.

**Acceptance Criteria:**
- [ ] Loading spinner during API calls
- [ ] Error toast on API failure
- [ ] Empty state when inbox is zero
- [ ] Auth error handling (re-auth prompt)

---

### GMAIL-08: PWA Capabilities

**Description:** Progressive Web App features for offline-capable experience.

**Acceptance Criteria:**
- [ ] Web app manifest with icons
- [ ] Service worker for caching
- [ ] Installable on mobile/desktop

---

### ANALYTICS-01: Enhanced Stats Display

**Description:** Display all processing metrics including skipped count in the stats dashboard.

**Acceptance Criteria:**
- [ ] Show totalProcessed count
- [ ] Show totalDeleted count
- [ ] Show totalSkipped count (currently missing)
- [ ] Show efficiency percentage

---

### ANALYTICS-02: Real Milestone Tracking

**Description:** Track and display user achievements based on actual cleaning activity.

**Acceptance Criteria:**
- [ ] Space Guardian: Track total emails deleted, award at 10,000
- [ ] Inbox Zero Streak: Track consecutive days with empty inbox, award at 7 days
- [ ] Persist milestone data in MongoDB

---

### ANALYTICS-03: Inbox Growth Predictions

**Description:** Use historical data to predict daily inbox growth.

**Acceptance Criteria:**
- [ ] Analyze past 7 days of email activity
- [ ] Predict today's expected inbox growth
- [ ] Display prediction in dashboard

---

### FILTERS-01: Smart Email Categorization

**Description:** Automatically categorize emails based on sender, subject patterns, or labels.

**Acceptance Criteria:**
- [ ] Categorize by sender domain (e.g., newsletters, promotions, social)
- [ ] Categorize by subject patterns (e.g., [Newsletter], [Promo])
- [ ] Store categories in user preferences
- [ ] Filter view to show specific categories

---

### FILTERS-02: Custom Filter Rules

**Description:** User can create custom filters based on sender, subject, or labels.

**Acceptance Criteria:**
- [ ] Create filter with conditions (sender contains, subject contains, has label)
- [ ] Apply action (auto-delete, auto-archive, auto-skip)
- [ ] Enable/disable filters
- [ ] Persist filters in MongoDB

---

### RULES-01: Scheduled Cleanup Rules

**Description:** Set up recurring cleanup rules that run on a schedule.

**Acceptance Criteria:**
- [ ] Create rule with conditions and schedule (daily, weekly, monthly)
- [ ] Run rule automatically at scheduled time
- [ ] Show rule execution history
- [ ] Enable/disable rules

---

### RULES-02: Rule Management UI

**Description:** Interface to manage all scheduled rules.

**Acceptance Criteria:**
- [ ] List all rules with status
- [ ] Edit existing rules
- [ ] Delete rules
- [ ] View execution history

---

### SNOOZE-01: Snooze Email

**Description:** Temporarily hide an email and bring it back at a specified time.

**Acceptance Criteria:**
- [ ] Snooze options: Later today, Tomorrow, Next week, Custom date/time
- [ ] Store snoozed emails with return date
- [ ] Hide snoozed emails from inbox
- [ ] Return snoozed emails at specified time

---

### SNOOZE-02: Snooze Management

**Description:** View and manage snoozed emails.

**Acceptance Criteria:**
- [ ] View list of snoozed emails
- [ ] Unsnooze (bring back immediately)
- [ ] Edit snooze time
- [ ] Delete from snooze

---

### SNOOZE-03: Snooze Notifications

**Description:** Notify user when snoozed emails return.

**Acceptance Criteria:**
- [ ] In-app notification when emails return
- [ ] Badge count for returning emails
- [ ] Option to auto-process when returning

---

### BULK-01: Bulk Selection

**Description:** Select multiple emails for batch operations.

**Acceptance Criteria:**
- [ ] Select all visible
- [ ] Select range
- [ ] Select by category/filter
- [ ] Clear selection

---

### BULK-02: Bulk Actions

**Description:** Apply actions to selected emails.

**Acceptance Criteria:**
- [ ] Bulk delete
- [ ] Bulk archive
- [ ] Bulk skip
- [ ] Bulk apply label
- [ ] Show progress for bulk operations

---

### QUICKREPLY-01: Quick Reply Templates

**Description:** Template responses for common actions.

**Acceptance Criteria:**
- [ ] Create reply templates
- [ ] Apply template to email
- [ ] Edit/delete templates
- [ ] Quick send with template

---

*Requirements defined: 2026-03-28*
