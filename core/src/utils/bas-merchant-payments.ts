import { ColaAPIClient } from "./bas-api-clients/cola-api-client";
import { AnungooAPIClient } from "./bas-api-clients/anungoo-api-client";
import { TotalAPIClient } from "./bas-api-clients/total-api-client";

interface MerchantProfile {
  agingday: number;
  businesstype?: string;
}

const basMerchantPayments = async (
  tradeshopId: string,
  type: string,
  supplier: string
) => {
  try {
    const { apiClient, requestBody } = getApiClientAndRequestBody(
      supplier,
      tradeshopId
    );

    const merchantProfile = await fetchData(
      apiClient,
      "/api/ebazaar/getdataprofile",
      requestBody
    );

    let merchantPayments = await fetchData(
      apiClient,
      "/api/ebazaar/getdatapayment",
      requestBody
    );

    let debts: any = [];

    let filteredProfile: MerchantProfile | undefined;

    if (supplier === "MCSCC" || supplier === "TD") {
      filteredProfile = merchantProfile[0];
    } else {
      filteredProfile = merchantProfile.find(
        (item: any) => item.businesstype === type
      );
    }

    if (!filteredProfile) {
      throw new Error(`No matching profile found for business type: ${type}`);
    }

    if (supplier === "AG" || supplier === "MG") {
      merchantPayments = merchantPayments.filter(
        (item: any) => item.company === supplier
      );
    }

    const payments = merchantPayments.map((p: any) => {
      if (p.amount > p.payamount) {
        const invoiceDate = new Date(p.invoicedate);
        const today = new Date();
        const payDate = new Date(
          invoiceDate.setDate(invoiceDate.getDate() + filteredProfile.agingday)
        );

        const diff = today.getTime() - payDate.getTime();
        p.overDays = Math.round(diff / (1000 * 3600 * 24));

        p.overdue = today > payDate;

        if (p.overdue) {
          debts.push(p);
        }
      }
      return p;
    });

    return {
      profile: filteredProfile,
      payments,
      debts,
    };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to retrieve merchant payments");
  }
};

export { basMerchantPayments };

const getApiClientAndRequestBody = (supplier: string, tradeshopId: string) => {
  try {
    let apiClient;
    let requestBody;

    switch (supplier) {
      case "MG":
      case "AG":
        apiClient = AnungooAPIClient;
        requestBody = { tradeshopid: tradeshopId };
        break;
      case "MCSCC":
        apiClient = ColaAPIClient;
        requestBody = { tradeshopid: tradeshopId };
        break;
      case "TD":
      default:
        apiClient = TotalAPIClient;
        requestBody = { tradeshopid: tradeshopId, company: "company" };
        break;
    }

    return { apiClient, requestBody };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get API client and request body");
  }
};

const fetchData = async (
  apiClient: any,
  endpoint: string,
  requestBody: object
) => {
  try {
    const response = await apiClient.getClient().post(endpoint, requestBody);
    const data = response?.data?.data;

    if (!data) {
      throw new Error(`Failed to retrieve data from ${endpoint}`);
    }

    return data;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to retrieve data");
  }
};
