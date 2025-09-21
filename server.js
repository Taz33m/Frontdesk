import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());

// API endpoint to get emails (handle both /api/emails and /emails)
const handleEmails = (req, res) => {
  try {
    // Path to the emails_monitor.json file
    const emailsPath = path.join(__dirname, 'mails_widget', 'emails_monitor.json');
    
    // Check if file exists
    if (!existsSync(emailsPath)) {
      return res.status(404).json({
        success: false,
        message: 'Email data file not found',
        path: emailsPath
      });
    }

    // Read and parse the email data
    const fileContent = readFileSync(emailsPath, 'utf-8');
    let emailData = JSON.parse(fileContent);
    
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
    console.error('Error in email API:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Register the route handlers
app.get('/api/emails', handleEmails);
app.get('/emails', handleEmails);

// Start the server
app.listen(PORT, () => {
  console.log(`API server is running on http://localhost:${PORT}`);
  console.log(`Vite dev server will be available at http://localhost:3000`);
});
