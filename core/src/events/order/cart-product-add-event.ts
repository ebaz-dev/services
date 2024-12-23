import { CartEventSubjects } from "./cart-event-subjects";

export interface CartProductAddedEvent {
  subject: CartEventSubjects.CartProductAdded;
  data: {
    id: string;
    productId?: string;
    quantity?: number;
    products?: any;
    updatedAt: Date;
  };
}
