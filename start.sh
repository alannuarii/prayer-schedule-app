#!/bin/sh
# Start background cron job
node server/runner.js &

# Start the web app
npm run start
