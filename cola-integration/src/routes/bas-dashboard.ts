import express, { Request, Response } from "express";
import axios from "axios";
import { StatusCodes } from "http-status-codes";
import {
  Merchant,
  Supplier,
  AnungooAPIClient,
  ColaAPIClient,
  TotalAPIClient,
} from "@ezdev/core";
import { fetchDataFromAPI } from "../utils/fetch-dashboard-data";

const router = express.Router();

router.get("/bas/dashboard-data", async (req: Request, res: Response) => {
  try {
    const { tradeshopId, supplierId } = req.query;

    if (!tradeshopId || !supplierId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: "Parameter is missing",
        data: [],
      });
    }

    const merchant = await Merchant.findById(tradeshopId).select("tradeShops");

    if (!merchant || !merchant.tradeShops) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: "Merchant data not found",
        data: [],
      });
    }

    const supplier = await Supplier.findById(supplierId).select(
      "holdingKey vendorKey business businessType"
    );

    if (!supplier || !supplier.holdingKey) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: "Supplier data not found",
        data: [],
      });
    }

    const isTotalMerchant = merchant.tradeShops.some(
      (item: any) => item.holdingKey === "TD"
    );

    const holdingKey = supplier.holdingKey;
    const supplierTag = supplier.business;
    const businessType = supplier.businessType;

    const merchantBasId = merchant.tradeShops.find(
      (item: any) => item.holdingKey === holdingKey
    )?.tsId;

    if (!merchantBasId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: "Merchant BAS ID not found",
        data: [],
      });
    }

    const businessLocation = isTotalMerchant ? "Орон нутаг" : "Хот";

    let orderList: any[] = [];
    let discountList: any[] = [];
    let salesPerformance: any[] = [];
    let coolerList: any[] = [];
    let rackList: any[] = [];
    let printingsList: any[] = [];

    if (isTotalMerchant) {
      const totalClient = TotalAPIClient.getClient();

      if (supplierTag === "Coca Cola") {
        const colaClient = ColaAPIClient.getClient();
        [
          orderList,
          discountList,
          salesPerformance,
          coolerList,
          rackList,
          printingsList,
        ] = await Promise.all([
          fetchDataFromAPI(totalClient, "/api/ebazaar/getdatasales", {
            tradeshopid: merchantBasId,
            company: supplierTag,
          }),
          fetchDataFromAPI(totalClient, "/api/ebazaar/getdatadiscount", {
            tradeshopid: merchantBasId,
            company: supplierTag,
          }),
          fetchDataFromAPI(totalClient, "/api/ebazaar/getdatared", {
            tradeshopid: merchantBasId,
          }),
          fetchDataFromAPI(totalClient, "/api/ebazaar/getdatacooler", {
            tradeshopid: merchantBasId,
            customerType: businessLocation,
          }),
          fetchDataFromAPI(colaClient, "/api/ebazaar/getdatampoe", {
            tradeshopid: merchantBasId,
          }),
          fetchDataFromAPI(colaClient, "/api/ebazaar/getdataprinting", {
            tradeshopid: merchantBasId,
          }),
        ]);
      } else if (supplierTag === "Anungoo" || supplierTag === "MarketGate") {
        const agClient = AnungooAPIClient.getClient();

        [orderList, salesPerformance, discountList] = await Promise.all([
          fetchDataFromAPI(totalClient, "/api/ebazaar/getdatasales", {
            tradeshopid: merchantBasId,
            company: supplierTag,
          }),
          fetchDataFromAPI(agClient, "/api/ebazaar/getdataaudit", {
            tradeshopid: merchantBasId,
          }),
          fetchDataFromAPI(agClient, "/api/ebazaar/getdatadiscount", {
            tradeshopid: merchantBasId,
          }),
        ]);

        orderList = orderList.filter(
          (item: any) => item.businesstype === businessType
        );

        const businessTypeMapping: { [key: string]: string } = {
          data_pg: "ag_nonfood",
          data_ione: "ag_food",
          data_ico: "mg_nonfood",
          data_nestle: "mg_food",
        };

        const filteredSalesPerformance: any = {};
        for (const key in salesPerformance) {
          if (salesPerformance.hasOwnProperty(key)) {
            const origin = businessTypeMapping[key];
            if (origin === businessType) {
              filteredSalesPerformance[key] = salesPerformance[key];
            }
          }
        }

        const salesPerformanceArray: any[] = Object.values(
          filteredSalesPerformance
        ).flat();

        salesPerformance = salesPerformanceArray;

        discountList = discountList.filter(
          (item: any) => item.businesstype === businessType
        );
      } else if (supplierTag === "TotalDistribution") {
        [orderList, discountList] = await Promise.all([
          fetchDataFromAPI(totalClient, "/api/ebazaar/getdatasales", {
            tradeshopid: merchantBasId,
            company: supplierTag,
          }),
          fetchDataFromAPI(totalClient, "/api/ebazaar/getdatadiscount", {
            tradeshopid: merchantBasId,
            company: supplierTag,
          }),
        ]);
      }
    } else {
      if (supplierTag === "Anungoo" || supplierTag === "MarketGate") {
        const anungoo = AnungooAPIClient.getClient();

        [orderList, salesPerformance, discountList] = await Promise.all([
          fetchDataFromAPI(anungoo, "/api/ebazaar/getdatasales", {
            tradeshopid: merchantBasId,
          }),
          fetchDataFromAPI(anungoo, "/api/ebazaar/getdataaudit", {
            tradeshopid: merchantBasId,
          }),
          fetchDataFromAPI(anungoo, "/api/ebazaar/getdatadiscount", {
            tradeshopid: merchantBasId,
          }),
        ]);

        orderList = orderList.filter(
          (item: any) => item.businesstype === businessType
        );

        const businessTypeMapping: { [key: string]: string } = {
          data_pg: "ag_nonfood",
          data_ione: "ag_food",
          data_ico: "mg_nonfood",
          data_nestle: "mg_food",
        };

        const filteredSalesPerformance: any = {};
        for (const key in salesPerformance) {
          if (salesPerformance.hasOwnProperty(key)) {
            const origin = businessTypeMapping[key];
            if (origin === businessType) {
              filteredSalesPerformance[key] = salesPerformance[key];
            }
          }
        }

        const salesPerformanceArray: any[] = Object.values(
          filteredSalesPerformance
        ).flat();

        salesPerformance = salesPerformanceArray;

        discountList = discountList.filter(
          (item: any) => item.businesstype === businessType
        );
      } else if (supplierTag === "Coca Cola") {
        const colaClient = ColaAPIClient.getClient();
        [
          orderList,
          discountList,
          salesPerformance,
          coolerList,
          rackList,
          printingsList,
        ] = await Promise.all([
          fetchDataFromAPI(colaClient, "/api/ebazaar/getdatasales", {
            tradeshopid: merchantBasId,
          }),
          fetchDataFromAPI(colaClient, "/api/ebazaar/getdatadiscount", {
            tradeshopid: merchantBasId,
          }),
          fetchDataFromAPI(colaClient, "/api/ebazaar/getdatared", {
            tradeshopid: merchantBasId,
          }),
          fetchDataFromAPI(colaClient, "/api/ebazaar/getdatacooler", {
            tradeshopid: merchantBasId,
            customerType: businessLocation,
          }),
          fetchDataFromAPI(colaClient, "/api/ebazaar/getdatampoe", {
            tradeshopid: merchantBasId,
          }),
          fetchDataFromAPI(colaClient, "/api/ebazaar/getdataprinting", {
            tradeshopid: merchantBasId,
          }),
        ]);
      }
    }

    const data = {
      orderList,
      discountList,
      salesPerformance,
      coolerList,
      rackList,
      printingsList,
    };

    return res.status(StatusCodes.OK).send(data);
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: "Axios error: " + error.message,
        basError: true,
        orderList: [],
        discountList: [],
        salesPerformance: [],
        coolerList: [],
        rackList: [],
        printingsList: [],
      });
    } else {
      console.log(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Unexpected error: " + error,
        basError: true,
        orderList: [],
        discountList: [],
        salesPerformance: [],
        coolerList: [],
        rackList: [],
        printingsList: [],
      });
    }
  }
});

export { router as basDashboardRouter };
