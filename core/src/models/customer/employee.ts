import { Document, Schema, Types, model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { EmployeeRoles } from "../../types/employee-roles";

interface EmployeeDoc extends Document {
  customerId: Types.ObjectId;
  userId: Types.ObjectId;
  role: EmployeeRoles;
}

const employeeSchema = new Schema<EmployeeDoc>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    role: { type: String, enum: Object.values(EmployeeRoles) },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

employeeSchema.virtual("customer", {
  ref: "Customer",
  localField: "customerId",
  foreignField: "_id",
  justOne: true,
});
employeeSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

employeeSchema.set("versionKey", "version");
employeeSchema.plugin(updateIfCurrentPlugin);

const Employee = model<EmployeeDoc>("Employee", employeeSchema);

export { EmployeeDoc, Employee };
