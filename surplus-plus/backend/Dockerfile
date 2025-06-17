# surplus-plus/backend/Dockerfile

FROM node:18
WORKDIR /usr/src/app
COPY . .
RUN npm install
EXPOSE 5002
CMD ["npm", "run", "dev"]