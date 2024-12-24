import mongoose, { Document, Schema } from "@ezdev/core/lib/mongoose";
import { Password } from "../utils/password";

export interface UserDoc extends Document {
  email?: string;
  phoneNumber?: string;
  password: string;
  isEmailConfirmed: boolean;
  isPhoneConfirmed: boolean;
  confirmationCode: string | undefined;
  confirmationCodeExpiresAt: Date | undefined;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, unique: true, sparse: true },
    phoneNumber: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    isEmailConfirmed: { type: Boolean, default: false },
    isPhoneConfirmed: { type: Boolean, default: false },
    confirmationCode: { type: String },
    confirmationCodeExpiresAt: { type: Date },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
        delete ret.__v;
      },
    },
  }
);

userSchema.pre("save", async function (done) {
  if (this.isModified("password")) {
    const hashed = await Password.toHash(this.get("password"));
    this.set("password", hashed);
  }
  done();
});

const User = mongoose.model<UserDoc>("User", userSchema);

export { User };
