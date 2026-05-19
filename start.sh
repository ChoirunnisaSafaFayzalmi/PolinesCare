#!/bin/bash
cd /home/z/my-project
pkill -f "next dev" 2>/dev/null
sleep 1
nohup setsid ./node_modules/.bin/next dev -p 3000 > /tmp/polines_server.log 2>&1 &
echo "Server started"
