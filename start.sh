#!/bin/bash

# Function to handle script termination
cleanup() {
  echo "Stopping all processes..."
  kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
  exit 0
}

# Set up trap to catch termination signals
trap cleanup SIGINT SIGTERM

# Start the Next.js development server
echo "Starting Next.js development server..."
cd /Users/tazeemmahashin/Downloads/Deskv1
npm run dev &
FRONTEND_PID=$!

# Start the Python email monitoring script
echo "Starting Python email monitoring..."
cd /Users/tazeemmahashin/Downloads/Deskv1/mails_widget
nohup python3 test7.py > mail_monitor.log 2>&1 &
BACKEND_PID=$!
echo "Python email monitoring started with PID $BACKEND_PID"

# Keep script running and wait for processes
echo "Both services are now running. Press Ctrl+C to stop."
wait $FRONTEND_PID $BACKEND_PID
