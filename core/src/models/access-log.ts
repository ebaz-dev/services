import mongoose from "mongoose";

interface AccessLogAttrs {
  timestamp: Date;
  method: string;
  path: string;
  userId?: string;
  deviceId?: string;
  statusCode: number;
  responseTime: number;
  userAgent: string;
  ip: string;
  service: string;
  errorMessage?: string;
  errorStack?: string;
  responseBody?: any;
}

interface AccessLogDoc extends mongoose.Document {
  timestamp: Date;
  method: string;
  path: string;
  userId?: string;
  deviceId?: string;
  statusCode: number;
  responseTime: number;
  userAgent: string;
  ip: string;
  service: string;
  errorMessage?: string;
  errorStack?: string;
  responseBody?: any;
}

interface AccessLogModel extends mongoose.Model<AccessLogDoc> {
  build(attrs: AccessLogAttrs): AccessLogDoc;
}

const accessLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
    },
    deviceId: {
      type: String,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    responseTime: {
      type: Number,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    service: {
      type: String,
      required: true,
    },
    errorMessage: {
      type: String,
    },
    errorStack: {
      type: String,
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed,
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
  }
);

accessLogSchema.index({ timestamp: -1 });
accessLogSchema.index({ userId: 1 });
accessLogSchema.index({ service: 1 });
accessLogSchema.index({ statusCode: 1 });

accessLogSchema.statics.build = (attrs: AccessLogAttrs) => {
  return new AccessLog(attrs);
};

const AccessLog = mongoose.model<AccessLogDoc, AccessLogModel>(
  "AccessLog",
  accessLogSchema
);

export { AccessLog };
