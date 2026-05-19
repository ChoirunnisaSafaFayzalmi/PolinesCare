#!/bin/bash
while true; do
    if ! ss -tlnp | grep -q ":3000 "; then
        cd /home/z/my-project
        NODE_ENV=production node .next/standalone/server.js -p 3000 > /tmp/polines.log 2>&1 &
    fi
    sleep 2
done
