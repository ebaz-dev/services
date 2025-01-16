import { BasProductSubjects } from "./bas-product-event-subjects";
import { Types } from "../../lib/mongoose";

export interface BasProductRecievedEvent {
  subject: BasProductSubjects.BasProductRecieved;
  data: {
    supplierId: Types.ObjectId;
    basId: string;
    productName: string;
    brandName?: string;
    incase?: number;
    capacity?: number;
    sectorName?: string;
    business?: string;
    barcode?: string;
    vendorId?: Types.ObjectId;
    splitSale?: boolean;
    priority?: number;
  };
}
