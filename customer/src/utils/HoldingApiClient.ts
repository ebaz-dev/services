import { BaseAPIClient, loginType, HoldingSupplierCodes } from "@ezdev/core";

interface MerchantInfoResponse {
  message: string;
  data: {
    customer: {
      customer_master_id: number;
      reg_num: string;
      customer_name: string;
      phone_number: string;
    };
    trade_shop: {
      trade_shop_master_id: number;
      full_address: string;
      province_city: string;
      district_subcity: string;
      sub_district_block: string;
      coordinate: {
        longitude: number;
        latitude: number;
      };
      e_group_master: string;
    };
  };
}

export class HoldingAPIClient extends BaseAPIClient {
  private static client: HoldingAPIClient | null = null;

  private readonly PATH_PREFIX = "/api";

  constructor() {
    super(
      "https://merchant-verification-test-a6dba7hrezffecdw.southeastasia-01.azurewebsites.net",
      "/api/login",
      "ebazaar",
      "/IM3l)8Vs4K5",
      30,
      loginType.Basic,
      "auth_token"
    );
  }

  // Method to get merchant info by tradeshop_id and register_number
  public async getMerchantInfo(
    tradeShopId: string,
    register_number: string,
    holdingKey: HoldingSupplierCodes
  ): Promise<MerchantInfoResponse> {
    const { data } = await this.post(`${this.PATH_PREFIX}/get_profile`, {
      trade_shop_id: tradeShopId,
      reg_num: register_number,
      supplier_name: holdingKey,
    });

    return data;
  }

  public static getClient(): HoldingAPIClient {
    if (!HoldingAPIClient.client) {
      HoldingAPIClient.client = new HoldingAPIClient();
    }
    return HoldingAPIClient.client;
  }
}
