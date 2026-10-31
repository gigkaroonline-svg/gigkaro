import mongoose, { Schema } from "mongoose";

const partnerCheckSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    companies: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const PartnerCheckSettings = mongoose.model(
  "PartnerCheckSettings",
  partnerCheckSettingsSchema,
);
