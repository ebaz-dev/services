import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import {
  currentUser,
  NotFoundError,
  errorHandler,
  accessLogger,
} from "@ezdev/core";
import cookieSession from "cookie-session";
import dotenv from "dotenv";
import { healthRouter } from "./routes/health";

import { productCreateRouter } from "./routes/product-create";
import { productBulkCreateRouter } from "./routes/product-bulk-create";
import { productGetRouter } from "./routes/product-get";
import { productListRouter } from "./routes/product-list";
import { productUpdateRouter } from "./routes/product-update";
import { productBulkUpdateRouter } from "./routes/product-bulk-update";
import { productListBymerchantIdRouter } from "./routes/merchant-product-list";
import { dashboardProductListRouter } from "./routes/dashboard-product-list";

import { priceCreateRouter } from "./routes/price-create";
import { priceRouter } from "./routes/price-get";
import { pricesRouter } from "./routes/price-list";
import { priceUpdateRouter } from "./routes/price-update";

import { attributeCreateRouter } from "./routes/attribute-create";
import { attributesRouter } from "./routes/attribute-list";

import { brandCreateRouter } from "./routes/brand-create";
import { brandsRouter } from "./routes/brand-list";

import { createCategoryRouter } from "./routes/category-create";
import { categoriesRouter } from "./routes/category-list";

import { promoCreateRouter } from "./routes/promo-type-create";
import { promoGetRouter } from "./routes/promo-get";
import { promoListRouter } from "./routes/promo-list";
import { promoTypesRouter } from "./routes/promo-types";

//Backoffice brand routers
import { boBrandCreateRouter } from "./routes/backoffice/bo-brand-create";
import { boBrandGetByIdRouter } from "./routes/backoffice/bo-brand-get";
import { boBrandsRouter } from "./routes/backoffice/bo-brand-list";
import { boBrandUpdateRouter } from "./routes/backoffice/bo-brand-update";
import { boBrandDeleteRouter } from "./routes/backoffice/bo-brand-delete";

//Backoffice category routers
import { boCategoryCreateRouter } from "./routes/backoffice/bo-category-create";
import { boCategoryGetByIdRouter } from "./routes/backoffice/bo-category-get";
import { boCategoriesRouter } from "./routes/backoffice/bo-category-list";
import { boCategoryUpdateRouter } from "./routes/backoffice/bo-category-update";

//Backoffice product attribute routers
import { boProductAttributeGetByIdRouter } from "./routes/backoffice/bo-product-attribute-get";
import { boProductAttributesRouter } from "./routes/backoffice/bo-product-attribute-list";
import { boProductAttributeUpdateRouter } from "./routes/backoffice/bo-product-attribute-update";

//Backoffice product routers
import { boProductBulkCreateRouter } from "./routes/backoffice/bo-product-bulk-create";
import { boProductBulkUpdateRouter } from "./routes/backoffice/bo-product-bulk-update";
import { boProductCreateRouter } from "./routes/backoffice/bo-product-create";
import { boProductGetRouter } from "./routes/backoffice/bo-product-get";
import { boProductListRouter } from "./routes/backoffice/bo-product-list";
import { boProductUpdateRouter } from "./routes/backoffice/bo-product-update";

//Backoffice promo routers
import { boPromoGetByIdRouter } from "./routes/backoffice/bo-promo-get";
import { boPromosRouter } from "./routes/backoffice/bo-promo-list";
import { boPromoUpdateRouter } from "./routes/backoffice/bo-promo-update";

//Backoffice vendor routers
import { boVendorCreateRouter } from "./routes/backoffice/bo-vendor-create";
import { boVendorGetByIdRouter } from "./routes/backoffice/bo-vendor-get";
import { boVendorsRouter } from "./routes/backoffice/bo-vendor-list";
import { boVendorUpdateRouter } from "./routes/backoffice/bo-vendor-update";

dotenv.config();

const apiPrefix = "/api/v1/product";
const boApiPrefix = "/api/v1/product/bo";

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
app.use(accessLogger("product"));

app.use(apiPrefix, healthRouter);

// Backoffice brand routers
app.use(boApiPrefix, boBrandsRouter);
app.use(boApiPrefix, boBrandGetByIdRouter);
app.use(boApiPrefix, boBrandCreateRouter);
app.use(boApiPrefix, boBrandUpdateRouter);
app.use(boApiPrefix, boBrandDeleteRouter);

// Backoffice category routers
app.use(boApiPrefix, boCategoriesRouter);
app.use(boApiPrefix, boCategoryGetByIdRouter);
app.use(boApiPrefix, boCategoryCreateRouter);
app.use(boApiPrefix, boCategoryUpdateRouter);

// Backoffice product attribute routers
app.use(boApiPrefix, boProductAttributesRouter);
app.use(boApiPrefix, boProductAttributeGetByIdRouter);
app.use(boApiPrefix, boProductAttributeUpdateRouter);

// Backoffice product routers
app.use(boApiPrefix, boProductBulkCreateRouter);
app.use(boApiPrefix, boProductBulkUpdateRouter);
app.use(boApiPrefix, boProductListRouter);
app.use(boApiPrefix, boProductGetRouter);
app.use(boApiPrefix, boProductCreateRouter);
app.use(boApiPrefix, boProductUpdateRouter);

// Backoffice promo routers
app.use(boApiPrefix, boPromosRouter);
app.use(boApiPrefix, boPromoGetByIdRouter);
app.use(boApiPrefix, boPromoUpdateRouter);

// Backoffice vendor routers
app.use(boApiPrefix, boVendorsRouter);
app.use(boApiPrefix, boVendorGetByIdRouter);
app.use(boApiPrefix, boVendorCreateRouter);
app.use(boApiPrefix, boVendorUpdateRouter);

// Price routes
app.use(apiPrefix, pricesRouter);
app.use(apiPrefix, priceRouter);
app.use(apiPrefix, priceCreateRouter);
app.use(apiPrefix, priceUpdateRouter);

// Attribute routes
app.use(apiPrefix, attributeCreateRouter);
app.use(apiPrefix, attributesRouter);

// Brand routes
app.use(apiPrefix, brandCreateRouter);
app.use(apiPrefix, brandsRouter);

// Category routes
app.use(apiPrefix, createCategoryRouter);
app.use(apiPrefix, categoriesRouter);

// Promo routes
app.use(apiPrefix, promoCreateRouter);
app.use(apiPrefix, promoListRouter);
app.use(apiPrefix, promoGetRouter);
app.use(apiPrefix, promoTypesRouter);

// Product routes
app.use(apiPrefix, productListBymerchantIdRouter);
app.use(apiPrefix, productBulkCreateRouter);
app.use(apiPrefix, productCreateRouter);
app.use(apiPrefix, productListRouter);
app.use(apiPrefix, productGetRouter);
app.use(apiPrefix, productBulkUpdateRouter);
app.use(apiPrefix, productUpdateRouter);
app.use(apiPrefix, dashboardProductListRouter);

app.all("*", async () => {
  console.log("router not found");
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
