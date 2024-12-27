import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Invoice, InvoiceStatus, PaymentMethod } from "@ezdev/core";
import { InvoicePaidPublisher } from "../events/publisher/invoice-paid-publisher";
import { natsWrapper } from "../nats-wrapper";
import axios, { AxiosRequestConfig } from "axios";

const router = express.Router();

router.get("/invoice-status", async (req: Request, res: Response) => {
  const invoiceId = req.query.invoice;

  const QPAY_PAYMENT_CHECK_URL = "https://merchant.qpay.mn/v2/payment/check";

  const invoice = await Invoice.findOne({
    orderId: invoiceId,
    paymentMethod: PaymentMethod.QPay,
  });

  if (!invoice) {
    return res.status(StatusCodes.BAD_REQUEST).send("FAILURE");
  }

  const data = {
    object_type: "INVOICE",
    object_id: invoice.additionalData.thirdPartyInvoiceId,
    offset: {
      page_number: 1,
      page_limit: 100,
    },
  };

  const config: AxiosRequestConfig = {
    method: "post",
    url: QPAY_PAYMENT_CHECK_URL,
    headers: { Authorization: `Bearer ${invoice.additionalData.invoiceToken}` },
    data: data,
  };

  try {
    const response = await axios(config);

    if (response.status !== StatusCodes.OK) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send("PAYMENT CHECK REQUEST FAILED");
    }

    const responseData = response.data;
    const responseDetails = responseData.rows[0];

    if (!responseDetails) {
      return res.status(StatusCodes.BAD_REQUEST).send("NO PAYMENT DETAILS");
    }

    const thirdPartyData = {
      paymentId: responseDetails.payment_id,
      status: responseDetails.payment_status,
      currency: responseDetails.payment_currency,
      paymentWallet: responseDetails.payment_wallet,
      paymentType: responseDetails.payment_type,
      transactionData: responseDetails.p2p_transactions,
    };

    invoice.set({
      status: InvoiceStatus.Paid,
      paidAmount: responseData.paid_amount,
      additionalData: {
        ...invoice.additionalData,
        thirdPartyData: thirdPartyData,
      },
    });

    await invoice.save();

    await new InvoicePaidPublisher(natsWrapper.client).publish({
      id: invoice.id.toString(),
      orderId: invoice.orderId.toString(),
      supplierId: invoice.supplierId.toString(),
      merchantId: invoice.merchantId.toString(),
      status: invoice.status,
      invoiceAmount: invoice.invoiceAmount,
      paidAmount: invoice.paidAmount || 0,
      thirdPartyInvoiceId: invoice.additionalData.thirdPartyInvoiceId || "",
      paymentMethod: invoice.paymentMethod,
    });

    return res.status(StatusCodes.OK).send("SUCCESS");
  } catch (error) {
    console.error("Error during payment status check:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("FAILURE");
  }
});

export { router as paymemntStatusRouter };
