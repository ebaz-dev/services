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
import * as dotenv from "dotenv";
import { orderReportRouter } from "./routes/backoffice/report";
import { healthRouter } from "./routes/health";
dotenv.config();

const apiPrefix = "/api/v1/report";
const backofficePrefix = "/api/v1/report/bo";

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
process.env.NODE_ENV !== "test" && app.use(accessLogger("report"));

app.use(apiPrefix, healthRouter);
// backoffice
app.use(backofficePrefix, orderReportRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
