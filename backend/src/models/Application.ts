import mongoose, { Schema, type InferSchemaType } from "mongoose";

const applicationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    mobile: { type: String, required: true, index: true },
    pincode: { type: String, required: true },
    bike: { type: String, required: true },
    licence: { type: String, required: true },
    joining: { type: String, required: true },
    status: {
      type: String,
      enum: ["Applied", "Contacted", "Interview", "Selected", "Joined"],
      default: "Applied",
    },
  },
  { timestamps: true },
);

applicationSchema.index({ mobile: 1, jobId: 1 }, { unique: true });
applicationSchema.index(
  { userId: 1, jobId: 1 },
  { unique: true, sparse: true },
);

export type ApplicationDoc = InferSchemaType<typeof applicationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Application = mongoose.model("Application", applicationSchema);
