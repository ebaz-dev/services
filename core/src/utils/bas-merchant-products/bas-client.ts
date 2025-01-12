import { ColaAPIClient } from "../bas-api-clients/cola-api-client";
import { AnungooAPIClient } from "../bas-api-clients/anungoo-api-client";
import { TotalAPIClient } from "../bas-api-clients/total-api-client";

export const getBasClient = async (
  holdingKey: string,
  isTotalMerchant: boolean
) => {
  let apiClient;

  if (isTotalMerchant) {
    apiClient = TotalAPIClient;
  } else if (holdingKey === "MCSCC") {
    apiClient = ColaAPIClient;
  } else if (holdingKey === "AG" || holdingKey === "MG") {
    apiClient = AnungooAPIClient;
  } else {
    apiClient = TotalAPIClient;
  }

  return apiClient;
};
