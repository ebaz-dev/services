import {
  Publisher,
  ColaOrderStatusRecievedEvent,
  ColaOrderStatusSubjects,
} from "@ezdev/core";

export class ColaOrderStatusPublisher extends Publisher<ColaOrderStatusRecievedEvent> {
  subject: ColaOrderStatusSubjects.OrderStatusRecieved =
    ColaOrderStatusSubjects.OrderStatusRecieved;
}
