FROM node:16-alpine AS base
LABEL NAME="logic-gateway-component"
LABEL MAINTAINER Basaas GmbH "info@basaas.com"
LABEL SUMMARY="Logic Gateway component for OIH"

WORKDIR /usr/src/app

COPY package.json /usr/src/app
COPY package-lock.json /usr/src/app

FROM base AS dependencies

RUN apk --no-cache add \
    make \
    g++ \
    libc6-compat

RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python

RUN npm ci
RUN npm prune --production

FROM base AS release

# copy folders to keep node_modules
COPY --from=dependencies /usr/src/app/node_modules /usr/src/app/node_modules

# copy src
COPY . /usr/src/app

RUN rm package-lock.json

RUN chown -R node:node .

USER node

ENTRYPOINT ["npm", "start"]