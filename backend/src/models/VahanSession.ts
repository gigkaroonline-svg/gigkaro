import mongoose, { Schema } from "mongoose";

const vahanSessionSchema = new Schema(
  {
    accessToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const VahanSession = mongoose.model("VahanSession", vahanSessionSchema);
