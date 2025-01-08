import { Publisher, UserCreatedEvent, AuthEventSubjects } from "@ezdev/core";

export class UserCreatedCreatedPublisher extends Publisher<UserCreatedEvent> {
  subject: AuthEventSubjects = AuthEventSubjects.UserCreated;
}
