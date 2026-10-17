FROM node:24-alpine
WORKDIR /app
# Deliberately copy only public configuration and service code; never the private key or local state.
COPY --chown=node:node package.json ./package.json
COPY --chown=node:node desktop/itchDlc.js ./desktop/itchDlc.js
COPY --chown=node:node services/itch-redeem/core.mjs services/itch-redeem/server.mjs ./services/itch-redeem/
ENV HOST=0.0.0.0 PORT=8787 DLC_DB_PATH=/data/purchases.sqlite
RUN mkdir -m 0700 /data && chown node:node /data
USER node
EXPOSE 8787
CMD ["node", "services/itch-redeem/server.mjs"]
