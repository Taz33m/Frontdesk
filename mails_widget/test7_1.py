import os
import base64
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from cerebras.cloud.sdk import Cerebras
import json
import time
from datetime import datetime, timedelta
import re
import html
from dotenv import load_dotenv
import threading
import signal
import sys
import pytz
from email.utils import parsedate_to_datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import traceback

# Flask imports
from flask import Flask, request, jsonify

# Load environment variables
load_dotenv('googleAPIkey.env')

# Updated scopes to include label modification
SCOPES = ['https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/calendar']

# Configuration
CONFIG = {
    'poll_interval': 30,  # Check for new emails every 30 seconds
    'enable_summary': True,  # Set to False to disable AI summaries
    'processed_label': 'processed',  # Gmail label for processed emails
    'json_file': 'emails_monitor.json',  # Output JSON file
    'events_json_file': 'email_events.json',  # Separate events database
    'userinfo_file': 'userinfo.json',  # User information file
    'max_content_length': 30000,  # Max content length for AI processing
    'summary_retry_attempts': 3,  # Number of times to retry AI summary generation
    'summary_retry_delay': 2,  # Seconds to wait between retry attempts
    'api_server_port': 5000,  # Port for Flask API server
    'api_server_host': '0.0.0.0',  # Host for Flask API server
}

# Global flags and shared resources
RUNNING = True
gmail_service = None
cerebras_client = None

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully."""
    global RUNNING
    print("\n⏹️  Stopping email monitor and API server...")
    RUNNING = False

# Set up signal handler
signal.signal(signal.SIGINT, signal_handler)

def load_user_info():
    """Load user information including timezone from userinfo.json."""
    try:
        if os.path.exists(CONFIG['userinfo_file']):
            with open(CONFIG['userinfo_file'], 'r', encoding='utf-8') as f:
                user_info = json.load(f)
                print(f"👤 Loaded user info from {CONFIG['userinfo_file']}")
                return user_info
        else:
            print(f"⚠️  {CONFIG['userinfo_file']} not found, using defaults")
            # Create default userinfo.json
            default_info = {
                "default_tz": "UTC",
                "created": datetime.now().isoformat()
            }
            with open(CONFIG['userinfo_file'], 'w', encoding='utf-8') as f:
                json.dump(default_info, f, indent=2)
            print(f"📄 Created default {CONFIG['userinfo_file']}")
            return default_info
    except Exception as e:
        print(f"❌ Error loading user info: {e}")
        return {"default_tz": "UTC"}

def parse_timezone_offset(tz_string):
    """Parse timezone string like 'UTC-6' to get timezone object."""
    try:
        if tz_string.upper().startswith('UTC'):
            # Handle UTC+X or UTC-X format
            offset_str = tz_string[3:]  # Remove 'UTC'
            if offset_str:
                if offset_str.startswith('+'):
                    hours = int(offset_str[1:])
                    return pytz.FixedOffset(hours * 60)
                elif offset_str.startswith('-'):
                    hours = int(offset_str[1:])
                    return pytz.FixedOffset(-hours * 60)
            return pytz.UTC
        else:
            # Try to get timezone by name (e.g., 'America/New_York')
            return pytz.timezone(tz_string)
    except:
        print(f"⚠️  Invalid timezone '{tz_string}', defaulting to UTC")
        return pytz.UTC

def convert_to_user_timezone(timestamp_str, user_tz):
    """Convert email timestamp to user's timezone."""
    try:
        if not timestamp_str:
            return None
        
        # Parse the email timestamp
        dt = parsedate_to_datetime(timestamp_str)
        
        # Convert to user timezone
        user_dt = dt.astimezone(user_tz)
        
        return {
            'original': timestamp_str,
            'user_timezone': user_dt.isoformat(),
            'user_tz_name': str(user_tz),
            'formatted': user_dt.strftime('%Y-%m-%d %H:%M:%S %Z')
        }
    except Exception as e:
        print(f"⚠️  Error converting timestamp: {e}")
        return {
            'original': timestamp_str,
            'user_timezone': timestamp_str,
            'user_tz_name': str(user_tz),
            'formatted': timestamp_str
        }

def authenticate_gmail():
    """Authenticate and return Gmail service object."""
    creds = None
    
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Use context manager for file writing
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    
    return build('gmail', 'v1', credentials=creds)

def setup_cerebras_client():
    """Setup Cerebras API client using official SDK."""
    try:
        api_key = os.getenv('CEREBRAS_API_KEY')
        if not api_key:
            print("⚠️  CEREBRAS_API_KEY not found in googleAPIkey.env")
            return None
        
        print(f"🔑 Cerebras API Key found: {api_key[:10]}...{api_key[-4:]}")
        client = Cerebras()
        print("✅ Cerebras Cloud SDK initialized")
        return client
        
    except Exception as e:
        print(f"⚠️  Cerebras SDK not available: {e}")
        return None

def get_or_create_label(service, label_name):
    """Get or create a Gmail label."""
    try:
        # List existing labels
        results = service.users().labels().list(userId='me').execute()
        labels = results.get('labels', [])
        
        # Check if label already exists
        for label in labels:
            if label['name'].lower() == label_name.lower():
                print(f"📋 Found existing label: {label_name}")
                return label['id']
        
        # Create new label if it doesn't exist
        label_object = {
            'name': label_name,
            'labelListVisibility': 'labelShow',
            'messageListVisibility': 'show'
        }
        
        created_label = service.users().labels().create(
            userId='me', body=label_object).execute()
        
        print(f"📋 Created new label: {label_name}")
        return created_label['id']
        
    except HttpError as error:
        print(f"❌ Error managing label: {error}")
        return None

def add_label_to_email(service, message_id, label_id):
    """Add a label to an email."""
    try:
        service.users().messages().modify(
            userId='me',
            id=message_id,
            body={'addLabelIds': [label_id]}
        ).execute()
        return True
    except HttpError as error:
        print(f"❌ Error adding label to email {message_id}: {error}")
        return False

def get_unprocessed_emails(service, processed_label_id, since_time=None):
    """Get emails that haven't been processed yet."""
    try:
        # Build query to exclude processed emails
        query = f'in:inbox category:primary -label:{CONFIG["processed_label"]}'
        
        # Add time filter if specified
        if since_time:
            time_str = since_time.strftime('%Y/%m/%d')
            query += f' after:{time_str}'
        
        results = service.users().messages().list(
            userId='me',
            q=query,
            maxResults=50
        ).execute()
        
        messages = results.get('messages', [])
        return messages
        
    except HttpError as error:
        print(f"❌ Error fetching emails: {error}")
        return []

def clean_email_content(content):
    """Clean and normalize email content while preserving structure and newlines."""
    if not content:
        return ""
    
    # Decode HTML entities first
    content = html.unescape(content)
    
    # Remove HTML tags and their contents for certain elements
    content = re.sub(r'<(script|style|head)[^>]*>.*?</\1>', '', content, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove HTML comments
    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
    
    # Convert table rows to newlines BEFORE removing other tags
    # Convert </tr> to newlines to preserve table structure
    content = re.sub(r'</tr[^>]*>', '\n', content, flags=re.IGNORECASE)
    
    # Convert table cells to have some separation
    content = re.sub(r'</td[^>]*>', ' | ', content, flags=re.IGNORECASE)
    content = re.sub(r'</th[^>]*>', ' | ', content, flags=re.IGNORECASE)
    
    # Convert common block-level elements to newlines
    block_elements = ['div', 'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'ul', 'ol']
    for element in block_elements:
        # Convert closing tags to newlines
        content = re.sub(f'</{element}[^>]*>', '\n', content, flags=re.IGNORECASE)
        # Convert <br> and self-closing tags to newlines
        content = re.sub(f'<{element}[^>]*/?>', '\n', content, flags=re.IGNORECASE)
    
    # Convert remaining HTML tags to spaces (but preserve the newlines we just added)
    content = re.sub(r'<[^>]+>', ' ', content)
    
    # Clean up tracking links and email-specific URLs
    content = re.sub(r'https?://[^\s]{100,}', '[LINK]', content)
    
    # Remove email tracking parameters
    content = re.sub(r'[?&](utm_|bt_|mso-)[^=]*=[^&\s]*', '', content)
    
    # Normalize different types of line breaks but preserve intentional newlines
    content = content.replace('\r\n', '\n').replace('\r', '\n')
    
    # Remove common email footer/header patterns
    content = re.sub(r'(unsubscribe|opt[- ]?out|update preferences|manage subscription).*?(?=\n|$)', '', content, flags=re.IGNORECASE)
    content = re.sub(r'(view\s+in\s+browser|view\s+online|view\s+web\s+version).*?(?=\n|$)', '', content, flags=re.IGNORECASE)
    content = re.sub(r'(sponsor\s+content|sponsored\s+by|advertisement|ad\s+by).*?(?=\n|$)', '', content, flags=re.IGNORECASE)
    content = re.sub(r'(share\s+on|follow\s+us|connect\s+with\s+us).*?(?=\n|$)', '', content, flags=re.IGNORECASE)
    
    # Remove common email client artifacts
    content = re.sub(r'(mso-[^:]*:[^;]*;?)', '', content)
    content = re.sub(r'font-family:[^;]*;?', '', content)
    content = re.sub(r'color:[^;]*;?', '', content)
    
    # Clean up excessive punctuation
    content = re.sub(r'[.]{3,}', '...', content)
    content = re.sub(r'[-]{3,}', '---', content)
    
    # Clean up spacing around punctuation but preserve newlines
    content = re.sub(r'[ \t]+([,.!?;:])', r'\1', content)
    content = re.sub(r'([,.!?;:])[ \t]*([,.!?;:])', r'\1 \2', content)
    
    # Remove excessive whitespace on each line but preserve newlines
    lines = content.split('\n')
    cleaned_lines = []
    for line in lines:
        # Remove excessive spaces within the line
        cleaned_line = re.sub(r'[ \t]+', ' ', line.strip())
        # Remove standalone numbers and isolated characters from each line
        cleaned_line = re.sub(r'\b\d+\b(?=\s|$)', '', cleaned_line)
        cleaned_line = re.sub(r'\b[a-zA-Z]\b(?=\s|$)', '', cleaned_line)
        # Only keep non-empty lines or preserve intentional blank lines
        if cleaned_line.strip() or len(cleaned_line) == 0:
            cleaned_lines.append(cleaned_line.strip())
    
    # Join lines back and clean up excessive newlines
    content = '\n'.join(cleaned_lines)
    
    # Remove excessive consecutive newlines but keep structure
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    # Final trim
    content = content.strip()
    
    if len(content) < 20:
        return ""
    
    return content

def extract_meaningful_content(email_info):
    """Extract and clean the most meaningful content from an email."""
    content_sources = []
    
    if email_info.get('body_text'):
        clean_text = clean_email_content(email_info['body_text'])
        if clean_text and len(clean_text) > 50:
            content_sources.append(('body_text', clean_text))
    
    if email_info.get('body_html'):
        clean_html = clean_email_content(email_info['body_html'])
        if clean_html and len(clean_html) > 50:
            content_sources.append(('body_html', clean_html))
    
    if email_info.get('snippet'):
        clean_snippet = clean_email_content(email_info['snippet'])
        if clean_snippet and len(clean_snippet) > 20:
            content_sources.append(('snippet', clean_snippet))
    
    if content_sources:
        best_source = max(content_sources, key=lambda x: len(x[1]))
        return best_source[1], best_source[0]
    
    return "", "none"

def extract_email_info(message, service):
    """Extract relevant information from email message."""
    payload = message['payload']
    headers = payload.get('headers', [])
    
    email_info = {
        'id': message['id'],
        'thread_id': message['threadId'],
        'snippet': message.get('snippet', ''),
        'sender': None,
        'recipient': None,
        'subject': None,
        'date': None,
        'timestamp': None,
        'body_text': '',
        'body_html': '',
        'attachments': [],
        'summary': '',
        'priority': None,  # New field for priority (1-10)
        'events_extracted': [],  # New field for extracted events
        'summary_generated': False,
        'has_been_read': False,  # New flag: default to False when email is created
        'processed_at': datetime.now().isoformat()
    }
    
    # Parse headers
    for header in headers:
        name = header['name'].lower()
        value = header['value']
        
        if name == 'date':
            email_info['date'] = value
            try:
                from email.utils import parsedate_to_datetime
                email_info['timestamp'] = parsedate_to_datetime(value).isoformat()
            except:
                email_info['timestamp'] = value
        elif name == 'from':
            email_info['sender'] = value
        elif name == 'to':
            email_info['recipient'] = value
        elif name == 'subject':
            email_info['subject'] = value
    
    # Extract email body and attachments
    extract_body_and_attachments(payload, email_info, service, message['id'])
    
    return email_info

def extract_body_and_attachments(payload, email_info, service, message_id):
    """Extract email body and process attachments."""
    
    def process_part(part):
        mime_type = part.get('mimeType', '')
        
        if mime_type == 'text/plain':
            if 'data' in part['body']:
                data = part['body']['data']
                email_info['body_text'] = base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
        
        elif mime_type == 'text/html':
            if 'data' in part['body']:
                data = part['body']['data']
                email_info['body_html'] = base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
        
        elif part.get('filename'):
            attachment_info = process_attachment(service, message_id, part)
            if attachment_info:
                email_info['attachments'].append(attachment_info)
        
        if 'parts' in part:
            for subpart in part['parts']:
                process_part(subpart)
    
    if 'parts' in payload:
        for part in payload['parts']:
            process_part(part)
    else:
        process_part(payload)

def process_attachment(service, message_id, part):
    """Process attachment metadata (without downloading files)."""
    try:
        filename = part['filename']
        if not filename:
            return None
        
        attachment_id = part['body'].get('attachmentId')
        if not attachment_id:
            return None
        
        size = part['body'].get('size', 0)
        
        return {
            'filename': filename,
            'size_bytes': size,
            'mime_type': part.get('mimeType', 'unknown'),
            'attachment_id': attachment_id
        }
        
    except Exception as e:
        print(f"❌ Error processing attachment: {e}")
        return None

def load_events_data():
    """Load existing events data from JSON file."""
    if os.path.exists(CONFIG['events_json_file']):
        try:
            with open(CONFIG['events_json_file'], 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"📅 Loaded existing events data: {data.get('total_events', 0)} events")
                return data
        except Exception as e:
            print(f"⚠️  Error loading existing events data: {e}")
    
    return {
        "database_created": datetime.now().isoformat(),
        "last_updated": datetime.now().isoformat(),
        "total_events": 0,
        "events": []
    }

def save_events_data(events_data):
    """Save events data to JSON file."""
    try:
        events_data['last_updated'] = datetime.now().isoformat()
        
        with open(CONFIG['events_json_file'], 'w', encoding='utf-8') as f:
            json.dump(events_data, f, indent=2, default=str, ensure_ascii=False)
        
        return True
    except Exception as e:
        print(f"❌ Error saving events data: {e}")
        return False

def parse_ai_response(response_text):
    """Parse the AI response to extract summary, priority, and events."""
    try:
        # Try to parse as JSON first
        response_data = json.loads(response_text)
        return response_data
    except json.JSONDecodeError:
        # Fallback to text parsing if JSON fails
        print("   ⚠️  AI response not in JSON format, attempting text parsing...")
        
        lines = response_text.strip().split('\n')
        result = {
            'summary': '',
            'priority': 5,  # Default priority
            'events': []
        }
        
        # Simple text parsing as fallback
        result['summary'] = response_text.strip()
        
        return result

def add_events_to_database(events, email_info, events_data):
    """Add extracted events to the events database."""
    if not events:
        return
    
    for event in events:
        event_record = {
            'id': f"{email_info['id']}_{len(events_data['events'])}",
            'email_id': email_info['id'],
            'email_subject': email_info.get('subject', 'No Subject'),
            'email_sender': email_info.get('sender', 'Unknown'),
            'email_date': email_info.get('timestamp'),
            'event_description': event.get('description', ''),
            'event_date': event.get('date', ''),
            'event_time': event.get('time', ''),
            'event_location': event.get('location', ''),
            'event_type': event.get('type', 'unknown'),
            'priority': email_info.get('priority', 5),
            'extracted_at': datetime.now().isoformat()
        }
        
        events_data['events'].insert(0, event_record)  # Add to beginning
    
    events_data['total_events'] = len(events_data['events'])
    
    if save_events_data(events_data):
        print(f"   📅 Added {len(events)} events to events database")

def generate_email_summary(email_info, cerebras_client):
    """Generate a summary of the email using Cerebras API with priority and events extraction."""
    if not CONFIG['enable_summary'] or not cerebras_client:
        return
    
    content_to_summarize, content_source = extract_meaningful_content(email_info)
    
    if not content_to_summarize:
        print("   ⚠️  No meaningful content found to summarize")
        return
    
    if len(content_to_summarize) > CONFIG['max_content_length']:
        content_to_summarize = content_to_summarize[:CONFIG['max_content_length']] + "..."
    
    # Retry logic for AI summary generation
    max_attempts = CONFIG['summary_retry_attempts']
    retry_delay = CONFIG['summary_retry_delay']
    
    for attempt in range(1, max_attempts + 1):
        try:
            if attempt > 1:
                print(f"   🔄 Retry attempt {attempt}/{max_attempts} for AI summary...")
            else:
                print(f"   🧠 Generating AI summary with priority and events from {content_source} ({len(content_to_summarize)} chars)...")
            
            messages = [
                {
                    "role": "system",
                    "content": """You are an expert email analyzer that provides comprehensive analysis including summaries, priority scoring, and event extraction. 

CRITICAL: You must extract ALL dates, times, meetings, events, deadlines, appointments, and schedule-related information from emails. This includes:
- Meeting dates and times
- Deadline dates
- Event dates  
- Appointment times
- Conference dates
- Project milestones
- Due dates
- Any temporal references

Your response must be valid JSON with this exact structure:
{
  "summary": "Concise summary under 50 words focusing on key information and action items",
  "priority": integer from 1-10 (1=lowest, 10=highest urgency/importance),
  "events": [
    {
      "description": "Event/meeting/deadline description",
      "date": "YYYY-MM-DD or extracted date format",
      "time": "HH:MM or extracted time format",
      "location": "Location if mentioned",
      "type": "meeting|deadline|event|appointment|conference|other"
    }
  ]
}"""
                },
                {
                    "role": "user", 
                    "content": f"""Analyze this email and provide a JSON response with summary, priority (1-10), and ALL calendar events/dates/meetings/deadlines found in the content.

Email Subject: {email_info.get('subject', 'No Subject')}
Email From: {email_info.get('sender', 'Unknown')}
Email Date: {email_info.get('date', 'Unknown')}

Email Content:
{content_to_summarize}

Remember: Extract EVERY date, time, meeting, event, deadline, or scheduled item mentioned in the email. Include partial dates/times even if incomplete."""
                }
            ]
            
            response = cerebras_client.chat.completions.create(
                model="gpt-oss-120b",
                messages=messages,
                max_tokens=4000,
                temperature=0.4
            )
            
            if hasattr(response, 'choices') and len(response.choices) > 0:
                response_text = response.choices[0].message.content.strip()
                
                if response_text:
                    # Parse the AI response
                    parsed_response = parse_ai_response(response_text)
                    
                    # Update email info with parsed data
                    email_info['summary'] = parsed_response.get('summary', 'Summary generation failed')
                    email_info['priority'] = parsed_response.get('priority', 5)
                    email_info['events_extracted'] = parsed_response.get('events', [])
                    email_info['summary_generated'] = True
                    email_info['content_source'] = content_source
                    email_info['summary_attempts'] = attempt
                    
                    print(f"   ✅ Analysis generated successfully on attempt {attempt}")
                    print(f"   📊 Priority: {email_info['priority']}/10")
                    print(f"   📅 Events found: {len(email_info['events_extracted'])}")
                    
                    # Add events to separate database
                    if email_info['events_extracted']:
                        events_data = load_events_data()
                        add_events_to_database(email_info['events_extracted'], email_info, events_data)
                    
                    return  # Success - exit the retry loop
                else:
                    raise Exception("Empty response returned")
            else:
                raise Exception("No valid response from API")
                
        except Exception as e:
            error_msg = str(e)
            print(f"   ❌ Analysis generation attempt {attempt} failed: {error_msg}")
            if attempt < max_attempts:
                print(f"   ⏳ Waiting {retry_delay} seconds before retry...")
                time.sleep(retry_delay)
                # Increase delay for next attempt (exponential backoff)
                retry_delay *= 1.5
            else:
                # All attempts failed
                email_info['summary'] = f"Analysis generation failed after {max_attempts} attempts: {error_msg}"
                email_info['priority'] = 5  # Default priority
                email_info['events_extracted'] = []
                email_info['summary_generated'] = False
                email_info['summary_attempts'] = max_attempts
                print(f"   ❌ Analysis generation failed after {max_attempts} attempts")

def load_existing_data():
    """Load existing email data from JSON file using proper file handling."""
    if os.path.exists(CONFIG['json_file']):
        try:
            # Use context manager to ensure file is properly closed
            with open(CONFIG['json_file'], 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"📄 Loaded existing data: {data.get('total_emails', 0)} emails")
                return data
        except Exception as e:
            print(f"⚠️  Error loading existing data: {e}")
    
    # Return empty structure if file doesn't exist or can't be loaded
    return {
        "monitor_started": datetime.now().isoformat(),
        "last_updated": datetime.now().isoformat(),
        "total_emails": 0,
        "config": CONFIG,
        "emails": []
    }

def save_data(data):
    """Save data to JSON file using proper file handling."""
    try:
        data['last_updated'] = datetime.now().isoformat()
        
        # Use context manager to ensure file is properly opened and closed
        with open(CONFIG['json_file'], 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str, ensure_ascii=False)
        
        return True
    except Exception as e:
        print(f"❌ Error saving data: {e}")
        return False

def process_new_email(service, message_id, cerebras_client, processed_label_id, data):
    """Process a single new email."""
    try:
        print(f"\n📧 Processing new email: {message_id}")
        
        # Get full message details
        msg = service.users().messages().get(
            userId='me', 
            id=message_id,
            format='full'
        ).execute()
        
        # Extract email information
        email_info = extract_email_info(msg, service)
        
        print(f"   📋 Subject: {email_info.get('subject', 'No Subject')}")
        print(f"   👤 From: {email_info.get('sender', 'Unknown')}")
        print(f"   📖 Has been read: {email_info.get('has_been_read', False)}")
        
        # Generate AI summary with priority and events extraction
        if cerebras_client:
            generate_email_summary(email_info, cerebras_client)
        
        # Add label to mark as processed
        if add_label_to_email(service, message_id, processed_label_id):
            print(f"   🏷️  Added 'processed' label")
        
        # Add to data structure
        data['emails'].insert(0, email_info)  # Insert at beginning (newest first)
        data['total_emails'] = len(data['emails'])
        
        # Save updated data with proper file handling
        if save_data(data):
            print(f"   💾 Saved to {CONFIG['json_file']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error processing email {message_id}: {e}")
        return False

# =============================================================================
# FLASK API SERVER FUNCTIONS
# =============================================================================

def create_message(sender, to, subject, message_text, message_html=None, attachments=None):
    """Create a message for an email."""
    if message_html or attachments:
        message = MIMEMultipart('alternative')
    else:
        message = MIMEText(message_text)
        message['to'] = to
        message['from'] = sender
        message['subject'] = subject
        return {'raw': base64.urlsafe_b64encode(message.as_bytes()).decode()}
    
    message['to'] = to
    message['from'] = sender
    message['subject'] = subject
    
    # Add text part
    text_part = MIMEText(message_text, 'plain')
    message.attach(text_part)
    
    # Add HTML part if provided
    if message_html:
        html_part = MIMEText(message_html, 'html')
        message.attach(html_part)
    
    # Add attachments if provided
    if attachments:
        for attachment in attachments:
            if os.path.isfile(attachment):
                with open(attachment, "rb") as attachment_file:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment_file.read())
                
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {os.path.basename(attachment)}',
                )
                message.attach(part)
    
    return {'raw': base64.urlsafe_b64encode(message.as_bytes()).decode()}

def send_message(service, user_id, message):
    """Send an email message."""
    try:
        message = service.users().messages().send(userId=user_id, body=message).execute()
        return message
    except HttpError as error:
        print(f'An error occurred: {error}')
        return None

# Create Flask app
app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'gmail_authenticated': gmail_service is not None,
        'monitor_running': RUNNING
    })

@app.route('/send_email', methods=['POST'])
def send_email():
    """Send an email via Gmail API."""
    try:
        # Check if Gmail service is available
        if not gmail_service:
            return jsonify({
                'error': 'Gmail service not authenticated',
                'success': False
            }), 500
        
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No JSON data provided',
                'success': False
            }), 400
        
        # Validate required fields
        required_fields = ['recipient', 'subject', 'body']
        missing_fields = [field for field in required_fields if field not in data or not data[field]]
        
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}',
                'success': False
            }), 400
        
        recipient = data['recipient']
        subject = data['subject']
        body = data['body']
        html_body = data.get('html_body')  # Optional HTML version
        attachments = data.get('attachments')  # Optional attachments
        
        # Get sender email (you might want to make this configurable)
        sender = 'me'  # Gmail API uses 'me' for authenticated user
        
        # Create the message
        message = create_message(
            sender=sender,
            to=recipient,
            subject=subject,
            message_text=body,
            message_html=html_body,
            attachments=attachments
        )
        
        # Send the message
        result = send_message(gmail_service, 'me', message)
        
        if result:
            return jsonify({
                'success': True,
                'message_id': result['id'],
                'recipient': recipient,
                'subject': subject,
                'sent_at': datetime.now().isoformat(),
                'thread_id': result.get('threadId')
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to send email'
            }), 500
            
    except Exception as e:
        error_details = {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__,
            'timestamp': datetime.now().isoformat()
        }
        
        # Add traceback in debug mode
        if app.debug:
            error_details['traceback'] = traceback.format_exc()
        
        return jsonify(error_details), 500

@app.route('/get_emails', methods=['GET'])
def get_emails():
    """Get recent emails from Gmail."""
    try:
        if not gmail_service:
            return jsonify({
                'error': 'Gmail service not authenticated',
                'success': False
            }), 500
        
        # Get query parameters
        max_results = request.args.get('max_results', 10, type=int)
        query = request.args.get('query', 'in:inbox')
        
        # Limit max_results to prevent abuse
        max_results = min(max_results, 100)
        
        # Get messages
        results = gmail_service.users().messages().list(
            userId='me',
            q=query,
            maxResults=max_results
        ).execute()
        
        messages = results.get('messages', [])
        emails = []
        
        for msg in messages:
            # Get full message details
            full_msg = gmail_service.users().messages().get(
                userId='me',
                id=msg['id'],
                format='metadata',
                metadataHeaders=['Date', 'From', 'Subject']
            ).execute()
            
            headers = {h['name']: h['value'] for h in full_msg['payload'].get('headers', [])}
            
            email_info = {
                'id': msg['id'],
                'thread_id': full_msg['threadId'],
                'snippet': full_msg.get('snippet', ''),
                'date': headers.get('Date'),
                'from': headers.get('From'),
                'subject': headers.get('Subject'),
                'labels': full_msg.get('labelIds', [])
            }
            emails.append(email_info)
        
        return jsonify({
            'success': True,
            'emails': emails,
            'total_count': len(emails),
            'query_used': query
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }), 500

@app.route('/get_email/<email_id>', methods=['GET'])
def get_email_by_id(email_id):
    """Get a specific email by ID."""
    try:
        if not gmail_service:
            return jsonify({
                'error': 'Gmail service not authenticated',
                'success': False
            }), 500
        
        # Get full message details
        message = gmail_service.users().messages().get(
            userId='me',
            id=email_id,
            format='full'
        ).execute()
        
        headers = {h['name']: h['value'] for h in message['payload'].get('headers', [])}
        
        # Extract body (simplified - you might want to use the more complex extraction from your original code)
        body_text = ''
        body_html = ''
        
        def extract_body(payload):
            nonlocal body_text, body_html
            
            if payload.get('mimeType') == 'text/plain' and 'data' in payload.get('body', {}):
                body_text = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')
            elif payload.get('mimeType') == 'text/html' and 'data' in payload.get('body', {}):
                body_html = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')
            
            if 'parts' in payload:
                for part in payload['parts']:
                    extract_body(part)
        
        extract_body(message['payload'])
        
        email_data = {
            'id': message['id'],
            'thread_id': message['threadId'],
            'snippet': message.get('snippet', ''),
            'headers': headers,
            'body_text': body_text,
            'body_html': body_html,
            'labels': message.get('labelIds', []),
            'size_estimate': message.get('sizeEstimate', 0)
        }
        
        return jsonify({
            'success': True,
            'email': email_data
        })
        
    except HttpError as e:
        if e.resp.status == 404:
            return jsonify({
                'success': False,
                'error': 'Email not found'
            }), 404
        else:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }), 500

@app.route('/get_processed_emails', methods=['GET'])
def get_processed_emails():
    """Get processed emails from local database."""
    try:
        data = load_existing_data()
        
        # Get query parameters
        max_results = request.args.get('max_results', 10, type=int)
        max_results = min(max_results, 100)  # Limit to prevent abuse
        
        emails = data.get('emails', [])[:max_results]
        
        return jsonify({
            'success': True,
            'emails': emails,
            'total_in_db': data.get('total_emails', 0),
            'returned_count': len(emails)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }), 500

@app.route('/get_events', methods=['GET'])
def get_events():
    """Get extracted events from local database."""
    try:
        events_data = load_events_data()
        
        # Get query parameters
        max_results = request.args.get('max_results', 20, type=int)
        max_results = min(max_results, 100)  # Limit to prevent abuse
        
        events = events_data.get('events', [])[:max_results]
        
        return jsonify({
            'success': True,
            'events': events,
            'total_events': events_data.get('total_events', 0),
            'returned_count': len(events)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

def run_flask_server():
    """Run Flask server in a separate thread."""
    print(f"🌐 Starting Flask API server on {CONFIG['api_server_host']}:{CONFIG['api_server_port']}")
    try:
        app.run(
            host=CONFIG['api_server_host'],
            port=CONFIG['api_server_port'],
            debug=False,  # Disable debug in production
            use_reloader=False  # Disable reloader in threaded environment
        )
    except Exception as e:
        print(f"❌ Flask server error: {e}")

# =============================================================================
# EMAIL MONITORING FUNCTIONS
# =============================================================================

def monitor_emails():
    """Main monitoring function that runs continuously."""
    global gmail_service, cerebras_client
    
    print("🔄 Starting Enhanced Gmail Email Monitor with API Server...")
    print(f"⚙️  Configuration:")
    print(f"   📊 Poll interval: {CONFIG['poll_interval']} seconds")
    print(f"   🧠 AI Summary enabled: {CONFIG['enable_summary']}")
    print(f"   🔄 Summary retry attempts: {CONFIG['summary_retry_attempts']}")
    print(f"   ⏳ Summary retry delay: {CONFIG['summary_retry_delay']} seconds")
    print(f"   🏷️  Processed label: {CONFIG['processed_label']}")
    print(f"   📄 Email database: {CONFIG['json_file']}")
    print(f"   📅 Events database: {CONFIG['events_json_file']}")
    print(f"   🌐 API server: {CONFIG['api_server_host']}:{CONFIG['api_server_port']}")
    
    # Setup APIs
    gmail_service = authenticate_gmail()
    cerebras_client = setup_cerebras_client() if CONFIG['enable_summary'] else None
    
    # Setup processed label
    processed_label_id = get_or_create_label(gmail_service, CONFIG['processed_label'])
    if not processed_label_id:
        print("❌ Failed to setup processed label. Exiting.")
        return
    
    # Load existing data
    data = load_existing_data()
    events_data = load_events_data()
    
    print(f"\n✅ Monitor started! Press Ctrl+C to stop.")
    print(f"🔍 Watching for new emails...")
    print(f"📧 Current email count: {data['total_emails']}")
    print(f"📅 Current events count: {events_data['total_events']}")
    
    last_check = datetime.now()
    
    while RUNNING:
        try:
            # Get unprocessed emails
            messages = get_unprocessed_emails(gmail_service, processed_label_id, since_time=last_check - timedelta(hours=1))
            
            if messages:
                print(f"\n📬 Found {len(messages)} unprocessed emails")
                
                # Process each email
                for message in messages:
                    if not RUNNING:  # Check if we should stop
                        break
                    
                    success = process_new_email(
                        gmail_service, 
                        message['id'], 
                        cerebras_client, 
                        processed_label_id,
                        data
                    )
                    
                    if success:
                        print(f"   ✅ Email processed successfully")
                    
                    # Small delay between processing emails
                    time.sleep(1)
                
                print(f"\n📊 Total emails in database: {data['total_emails']}")
                
                # Reload events data to show current count
                events_data = load_events_data()
                print(f"📅 Total events in database: {events_data['total_events']}")
            else:
                print(".", end="", flush=True)  # Show activity without cluttering output
            
            last_check = datetime.now()
            
            # Wait before next check
            time.sleep(CONFIG['poll_interval'])
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"\n❌ Error in monitoring loop: {e}")
            print("⏸️  Waiting 60 seconds before retrying...")
            time.sleep(60)
    
    # Final statistics
    events_data = load_events_data()
    print(f"\n🛑 Email monitor stopped.")
    print(f"📊 Final count: {data['total_emails']} emails processed")
    print(f"📅 Final count: {events_data['total_events']} events extracted")

def main():
    """Main function that starts both the email monitor and Flask API server."""
    try:
        print("🚀 Starting Unified Gmail Monitor & API Server...")
        print("📧 Available API endpoints:")
        print(f"   POST http://localhost:{CONFIG['api_server_port']}/send_email")
        print(f"   GET  http://localhost:{CONFIG['api_server_port']}/get_emails")
        print(f"   GET  http://localhost:{CONFIG['api_server_port']}/get_email/<id>")
        print(f"   GET  http://localhost:{CONFIG['api_server_port']}/get_processed_emails")
        print(f"   GET  http://localhost:{CONFIG['api_server_port']}/get_events")
        print(f"   GET  http://localhost:{CONFIG['api_server_port']}/health")
        print()
        print("📋 Send email example:")
        print(f'   curl -X POST http://localhost:{CONFIG["api_server_port"]}/send_email \\')
        print('        -H "Content-Type: application/json" \\')
        print('        -d \'{"recipient": "test@example.com", "subject": "Test", "body": "Hello!"}\'')
        print()
        
        # Start Flask API server in a separate thread
        flask_thread = threading.Thread(target=run_flask_server, daemon=True)
        flask_thread.start()
        
        # Give Flask a moment to start
        time.sleep(2)
        
        # Start email monitoring in the main thread
        monitor_emails()
        
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Fatal error: {e}")

if __name__ == '__main__':
    main()