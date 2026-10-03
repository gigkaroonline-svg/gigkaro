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
// Only enforce one application per logged-in user+job.
// Guest applies omit userId; a sparse unique index still treats null as a value
// and blocks every second guest for the same job.
applicationSchema.index(
  { userId: 1, jobId: 1 },
  {
    unique: true,
    partialFilterExpression: { userId: { $type: "objectId" } },
  },
);

export type ApplicationDoc = InferSchemaType<typeof applicationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Application = mongoose.model("Application", applicationSchema);

/** Drop the old sparse unique index if present, then sync schema indexes. */
export async function ensureApplicationIndexes() {
  try {
    const indexes = await Application.collection.indexes();
    const legacy = indexes.find((idx) => idx.name === "userId_1_jobId_1");
    if (legacy && !legacy.partialFilterExpression) {
      await Application.collection.dropIndex("userId_1_jobId_1");
      console.log("Dropped legacy applications userId_1_jobId_1 index");
    }
  } catch (err) {
    console.warn(
      "Could not inspect applications indexes:",
      err instanceof Error ? err.message : err,
    );
  }
  await Application.syncIndexes();
}
