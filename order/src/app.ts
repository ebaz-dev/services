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
import { cartGetRouter } from "./routes/cart-get";
import { cartListRouter } from "./routes/cart-list";
import { cartProductAddRouter } from "./routes/cart-product-add";
import { cartConfirmRouter } from "./routes/cart-confirm";
import { cartProductRemoveRouter } from "./routes/cart-product-remove";
import { orderGetRouter } from "./routes/order-get";
import { orderListRouter } from "./routes/order-list";
import { cartGetSupplierRouter } from "./routes/cart-get-by-supplier";
import { orderCancelRouter } from "./routes/order-cancel";
import { orderDeliverRouter } from "./routes/order-deliver";
import { cartGetOrderRouter } from "./routes/cart-get-order";
import { orderUpdatePaymentMethodRouter } from "./routes/order-update-payment-method";
import { templateCreateRouter } from "./routes/template-create";
import { templateUpdateRouter } from "./routes/template-update";
import { templateDeleteRouter } from "./routes/template-delete";
import { templateGetRouter } from "./routes/template-get";
import { templateListRouter } from "./routes/template-list";
import { cartProductsAddRouter } from "./routes/cart-products-add";
import { healthRouter } from "./routes/health";
import { orderBoListRouter } from "./routes/backoffice/list";
import { orderBoGetRouter } from "./routes/backoffice/get";
import { merchantDebtRouter } from "./routes/check-merchant-debt";
import { orderReportRouter } from "./routes/backoffice/report";
dotenv.config();

const apiPrefix = "/api/v1/order";
const backofficePrefix = "/api/v1/order/bo";

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
process.env.NODE_ENV !== "test" && app.use(accessLogger("order"));

app.use(apiPrefix, healthRouter);
app.use(apiPrefix, cartConfirmRouter);
app.use(apiPrefix, cartGetRouter);
app.use(apiPrefix, cartGetSupplierRouter);
app.use(apiPrefix, cartListRouter);
app.use(apiPrefix, cartProductAddRouter);
app.use(apiPrefix, cartProductsAddRouter);
app.use(apiPrefix, cartProductRemoveRouter);
app.use(apiPrefix, cartGetOrderRouter);
app.use(apiPrefix, orderCancelRouter);
app.use(apiPrefix, orderDeliverRouter);
app.use(apiPrefix, orderGetRouter);
app.use(apiPrefix, orderListRouter);
app.use(apiPrefix, orderUpdatePaymentMethodRouter);
app.use(apiPrefix, templateCreateRouter);
app.use(apiPrefix, templateUpdateRouter);
app.use(apiPrefix, templateDeleteRouter);
app.use(apiPrefix, templateGetRouter);
app.use(apiPrefix, templateListRouter);
app.use(apiPrefix, merchantDebtRouter);

// backoffice
app.use(backofficePrefix, orderBoListRouter);
app.use(backofficePrefix, orderReportRouter);
app.use(backofficePrefix, orderBoGetRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
