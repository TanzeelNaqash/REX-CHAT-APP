FROM node:20 AS builder 
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
CMD ["npm","run","start"] 

#STAGE 2
FROM node:20
WORKDIR /app
COPY --from=builder /app /app

EXPOSE 8747
CMD ["npm","run","dev"]

