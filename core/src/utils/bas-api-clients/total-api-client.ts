import axios from "axios";
import { BaseAPIClient } from "./base-api-client";
import { IntegrationBaseURI } from "./integration-uri";

export class TotalAPIClient extends BaseAPIClient {
  private static client: TotalAPIClient | null = null;

  private readonly PATH_PREFIX = "/api/ebazaar";

  constructor() {
    super(
      IntegrationBaseURI.totalBaseURI,
      "/api/tokenbazaar",
      "bazaar",
      "M8@46jkljkjkljlk#$2024TD"
    );
  }

  // Method to get product by merchant ID using the CocaCola API
  public async getProductsByMerchantId(
    tradeshopId: string,
    company: string
  ): Promise<any> {
    try {
      const response = await this.post(`${this.PATH_PREFIX}/productremains`, {
        tradeshopid: tradeshopId,
        company: company,
      });
      return response;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (
          error.response &&
          error.response.status === 404 &&
          error.response.data.err_msg === "no data"
        ) {
          return { data: { data: [] } };
        }
      }
      throw error;
    }
  }

  public static getClient(): TotalAPIClient {
    if (!TotalAPIClient.client) {
      TotalAPIClient.client = new TotalAPIClient();
    }
    return TotalAPIClient.client;
  }
}
