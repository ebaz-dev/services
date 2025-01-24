import express, { Request, Response } from "express";
import {
  listAndCount,
  QueryOptions,
  validateRequest,
  Employee,
  Supplier,
  requireAuth,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { Types } from "@ezdev/core/lib/mongoose";
import { populate } from "dotenv";
const router = express.Router();

router.get(
  "/supplier/list",
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const filter: any = req.query || {};
    const criteria: any = {};
    if (filter.name) {
      criteria.name = {
        $regex: filter.name,
        $options: "i",
      };
    }
    if (filter.customerNo) {
      criteria.customerNo = {
        $regex: filter.customerNo,
        $options: "i",
      };
    }
    if (filter.regNo) {
      criteria.regNo = {
        $regex: filter.regNo,
        $options: "i",
      };
    }
    if (filter.phone) {
      criteria.phone = {
        $regex: filter.phone,
        $options: "i",
      };
    }

    if (filter.parentId) {
      criteria.parentId = new Types.ObjectId(filter.parentId as string);
    }

    const options: QueryOptions = <QueryOptions>req.query;
    options.sortBy = "updatedAt";
    options.sortDir = -1;
    options.populates = [
      { path: "category" },
      {
        path: "refSupplier",
        populate: [{ path: "category" }],
      },
    ];
    const result = await listAndCount(criteria, Supplier, options);

    result.data = result.data.map((item: any) => {
      let supplier: any = item.toJSON();

      if (item.linked && item.refSupplier) {
        const refSupplier = item.refSupplier;
        supplier = {
          id: supplier.id,
          parentId: supplier.parentId,
          customerNo: supplier.customerNo,
          holdingKey: refSupplier.holdingKey,
          business: supplier.business,
          businessType: supplier.businessType,
          showOnHome: refSupplier.showOnHome,
          linked: supplier.linked,
          refId: supplier.refId,
          name: supplier.name,
          regNo: refSupplier.regNo,
          category: refSupplier.category,
          address: refSupplier.address,
          phone: refSupplier.phone,
          email: refSupplier.email,
          logo: refSupplier.logo,
          bankAccounts: refSupplier.bankAccounts,
          inactive: refSupplier.inactive,
          orderMin: refSupplier.orderMin,
          stockMin: refSupplier.stockMin,
          deliverDays: refSupplier.deliverDays,
          banners: refSupplier.banners,
          productQuery: refSupplier.productQuery,
          productBanner: refSupplier.productBanner,
          infoBanner: refSupplier.infoBanner,
          brands: refSupplier.brands,
          integrationKey: refSupplier.integrationKey,
          appData: refSupplier.appData,
          promoBanners: refSupplier.promoBanners,
          orderScheduleTime: refSupplier.orderScheduleTime,
          termOfService: refSupplier.termOfService,
          cooperation: refSupplier.cooperation,
          aboutCompany: refSupplier.aboutCompany,
        };
      }
      return supplier;
    });

    res.status(StatusCodes.OK).send(result);
  }
);

export { router as supplierListRouter };
