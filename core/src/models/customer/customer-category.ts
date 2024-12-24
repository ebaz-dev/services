import { Document, Schema, Types, model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { CustomerType } from "./customer";


interface CustomerCategoryDoc extends Document {
    parentId: Types.ObjectId;
    name: string;
    type: CustomerType;

}

const customerCategorySchema = new Schema<CustomerCategoryDoc>(
    {
        parentId: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: "CustomerCategory",
        },
        name: {
            type: String,
            required: true,
        },

        type: { type: String, enum: Object.values(CustomerType), required: true },

    },
    {
        timestamps: true,
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

customerCategorySchema.set("versionKey", "version");
customerCategorySchema.plugin(updateIfCurrentPlugin);

const CustomerCategory = model<CustomerCategoryDoc>("CustomerCategory", customerCategorySchema);

export { CustomerCategoryDoc, CustomerCategory };


