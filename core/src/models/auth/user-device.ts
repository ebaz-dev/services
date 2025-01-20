import mongoose, { Document, Schema } from "../../lib/mongoose";
import { DeviceTypes } from "../../types/device-types";

export interface UserDeviceDoc extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  deviceToken?: string;
  deviceType: DeviceTypes;
  deviceName: string;
  deviceIdentifier: string;
  isLogged: boolean;
  loginTime: Date;
  logoutTime?: Date;
  lastActiveTime: Date;
}

const userDeviceSchema = new Schema<UserDeviceDoc>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    deviceToken: { type: String, sparse: true },
    deviceType: {
      type: String,
      enum: Object.values(DeviceTypes),
      required: true,
    },
    deviceName: { type: String, required: true },
    deviceIdentifier: { type: String },
    isLogged: { type: Boolean, required: true },
    loginTime: { type: Date, required: true, default: Date.now },
    logoutTime: { type: Date },
    lastActiveTime: { type: Date, required: true, default: Date.now },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

userDeviceSchema.index({ userId: 1, deviceIdentifier: 1 });

const UserDevice = mongoose.model<UserDeviceDoc>(
  "UserDevice",
  userDeviceSchema
);

export { UserDevice };
