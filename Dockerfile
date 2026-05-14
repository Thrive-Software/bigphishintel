FROM node:20-alpine

WORKDIR /usr/src/app

# Copy backend package.json and package-lock.json
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy entire source code (includes the pre-built client/build produced on the dev machine)
COPY . .

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/src/app/
RUN chmod +x /usr/src/app/docker-entrypoint.sh

# Expose port 8080
EXPOSE 8080

# Use entrypoint script to initialize root admin and start app
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]