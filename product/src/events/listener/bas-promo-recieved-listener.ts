import { Message } from "node-nats-streaming";
import {
  Listener,
  BasPromoRecievedEvent,
  BasPromoSubjects,
  Promo,
  PromoType,
} from "@ezdev/core";
import { queueGroupName } from "./queu-group-name";
import slugify from "slugify";

export class BasPromoRecievedEventListener extends Listener<BasPromoRecievedEvent> {
  readonly subject = BasPromoSubjects.BasPromoRecieved;
  queueGroupName = queueGroupName;

  async onMessage(data: BasPromoRecievedEvent["data"], msg: Message) {
    try {
      const {
        supplierId,
        name,
        startDate,
        endDate,
        tresholdAmount,
        thresholdQuantity,
        promoPercent,
        giftQuantity,
        isActive,
        products,
        giftProducts,
        giftProductPackage,
        tradeshops,
        thirdPartyPromoId,
        thirdPartyPromoNo,
        thirdPartyPromoTypeId,
        thirdPartyPromoType,
        thirdPartyPromoTypeCode,
      } = data;

      const promoType = await PromoType.findOne({
        type: thirdPartyPromoTypeCode,
      });

      if (!promoType) {
        throw new Error(`Invalid promo type: ${thirdPartyPromoTypeCode}`);
      }

      const slug = slugify(name, { lower: true, strict: true });

      const promo = new Promo({
        customerId: supplierId,
        name: name,
        slug: slug,
        startDate: startDate,
        endDate: endDate,
        promoNo: thirdPartyPromoNo || "",
        tresholdAmount: tresholdAmount,
        thresholdQuantity: thresholdQuantity,
        promoPercent: promoPercent,
        giftQuantity: giftQuantity,
        isActive: isActive,
        promoTypeId: promoType.typeId,
        promoTypeName: promoType.name,
        promoType: promoType.type,
        products: products,
        giftProducts: giftProducts,
        giftProductPackage: giftProductPackage || [],
        tradeshops: tradeshops,
        thirdPartyData: {
          thirdPartyPromoName: name,
          thirdPartyPromoId: thirdPartyPromoId,
          thirdPartyPromoNo: thirdPartyPromoNo,
          thirdPartyPromoTypeId: thirdPartyPromoTypeId,
          thirdPartyPromoType: thirdPartyPromoType,
          thirdPartyPromoTypeCode: thirdPartyPromoTypeCode,
        },
      });

      promo.save();

      msg.ack();
    } catch (error: any) {
      console.error("Error processing BasPromoRecievedEventListener:", error);
      msg.ack();
    }
  }
}
