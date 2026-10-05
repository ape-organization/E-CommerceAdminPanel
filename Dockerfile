# ==================================================
# Stage 1: Build Angular application
# ==================================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# ==================================================
# Select Angular environment
# ==================================================
ARG APP_ENV=prod

RUN echo "Building Angular application with environment: ${APP_ENV}" && \
    if [ "$APP_ENV" = "dev" ]; then \
        npm run build -- --configuration development; \
    elif [ "$APP_ENV" = "preprod" ]; then \
        npm run build -- --configuration preprod; \
    elif [ "$APP_ENV" = "prod" ]; then \
        npm run build -- --configuration production; \
    else \
        echo "ERROR: Unknown APP_ENV: ${APP_ENV}" && \
        exit 1; \
    fi

# Stage 2: Serve Angular with Nginx
FROM nginx:alpine

# Remove default Nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy Angular production build
COPY --from=build /app/dist/pharmacy-ui/browser/ /usr/share/nginx/html/

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
