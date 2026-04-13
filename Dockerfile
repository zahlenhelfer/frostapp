# Multi-stage Dockerfile for FrostApp Monorepo

# Stage 1: Build shared package
FROM node:22-alpine AS shared-builder
WORKDIR /app
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --workspace=@frostapp/shared
COPY packages/shared ./packages/shared
RUN npm run build --workspace=@frostapp/shared

# Stage 2: Build API (with build tools for sqlite3)
FROM node:22-alpine AS api-builder
# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++
WORKDIR /app
# Copy all package files for workspace install
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/
# Install all workspace dependencies (this will include express-rate-limit)
RUN npm ci --workspaces --if-present
# Copy the built shared package from shared-builder stage
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
# Copy source files
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN npm run build --workspace=@frostapp/api
RUN npm prune --omit=dev --workspaces

# Stage 3: Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/frontend/package*.json ./apps/frontend/
COPY apps/frontend/angular.json ./apps/frontend/
COPY apps/frontend/tsconfig*.json ./apps/frontend/
RUN npm ci --workspace=@frostapp/frontend
COPY apps/frontend ./apps/frontend
RUN npm run build --workspace=@frostapp/frontend

# Stage 4: Production API Server
FROM node:22-alpine AS api
# Install sqlite dependencies
RUN apk add --no-cache sqlite-libs ca-certificates
WORKDIR /app
# Copy the built application
COPY --from=api-builder /app/apps/api/dist ./dist
# Copy root node_modules
COPY --from=api-builder /app/node_modules ./node_modules
# Copy workspace-specific node_modules (for deps that aren't hoisted)
COPY --from=api-builder /app/apps/api/node_modules ./apps/api/node_modules
# Copy the shared package dist to the right location
COPY --from=shared-builder /app/packages/shared/dist ./node_modules/@frostapp/shared
# Create data directory for SQLite and ensure non-root ownership
RUN mkdir -p /app/data && chown -R node:node /app
USER node
ENV DATA_DIR=/app/data
# Set NODE_PATH to include both node_modules locations
ENV NODE_PATH=/app/node_modules:/app/apps/api/node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]

# Stage 5: Production Frontend (Nginx)
FROM nginx:alpine AS frontend
COPY --from=frontend-builder /app/apps/frontend/dist/frostapp/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN chown -R nginx:nginx /usr/share/nginx/html /etc/nginx/conf.d /var/cache/nginx /var/log/nginx /run
USER nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Default target: API
FROM api
