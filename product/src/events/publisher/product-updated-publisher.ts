import {
  Publisher,
  ProductUpdatedEvent,
  ProductEventSubjects,
} from "@ezdev/core";

export class ProductUpdatedPublisher extends Publisher<ProductUpdatedEvent> {
  readonly subject: ProductEventSubjects.ProductUpdated =
    ProductEventSubjects.ProductUpdated;
}
