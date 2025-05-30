#!/bin/bash

# Kill any running dev servers on ports 3000-3005
for port in 3000 3001 3002 3003 3004 3005; do
  echo "Checking for processes on port $port"
  lsof -ti:$port | xargs kill -9 2>/dev/null || echo "No process on port $port"
done

# Clear the terminal
clear

# Start the dev server on port 3001
echo "Starting dev server on port 3001..."
npm run fixed-port 