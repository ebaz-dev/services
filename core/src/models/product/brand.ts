import mongoose, {
  Document,
  Schema,
  model,
  Types,
  Model,
} from "../../lib/mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface BrandDoc extends Document {
  id: Types.ObjectId;
  name: string;
  slug: string;
  customerId: Types.ObjectId;
  vendorId?: Types.ObjectId;
  image: string;
  isActive: boolean;
  priority: number;
  isDeleted?: boolean;
}

interface BrandModel extends Model<BrandDoc> {}

const brandSchema = new Schema<BrandDoc>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      required: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
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
    timestamps: true,
  }
);

brandSchema.plugin(updateIfCurrentPlugin);

brandSchema.pre("save", async function (next) {
  if (!this.isModified("priority")) {
    return next();
  }

  const brand = this as BrandDoc;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const currentPriority = brand.priority;

    const existingBrand = await (brand.constructor as BrandModel)
      .findById(brand.id)
      .session(session);

    if (!existingBrand) {
      throw new Error("Brand not found");
    }

    const oldPriority = existingBrand.priority;

    if (currentPriority === oldPriority) {
      await session.commitTransaction();
      session.endSession();
      return next();
    }

    let query: {
      customerId: Types.ObjectId;
      priority: any;
      vendorId?: Types.ObjectId;
    };

    if (oldPriority < currentPriority) {
      query = {
        customerId: brand.customerId,
        priority: { $gt: oldPriority, $lte: currentPriority },
      };

      if (brand.vendorId) {
        query.vendorId = brand.vendorId;
      }

      await (brand.constructor as BrandModel)
        .updateMany(query, { $inc: { priority: -1 } })
        .session(session);
    } else {
      query = {
        customerId: brand.customerId,
        priority: { $gte: currentPriority, $lt: oldPriority },
      };

      if (brand.vendorId) {
        query.vendorId = brand.vendorId;
      }

      await (brand.constructor as BrandModel)
        .updateMany(query, { $inc: { priority: 1 } })
        .session(session);
    }

    await session.commitTransaction();
    session.endSession();
    next();
  } catch (error: any) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

const Brand = model<BrandDoc, BrandModel>("Brand", brandSchema);

export { Brand };
