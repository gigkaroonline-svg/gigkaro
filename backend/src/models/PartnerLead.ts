import mongoose, { Schema, type HydratedDocument, type InferSchemaType } from "mongoose";

const partnerLeadSchema = new Schema(
  {
    source: { type: String, enum: ["gigkaro", "gsheet"], required: true },
    sourceRef: { type: String, required: true },
    applicationIds: { type: [Schema.Types.ObjectId], ref: "Application", default: [] },
    name: { type: String, default: "" },
    phone: { type: String, required: true, index: true },
    companyKey: { type: String, default: "" },
    clientName: { type: String, required: true },
    city: { type: String, default: "" },
    locality: { type: String, default: "" },
    status: {
      type: String,
      enum: ["queued", "needs_locality", "waiting", "unique", "not_unique", "failed"],
      default: "queued",
      index: true,
    },
    partnerStatus: { type: String, default: "" },
    recommendationHistoryId: { type: String, default: "" },
    scheduledInterviewId: { type: String, default: "" },
    partnerUserId: { type: String, default: "" },
    lastError: { type: String, default: "" },
    attempts: { type: Number, default: 0 },
    priority: { type: Number, default: 1 },
    nextCheckAt: { type: Date },
    checkedAt: { type: Date },
  },
  { timestamps: true },
);

partnerLeadSchema.index({ source: 1, sourceRef: 1 }, { unique: true });
partnerLeadSchema.index({ phone: 1, clientName: 1, createdAt: -1 });
partnerLeadSchema.index({ status: 1, nextCheckAt: 1 });

export type PartnerLeadDoc = HydratedDocument<InferSchemaType<typeof partnerLeadSchema>>;

export const PartnerLead = mongoose.model("PartnerLead", partnerLeadSchema);
