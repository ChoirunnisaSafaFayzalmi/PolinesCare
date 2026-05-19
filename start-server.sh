#!/bin/bash
cd /home/z/my-project
while true; do
  echo "$(date): Starting Next.js dev server..." >> /tmp/server-watch.log
  npx next dev --port 3000 >> /tmp/srv.log 2>&1
  echo "$(date): Server exited with code $?. Restarting in 3s..." >> /tmp/server-watch.log
  sleep 3
done
