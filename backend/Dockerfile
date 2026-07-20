# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (includes devDependencies for tools like tsx/typescript)
RUN npm install

# Copy all source files
COPY . .

# Expose the API port
EXPOSE 5000

# Start the server using the existing script
CMD ["npm", "run", "server"]
