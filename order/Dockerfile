FROM node:lts

WORKDIR /app

# Copy core first
COPY core/ ./core/
WORKDIR /app/core
RUN npm install && npm run build && npm link

# Then service
WORKDIR /app/order
COPY order/ ./
RUN npm install && npm link @ezdev/core

CMD [ "npm", "start" ]