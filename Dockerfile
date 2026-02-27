FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Keep dependency install layer stable when app code changes.
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY server.js ./server.js

# INTENTIONAL TEST FAILURE: remove after verifying worker/manager error logging.
RUN echo "INTENTIONAL_RELAY_ERROR_TEST" && false

COPY public ./public

EXPOSE 3000

CMD ["npm", "start"]
