import {
  HoldingSupplierCodes,
  Merchant,
  Supplier,
  Order,
  OrderStatus,
  OrderThirdPartyDataDoc,
  PaymentMethods,
  AnungooAPIClient,
  ColaAPIClient,
  TotalAPIClient,
} from "@ezdev/core";
import moment from "moment";
import { Types } from "@ezdev/core/lib/mongoose";

const baseSendOrder = async (orderId: string) => {
  try {
    const order = await Order.findById(new Types.ObjectId(orderId));

    if (!order) {
      console.log("Order not found");
      throw new Error("Order not found");
    }

    if (
      order.status === OrderStatus.Created &&
      order.paymentMethod != PaymentMethods.Cash
    ) {
      return { order };
    }
    const supplier = await Supplier.findById(order.supplierId);

    if (!supplier) {
      console.log("Supplier not found");
      throw new Error("Supplier not found");
    }

    const merchant = await Merchant.findById(order.merchantId);

    if (!merchant) {
      console.log("Merchant not found");
      throw new Error("Merchant not found");
    }

    const tradeshop = merchant.tradeShops?.find(
      (ts) => ts.holdingKey === supplier.holdingKey
    );
    if (!tradeshop) {
      console.log("Tradeshop not found");
      throw new Error("Tradeshop not found");
    }
    let supplierKey = tradeshop.holdingKey;
    if (
      merchant.tradeShops
        ?.map((ts) => ts.holdingKey)
        .indexOf(HoldingSupplierCodes.TotalDistribution) !== -1
    ) {
      supplierKey = HoldingSupplierCodes.TotalDistribution;
    } else if (
      merchant.tradeShops
        ?.map((ts) => ts.holdingKey)
        .indexOf(HoldingSupplierCodes.AnunGoo) !== -1
    ) {
      supplierKey = HoldingSupplierCodes.AnunGoo;
    }

    if (!order.thirdPartyId) {
      const getOrderNoData: any = {
        tradeshopid: Number(tradeshop.tsId),
        deliverydate: moment(order.deliveryDate).format("YYYY-MM-DD"),
        paymenttype:
          order.paymentMethod === PaymentMethods.Cash ? "Бэлэн" : "QPAY",
        ordertype: "bazaar",
        description: merchant.test ? "bazaar test" : order.orderNo?.toString(),
        yourorderno: `${order.orderNo}`,
      };
      const getOrderNoResponse = await getOrderNo(
        supplier,
        supplierKey,
        getOrderNoData,
        order.tierDiscountPercent ? order.tierDiscountPercent : 0
      );
      if (!order.thirdPartyData) {
        order.thirdPartyData = <OrderThirdPartyDataDoc>{
          response: [getOrderNoResponse?.response],
        };
      } else if (!order.thirdPartyData.response) {
        order.thirdPartyData.response = [getOrderNoResponse?.response];
      } else {
        order.thirdPartyData.response.push(getOrderNoResponse?.response);
      }
      order.thirdPartyData.updatedAt = new Date();
      console.log("order", order);
      if (!getOrderNoResponse || !getOrderNoResponse.orderNo) {
        await order.save();
        console.log("order no error");
        throw new Error("Get order no: error");
      }

      order.thirdPartyData.thirdPartyId = getOrderNoResponse.orderNo;

      order.thirdPartyId = getOrderNoResponse.orderNo;
    }

    const orderDetails = order.products
      .concat(order.giftProducts)
      .map((product) => {
        return {
          orderno: order.thirdPartyId,
          productid: Number(product.thirdPartyData[0].productId),
          quantity: Number(product.quantity) + Number(product.giftQuantity),
          price: Number(product.price),
          baseprice: Number(product.basePrice),
          promoid: product.promoId || 0,
        };
      });

    const orderDetailResponse = await sendOrderDetail(
      supplierKey,
      orderDetails
    );
    order.thirdPartyData.response.push(orderDetailResponse?.response);
    await order.save();
    return { colaOrderNo: order.thirdPartyId, orderDetails };
  } catch (error) {
    console.log("err", error);
    throw new Error("Send order: error");
  }
};

const getOrderNo = async (
  supplier: any,
  holdingKey: HoldingSupplierCodes,
  data: any,
  tierDiscountPercent: number
) => {
  let result: any = {};
  try {
    if (holdingKey === HoldingSupplierCodes.CocaCola) {
      result = await ColaAPIClient.getClient().post(
        `/api/ebazaar/getorderno`,
        data
      );
    } else if (holdingKey === HoldingSupplierCodes.TotalDistribution) {
      data.company = supplier.business;
      data.businesstype = supplier.businessType;
      data.shatlal = tierDiscountPercent > 0 ? "yes" : "no";

      result = await TotalAPIClient.getClient().post(
        `/api/ebazaar/getorderno`,
        data
      );
    } else if (holdingKey === HoldingSupplierCodes.AnunGoo) {
      data.company = supplier.business;
      data.businesstype = supplier.businessType;
      data.shatlal = tierDiscountPercent > 0 ? "yes" : "no";

      result = await AnungooAPIClient.getClient().post(
        `/api/ebazaar/getorderno`,
        data
      );
    }
  } catch (error: any) {
    if (error.response && error.response.data) {
      result.data = error.response.data;
    }
    console.log("order no error");
  }
  if (!result.data || !result.data.data[0] || !result.data.data[0].orderno) {
    return { response: result.data };
  }
  return { response: result.data, orderNo: result.data.data[0].orderno };
};

const sendOrderDetail = async (holdingKey: HoldingSupplierCodes, data: any) => {
  let result: any = {};
  try {
    if (holdingKey === HoldingSupplierCodes.CocaCola) {
      result = await ColaAPIClient.getClient().post(
        `/api/ebazaar/orderdetailcreate`,
        data
      );
    } else if (holdingKey === HoldingSupplierCodes.TotalDistribution) {
      result = await TotalAPIClient.getClient().post(
        `/api/ebazaar/orderdetailcreate`,
        data
      );
    } else if (holdingKey === HoldingSupplierCodes.AnunGoo) {
      result = await AnungooAPIClient.getClient().post(
        `/api/ebazaar/orderdetailcreate`,
        data
      );
    }
  } catch (error: any) {
    if (error.response && error.response.data) {
      result.data = error.response.data;
    }
    console.log("send order error", error.data);
  }

  return { response: result.data };
};

export { baseSendOrder };
