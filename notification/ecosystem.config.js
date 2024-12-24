const { PORTS, ENVS } = require('@ebazdev/core');

module.exports = {
  apps: [
    {
      name: "notification",
      script: "./build/index.js",
      instances: 1,
      exec_mode: "cluster",
      env_development: {
        NODE_ENV: "development",
        PORT: PORTS.DEV.Notification,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID ? `auth-service-${process.env.PM2_INSTANCE_ID}` : 'notification-service',
        ...ENVS.DEV
      },
      env_stag: {
        NODE_ENV: "stag",
        PORT: PORTS.STAG.Notification,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID ? `auth-service-${process.env.PM2_INSTANCE_ID}` : 'notification-service',
        ...ENVS.STAG
      },
      env_production: {
        NODE_ENV: "production",
        PORT: PORTS.DEV.Notification,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID ? `auth-service-${process.env.PM2_INSTANCE_ID}` : 'notification-service',
        ...ENVS.PROD
      },
    },
  ],
};
