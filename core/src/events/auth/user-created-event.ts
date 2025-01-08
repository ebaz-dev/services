import { AuthEventSubjects } from "./auth-event-subjects";

export interface UserCreatedEvent {
  subject: AuthEventSubjects.UserCreated;
  data: {
    id: string;
    email: string | undefined;
    phoneNumber: string | undefined;
    confirmationCode: string;
    confirmationExpireAt: string;
  };
}
