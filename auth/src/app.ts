import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import { currentUserRouter } from "./routes/current-user";
import { signInRouter } from "./routes/signIn";
import { signUpRouter } from "./routes/signUp";
import { signOutRouter } from "./routes/signOut";
import { confirmUser } from "./routes/confirm-user";
import { healthRouter } from "./routes/health";
import {
  accessLogger,
  currentUser,
  errorHandler,
  NotFoundError,
} from "@ezdev/core";
import cookieSession from "cookie-session";
import * as dotenv from "dotenv";
import { requestResetRouter } from "./routes/request-reset";
import { resetPasswordRouter } from "./routes/reset-password";
import { verifyResetCodeRouter } from "./routes/verify-reset-code";
dotenv.config();

const apiPrefix = "/api/v1/users";

const app = express();
app.set("trust proxy", true);
app.use(json());

const cookieOptions = {
  signed: true,
  secure: process.env.NODE_ENV !== "test",
  keys: [process.env.JWT_KEY!],
};
app.use(cookieSession(cookieOptions));

app.use(currentUser);
process.env.NODE_ENV !== "test" && app.use(accessLogger("auth"));

app.use(apiPrefix, currentUserRouter);
app.use(apiPrefix, signInRouter);
app.use(apiPrefix, signUpRouter);
app.use(apiPrefix, signOutRouter);
app.use(apiPrefix, confirmUser);
app.use(apiPrefix, healthRouter);
app.use(apiPrefix, requestResetRouter);
app.use(apiPrefix, resetPasswordRouter);
app.use(apiPrefix, verifyResetCodeRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
