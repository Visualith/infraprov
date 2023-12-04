# Use the specified Node version
FROM node:lts-alpine

# Set the working directory in Docker
WORKDIR /app

# Copy only the package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of your application's code
COPY . /app

# Build the project
RUN npm run build

# Expose the port your app runs on
EXPOSE 8085

# Command to run the application
CMD ["npm", "start"]
