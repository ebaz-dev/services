import { Sequence, Supplier } from "@ezdev/core";
import moment from "moment";

export const getOrderNumber = async (
  supplierId?: string,
  test?: boolean
): Promise<any> => {
  let code = "EB";
  if (test) {
    code = "ebt";
  }
  const duration = moment().format("YYMMDD");
  const supplier = await Supplier.findById(supplierId);
  if (supplier && supplier.code) {
    code = supplier.code;
  }

  let sequence: any = await Sequence.findOneAndUpdate(
    { code, duration },
    { $inc: { seq: 1 } }
  );
  if (!sequence) {
    await Sequence.create({ code, duration, seq: 1 });
    sequence = await Sequence.findOneAndUpdate(
      { code, duration },
      { $inc: { seq: 1 } }
    );
  }
  return `${code}${duration}${sequence.seq}`;
};
