import mongoose, { Schema, type InferSchemaType } from "mongoose";

const analyticsEventSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["pageview", "event"],
      required: true,
      index: true,
    },
    name: { type: String, default: "", index: true },
    path: { type: String, required: true, index: true },
    title: { type: String, default: "" },
    referrer: { type: String, default: "" },
    source: { type: String, default: "", index: true },
    medium: { type: String, default: "", index: true },
    campaign: { type: String, default: "" },
    utmSource: { type: String, default: "" },
    utmMedium: { type: String, default: "" },
    utmCampaign: { type: String, default: "" },
    utmContent: { type: String, default: "" },
    utmTerm: { type: String, default: "" },
    visitorId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, default: "", index: true },
    userAgent: { type: String, default: "" },
    language: { type: String, default: "" },
    screen: { type: String, default: "" },
    props: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

analyticsEventSchema.index({ createdAt: -1 });
analyticsEventSchema.index({ type: 1, createdAt: -1 });
// Keep ~180 days of first-party traffic.
analyticsEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 180 * 24 * 60 * 60 },
);

export type AnalyticsEventDoc = InferSchemaType<typeof analyticsEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AnalyticsEvent = mongoose.model(
  "AnalyticsEvent",
  analyticsEventSchema,
);
