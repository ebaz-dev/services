import { Types, ObjectId } from "../../lib/mongoose";
import { BasPromoSubjects } from "./bas-promo-event-subjects";
import { giftProductsPackage } from "../../models/cola-integration/bas-promo";

export interface BasPromoRecievedEvent {
  subject: BasPromoSubjects.BasPromoRecieved;

  data: {
    supplierId: Types.ObjectId;
    name: string;
    startDate: string;
    endDate: string;
    tresholdAmount: number;
    thresholdQuantity: number;
    promoPercent: number;
    giftQuantity: number;
    isActive: boolean;
    products?: ObjectId[];
    giftProducts?: ObjectId[];
    giftProductPackage?: giftProductsPackage[];
    tradeshops?: number[];
    thirdPartyPromoId: number;
    thirdPartyPromoNo: string;
    thirdPartyPromoTypeId: number;
    thirdPartyPromoType: string;
    thirdPartyPromoTypeCode: string;
  };
}
