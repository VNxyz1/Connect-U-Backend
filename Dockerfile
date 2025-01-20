FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

# Add the setup script
COPY setup.sh /usr/local/bin/setup.sh
RUN chmod +x /usr/local/bin/setup.sh

RUN npm run build

EXPOSE 3000

CMD [ "/usr/local/bin/setup.sh", "node", "dist/main.js" ]
