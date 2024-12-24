import { AnungooAPIClient } from "@ebazdev/cola-integration";
import {
  HoldingBusinessCodes,
  HoldingBusinessTypeCodes,
} from "@ebazdev/customer";
import axios from "axios";

export const getMerchantTierDiscount = async (
  tradeshopId: string,
  type?: HoldingBusinessTypeCodes
): Promise<any> => {
  try {
    const productsResponse = await AnungooAPIClient.getClient().post(
      `/api/ebazaar/productremains`,
      {
        tradeshopid: parseInt(tradeshopId),
      }
    );

    const merchantTierDiscount = productsResponse?.data?.shatlal || [];
    const filteredList = merchantTierDiscount.filter((item: any) => {
      if (type === HoldingBusinessTypeCodes.AGFood) {
        return item.business === "AG_FOOD";
      } else if (type === HoldingBusinessTypeCodes.AGNonFood) {
        return item.business === "AG_NONFOOD";
      } else if (type === HoldingBusinessTypeCodes.MGFood) {
        return item.business === "MG_FOOD";
      } else if (type === HoldingBusinessTypeCodes.MGNonFood) {
        return item.business === "MG_NONFOOD";
      } else {
        return false;
      }
    });
    return filteredList;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return [];
    } else {
      console.error(
        "Bas integration anungoo merchant shatlal get error:",
        error
      );

      return [];
    }
  }
};
