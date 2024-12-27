import mongoose from "mongoose";

interface EventLogAttrs {
  cartId: mongoose.Types.ObjectId;
  eventType: string;
  supplierId?: mongoose.Types.ObjectId;
  merchantId?: mongoose.Types.ObjectId;
  products?: any[];
  receivedAt: Date;
  returnedAt?: Date;
  processingTime?: number;
}

interface EventLogDoc extends mongoose.Document {
  cartId: mongoose.Types.ObjectId;
  eventType: string;
  supplierId?: mongoose.Types.ObjectId;
  merchantId?: mongoose.Types.ObjectId;
  products?: any[];
  receivedAt: Date;
  returnedAt?: Date;
  processingTime?: number;
}

interface EventLogModel extends mongoose.Model<EventLogDoc> {
  build(attrs: EventLogAttrs): EventLogDoc;
}

const eventLogSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    products: {
      type: [mongoose.Schema.Types.Mixed],
      required: false,
    },
    receivedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    returnedAt: {
      type: Date,
      required: false,
    },
    processingTime: {
      type: Number,
      required: false,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
    collection: "eventlogs",
  }
);

eventLogSchema.statics.build = (attrs: EventLogAttrs) => {
  return new EventLog(attrs);
};

const EventLog = mongoose.model<EventLogDoc, EventLogModel>(
  "EventLog",
  eventLogSchema
);

export { EventLog };
