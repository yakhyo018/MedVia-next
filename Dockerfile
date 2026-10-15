# The web app: `next build` with the API's public URLs (Next inlines them at build time),
# then `next start` on :4000 behind nginx. Built by ../MedVia/deploy/docker-compose.prod.yml.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
ARG REACT_APP_API_URL
ARG REACT_APP_API_GRAPHQL_URL
ARG REACT_APP_API_WS
ENV REACT_APP_API_URL=$REACT_APP_API_URL \
	REACT_APP_API_GRAPHQL_URL=$REACT_APP_API_GRAPHQL_URL \
	REACT_APP_API_WS=$REACT_APP_API_WS \
	NEXT_TELEMETRY_DISABLED=1
RUN yarn i18n:check && yarn build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY next.config.js next-i18next.config.js ./
USER node
EXPOSE 4000
CMD ["yarn", "start"]
