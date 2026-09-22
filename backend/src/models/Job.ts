import mongoose, { Schema, type InferSchemaType } from "mongoose";

const jobSchema = new Schema(
  {
    jobKey: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    companyId: { type: String, required: true },
    initials: { type: String, required: true },
    color: { type: String, required: true },
    category: { type: String, required: true, index: true },
    city: { type: String, required: true },
    locality: { type: String, required: true },
    pincode: { type: String, required: true, index: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    distanceKm: { type: Number, default: 0 },
    salaryMin: { type: Number, required: true },
    salaryMax: { type: Number, required: true },
    salaryType: { type: String, default: "monthly" },
    incentiveMax: { type: Number, default: 0 },
    openings: { type: Number, default: 1 },
    immediateJoining: { type: Boolean, default: false },
    vehicle: {
      type: String,
      enum: ["Bike required", "EV accepted", "No vehicle required"],
      required: true,
    },
    verified: { type: Boolean, default: true },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Flexible"],
      required: true,
    },
    shift: {
      type: String,
      enum: ["Morning", "Evening", "Night", "Flexible"],
      required: true,
    },
    postedAt: { type: String, default: "Today" },
    description: { type: String, required: true },
    requirements: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["Active", "Paused", "Rejected", "Pending approval", "Expired"],
      default: "Active",
      index: true,
    },
    /** When true, job appears for any location/pincode search. */
    showEverywhere: { type: Boolean, default: false, index: true },
    employerId: { type: Schema.Types.ObjectId, ref: "User" },
    postedByAdminId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export type JobDoc = InferSchemaType<typeof jobSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Job = mongoose.model("Job", jobSchema);
