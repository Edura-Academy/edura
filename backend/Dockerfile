# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

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
FROM node:20-alpine AS runner

WORKDIR /app

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
ENV PORT=5000

# Expose port (Cloud Run uses PORT env variable)
EXPOSE 5000

# Cloud Run health check endpoint: /api/health
# No HEALTHCHECK needed - Cloud Run handles this

# Start the server
CMD ["node", "dist/index.js"]
