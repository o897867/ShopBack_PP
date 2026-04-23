#!/bin/bash
# Setup systemd timer for analytics export
# Runs export_to_s3.py daily at 04:45 UTC (30 min before Lambda fires at 05:15 UTC)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
VENV_PYTHON="$BACKEND_DIR/venv/bin/python"

echo "Setting up analytics export scheduler..."
echo "  Backend dir: $BACKEND_DIR"
echo "  Python:      $VENV_PYTHON"

# Create systemd service
cat > /etc/systemd/system/analytics-export.service <<EOF
[Unit]
Description=Analytics ETL - Export SQLite to S3
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
WorkingDirectory=$BACKEND_DIR
ExecStart=$VENV_PYTHON -m analytics.export_to_s3
Environment="PATH=$BACKEND_DIR/venv/bin:/usr/bin"
StandardOutput=journal
StandardError=journal
TimeoutStartSec=600
EOF

# Create systemd timer — 04:45 UTC, 30 min before Lambda (05:15 UTC)
cat > /etc/systemd/system/analytics-export.timer <<EOF
[Unit]
Description=Run analytics export daily at 04:45 UTC

[Timer]
OnCalendar=*-*-* 04:45:00 UTC
Persistent=true
RandomizedDelaySec=120

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now analytics-export.timer

echo ""
echo "Done! Timer is active."
echo ""
echo "Useful commands:"
echo "  systemctl status analytics-export.timer    # check timer status"
echo "  systemctl list-timers analytics-*           # see next trigger time"
echo "  journalctl -u analytics-export.service      # view logs"
echo "  systemctl start analytics-export.service    # manual run (test)"
