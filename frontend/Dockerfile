# Use Node.js 18 base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if exists) to install dependencies
COPY package*.json ./
RUN npm install

# Copy the entire frontend code
COPY . .

# Expose port 3000 (default for npm start in React)
EXPOSE 3000

# Run the frontend application
CMD ["npm", "start"]
