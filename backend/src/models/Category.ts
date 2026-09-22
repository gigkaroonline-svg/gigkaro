import mongoose, { Schema, type InferSchemaType } from "mongoose";

const categorySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    icon: { type: String, default: "briefcase" },
    color: {
      type: String,
      enum: ["blue", "green", "orange", "violet", "rose", "teal", "slate"],
      default: "blue",
    },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export type CategoryDoc = InferSchemaType<typeof categorySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Category = mongoose.model("Category", categorySchema);
