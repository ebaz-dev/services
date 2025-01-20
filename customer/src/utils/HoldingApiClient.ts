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
      province_city: {
        id: string;
        name: string;
      };
      district_subcity: {
        id: string;
        name: string;
      };
      sub_district_block: {
        id: string;
        name: string;
      };
      coordinate: {
        longitude: number;
        latitude: number;
      };
      e_group_master: string;
    };
    supplier: Array<{
      supplier: string;
      trade_shop_id: number;
    }>;
  };
}

export class HoldingAPIClient extends BaseAPIClient {
  private static client: HoldingAPIClient | null = null;

  private readonly PATH_PREFIX = "/api";

  constructor() {
    const defaultExpirationMinutes = 60;

    // Calculate expiration before super call
    const expirationMinutes = (() => {
      try {
        const now = new Date();
        now.setHours(now.getHours() + 8);
        const targetDate = new Date("2024-11-28T11:55:57.557438+08:00");
        const diffInMinutes =
          (targetDate.getTime() - now.getTime()) / (1000 * 60);
        return Math.floor(diffInMinutes) || defaultExpirationMinutes;
      } catch (error) {
        console.error("Error calculating expiration minutes:", error);
        return defaultExpirationMinutes;
      }
    })();

    super(
      "https://merchant-verification-test-a6dba7hrezffecdw.southeastasia-01.azurewebsites.net",
      "/api/login",
      "ebazaar",
      "/IM3l)8Vs4K5",
      expirationMinutes,
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
