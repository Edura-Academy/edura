# Build stage - Debian tabanlı (Prisma uyumlu)
FROM node:20-slim AS builder

WORKDIR /app

# OpenSSL ve gerekli paketleri kur
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

# OpenSSL ve gerekli paketleri kur
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy built files
COPY --from=builder /app/dist ./dist

# Create uploads directory (Firebase Storage kullanılıyor ama fallback için)
RUN mkdir -p uploads

# Environment variables
ENV NODE_ENV=production

# Expose port (Cloud Run uses PORT env variable)
EXPOSE 5000

# Cloud Run health check endpoint: /api/health
# No HEALTHCHECK needed - Cloud Run handles this

# Start the server
CMD ["node", "dist/index.js"]
