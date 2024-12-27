import express from "express";
import "express-async-errors";
import { errorHandler, NotFoundError } from "@ezdev/core";
import { healthRouter } from "./routes/health";
import { json } from "body-parser";
import cookieSession from "cookie-session";
import dotenv from "dotenv";

import { basInboundLoginRouter } from "./routes/bas-inbound-login";
import { basInboundorderStatusUpdateRouter } from "./routes/bas-inbound-order-status";
import { basProfileRouter } from "./routes/bas-pofile";
import { basDashboardRouter } from "./routes/bas-dashboard";

import { agMerchantShatlalRouter } from "./routes/anungoo/ag-merchant-shatlal";
import { agProductsRouter } from "./routes/anungoo/ag-products";
import { agPromosRouter } from "./routes/anungoo/ag-promos";
import { agMerchantDebtRouter } from "./routes/anungoo/ag-check-merchant-debt";

import { colaMerchantDebtRouter } from "./routes/coca-cola/cola-check-merchant-debt";
import { colaDashboardRouter } from "./routes/coca-cola/cola-dashboard-data";
import { colaProductsRouter } from "./routes/coca-cola/cola-products";
import { colaPromosRouter } from "./routes/coca-cola/cola-promos";
import { colaPaymentRouter } from "./routes/coca-cola/get-payment";
import { colaOrderSendRouter } from "./routes/coca-cola/order-send";
import { colaProfileRouter } from "./routes/coca-cola/profile-data";

import { mgMerchantShatlalRouter } from "./routes/market-gate/mg-merchant-shatlal";
import { mgProductsRouter } from "./routes/market-gate/mg-products";
import { mgMerchantDebtRouter } from "./routes/market-gate/mg-check-merchant-debt";

import { totalProductsRouter } from "./routes/total-integration/total-products";
import { totalPromosRouter } from "./routes/total-integration/total-promos";
import { totalMerchantDebtRouter } from "./routes/total-integration/total-check-merchant-debt";
import { totalProfileRouter } from "./routes/total-integration/profile-data";
import { totalDashboardRouter } from "./routes/total-integration/dashboard-data";

dotenv.config();

const apiPrefix = "/api/v1/integration";

const app = express();
app.set("trust proxy", true);
app.use(json());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  })
);

app.use(apiPrefix, healthRouter);

app.use(apiPrefix, basInboundLoginRouter);
app.use(apiPrefix, basInboundorderStatusUpdateRouter);
app.use(apiPrefix, basProfileRouter);
app.use(apiPrefix, basDashboardRouter);

app.use(apiPrefix, agProductsRouter);
app.use(apiPrefix, agPromosRouter);
app.use(apiPrefix, agMerchantShatlalRouter);
app.use(apiPrefix, agMerchantDebtRouter);

app.use(apiPrefix, colaMerchantDebtRouter);
app.use(apiPrefix, colaDashboardRouter);
app.use(apiPrefix, colaProductsRouter);
app.use(apiPrefix, colaPromosRouter);
app.use(apiPrefix, colaPaymentRouter);
app.use(apiPrefix, colaOrderSendRouter);
app.use(apiPrefix, colaProfileRouter);

app.use(apiPrefix, mgMerchantShatlalRouter);
app.use(apiPrefix, mgProductsRouter);
app.use(apiPrefix, mgMerchantDebtRouter);

app.use(apiPrefix, totalProductsRouter);
app.use(apiPrefix, totalPromosRouter);
app.use(apiPrefix, totalMerchantDebtRouter);
app.use(apiPrefix, totalProfileRouter);
app.use(apiPrefix, totalDashboardRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
