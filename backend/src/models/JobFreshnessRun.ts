import mongoose, { Schema, type InferSchemaType } from "mongoose";

const jobFreshnessRunSchema = new Schema(
  {
    /** Calendar day in Asia/Kolkata, YYYY-MM-DD */
    day: { type: String, required: true, index: true },
    slot: { type: String, enum: ["A", "B", "C"], required: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    notified: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    dryRun: { type: Boolean, default: false },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

jobFreshnessRunSchema.index({ day: 1, slot: 1 }, { unique: true });

export type JobFreshnessRunDoc = InferSchemaType<typeof jobFreshnessRunSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const JobFreshnessRun = mongoose.model(
  "JobFreshnessRun",
  jobFreshnessRunSchema,
);
