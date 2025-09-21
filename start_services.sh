#!/bin/bash

# Function to handle script termination
cleanup() {
  echo "Stopping all processes..."
  kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
  exit 0
}

# Set up trap to catch termination signals
trap cleanup SIGINT SIGTERM

# Start the Next.js development server in the background
echo "🚀 Starting Next.js development server..."
cd "$(dirname "$0")"
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Next.js server started with PID $FRONTEND_PID"

# Start the Python email monitoring script in the background
echo "📧 Starting Python email monitoring..."
cd "$(dirname "$0")/mails_widget"
nohup python3 test7.py > mail_monitor.log 2>&1 &
BACKEND_PID=$!
echo "Email monitoring started with PID $BACKEND_PID"

# Keep script running and wait for processes
echo "✅ Both services are now running. Press Ctrl+C to stop."
echo "- Frontend logs: frontend.log"
echo "- Email monitor logs: mails_widget/mail_monitor.log"

# Wait for both processes
tail -f /dev/null
