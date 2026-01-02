# Build stage
FROM node:20-slim AS build

WORKDIR /src

# Set production environment
ENV NODE_ENV=production

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install --include=dev

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Nuxt application
RUN npm run build

# Runtime stage
FROM node:20-slim AS runtime

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy built application from build stage
COPY --from=build /src/.output ./.output
COPY --from=build /src/prisma ./prisma
COPY --from=build /src/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Expose the port Nuxt runs on
EXPOSE 3000

# Start the application
CMD ["node", ".output/server/index.mjs"]
