import { Document, Schema, Types, model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface LocationDoc extends Document {
  code: number;
  parentCode: number;
  parentId: Types.ObjectId;
  name: string;
  lat: number;
  long: number;
}

const locationSchema = new Schema<LocationDoc>(
  {
    code: {
      type: Number,
      required: false,
    },
    parentCode: {
      type: Number,
      required: false,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Location",
    },
    name: {
      type: String,
      required: true,
    },
    lat: {
      type: Number,
      required: false,
    },
    long: {
      type: Number,
      required: false,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.createdAt;
        delete ret.updatedAt;
        delete ret.version;
      },
    },
  }
);

locationSchema.set("versionKey", "version");
locationSchema.plugin(updateIfCurrentPlugin);

const Location = model<LocationDoc>("Location", locationSchema);

export { LocationDoc, Location };
