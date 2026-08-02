#!/bin/sh
# Starts the proxy + all 4 dummy services in one container, for
# single-service hosts (e.g. Render's free tier, which runs one
# container per service and has no docker-compose support).
#
# Every process talks over localhost — this works with zero code
# changes because proxy/index.js and services/*/index.js already read
# their target URLs from env vars with localhost fallbacks; setting
# *_SERVICE_URL=http://localhost:PORT here is exactly what they'd
# default to anyway, just made explicit.

set -e

# Each service process needs its OWN distinct PORT/SERVICE_NAME/
# SERVICE_SECRET, not the container's shared environment — all 4 use
# the same generic env var names in their own code (process.env.PORT,
# process.env.SERVICE_SECRET, etc.), which is fine when each runs in
# its own container (docker-compose) but would collide if they all
# read one shared process.env here. Setting the vars inline on each
# spawn, scoped to just that child process, is what keeps them
# distinct without touching any service's source code.

PORT=5001 SERVICE_NAME=user-service SERVICE_SECRET="$USER_SERVICE_SECRET" \
  node /app/services/user-service/index.js &
USER_PID=$!

PORT=5002 SERVICE_NAME=payment-service SERVICE_SECRET="$PAYMENT_SERVICE_SECRET" \
  node /app/services/payment-service/index.js &
PAYMENT_PID=$!

PORT=5003 SERVICE_NAME=db-service SERVICE_SECRET="$DB_SERVICE_SECRET" \
  node /app/services/db-service/index.js &
DB_PID=$!

PORT=5004 SERVICE_NAME=notification-service SERVICE_SECRET="$NOTIFICATION_SERVICE_SECRET" \
  node /app/services/notification-service/index.js &
NOTIFICATION_PID=$!

node /app/proxy/index.js &
PROXY_PID=$!

# Forward termination signals to every child so `docker stop` / Render's
# shutdown actually stops all 5 processes, not just the shell.
trap 'kill $USER_PID $PAYMENT_PID $DB_PID $NOTIFICATION_PID $PROXY_PID 2>/dev/null' TERM INT

# If any one process dies, exit the container instead of limping along
# with a partial mesh — `wait -n` exits as soon as any single job ends.
wait -n $USER_PID $PAYMENT_PID $DB_PID $NOTIFICATION_PID $PROXY_PID
exit $?
