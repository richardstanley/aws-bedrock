#!/bin/bash

# Install dependencies
npm install

# Build TypeScript
npm run build

# Create deployment package
cd dist
zip -r ../function.zip .
cd ..

# Clean up
rm -rf node_modules
rm -rf dist 