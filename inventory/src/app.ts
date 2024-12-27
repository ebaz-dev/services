import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import { errorHandler, NotFoundError } from "@ezdev/core";
import cookieSession from "cookie-session";
import { listRouter } from "./routes/list";
import { getRouter } from "./routes/get";
import dotenv from "dotenv";
import { healthRouter } from "./routes/health";
import { cartCheckRouter } from "./routes/cart-check";

dotenv.config();

const apiPrefix = "/api/v1/inventory";

const app = express();
app.set("trust proxy", true);
app.use(json());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
    keys: [process.env.JWT_KEY!],
  })
);

app.use(apiPrefix, cartCheckRouter);
app.use(apiPrefix, healthRouter);
app.use(apiPrefix, listRouter);
app.use(apiPrefix, getRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
