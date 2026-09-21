FROM node:22-alpine

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies (this will install for all workspaces)
RUN npm install

# Build shared types
RUN npm run build --workspace=packages/shared

# Build the backend server
RUN npm run build --workspace=packages/server

# Expose port (Koyeb automatically assigns a port or defaults to what we expose)
EXPOSE 3001

# Start the Node.js server
CMD ["npm", "run", "start", "--workspace=packages/server"]
