import {
  Publisher,
  ProductCreatedEvent,
  ProductEventSubjects,
} from "@ezdev/core";

export class ProductCreatedPublisher extends Publisher<ProductCreatedEvent> {
  readonly subject: ProductEventSubjects.ProductCreated =
    ProductEventSubjects.ProductCreated;
}
