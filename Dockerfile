# Xerophis — production image (spec 72)
FROM node:22-alpine AS build
WORKDIR /srv
COPY app/package.json ./app/
RUN cd app && npm install --omit=dev --no-audit --no-fund

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /srv
COPY --from=build /srv/app/node_modules ./app/node_modules
COPY app ./app
RUN mkdir -p /srv/app/data && addgroup -S xero && adduser -S xero -G xero && chown -R xero:xero /srv/app
USER xero
EXPOSE 8080
CMD ["node", "app/server/index.js"]
