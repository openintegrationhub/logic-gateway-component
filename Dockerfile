FROM node:12-alpine
LABEL NAME="logic-gateway-component"
LABEL MAINTAINER Basaas GmbH "info@basaas.com"
LABEL SUMMARY="Logic Gateway component for OIH"

RUN apk --no-cache add \
    python \
    make \
    g++ \
    libc6-compat

WORKDIR /usr/src/app

COPY package.json /usr/src/app

RUN npm install --production

COPY . /usr/src/app

RUN chown -R node:node .

USER node

ENTRYPOINT ["npm", "start"]