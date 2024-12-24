import { Document, Schema, Types, model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

export enum NotificationStatus {
  Unread = "unread",
  Readed = "readed",
  Deleted = "deleted",
}
interface ReceiverDoc extends Document {
  id: Types.ObjectId;
  status: NotificationStatus;
}

const receiverSchema = new Schema<ReceiverDoc>(
  {
    id: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "User",
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      required: true,
      default: NotificationStatus.Unread,
    },
  },
  { _id: false, timestamps: true }
);
interface NotificationDoc extends Document {
  title: string;
  body: string;
  data?: any;
  receivers: ReceiverDoc[];
  senderName: string;
  senderId?: Types.ObjectId;
  supplierId?: Types.ObjectId;
  status: NotificationStatus;
}

const notificationSchema = new Schema<NotificationDoc>(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },

    data: {
      type: Object,
      required: false,
    },
    receivers: [receiverSchema],
    senderName: {
      type: String,
      required: false,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "User",
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Customer",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.version;
      },
    },
  }
);

notificationSchema.set("versionKey", "version");
notificationSchema.plugin(updateIfCurrentPlugin);

const Notification = model<NotificationDoc>("Notification", notificationSchema);

export { NotificationDoc, Notification };
