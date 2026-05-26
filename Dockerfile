FROM node:20-alpine

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create directories
RUN mkdir -p uploads logs

EXPOSE 3000

# Migrate and start
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
