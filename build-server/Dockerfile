FROM ubuntu:focal

# Update package list and install curl
RUN apt-get update \
    && apt-get install -y curl

# Install Node.js
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Upgrade existing packages
RUN apt-get upgrade -y

# Install git
RUN apt-get install -y git

# Set working directory
WORKDIR /home/app

# Copy necessary files
COPY main.sh main.sh
COPY script.js script.js
COPY package*.json .

# Install npm packages
RUN npm install

# Make scripts executable
RUN chmod +x main.sh \
    && chmod +x script.js

# Set the entrypoint
ENTRYPOINT [ "/home/app/main.sh" ]
