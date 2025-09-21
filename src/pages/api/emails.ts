import { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';

// Define the types for our email data
interface EmailEvent {
  id: string;
  event_description: string;
  event_date: string | null;
  event_time: string | null;
  event_location: string | null;
  event_type: string;
  priority: number;
}

interface EmailAttachment {
  filename: string;
  size_bytes: number;
  mime_type: string;
}

interface Email {
  id: string;
  thread_id: string;
  snippet: string;
  sender: string;
  recipient: string;
  subject: string;
  date: string;
  timestamp: string;
  body_text: string;
  body_html: string;
  attachments: EmailAttachment[];
  summary: string;
  priority: number;
  events_extracted: EmailEvent[];
}

interface EmailMonitorData {
  monitor_started: string;
  last_updated: string;
  total_emails: number;
  config: {
    poll_interval: number;
    enable_summary: boolean;
    processed_label: string;
    json_file: string;
    events_json_file: string;
    userinfo_file: string;
    max_content_length: number;
    summary_retry_attempts: number;
    summary_retry_delay: number;
  };
  emails: Email[];
}

// Helper function to read and parse JSON file
function readJsonFile<T>(filePath: string): T | null {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent) as T;
  } catch (error) {
    console.error(`Error reading or parsing file ${filePath}:`, error);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} not allowed` 
    });
  }

  try {
    // Path to the emails_monitor.json file
    const emailsPath = path.join(process.cwd(), 'mails_widget', 'emails_monitor.json');
    
    // Check if file exists
    if (!fs.existsSync(emailsPath)) {
      return res.status(404).json({
        success: false,
        message: 'Email data file not found',
        path: emailsPath
      });
    }

    // Read and parse the email data
    const emailData = readJsonFile<EmailMonitorData>(emailsPath);
    
    if (!emailData) {
      return res.status(500).json({
        success: false,
        message: 'Failed to parse email data'
      });
    }
    
    // Ensure emails is an array
    if (!Array.isArray(emailData.emails)) {
      console.warn('Expected emails to be an array, received:', emailData.emails);
      emailData.emails = [];
    }
    
    // Update the last_updated timestamp and total count
    const now = new Date().toISOString();
    emailData.last_updated = now;
    emailData.total_emails = emailData.emails.length;
    
    // Return the email data
    return res.status(200).json({
      success: true,
      data: emailData,
      last_updated: now
    });
    
  } catch (error) {
    console.error('Error in /api/emails:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Add TypeScript module declarations
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}
