FROM node:24-alpine
WORKDIR /app
COPY apps/web/package*.json ./
RUN npm ci
COPY apps/web/ .
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
