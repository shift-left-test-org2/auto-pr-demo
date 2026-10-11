FROM node:20-slim

WORKDIR /app

# Dependencies are installed on the host (handlebars@4.0.11 pinned in
# package-lock.json) and copied in, so the build needs no registry access.
COPY package.json package-lock.json ./
COPY node_modules ./node_modules

COPY server.js ./

EXPOSE 3000
CMD ["node", "server.js"]
