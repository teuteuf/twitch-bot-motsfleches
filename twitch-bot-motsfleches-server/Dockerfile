FROM node:14-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY server.js .

RUN mkdir data

EXPOSE 4000

CMD [ "node", "server.js" ]
