#!/bin/bash
set -e

if [ -z "$PORT" ]; then
  echo "PORT not set, defaulting to 80"
  export PORT=80
fi

# Substitute PORT into nginx template and enable it
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/sites-enabled/default.conf || true
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-enabled/default.conf /etc/nginx/sites-enabled/default

# Start supervisord (this starts nginx, backend and frontend)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf