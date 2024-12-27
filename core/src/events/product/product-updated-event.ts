import { Types } from "mongoose";
import { ProductEventSubjects } from "./product-event-subjects";

export interface ProductUpdatedEvent {
  subject: ProductEventSubjects.ProductUpdated;
  data: {
    id: string;
    name?: string;
    slug?: string;
    barCode?: string;
    customerId?: Types.ObjectId;
    vendorId?: Types.ObjectId;
    categoryIds?: Types.ObjectId[];
    brandId?: Types.ObjectId;
    description?: string;
    images?: Array<string>;
    attributes?: Array<object>;
    inCase?: number;
  };
}
