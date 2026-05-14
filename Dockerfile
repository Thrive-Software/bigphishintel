FROM node:20-alpine

WORKDIR /usr/src/app

# Copy backend package.json and package-lock.json
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy entire source code (includes client/build.tar.gz — a pre-built React
# bundle produced on the dev machine, since the target host lacks the RAM
# to run `npm run build` itself).
COPY . .

# Extract the pre-built client bundle into client/build/ and drop the tarball.
RUN tar -xzf client/build.tar.gz -C client/ && rm client/build.tar.gz

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/src/app/
RUN chmod +x /usr/src/app/docker-entrypoint.sh

# Expose port 8080
EXPOSE 8080

# Use entrypoint script to initialize root admin and start app
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]