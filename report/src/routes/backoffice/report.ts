import express, { Request, Response } from "express";
import { QueryOptions, requireAuth, validateRequest, Order } from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import * as xl from "excel4node";
import { convertToUserTimezone } from "../../utils/date-time-format";

const router = express.Router();

router.get(
  "/order",
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const options: QueryOptions = <QueryOptions>req.query;
    if (!options.sortBy) {
      options.sortBy = "updatedAt";
    }
    if (!options.sortDir) {
      options.sortDir = -1;
    }
    const filter: any = req.query.filter || {};
    const criteria: any = {};

    if (filter.supplierId) {
      criteria.supplierId = new Types.ObjectId(filter.supplierId as string);
    }
    if (filter.merchantId) {
      criteria.merchantId = new Types.ObjectId(filter.merchantId as string);
    }
    if (filter.userId) {
      criteria.userId = new Types.ObjectId(filter.userId as string);
    }
    if (filter.status) {
      criteria.status = filter.status;
    }

    if (filter.orderNo) {
      criteria.orderNo = {
        $regex: filter.orderNo,
        $options: "i",
      };
    }
    if (filter.paymentMethod) {
      criteria.paymentMethod = filter.paymentMethod;
    }
    if (filter.startDate) {
      criteria.orderedAt = { $gte: new Date(filter.startDate) };
    }
    if (filter.endDate) {
      if (filter.startDate) {
        criteria.orderedAt = {
          $gte: new Date(filter.startDate),
          $lte: new Date(filter.endDate),
        };
      } else {
        criteria.orderedAt = { $lte: new Date(filter.endDate) };
      }
    }
    const aggregation: any = [
      { $match: criteria },
      {
        $lookup: {
          from: "customers",
          localField: "supplierId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                id: "$_id",
                _id: 0,
                name: 1,
                phone: 1,
                customerNo: 1,
                logo: 1,
              },
            },
          ],
          as: "suppliers",
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "merchantId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                id: "$_id",
                _id: 0,
                name: 1,
                phone: 1,
                customerNo: 1,
                logo: 1,
                categoryId: 1,
                address: 1,
                cityId: 1,
                districtId: 1,
                subDistrictId: 1,
              },
            },
          ],
          as: "merchants",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                id: "$_id",
                _id: 0,
                name: 1,
                phoneNumber: 1,
                email: 1,
              },
            },
          ],
          as: "users",
        },
      },
      {
        $addFields: {
          supplier: { $arrayElemAt: ["$suppliers", 0] },
          merchant: { $arrayElemAt: ["$merchants", 0] },
          user: { $arrayElemAt: ["$users", 0] },
        },
      },
      {
        $lookup: {
          from: "customercategories",
          localField: "merchant.categoryId",
          foreignField: "_id",
          as: "merchantCategory",
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "merchant.cityId",
          foreignField: "_id",
          as: "merchantCity",
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "merchant.districtId",
          foreignField: "_id",
          as: "merchantDistrict",
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "merchant.subDistrictId",
          foreignField: "_id",
          as: "merchantSubdistrict",
        },
      },
      {
        $addFields: {
          "merchant.categoryName": {
            $arrayElemAt: ["$merchantCategory.name", 0],
          },
          "merchant.cityName": {
            $arrayElemAt: ["$merchantCity.name", 0],
          },
          "merchant.districtName": {
            $arrayElemAt: ["$merchantDistrict.name", 0],
          },
          "merchant.subDistrictName": {
            $arrayElemAt: ["$merchantSubDistrict.name", 0],
          },
        },
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.id",
          foreignField: "_id",
          as: "_product",
        },
      },
      {
        $addFields: {
          product: {
            $arrayElemAt: ["$_product", 0],
          },
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "product.brandId",
          foreignField: "_id",
          as: "_brand",
        },
      },
      {
        $addFields: {
          "product.brandName": {
            $arrayElemAt: ["$_brand.name", 0],
          },
          "product.price": "$products.price",
          "product.basePrice": "$products.basePrice",
          "product.quantity": "$products.quantity",
        },
      },
      {
        $project: {
          id: "$_id",
          _id: 0,
          orderNo: 1,
          status: 1,
          product: 1,
          orderedAt: 1,
          deliveryDate: 1,
          deliveredAt: 1,
          paymentMethod: 1,
          thirdPartyId: 1,
          logs: 1,
          createdAt: 1,
          updatedAt: 1,
          supplier: 1,
          merchant: 1,
          user: 1,
        },
      },
      { $sort: { orderedAt: -1 } },
    ];
    const data: any = await Order.aggregate(aggregation);
    const excelFile: Buffer = await exportToExcel(data);
    res.status(StatusCodes.OK).send({ file: excelFile.toString("base64") });

    // res.status(StatusCodes.OK).send({ data });
  }
);
export { router as orderReportRouter };

export const exportToExcel = async (orders: any[]): Promise<any> => {
  const wb = new xl.Workbook({
    jszip: {
      compression: "DEFLATE",
    },
    defaultFont: {
      size: 12,
      name: "Calibri",
      color: "FFFFFFFF",
    },
  });
  const ws = wb.addWorksheet("Sheet 1");

  const baseStyle = {
    font: {
      color: "#000000",
      size: 12,
    },
    numberFormat: "#,##0.00; ($#,##0.00); -",
  };
  const normal = wb.createStyle(baseStyle);

  const bold = wb.createStyle(
    Object.assign(baseStyle, {
      font: {
        color: "#000000",
        bold: true,
        size: 12,
      },
    })
  );
  const styles = { normal, bold };

  const colHeaders: any[] = [
    "Order Number",
    "Product Name",
    "Barcode",
    "Brand",
    "Vendor",
    "Qty",
    "Price",
    "Total",
    "Final Total",
    "Completed At",
    "When to ship",
    "Receiver Phone",
    "Receiver name",
    "Business type",
    "State name",
    "District",
    "Quarter",
    "Address",
    "Status",
    "Latest note",
    "Main Category",
  ];
  let colIndex = 1;
  colHeaders.forEach((c) => {
    ws.cell(1, colIndex).string(c).style(styles.bold);
    colIndex++;
  });

  let index = 2;
  orders.forEach((order) => {
    const cols: any[] = [];
    cols.push(`${order.orderNo || ""}`);
    cols.push(`${order.product.name || ""}`);
    cols.push(`${order.product.barCode || ""}`);
    cols.push(`${order.product.brandName || ""}`);
    cols.push(`${order.supplier.name || ""}`);
    cols.push(`${order.product.quantity || ""}`);
    cols.push(`${order.product.price || ""}`);
    cols.push(`${order.product.price * order.product.quantity || ""}`);
    cols.push(`${order.product.price * order.product.quantity || ""}`);
    cols.push(
      `${
        order.orderedAt ? convertToUserTimezone({ date: order.orderedAt }) : ""
      }`
    );
    cols.push(
      `${
        order.deliveryDate
          ? convertToUserTimezone({
              date: order.deliveryDate,
              format: "YYYY-MM-DD",
            })
          : ""
      }`
    );
    cols.push(`${order.merchant.phone || ""}`);
    cols.push(`${order.merchant.name || ""}`);
    cols.push(`${order.merchant.categoryName || ""}`);
    cols.push(`${order.merchant.cityName || ""}`);
    cols.push(`${order.merchant.districtName || ""}`);
    cols.push(`${order.merchant.subDistrictName || ""}`);
    cols.push(`${order.merchant.address || ""}`);
    cols.push(`${order.status || ""}`);
    cols.push("");
    cols.push("");

    cols.forEach((c, i) => {
      ws.cell(index, i + 1)
        .string(c)
        .style(styles.normal);
    });
    index++;
  });
  return wb.writeToBuffer();
};
