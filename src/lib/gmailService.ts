import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the token file
const TOKEN_PATH = path.join(process.cwd(), 'mails_widget', 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'mails_widget', 'credentials.json');

// Load client secrets from a local file
async function loadSavedCredentialsIfExist() {
  try {
    const content = fs.readFileSync(TOKEN_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    console.error('Error loading saved credentials:', err);
    return null;
  }
}

// Initialize the Gmail API client
async function getGmailClient() {
  try {
    const auth = await loadSavedCredentialsIfExist();
    if (!auth) {
      throw new Error('No valid credentials found. Please authenticate first.');
    }
    return google.gmail({ version: 'v1', auth });
  } catch (error) {
    console.error('Error initializing Gmail client:', error);
    throw error;
  }
}

// Function to send a reply email
export async function sendReplyEmail({
  to,
  subject,
  message,
  threadId,
  references
}: {
  to: string;
  subject: string;
  message: string;
  threadId?: string;
  references?: string;
}) {
  try {
    const gmail = await getGmailClient();
    
    // Create the email message
    const emailLines = [
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
    ];

    // Add thread information if replying
    if (threadId) {
      emailLines.push(`In-Reply-To: ${threadId}`);
      emailLines.push(`References: ${references || threadId}`);
    }

    emailLines.push('', message);

    // The body needs to be base64url encoded
    const encodedMessage = Buffer.from(emailLines.join('\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the message
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: threadId || undefined,
      },
    });

    console.log('Email sent:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Function to get email details by ID
export async function getEmailDetails(messageId: string) {
  try {
    const gmail = await getGmailClient();
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    return res.data;
  } catch (error) {
    console.error('Error getting email details:', error);
    throw error;
  }
}

// Function to get thread details
export async function getThreadDetails(threadId: string) {
  try {
    const gmail = await getGmailClient();
    const res = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full',
    });
    return res.data;
  } catch (error) {
    console.error('Error getting thread details:', error);
    throw error;
  }
}
