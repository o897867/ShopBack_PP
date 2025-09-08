#!/bin/bash

# FastAPI Service Restart Script
# Author: ShopBack System
# Description: Automatically restart FastAPI service with proper error handling

SERVICE_NAME="fapi.py"
SERVICE_DIR="/root/shopback/ShopBack_PP/back-end"
VENV_PATH="$SERVICE_DIR/venv"
LOG_FILE="$SERVICE_DIR/fapi.log"
PID_FILE="$SERVICE_DIR/fapi.pid"
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
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        else
            # PID file exists but process is not running
            rm -f "$PID_FILE"
            return 1
        fi
    else
        # Check if process is running without PID file
        PIDS=$(pgrep -f "$SERVICE_NAME")
        if [ -n "$PIDS" ]; then
            return 0
        fi
    fi
    return 1
}

# Function to stop the service
stop_service() {
    print_status "Stopping FastAPI service..."
    
    # Try to stop using PID file first
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -TERM "$PID" 2>/dev/null; then
            print_status "Sent SIGTERM to process $PID"
            sleep 2
            
            # Check if process stopped
            if ! ps -p "$PID" > /dev/null 2>&1; then
                print_status "Service stopped successfully"
                rm -f "$PID_FILE"
                return 0
            else
                # Force kill if still running
                print_warning "Process still running, sending SIGKILL..."
                kill -9 "$PID" 2>/dev/null
                sleep 1
                rm -f "$PID_FILE"
            fi
        fi
    fi
    
    # Kill all processes matching the service name
    PIDS=$(pgrep -f "$SERVICE_NAME")
    if [ -n "$PIDS" ]; then
        print_warning "Found running processes: $PIDS"
        for PID in $PIDS; do
            print_status "Killing process $PID"
            kill -9 "$PID" 2>/dev/null
        done
        sleep 2
    fi
    
    # Also check for processes on the port
    PORT_PID=$(lsof -ti:$PORT 2>/dev/null)
    if [ -n "$PORT_PID" ]; then
        print_warning "Found process $PORT_PID using port $PORT"
        kill -9 "$PORT_PID" 2>/dev/null
        sleep 1
    fi
    
    print_status "All service processes stopped"
}

# Function to start the service
start_service() {
    print_status "Starting FastAPI service..."
    
    # Check if already running
    if is_running; then
        print_warning "Service is already running!"
        return 1
    fi
    
    # Navigate to service directory
    cd "$SERVICE_DIR" || {
        print_error "Failed to navigate to service directory: $SERVICE_DIR"
        exit 1
    }
    
    # Check if virtual environment exists
    if [ ! -d "$VENV_PATH" ]; then
        print_error "Virtual environment not found at: $VENV_PATH"
        exit 1
    fi
    
    # Activate virtual environment and start service
    print_status "Activating virtual environment..."
    source "$VENV_PATH/bin/activate"
    
    # Backup old log file if it exists
    if [ -f "$LOG_FILE" ]; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        mv "$LOG_FILE" "${LOG_FILE}.${TIMESTAMP}"
        print_status "Backed up old log to ${LOG_FILE}.${TIMESTAMP}"
    fi
    
    # Start the service
    print_status "Starting service on port $PORT..."
    nohup python "$SERVICE_NAME" > "$LOG_FILE" 2>&1 &
    SERVICE_PID=$!
    
    # Save PID
    echo $SERVICE_PID > "$PID_FILE"
    
    # Wait a moment for service to start
    sleep 3
    
    # Check if service started successfully
    if ps -p "$SERVICE_PID" > /dev/null 2>&1; then
        print_status "Service started successfully with PID: $SERVICE_PID"
        
        # Check if port is listening
        sleep 2
        if lsof -i:$PORT > /dev/null 2>&1; then
            print_status "Service is listening on port $PORT"
        else
            print_warning "Service started but not yet listening on port $PORT"
            print_status "Check log file for details: $LOG_FILE"
        fi
        
        # Show last few lines of log
        if [ -f "$LOG_FILE" ]; then
            echo ""
            print_status "Recent log entries:"
            tail -n 10 "$LOG_FILE"
        fi
        
        return 0
    else
        print_error "Failed to start service!"
        if [ -f "$LOG_FILE" ]; then
            print_error "Check log file for errors:"
            tail -n 20 "$LOG_FILE"
        fi
        rm -f "$PID_FILE"
        return 1
    fi
}

# Function to restart the service
restart_service() {
    print_status "Restarting FastAPI service..."
    stop_service
    sleep 2
    start_service
}

# Function to check service status
check_status() {
    if is_running; then
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            print_status "Service is running (PID: $PID)"
        else
            PIDS=$(pgrep -f "$SERVICE_NAME")
            print_status "Service is running (PIDs: $PIDS)"
        fi
        
        # Check port
        if lsof -i:$PORT > /dev/null 2>&1; then
            print_status "Port $PORT is active"
        else
            print_warning "Port $PORT is not active"
        fi
        
        # Show resource usage
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            print_status "Resource usage:"
            ps aux | grep -E "PID|$PID" | grep -v grep
        fi
    else
        print_warning "Service is not running"
    fi
}

# Function to show logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        print_status "Showing last 50 lines of log file:"
        tail -n 50 "$LOG_FILE"
    else
        print_warning "Log file not found: $LOG_FILE"
    fi
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