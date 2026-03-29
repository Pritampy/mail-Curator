import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import cookieSession from "cookie-session";
import cors from "cors";
import dotenv from "dotenv";
import { GmailService } from "./src/services/gmailService";
import { DbService } from "./src/services/dbService";

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.APP_URL;
const MONGODB_URI = process.env.MONGODB_URI;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error("CRITICAL: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing from environment variables.");
}

const app = express();
const PORT = 3000;

// Services (initialized after MongoDB connection)
let gmailService: GmailService | null = null;
let dbService: DbService | null = null;

// OAuth2 Setup
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${APP_URL}/auth/callback`
);

// Initialize services
async function initializeServices() {
  if (MONGODB_URI) {
    dbService = new DbService();
    await dbService.connect(MONGODB_URI);
  } else {
    console.warn("MONGODB_URI not set - using in-memory fallback");
  }
  gmailService = new GmailService(oauth2Client);
}

function getUserId(req: express.Request): string {
  return req.session?.tokens?.access_token?.substring(0, 20) || 'anonymous';
}

app.use(express.json());
app.use(cors());
const isProduction = process.env.NODE_ENV === 'production';
app.use(cookieSession({
  name: 'session',
  keys: ['kinetic-secret-key'],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: isProduction,
  sameSite: 'lax',
  httpOnly: true
}));

app.get("/api/auth/url", (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: "Google OAuth credentials are not configured in the Secrets panel." });
  }
  const scopes = [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  res.json({ url });
});

app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    req.session!.tokens = tokens;
    
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.status(500).send("Authentication failed");
  }
});

app.get("/api/user", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });
  
  try {
    oauth2Client.setCredentials(req.session.tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    res.json(userInfo.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});

app.get("/api/emails", async (req, res) => {
  if (!req.session?.tokens || !gmailService) return res.status(401).json({ error: "Not authenticated" });

  try {
    oauth2Client.setCredentials(req.session.tokens);
    
    // Check if token needs refresh
    if (req.session.tokens.refresh_token) {
      oauth2Client.on('tokens', (tokens) => {
        req.session!.tokens = { ...req.session!.tokens, ...tokens };
      });
    }
    
    const maxResults = Math.min(Math.max(parseInt(req.query.maxResults as string) || 50, 1), 100);
    const emails = await gmailService.getEmails(getUserId(req), maxResults);
    res.json(emails);
  } catch (error: any) {
    console.error("Error fetching emails:", error?.message || error);
    if (error?.response?.status === 429) {
      res.status(429).json({ error: "Rate limited by Google. Please try again in a moment." });
    } else {
      res.status(500).json({ error: "Failed to fetch emails" });
    }
  }
});

app.post("/api/delete", async (req, res) => {
  if (!req.session?.tokens || !gmailService || !dbService) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { emailId } = req.body;
  if (!emailId) {
    return res.status(400).json({ error: "emailId is required" });
  }

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const userId = getUserId(req);

    await gmailService.deleteEmail(emailId);

    await dbService.saveAction({
      emailId,
      sender: '',
      subject: '',
      action: 'delete',
      userId
    });

    res.json({ success: true });
  } catch (error) {
    console.error(`Error deleting email ${emailId}:`, error);
    res.status(500).json({ error: "Failed to delete email" });
  }
});

app.post("/api/skip", async (req, res) => {
  if (!req.session?.tokens || !dbService) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { emailId, sender, subject } = req.body;
  if (!emailId) {
    return res.status(400).json({ error: "emailId is required" });
  }

  try {
    const userId = getUserId(req);

    await dbService.saveAction({
      emailId,
      sender: sender || '',
      subject: subject || '',
      action: 'skip',
      userId
    });

    res.json({ success: true });
  } catch (error) {
    console.error(`Error skipping email ${emailId}:`, error);
    res.status(500).json({ error: "Failed to skip email" });
  }
});

app.post("/api/undo", async (req, res) => {
  if (!req.session?.tokens || !gmailService || !dbService) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { emailId } = req.body;
  if (!emailId) {
    return res.status(400).json({ error: "emailId is required" });
  }

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const userId = getUserId(req);

    await gmailService.untrashEmail(emailId);
    await dbService.undoAction(emailId, userId);

    res.json({ success: true });
  } catch (error) {
    console.error(`Error undoing action for email ${emailId}:`, error);
    res.status(500).json({ error: "Failed to undo action" });
  }
});

app.get("/api/stats", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);

    if (dbService) {
      const stats = await dbService.getStats(userId);
      res.json(stats);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Stats fetch error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.get("/api/milestones", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);

    if (dbService) {
      const milestones = await dbService.getMilestones(userId);
      res.json(milestones);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Milestones fetch error:", error);
    res.status(500).json({ error: "Failed to fetch milestones" });
  }
});

app.get("/api/prediction", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);

    if (dbService) {
      const prediction = await dbService.getInboxPrediction(userId);
      res.json(prediction);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Prediction fetch error:", error);
    res.status(500).json({ error: "Failed to fetch prediction" });
  }
});

app.get("/api/filters", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    if (dbService) {
      const filters = await dbService.getFilters(userId);
      res.json(filters);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Filters fetch error:", error);
    res.status(500).json({ error: "Failed to fetch filters" });
  }
});

app.post("/api/filters", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    if (dbService) {
      const filter = await dbService.createFilter({ ...req.body, userId });
      res.json(filter);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Filter create error:", error);
    res.status(500).json({ error: "Failed to create filter" });
  }
});

app.patch("/api/filters/:id", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    if (dbService) {
      const filter = await dbService.updateFilter(req.params.id, userId, req.body);
      res.json(filter);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Filter update error:", error);
    res.status(500).json({ error: "Failed to update filter" });
  }
});

app.delete("/api/filters/:id", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    if (dbService) {
      await dbService.deleteFilter(req.params.id, userId);
      res.json({ success: true });
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Filter delete error:", error);
    res.status(500).json({ error: "Failed to delete filter" });
  }
});

app.post("/api/filters/:id/toggle", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    const { enabled } = req.body;
    if (dbService) {
      const filter = await dbService.toggleFilter(req.params.id, userId, enabled);
      res.json(filter);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Filter toggle error:", error);
    res.status(500).json({ error: "Failed to toggle filter" });
  }
});

app.get("/api/rules", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    if (dbService) {
      const rules = await dbService.getRules(userId);
      res.json(rules);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Rules fetch error:", error);
    res.status(500).json({ error: "Failed to fetch rules" });
  }
});

app.post("/api/rules", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    if (dbService) {
      const rule = await dbService.createRule({ ...req.body, userId });
      res.json(rule);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Rule create error:", error);
    res.status(500).json({ error: "Failed to create rule" });
  }
});

app.patch("/api/rules/:id", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    if (dbService) {
      const rule = await dbService.updateRule(req.params.id, userId, req.body);
      res.json(rule);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Rule update error:", error);
    res.status(500).json({ error: "Failed to update rule" });
  }
});

app.delete("/api/rules/:id", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    if (dbService) {
      await dbService.deleteRule(req.params.id, userId);
      res.json({ success: true });
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Rule delete error:", error);
    res.status(500).json({ error: "Failed to delete rule" });
  }
});

app.post("/api/rules/:id/toggle", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    const { enabled } = req.body;
    if (dbService) {
      const rule = await dbService.toggleRule(req.params.id, userId, enabled);
      res.json(rule);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Rule toggle error:", error);
    res.status(500).json({ error: "Failed to toggle rule" });
  }
});

app.get("/api/rules/due", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    if (dbService) {
      const rules = await dbService.getRulesDueForExecution();
      res.json(rules);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Rules due fetch error:", error);
    res.status(500).json({ error: "Failed to fetch rules due for execution" });
  }
});

app.post("/api/rules/:id/execute", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    if (dbService) {
      await dbService.recordRuleExecution(req.params.id, 0, true);
      res.json({ success: true, message: "Rule execution recorded" });
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Rule execute error:", error);
    res.status(500).json({ error: "Failed to execute rule" });
  }
});

app.post("/api/snooze", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    const { emailId, sender, subject, snoozedUntil, originalAction } = req.body;
    
    if (!emailId || !snoozedUntil) {
      return res.status(400).json({ error: "emailId and snoozedUntil are required" });
    }

    if (dbService) {
      const snooze = await dbService.snoozeEmail(emailId, sender, subject, new Date(snoozedUntil), userId, originalAction);
      res.json(snooze);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Snooze error:", error);
    res.status(500).json({ error: "Failed to snooze email" });
  }
});

app.get("/api/snooze", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    if (dbService) {
      const snoozed = await dbService.getSnoozedEmails(userId);
      res.json(snoozed);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Snooze fetch error:", error);
    res.status(500).json({ error: "Failed to fetch snoozed emails" });
  }
});

app.delete("/api/snooze/:id", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    if (dbService) {
      await dbService.unsnoozeEmail(req.params.id, userId);
      res.json({ success: true });
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Unsnooze error:", error);
    res.status(500).json({ error: "Failed to unsnooze email" });
  }
});

app.post("/api/snooze/:id/extend", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    const { snoozedUntil } = req.body;
    
    if (!snoozedUntil) {
      return res.status(400).json({ error: "snoozedUntil is required" });
    }

    if (dbService) {
      const snooze = await dbService.extendSnooze(req.params.id, userId, new Date(snoozedUntil));
      res.json(snooze);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Extend snooze error:", error);
    res.status(500).json({ error: "Failed to extend snooze" });
  }
});

app.get("/api/snooze/due", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    if (dbService) {
      const due = await dbService.getEmailsDueForReturn(userId);
      res.json(due);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Snooze due fetch error:", error);
    res.status(500).json({ error: "Failed to fetch due emails" });
  }
});

app.get("/api/snooze/settings", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    if (dbService) {
      const settings = await dbService.getSnoozeSettings(userId);
      res.json(settings);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Snooze settings fetch error:", error);
    res.status(500).json({ error: "Failed to fetch snooze settings" });
  }
});

app.put("/api/snooze/settings", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    if (dbService) {
      const settings = await dbService.updateSnoozeSettings(userId, req.body);
      res.json(settings);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Snooze settings update error:", error);
    res.status(500).json({ error: "Failed to update snooze settings" });
  }
});

app.get("/api/quickreplies", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    if (dbService) {
      const replies = await dbService.getQuickReplies(userId);
      res.json(replies);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Quick replies fetch error:", error);
    res.status(500).json({ error: "Failed to fetch quick replies" });
  }
});

app.post("/api/quickreplies", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    const { name, template } = req.body;
    if (!name || !template) {
      return res.status(400).json({ error: "name and template are required" });
    }
    if (dbService) {
      const reply = await dbService.createQuickReply(userId, name, template);
      res.json(reply);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Quick reply create error:", error);
    res.status(500).json({ error: "Failed to create quick reply" });
  }
});

app.patch("/api/quickreplies/:id", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    if (dbService) {
      const reply = await dbService.updateQuickReply(req.params.id, userId, req.body);
      res.json(reply);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Quick reply update error:", error);
    res.status(500).json({ error: "Failed to update quick reply" });
  }
});

app.delete("/api/quickreplies/:id", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = getUserId(req);
    if (dbService) {
      await dbService.deleteQuickReply(req.params.id, userId);
      res.json({ success: true });
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Quick reply delete error:", error);
    res.status(500).json({ error: "Failed to delete quick reply" });
  }
});

app.post("/api/bulk/delete", async (req, res) => {
  if (!req.session?.tokens || !gmailService) return res.status(401).json({ error: "Not authenticated" });

  try {
    const { emailIds } = req.body;
    if (!emailIds || !Array.isArray(emailIds)) {
      return res.status(400).json({ error: "emailIds array is required" });
    }
    
    oauth2Client.setCredentials(req.session.tokens);
    const userId = getUserId(req);
    
    for (const emailId of emailIds) {
      await gmailService.deleteEmail(emailId);
    }
    
    res.json({ success: true, processed: emailIds.length });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({ error: "Failed to bulk delete emails" });
  }
});

app.post("/api/bulk/archive", async (req, res) => {
  if (!req.session?.tokens || !gmailService) return res.status(401).json({ error: "Not authenticated" });

  try {
    const { emailIds } = req.body;
    if (!emailIds || !Array.isArray(emailIds)) {
      return res.status(400).json({ error: "emailIds array is required" });
    }
    
    oauth2Client.setCredentials(req.session.tokens);
    
    for (const emailId of emailIds) {
      await gmailService.archiveEmail(emailId);
    }
    
    res.json({ success: true, processed: emailIds.length });
  } catch (error) {
    console.error("Bulk archive error:", error);
    res.status(500).json({ error: "Failed to bulk archive emails" });
  }
});

app.post("/api/bulk/skip", async (req, res) => {
  if (!req.session?.tokens || !dbService) return res.status(401).json({ error: "Not authenticated" });

  try {
    const { emailIds, senders, subjects } = req.body;
    if (!emailIds || !Array.isArray(emailIds)) {
      return res.status(400).json({ error: "emailIds array is required" });
    }
    
    const userId = getUserId(req);
    
    for (let i = 0; i < emailIds.length; i++) {
      await dbService.saveAction({
        emailId: emailIds[i],
        sender: senders?.[i] || '',
        subject: subjects?.[i] || '',
        action: 'skip',
        userId
      });
    }
    
    res.json({ success: true, processed: emailIds.length });
  } catch (error) {
    console.error("Bulk skip error:", error);
    res.status(500).json({ error: "Failed to bulk skip emails" });
  }
});

app.post("/api/bulk/label", async (req, res) => {
  if (!req.session?.tokens || !gmailService) return res.status(401).json({ error: "Not authenticated" });

  try {
    const { emailIds, label } = req.body;
    if (!emailIds || !Array.isArray(emailIds)) {
      return res.status(400).json({ error: "emailIds array is required" });
    }
    if (!label) {
      return res.status(400).json({ error: "label is required" });
    }
    
    oauth2Client.setCredentials(req.session.tokens);
    
    for (const emailId of emailIds) {
      await gmailService.addLabel(emailId, label);
    }
    
    res.json({ success: true, processed: emailIds.length });
  } catch (error) {
    console.error("Bulk label error:", error);
    res.status(500).json({ error: "Failed to bulk label emails" });
  }
});

app.post("/api/bulk/delete-batch", async (req, res) => {
  if (!req.session?.tokens || !gmailService || !dbService) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { emailIds, senders, subjects } = req.body;
    
    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return res.status(400).json({ error: "emailIds array is required and must not be empty" });
    }

    const userId = getUserId(req);
    let deletedCount = 0;
    const errors: string[] = [];

    // Process each email - batch the Gmail API calls
    for (let i = 0; i < emailIds.length; i++) {
      const emailId = emailIds[i];
      try {
        // Delete from Gmail
        await gmailService.deleteEmail(emailId);
        
        // Record action in database
        await dbService.saveAction({
          emailId,
          sender: senders?.[i] || '',
          subject: subjects?.[i] || '',
          action: 'delete',
          userId
        });
        
        deletedCount++;
      } catch (err: any) {
        console.error(`Error deleting email ${emailId}:`, err?.message || err);
        errors.push(`Failed to delete ${emailId}: ${err?.message || 'Unknown error'}`);
      }
    }

    res.json({ 
      success: true, 
      processed: deletedCount,
      total: emailIds.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error("Bulk delete error:", error?.message || error);
    res.status(500).json({ error: "Failed to delete emails" });
  }
});

app.post("/api/logout", (req, res) => {
  req.session = null;
  res.json({ success: true });
});

async function startServer() {
  await initializeServices();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
