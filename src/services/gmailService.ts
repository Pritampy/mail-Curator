import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export interface Email {
  id: string;
  threadId?: string;
  subject: string;
  from: string;
  snippet?: string;
  date: string;
}

export class GmailService {
  private oauth2Client: OAuth2Client;
  private gmail: gmail_v1.Gmail;

  constructor(oauth2Client: OAuth2Client) {
    this.oauth2Client = oauth2Client;
    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  async getEmails(userId: string, maxResults: number = 20): Promise<Email[]> {
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: 'label:INBOX -is:important -is:starred'
    });

    const messages = response.data.messages || [];
    const emailDetails = await Promise.all(
      messages.map(async (msg) => {
        const detail = await this.gmail.users.messages.get({
          userId: 'me',
          id: msg.id!
        });

        const headers = detail.data.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
        const from = headers.find(h => h.name === 'From')?.value || '(Unknown Sender)';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        return {
          id: msg.id,
          threadId: msg.threadId,
          subject,
          from,
          snippet: detail.data.snippet,
          date
        };
      })
    );

    return emailDetails;
  }

  async deleteEmail(emailId: string): Promise<void> {
    await this.gmail.users.messages.trash({
      userId: 'me',
      id: emailId
    });
  }

  async untrashEmail(emailId: string): Promise<void> {
    await this.gmail.users.messages.untrash({
      userId: 'me',
      id: emailId
    });
  }

  async archiveEmail(emailId: string): Promise<void> {
    await this.gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        removeLabelIds: ['INBOX']
      }
    });
  }

  async addLabel(emailId: string, label: string): Promise<void> {
    await this.gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        addLabelIds: [label]
      }
    });
  }
}
