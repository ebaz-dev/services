FROM node:lts

WORKDIR /app

# Copy core first
COPY core/ ./core/
WORKDIR /app/core
RUN npm install && npm run build && npm link

# Then service
WORKDIR /app/cola-integration
COPY cola-integration/ ./
RUN npm install && npm link @ezdev/core

CMD [ "npm", "start" ]