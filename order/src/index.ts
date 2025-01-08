import mongoose from "@ezdev/core/lib/mongoose";
import { app } from "./app";
import { natsWrapper } from "./nats-wrapper";
import { CartInventoryCheckedListener } from "./events/listener/inventory-checked-listener";
import { InvoicePaidListener } from "./events/listener/invoice-paid-listener";
import { ColaOrderStatusReceivedListener } from "./events/listener/cola-order-status";
import { Customer, CustomerCategory, Location, User } from "@ezdev/core";

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

  try {
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

    new CartInventoryCheckedListener(natsWrapper.client).listen();
    new InvoicePaidListener(natsWrapper.client).listen();
    new ColaOrderStatusReceivedListener(natsWrapper.client).listen();

    await mongoose.connect(process.env.MONGO_URI);
    mongoose.model("User", User.schema);
    mongoose.model("Customer", Customer.schema);
    mongoose.model("CustomerCategory", CustomerCategory.schema);
    mongoose.model("Location", Location.schema);
    console.log("Connected to DB");
  } catch (err) {
    console.error(err);
  }

  app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}!!!!!!!!!!`);
  });
};

start();
