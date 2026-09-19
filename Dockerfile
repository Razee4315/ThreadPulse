FROM node:22-alpine

# a tiny, dependency-free image: the whole app is one file
WORKDIR /app
COPY threadpulse.mjs .

# public hosts must accept connections on all interfaces
ENV HOST=0.0.0.0 PORT=8787
EXPOSE 8787

USER node
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://127.0.0.1:8787/health || exit 1

CMD ["node", "threadpulse.mjs"]
