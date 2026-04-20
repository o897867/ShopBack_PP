#!/bin/bash

# FastAPI Service Restart Script
# Author: ShopBack System
# Description: Manage FastAPI service using systemd

# Service configuration
SYSTEMD_SERVICE="fapi.service"
SERVICE_NAME="fapi.py"
SERVICE_DIR="/root/shopback/ShopBack_PP/back-end"
PORT=8001

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if service is running
is_running() {
    if systemctl is-active --quiet "$SYSTEMD_SERVICE"; then
        return 0
    else
        return 1
    fi
}

# Function to stop the service
stop_service() {
    print_status "Stopping FastAPI service..."

    if systemctl stop "$SYSTEMD_SERVICE"; then
        print_status "Service stopped successfully"

        # Wait for service to fully stop
        sleep 2

        # Clean up any stray processes
        PIDS=$(pgrep -f "$SERVICE_NAME")
        if [ -n "$PIDS" ]; then
            print_warning "Found stray processes: $PIDS"
            for PID in $PIDS; do
                print_status "Killing process $PID"
                kill -9 "$PID" 2>/dev/null
            done
            sleep 1
        fi
    else
        print_error "Failed to stop service via systemctl"
    fi

    print_status "Service stopped"
}

# Function to start the service
start_service() {
    print_status "Starting FastAPI service..."

    # Check if already running
    if is_running; then
        print_warning "Service is already running!"
        return 1
    fi

    # Start the service
    if systemctl start "$SYSTEMD_SERVICE"; then
        print_status "Service start command issued"

        # Wait for service to start
        sleep 3

        # Check if service started successfully
        if systemctl is-active --quiet "$SYSTEMD_SERVICE"; then
            print_status "Service started successfully"

            # Get PID
            PID=$(systemctl show -p MainPID --value "$SYSTEMD_SERVICE")
            print_status "Service running with PID: $PID"

            # Check if port is listening
            if lsof -i:$PORT > /dev/null 2>&1; then
                print_status "Service is listening on port $PORT"
            else
                print_warning "Service started but not yet listening on port $PORT"
            fi

            # Show recent logs
            echo ""
            print_status "Recent log entries:"
            journalctl -u "$SYSTEMD_SERVICE" -n 10 --no-pager

            return 0
        else
            print_error "Service failed to start!"
            print_error "Check logs with: journalctl -u $SYSTEMD_SERVICE -xe"
            return 1
        fi
    else
        print_error "Failed to start service via systemctl"
        return 1
    fi
}

# Function to restart the service
restart_service() {
    print_status "Restarting FastAPI service..."
    if systemctl restart "$SYSTEMD_SERVICE"; then
        print_status "Service restart command issued"
        sleep 3

        # Check if service is running
        if systemctl is-active --quiet "$SYSTEMD_SERVICE"; then
            print_status "Service restarted successfully"

            # Get PID
            PID=$(systemctl show -p MainPID --value "$SYSTEMD_SERVICE")
            print_status "Service running with PID: $PID"

            # Check port
            if lsof -i:$PORT > /dev/null 2>&1; then
                print_status "Service is listening on port $PORT"
            fi

            # Show recent logs
            echo ""
            print_status "Recent log entries:"
            journalctl -u "$SYSTEMD_SERVICE" -n 10 --no-pager
        else
            print_error "Service failed to restart!"
            journalctl -u "$SYSTEMD_SERVICE" -xe --no-pager | tail -20
        fi
    else
        print_error "Failed to restart service via systemctl"
    fi
}

# Function to check service status
check_status() {
    print_status "Checking service status..."

    # Show systemd status
    systemctl status "$SYSTEMD_SERVICE" --no-pager | head -20

    echo ""
    if is_running; then
        # Get PID
        PID=$(systemctl show -p MainPID --value "$SYSTEMD_SERVICE")
        print_status "Service is running (PID: $PID)"

        # Check port
        if lsof -i:$PORT > /dev/null 2>&1; then
            print_status "Port $PORT is active"
            PORT_INFO=$(lsof -i:$PORT | grep LISTEN)
            echo "$PORT_INFO"
        else
            print_warning "Port $PORT is not active"
        fi

        # Show resource usage
        print_status "Resource usage:"
        systemctl show "$SYSTEMD_SERVICE" -p MemoryCurrent -p CPUUsageNSec --value | \
            awk 'NR==1{printf "Memory: %.2f MB\n", $1/1024/1024} NR==2{printf "CPU Time: %.2f seconds\n", $1/1000000000}'
    else
        print_warning "Service is not running"
    fi
}

# Function to show logs
show_logs() {
    print_status "Showing last 50 lines of service logs:"
    journalctl -u "$SYSTEMD_SERVICE" -n 50 --no-pager
}

# Main script logic
case "${1:-restart}" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        restart_service
        ;;
    status)
        check_status
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the FastAPI service"
        echo "  stop    - Stop the FastAPI service"
        echo "  restart - Restart the FastAPI service (default)"
        echo "  status  - Check service status"
        echo "  logs    - Show recent log entries"
        exit 1
        ;;
esac

exit 0