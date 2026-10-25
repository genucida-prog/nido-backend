FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY dist ./dist
COPY src ./src
COPY .env.local .env.local

# Expose port
EXPOSE 3001

# Start
CMD ["node", "dist/index.js"]