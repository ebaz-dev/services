import express, { Request, Response } from "express";
import {
  currentUser,
  requireAuth,
  validateRequest,
  Employee,
  Customer,
  Merchant,
  EmployeeRoles,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { Cart, Order, OrderTemplate } from "@ebazdev/order";
import { Types } from "mongoose";

const router = express.Router();

router.get(
  "/employee/migrate",
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const merchants: any = await Merchant.aggregate([
      {
        $match: {
          type: "merchant",
          tradeShops: {
            $size: 1,
          },
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "merchantId",
          as: "orders",
        },
      },
      {
        $unwind: "$tradeShops",
      },
      {
        $group: {
          _id: {
            tsId: "$tradeShops.tsId",
            holdingKey: "$tradeShops.holdingKey",
          },
          customers: {
            $push: "$$ROOT",
          },
        },
      },
    ]);
    const data: any = {
      merchants,
      employees: [],
      orderRes: [],
      cartRes: [],
      customerRes: [],
    };
    merchants.map(async (merchant: any) => {
      const mainCustomer = merchant.customers[0];
      merchant.customers.map(async (customer: any) => {
        if (customer) {
          const userId = customer.userId;
          if (userId) {
            const employeeExist = await Employee.find({
              userId,
              customerId: mainCustomer._id,
            });
            if (employeeExist.length < 1) {
              const employee = await Employee.create({
                userId: userId,
                customerId: mainCustomer._id,
                role: EmployeeRoles.Admin,
              });
              console.log("employee", employee);
            }
          }
          if ((customer._id as string) !== (mainCustomer._id as string)) {
            const orderRes = await Order.updateMany(
              {
                merchantId: new Types.ObjectId(customer._id as string),
              },
              {
                $set: {
                  merchantId: new Types.ObjectId(mainCustomer._id as string),
                },
              }
            );

            const cartRes = await Cart.updateMany(
              {
                merchantId: new Types.ObjectId(customer._id as string),
              },
              {
                $set: {
                  merchantId: new Types.ObjectId(mainCustomer._id as string),
                },
              }
            );

            const customerRes = await Customer.updateOne(
              { _id: customer._id },
              { $set: { inactive: true } }
            );

            const templateRes = await OrderTemplate.updateOne(
              { merchantId: customer._id },
              {
                $set: {
                  merchantId: new Types.ObjectId(mainCustomer._id as string),
                },
              }
            );

            console.log("orderRes", orderRes);
            console.log("cartRes", cartRes);
            console.log("customerRes", customerRes);
            console.log("templateRes", templateRes);
          }
        }
      });
    });

    res.status(StatusCodes.OK).send({ data });
  }
);

export { router as employeeMigrateRouter };
