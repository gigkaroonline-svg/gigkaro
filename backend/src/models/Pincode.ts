import mongoose, { Schema, type InferSchemaType } from "mongoose";

const pincodeSchema = new Schema(
  {
    pincode: { type: String, required: true, unique: true, index: true },
    locality: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true },
    state: { type: String, default: "", index: true },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
  },
  { timestamps: false },
);

pincodeSchema.index({ locality: "text", city: "text", state: "text", pincode: "text" });

export type PincodeDoc = InferSchemaType<typeof pincodeSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Pincode = mongoose.model("Pincode", pincodeSchema);
