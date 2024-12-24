import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import {
  accessLogger,
  currentUser,
  errorHandler,
  NotFoundError,
} from "@ezdev/core";
import cookieSession from "cookie-session";
import { healthRouter } from "./routes/health";
import * as dotenv from "dotenv";
import { sendRouter } from "./routes/send";
import { listRouter } from "./routes/list";
import { statusUpdateRouter } from "./routes/status-update";
import { deleteRouter } from "./routes/delete";
import { markAsReadRouter } from "./routes/mark-as-read";
dotenv.config();

const apiPrefix = "/api/v1/notification";

const app = express();
app.set("trust proxy", true);
app.use(json());
app.use(
  cookieSession({
    signed: true,
    secure: process.env.NODE_ENV !== "test",
    keys: [process.env.JWT_KEY!],
  })
);

app.use(currentUser);
app.use(accessLogger("notification"));
app.use(apiPrefix, healthRouter);
app.use(apiPrefix, sendRouter);
app.use(apiPrefix, listRouter);
app.use(apiPrefix, statusUpdateRouter);
app.use(apiPrefix, deleteRouter);
app.use(apiPrefix, markAsReadRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
