// Utility functions for handling email data
interface EmailEvent {
  id: string;
  email_id: string;
  email_subject: string;
  email_sender: string;
  email_date: string;
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
export interface Email {
  id: string;
  thread_id: string;
  references?: string;
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
  events_extracted: Array<{
    id: string;
    event_description: string;
    event_date: string | null;
    event_time: string | null;
    event_location: string | null;
    event_type: string;
    priority: number;
  }>;
}
export interface EmailMonitorData {
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
// Format time to relative time (e.g., "2m ago", "3h ago", "2d ago")
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};
// Convert priority number to human-readable format
export const getPriorityLabel = (priority: number): string => {
  if (priority >= 8) return 'High';
  if (priority >= 4) return 'Normal';
  return 'Low';
};
// Parse the email's sender name from the "Name <email@example.com>" format
export const parseSenderName = (sender: string): string => {
  const match = sender.match(/^"?([^"]*?)"?\s*<[^>]+>$/);
  if (match && match[1]) {
    return match[1].trim() || 'Unknown Sender';
  }
  return sender.split('@')[0];
};
// Interface for the transformed email data used in the UI
export interface TransformedEmail {
  id: string;
  threadId?: string;
  references?: string;
  sender: string;
  senderEmail: string;
  subject: string;
  time: string;
  date: string;
  priority: 'high' | 'normal' | 'low';
  content: string;
  summary: string;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
  hasAttachments: boolean;
}
// Transform the email data for the UI
export const transformEmailForUI = (email: Email): TransformedEmail => {
  // Ensure we have valid values for required fields
  const safeEmail = {
    id: email.id || 'unknown-id',
    threadId: email.thread_id,
    references: email.references || email.id,
    sender: email.sender || 'Unknown Sender',
    subject: email.subject || 'No Subject',
    timestamp: email.timestamp || new Date().toISOString(),
    priority: typeof email.priority === 'number' ? email.priority : 2, // Default to normal priority
    body_text: email.body_text || '',
    snippet: email.snippet || '',
    summary: email.summary || '',
    attachments: Array.isArray(email.attachments) ? email.attachments : []
  };
  // Process attachments with type safety
  const attachments = safeEmail.attachments.map(attachment => ({
    id: attachment.filename || `file-${Math.random().toString(36).substr(2, 9)}`,
    name: attachment.filename || 'unnamed_file',
    type: (attachment.mime_type && typeof attachment.mime_type === 'string')
      ? attachment.mime_type.split('/').pop() || 'file'
      : 'file',
    size: typeof attachment.size_bytes === 'number' ? attachment.size_bytes : 0,
    url: '#' // We don't have actual download URLs in the JSON
  }));
  return {
    id: safeEmail.id,
    sender: parseSenderName(safeEmail.sender),
    senderEmail: safeEmail.sender,
    subject: safeEmail.subject,
    time: formatRelativeTime(safeEmail.timestamp),
    date: new Date(safeEmail.timestamp).toLocaleDateString(),
    priority: safeEmail.priority >= 4 ? 'high' : safeEmail.priority >= 2 ? 'normal' : 'low',
    content: safeEmail.body_text || safeEmail.snippet,
    summary: safeEmail.summary || safeEmail.snippet || 'No summary available',
    attachments,
    hasAttachments: attachments.length > 0
  };
};
// Fetch email data from the local JSON file
// Returns a properly typed EmailMonitorData object
export async function fetchEmailData(): Promise<EmailMonitorData> {
  try {
    // Import the JSON file directly - Vite will handle this at build time
    const response = await fetch('/mails_widget/emails_monitor.json');
    
    if (!response.ok) {
      throw new Error(`Failed to load email data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Ensure the data has the expected structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format in emails_monitor.json');
    }
    
    // Transform the data to match the EmailMonitorData interface
    return {
      monitor_started: data.monitor_started || new Date().toISOString(),
      last_updated: data.last_updated || new Date().toISOString(),
      total_emails: Array.isArray(data.emails) ? data.emails.length : 0,
      config: {
        poll_interval: data.config?.poll_interval || 30,
        enable_summary: data.config?.enable_summary !== false,
        processed_label: data.config?.processed_label || 'processed',
        json_file: data.config?.json_file || 'emails_monitor.json',
        events_json_file: data.config?.events_json_file || 'email_events.json',
        userinfo_file: data.config?.userinfo_file || 'userinfo.json',
        max_content_length: data.config?.max_content_length || 30000,
        summary_retry_attempts: data.config?.summary_retry_attempts || 3,
        summary_retry_delay: data.config?.summary_retry_delay || 2
      },
      emails: Array.isArray(data.emails) ? data.emails : []
    };
    
  } catch (error) {
    console.error('Error loading email data:', error);
    
    // Return a minimal valid response structure
    return {
      monitor_started: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      total_emails: 0,
      config: {
        poll_interval: 30,
        enable_summary: true,
        processed_label: 'processed',
        json_file: 'emails_monitor.json',
        events_json_file: 'email_events.json',
        userinfo_file: 'userinfo.json',
        max_content_length: 30000,
        summary_retry_attempts: 3,
        summary_retry_delay: 2
      },
      emails: []
    };
  }
};