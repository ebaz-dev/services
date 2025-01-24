import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import { createRouter } from "./routes/create";
import { updateRouter } from "./routes/update";
import {
  accessLogger,
  currentUser,
  errorHandler,
  NotFoundError,
} from "@ezdev/core";
import cookieSession from "cookie-session";
import * as dotenv from "dotenv";
import { getRouter } from "./routes/get";
import { listRouter } from "./routes/list";
import { branchesRouter } from "./routes/branches";
import { categoryCreateRouter } from "./routes/category-create";
import { categoryListRouter } from "./routes/category-list";
import { categoryGetRouter } from "./routes/category-get";
import { healthRouter } from "./routes/health";
import cors from "cors";
import { supplierCodeSaveRouter } from "./routes/supplier-code-save";
import { locCreateRouter } from "./routes/location-create";
import { locationListRouter } from "./routes/location-list";
import { merchantCreateRouter } from "./routes/merchant-create";
import { merchantConfirmByHolding } from "./routes/merchant-confirm-by-holding";
import { customerHoldingCreateRouter } from "./routes/create-bulk-customer-holding";
import { holdingLoginRouter } from "./routes/holding-login";
import { holdingSigninRouter } from "./routes/merchant-holding-signin";
import { holdingListRouter } from "./routes/holding-list";
import { boMerchantCreateRouter } from "./routes/backoffice/merchant/create";
import { boMerchantGetRouter } from "./routes/backoffice/merchant/get";
import { boMerchantListRouter } from "./routes/backoffice/merchant/list";
import { boMerchantUpdateRouter } from "./routes/backoffice/merchant/update";
import { boSupplierCreateRouter } from "./routes/backoffice/supplier/create";
import { boSupplierListRouter } from "./routes/backoffice/supplier/list";
import { boSupplierGetRouter } from "./routes/backoffice/supplier/get";
import { boSupplierUpdateRouter } from "./routes/backoffice/supplier/update";
import { boCategoryListRouter } from "./routes/backoffice/category/category-list";
import { boLocationListRouter } from "./routes/backoffice/location/location-list";
import { employeeAssignRouter } from "./routes/employee/assign";
import { employeeListRouter } from "./routes/employee/list";
import { employeeGetRouter } from "./routes/employee/get";
import { employeeMigrateRouter } from "./routes/employee/migrate";
import { holdingSigninDataRouter } from "./routes/merchant-holding-data";
import { holdingVerifyRouter } from "./routes/holding-verify";
import { supplierListRouter } from "./routes/supplier/list";
import { merchantEmployeeAssignRouter } from "./routes/merchant-employee-assign";

dotenv.config();

const apiPrefix = "/api/v1/customer";
const backofficePrefix = "/api/v1/customer/bo";

const app = express();
app.set("trust proxy", true);
app.use(json());
app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true, // Allow credentials (cookies, etc.)
  })
);
app.use(
  cookieSession({
    signed: true,
    secure: process.env.NODE_ENV !== "test",
    keys: [process.env.JWT_KEY!],
  })
);

app.use(currentUser);
process.env.NODE_ENV !== "test" && app.use(accessLogger("customer"));

app.use(apiPrefix, createRouter);
app.use(apiPrefix, updateRouter);
app.use(apiPrefix, getRouter);
app.use(apiPrefix, listRouter);
app.use(apiPrefix, branchesRouter);
app.use(apiPrefix, categoryCreateRouter);
app.use(apiPrefix, categoryListRouter);
app.use(apiPrefix, categoryGetRouter);
app.use(apiPrefix, supplierCodeSaveRouter);
app.use(apiPrefix, locCreateRouter);
app.use(apiPrefix, locationListRouter);
app.use(apiPrefix, healthRouter);
app.use(apiPrefix, merchantCreateRouter);
app.use(apiPrefix, merchantConfirmByHolding);
app.use(apiPrefix, customerHoldingCreateRouter);
app.use(apiPrefix, holdingLoginRouter);
app.use(apiPrefix, holdingSigninRouter);
app.use(apiPrefix, holdingSigninDataRouter);
app.use(apiPrefix, holdingListRouter);
app.use(apiPrefix, employeeAssignRouter);
app.use(apiPrefix, employeeListRouter);
app.use(apiPrefix, employeeMigrateRouter);
app.use(apiPrefix, employeeGetRouter);
app.use(apiPrefix, holdingVerifyRouter);
app.use(apiPrefix, supplierListRouter);
app.use(apiPrefix, merchantEmployeeAssignRouter);

//backoffice
app.use(backofficePrefix, boMerchantCreateRouter);
app.use(backofficePrefix, boMerchantListRouter);
app.use(backofficePrefix, boMerchantUpdateRouter);
app.use(backofficePrefix, boSupplierCreateRouter);
app.use(backofficePrefix, boSupplierListRouter);
app.use(backofficePrefix, boSupplierUpdateRouter);
app.use(backofficePrefix, boCategoryListRouter);
app.use(backofficePrefix, boLocationListRouter);
app.use(backofficePrefix, boMerchantGetRouter);
app.use(backofficePrefix, boSupplierGetRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
