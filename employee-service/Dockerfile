# ---- Build Stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --production 

COPY . .

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

# Copy application source
COPY --from=build --chown=app:app /app ./

USER app

EXPOSE 3001

CMD ["npm", "start"]
