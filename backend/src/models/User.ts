import mongoose, { Schema, type InferSchemaType } from "mongoose";

const profileSchema = new Schema(
  {
    name: { type: String, default: "" },
    mobile: { type: String, default: "" },
    email: { type: String, default: "" },
    pincode: { type: String, default: "560034" },
    city: { type: String, default: "Bengaluru" },
    radius: { type: String, default: "10" },
    category: { type: String, default: "delivery" },
    employmentType: { type: String, default: "Flexible" },
    shift: { type: String, default: "Flexible" },
    vehicle: { type: String, default: "No vehicle required" },
    licence: { type: String, default: "No" },
    dob: { type: String, default: "" },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["candidate", "employer", "admin"],
      default: "candidate",
    },
    mobile: { type: String, sparse: true, unique: true },
    email: { type: String, sparse: true, unique: true, lowercase: true },
    name: { type: String, default: "" },
    otp: { type: String },
    otpExpires: { type: Date },
    profile: { type: profileSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User = mongoose.model("User", userSchema);
