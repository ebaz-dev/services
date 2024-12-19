import { Publisher } from "@ezdev/core";
import { UserCreatedEvent } from "../../shared/events/user-created-event";
import { AuthEventSubjects } from "../../shared/events/auth-event-subjects";

export class UserCreatedCreatedPublisher extends Publisher<UserCreatedEvent> {
  subject: AuthEventSubjects = AuthEventSubjects.UserCreated;
}
