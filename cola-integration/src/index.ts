import mongoose from "@ezdev/core/lib/mongoose";
import { app } from "./app";
import { natsWrapper } from "./nats-wrapper";
import { OrderConfirmedListener } from "./events/listener/order-confirmed-listener";
import { OrderCreatedListener } from "./events/listener/order-created-listener";
import { OrderPaymentMethodUpdatedListener } from "./events/listener/order-payment-method-updated-listener";
import cron from "node-cron";
import axios from "axios";

const apiPrefix = "/api/v1/integration/cola";

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

  if (!process.env.COLA_OUTBOUND_USERNAME) {
    throw new Error("COLA_OUTBOUND_USERNAME must be defined");
  }

  if (!process.env.COLA_OUTBOUND_PASSWORD) {
    throw new Error("COLA_OUTBOUND_PASSWORD must be defined");
  }

  if (!process.env.COLA_BASE_URI) {
    throw new Error("COLA_BASE_API must be defined");
  }

  if (!process.env.COLA_INBOUND_USERNAME) {
    throw new Error("COLA_INBOUND_USERNAME must be defined");
  }

  if (!process.env.COLA_INBOUND_PASSWORD) {
    throw new Error("COLA_INBOUND_PASSWORD must be defined");
  }

  if (!process.env.COLA_INBOUND_ACCESS_TOKEN_SECRET) {
    throw new Error("COLA_INBOUND_ACCESS_TOKEN_SECRET must be defined");
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

    new OrderConfirmedListener(natsWrapper.client).listen();
    new OrderCreatedListener(natsWrapper.client).listen();
    new OrderPaymentMethodUpdatedListener(natsWrapper.client).listen();

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    cron.schedule(
      "0 */6 * * *",
      async () => {
        try {
          console.log("**************************************");
          console.log("Running cron job for cola product-list.");
          await axios.get(
            `http://localhost:3000/api/v1/integration/cola/product-list`
          );
          console.log("Cola product-list job executed successfully.");
        } catch (error) {
          console.error(
            "Error during scheduled job execution of cola product-list:",
            error
          );
        }
      },
      {
        timezone: "Asia/Ulaanbaatar",
      }
    );

    cron.schedule(
      "0 */2 * * *",
      async () => {
        try {
          console.log("**************************************");
          console.log("Running cron job for cola promo list.");
          await axios.get(
            `http://localhost:3000/api/v1/integration/cola/promo-list`
          );
          console.log("Promo list job executed successfully.");
        } catch (error) {
          console.error(
            "Error during scheduled job execution of promo list:",
            error
          );
        }
      },
      {
        timezone: "Asia/Ulaanbaatar",
      }
    );

    cron.schedule(
      "0 */6 * * *",
      async () => {
        try {
          console.log("**************************************");
          console.log("Running cron job for anungoo product-list.");
          await axios.get(
            `http://localhost:3000/api/v1/integration/anungoo/product-list`
          );
          console.log("Anungoo product-list job executed successfully.");
        } catch (error) {
          console.error(
            "Error during scheduled job execution of anungoo product-list:",
            error
          );
        }
      },
      {
        timezone: "Asia/Ulaanbaatar",
      }
    );

    cron.schedule(
      "0 */6 * * *",
      async () => {
        try {
          console.log("**************************************");
          console.log("Running cron job for marketgate product-list.");
          await axios.get(
            `http://localhost:3000/api/v1/integration/marketgate/product-list`
          );
          console.log("MarketGate product-list job executed successfully.");
        } catch (error) {
          console.error(
            "Error during scheduled job execution of marketgate product-list:",
            error
          );
        }
      },
      {
        timezone: "Asia/Ulaanbaatar",
      }
    );

    cron.schedule(
      "0 */2 * * *",
      async () => {
        try {
          console.log("**************************************");
          console.log("Running cron job for anungoo & marketgate promo-list.");

          let page = 0;
          let hasMorePages = true;

          while (hasMorePages) {
            try {
              const response = await axios.get(
                `http://localhost:3000/api/v1/integration/anungoo/promo-list`,
                { params: { page } }
              );
              if (response.data.status === "success") {
                page++;
                console.log(
                  "Anungoo & marketgate promo list running at page:",
                  page
                );
              } else if (response.data.status === "finished") {
                console.log(
                  "Finished processing anungoo & marketgate promo-list."
                );
                break;
              } else if (response.data.status === "failure") {
                console.error(
                  "Failed to process anungoo & marketgate promo-list."
                );
                break;
              }
            } catch (error) {
              console.error(
                `Error during scheduled job execution of anungoo & marketgate promo-list on page ${page}:`,
                error
              );
              break;
            }
          }

          console.log("Promo list job executed successfully.");
        } catch (error) {
          console.error(
            "Error during scheduled job execution of promo-list:",
            error
          );
        }
      },
      {
        timezone: "Asia/Ulaanbaatar",
      }
    );
  } catch (err) {
    console.error(err);
  }

  app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}!!!!!!!!!!`);
  });
};

start();
