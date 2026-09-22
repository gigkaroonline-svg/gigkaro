import mongoose, { Schema, type InferSchemaType } from "mongoose";

const companySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    initials: { type: String, required: true },
    color: {
      type: String,
      enum: ["blue", "green", "orange", "violet", "rose", "teal", "slate"],
      default: "blue",
    },
    logo: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export type CompanyDoc = InferSchemaType<typeof companySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Company = mongoose.model("Company", companySchema);
