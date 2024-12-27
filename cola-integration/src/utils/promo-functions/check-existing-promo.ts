import { Types, ObjectId } from "mongoose";
import { checkPromoFields } from "./check-updates";
import { natsWrapper } from "../../nats-wrapper";
import { BasPromoUpdatedEventPublisher } from "../../events/publisher/bas-promo-updated-event-publisher";

export const checkAndUpdatePromo = async (
  existingPromo: any,
  promo: any,
  promoSupplierId: ObjectId,
  ebProductIds: ObjectId[],
  ebGiftProductIds: ObjectId[]
) => {
  const updatedFields = checkPromoFields(
    existingPromo,
    promo,
    ebProductIds,
    ebGiftProductIds
  );
  if (Object.keys(updatedFields).length > 0) {
    await new BasPromoUpdatedEventPublisher(natsWrapper.client).publish({
      supplierId: promoSupplierId as unknown as Types.ObjectId,
      id: existingPromo.id,
      updatedFields,
    });
  }
};
