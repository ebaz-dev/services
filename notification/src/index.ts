import mongoose from "@ezdev/core/lib/mongoose";
import { app } from "./app";
import { natsWrapper } from "./nats-wrapper";
import dotenv from "dotenv";
import { SendSMSListener } from "./events/listener/send-sms-listener";
import { UserCreatedListener } from "./events/listener/user-created-listener";
import * as admin from "firebase-admin";
import { OrderCreatedListener } from "./events/listener/order-created-listener";
import { OrderConfirmedListener } from "./events/listener/order-confirmed-listener";
import { OrderCancelledListener } from "./events/listener/order-cancelled-listener";
import { OrderDeliveredListener } from "./events/listener/order-delivered-listener";
dotenv.config();

const start = async () => {
  if (!process.env.PORT) {
    throw new Error("PORT must be defined");
  }

  if (!process.env.JWT_KEY) {
    throw new Error("JWT_KEY must be defined");
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI must be defined");
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI must be defined");
  }

  if (!process.env.NATS_CLIENT_ID) {
    throw new Error("NATS_CLIENT_ID must be defined");
  }

  if (!process.env.NATS_URL) {
    throw new Error("NATS_URL must be defined");
  }

  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error("NATS_CLUSTER_ID must be defined");
  }

  if (!process.env.NATS_USER) {
    throw new Error("NATS_USER must be defined");
  }

  if (!process.env.NATS_PASS) {
    throw new Error("NATS_PASS must be defined");
  }

  const {
    FB_TYPE,
    FB_PROJECT_ID,
    FB_PRIVATE_KEY_ID,
    FB_PRIVATE_KEY,
    FB_CLIENT_EMAIL,
    FB_CLIENT_ID,
    FB_AUTH_URI,
    FB_TOKEN_URI,
    FB_AUTH_PROVIDER_X509_CERT_URL,
    FB_CLIENT_X509_CERT_URL
  } = process.env.NODE_ENV === "development" ? process.env : process.env;

  if (
    !FB_TYPE ||
    !FB_PROJECT_ID ||
    !FB_PRIVATE_KEY_ID ||
    !FB_PRIVATE_KEY ||
    !FB_CLIENT_EMAIL ||
    !FB_CLIENT_ID ||
    !FB_AUTH_URI ||
    !FB_TOKEN_URI ||
    !FB_AUTH_PROVIDER_X509_CERT_URL ||
    !FB_CLIENT_X509_CERT_URL
  ) {
    throw new Error("Get token: Firebase credentials are missing.")
  }


  await natsWrapper.connect(
    process.env.NATS_CLUSTER_ID,
    process.env.NATS_CLIENT_ID,
    process.env.NATS_URL,
    process.env.NATS_USER,
    process.env.NATS_PASS
  );

  natsWrapper.client.on("close", () => {
    console.log("NATS connection closed!");
    process.exit();
  });
  process.on("SIGINT", () => natsWrapper.client.close());
  process.on("SIGTERM", () => natsWrapper.client.close());

  new SendSMSListener(natsWrapper.client).listen();
  new UserCreatedListener(natsWrapper.client).listen();
  new OrderCreatedListener(natsWrapper.client).listen();
  new OrderConfirmedListener(natsWrapper.client).listen();
  new OrderCancelledListener(natsWrapper.client).listen();
  new OrderDeliveredListener(natsWrapper.client).listen();

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
  });

  const params = {
    type: FB_TYPE,
    projectId: FB_PROJECT_ID,
    privateKeyId: FB_PRIVATE_KEY_ID,
    privateKey: FB_PRIVATE_KEY,
    clientEmail: FB_CLIENT_EMAIL,
    clientId: FB_CLIENT_ID,
    authUri: FB_AUTH_URI,
    tokenUri: FB_TOKEN_URI,
    authProviderX509CertUrl: FB_AUTH_PROVIDER_X509_CERT_URL,
    clientC509CertUrl: FB_CLIENT_X509_CERT_URL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(params),
  })

};

start();

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
