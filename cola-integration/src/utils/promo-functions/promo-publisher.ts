import { Types, ObjectId } from "mongoose";
import { natsWrapper } from "../../nats-wrapper";
import { BasPromoRecievedEventPublisher } from "../../events/publisher/bas-promo-recieved-event-publisher";

export const publishPromo = async (
  promo: any,
  promoSupplierId: ObjectId,
  ebProductIds: ObjectId[],
  ebGiftProductIds: ObjectId[]
) => {
  await new BasPromoRecievedEventPublisher(natsWrapper.client).publish({
    supplierId: promoSupplierId as unknown as Types.ObjectId,
    name: promo.promoname,
    startDate: new Date(promo.startdate).toISOString(),
    endDate: new Date(promo.enddate).toISOString(),
    tresholdAmount: promo.tresholdamount ?? 0,
    thresholdQuantity: promo.tresholdquantity ?? 0,
    promoPercent: promo.promopercent ?? 0,
    giftQuantity: promo.giftquantity ?? 0,
    isActive: promo.isactive,
    tradeshops: promo.thirdPartyTradeshops ?? [],
    products: ebProductIds,
    giftProducts: ebGiftProductIds ?? [],
    giftProductPackage: promo.giftProductPackage ?? [],
    thirdPartyPromoId: promo.promoid,
    thirdPartyPromoNo: promo.promono,
    thirdPartyPromoTypeId: promo.promotypeid,
    thirdPartyPromoType: promo.promotype,
    thirdPartyPromoTypeCode: promo.promotypebycode,
  });
};
