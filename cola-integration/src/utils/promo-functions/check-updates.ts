import { ObjectId } from "@ezdev/core/lib/mongoose";

export const arraysEqual = (a: any[], b: any[]): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  const aSorted = a.map((item) => item.toString()).sort();
  const bSorted = b.map((item) => item.toString()).sort();

  for (let i = 0; i < aSorted.length; ++i) {
    if (aSorted[i] !== bSorted[i]) return false;
  }
  return true;
};

export const checkPromoFields = (
  existingPromo: any,
  basPromo: any,
  ebProductIds: ObjectId[],
  ebGiftProductIds: ObjectId[]
): any => {
  const updatedFields: any = {};

  const fieldsToCheck = [
    { key: "name", value: basPromo.promoname, type: "string" },
    {
      key: "startDate",
      value: new Date(basPromo.startdate).toISOString(),
      type: "date",
    },
    {
      key: "endDate",
      value: new Date(basPromo.enddate).toISOString(),
      type: "date",
    },
    {
      key: "tresholdAmount",
      value: basPromo.tresholdamount ?? 0,
      type: "number",
    },
    {
      key: "thresholdQuantity",
      value: basPromo.tresholdquantity ?? 0,
      type: "number",
    },
    { key: "promoPercent", value: basPromo.promopercent ?? 0, type: "number" },
    { key: "giftQuantity", value: basPromo.giftquantity ?? 0, type: "number" },
    { key: "isActive", value: basPromo.isactive, type: "boolean" },
    { key: "products", value: ebProductIds, type: "array" },
    { key: "giftProducts", value: ebGiftProductIds, type: "array" },
    { key: "tradeshops", value: basPromo.thirdPartyTradeshops, type: "array" },
  ];

  fieldsToCheck.forEach(({ key, value, type }) => {
    if (
      type === "array"
        ? !arraysEqual(existingPromo[key], value)
        : type === "date"
        ? new Date(existingPromo[key]).toISOString() !== value
        : existingPromo[key] !== value
    ) {
      updatedFields[key] = value;
    }
  });

  return updatedFields;
};
