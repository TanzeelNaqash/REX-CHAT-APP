# Stage 1: Build the frontend
FROM node:20 AS builder

WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Use Nginx to serve the static files
FROM nginx:alpine

# Remove default Nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built static files to Nginx public folder
COPY --from=builder /app/dist /usr/share/nginx/html/

# Optional: Copy a custom Nginx config if you have one
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]

