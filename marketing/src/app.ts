import express from "express";
import "express-async-errors";
import {
  errorHandler,
  NotFoundError,
  currentUser,
  accessLogger,
} from "@ezdev/core";
import { healthRouter } from "./routes/health";
import { json } from "body-parser";
import cookieSession from "cookie-session";
import dotenv from "dotenv";

import { boPromotedItemsCreateRouter } from "./routes/backoffice/bo-promoted-items-create";
import { boPromotedItemsDeleteRouter } from "./routes/backoffice/bo-promoted-items-delete";
import { boPromotedItemsGetRouter } from "./routes/backoffice/bo-promoted-items-get";
import { boPromotedItemsListRouter } from "./routes/backoffice/bo-promoted-items-list";
import { boPromotedItemsUpdateRouter } from "./routes/backoffice/bo-promoted-items-update";

import { appPromotedItemsGetRouter } from "./routes/app-pro/app-promoted-items-get";
import { appPromotedItemsListRouter } from "./routes/app-pro/app-promoted-items-list";

dotenv.config();

const apiPrefix = "/api/v1/marketing";

const app = express();

app.set("trust proxy", true);
app.use(json());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  })
);

app.use(currentUser);
// app.use(accessLogger("marketing"));

app.use(apiPrefix, healthRouter);

// Backoffice routes
app.use(apiPrefix, boPromotedItemsCreateRouter);
app.use(apiPrefix, boPromotedItemsDeleteRouter);
app.use(apiPrefix, boPromotedItemsListRouter);
app.use(apiPrefix, boPromotedItemsGetRouter);
app.use(apiPrefix, boPromotedItemsUpdateRouter);

// Merchant app pro routes
app.use(apiPrefix, appPromotedItemsListRouter);
app.use(apiPrefix, appPromotedItemsGetRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
