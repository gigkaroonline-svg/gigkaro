import mongoose, { Schema, type InferSchemaType } from "mongoose";

const sheetSourceSchema = new Schema(
  {
    name: { type: String, required: true },
    spreadsheetId: { type: String, required: true },
    tab: { type: String, required: true },
    columns: {
      name: { type: String, default: "Name" },
      phone: { type: String, default: "Phone" },
      city: { type: String, default: "City" },
      company: { type: String, default: "Company" },
      locality: { type: String, default: "Locality" },
    },
    active: { type: Boolean, default: true },
    lastError: { type: String, default: "" },
    lastSyncedAt: { type: Date },
    rowsSeen: { type: Number, default: 0 },
  },
  { timestamps: true },
);

sheetSourceSchema.index({ spreadsheetId: 1, tab: 1 }, { unique: true });

export type SheetSourceDoc = InferSchemaType<typeof sheetSourceSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SheetSource = mongoose.model("SheetSource", sheetSourceSchema);
