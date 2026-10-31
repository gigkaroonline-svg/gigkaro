import mongoose, { Schema, type InferSchemaType } from "mongoose";

const blogPostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    coverUrl: { type: String, default: "" },
    coverAlt: { type: String, default: "" },
    authorName: { type: String, default: "GigKaro" },
    authorUrl: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type BlogPostDoc = InferSchemaType<typeof blogPostSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const BlogPost = mongoose.model("BlogPost", blogPostSchema);
