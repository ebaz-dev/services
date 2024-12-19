import { Document, Schema, model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface SequenceDoc extends Document {
    code: string;
    duration: string;
    seq: number;
}

const sequenceSchema = new Schema<SequenceDoc>(
    {
        code: { type: String, required: true },
        duration: { type: String, required: true },
        seq: { type: Number, default: 1 }
    },
    {
        timestamps: true,
        toJSON: {
            transform(doc, ret) {
                ret.id = ret._id;
                delete ret._id;
            },
        },
    }
);

sequenceSchema.set("versionKey", "version");
sequenceSchema.plugin(updateIfCurrentPlugin);

const Sequence = model<SequenceDoc>("Sequence", sequenceSchema);

export { SequenceDoc, Sequence };