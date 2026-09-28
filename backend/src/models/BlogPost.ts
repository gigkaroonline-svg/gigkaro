import mongoose, { Schema, type InferSchemaType } from "mongoose";

const blogPostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    coverUrl: { type: String, default: "" },
    authorName: { type: String, default: "GigKaro" },
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
