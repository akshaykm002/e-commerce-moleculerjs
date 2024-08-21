# Use a Node.js base image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application files to the container
COPY . .

# Expose the port your Moleculer service uses (3000 in this case)
EXPOSE 4000

# Start the application
CMD ["npm", "run", "start"]
