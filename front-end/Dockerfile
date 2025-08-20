# Frontend Dockerfile for ShopBack React Application
# Multi-stage build for optimization

# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S reactuser -u 1001

# Set proper permissions
RUN chown -R reactuser:nodejs /usr/share/nginx/html \
    && chown -R reactuser:nodejs /var/cache/nginx \
    && chown -R reactuser:nodejs /var/log/nginx \
    && chown -R reactuser:nodejs /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown -R reactuser:nodejs /var/run/nginx.pid

USER reactuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]