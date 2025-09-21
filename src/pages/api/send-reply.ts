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
async function getAuthClient() {
  try {
    // Read the token file
    const tokenContent = fs.readFileSync(TOKEN_PATH, 'utf-8');
    const token = JSON.parse(tokenContent);
    
    // Create an OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    // Set the credentials
    oauth2Client.setCredentials(token);
    
    // Refresh the token if it's expired
    if (token.expiry_date && token.expiry_date < Date.now()) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      
      // Save the new token
      fs.writeFileSync(TOKEN_PATH, JSON.stringify({
        ...token,
        access_token: credentials.access_token,
        expiry_date: credentials.expiry_date,
        refresh_token: credentials.refresh_token || token.refresh_token
      }));
    }
    
    return oauth2Client;
  } catch (err) {
    console.error('Error initializing auth client:', err);
    throw new Error('Failed to initialize authentication. Please check your credentials.');
  }
}

// Initialize the Gmail API client
async function getGmailClient() {
  try {
    const auth = await getAuthClient();
    
    // Return the Gmail API client with the authenticated client
    // Using type assertion to bypass type checking issues
    return google.gmail({ version: 'v1', auth: auth as any });
  } catch (error) {
    console.error('Error initializing Gmail client:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { to, subject, message, threadId, references } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, or message',
      });
    }

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
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: threadId || undefined,
      },
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email',
    });
  }
}
