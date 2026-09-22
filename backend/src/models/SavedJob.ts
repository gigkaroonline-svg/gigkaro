import mongoose, { Schema, type InferSchemaType } from "mongoose";

const savedJobSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

savedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export type SavedJobDoc = InferSchemaType<typeof savedJobSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SavedJob = mongoose.model("SavedJob", savedJobSchema);
