import { Router } from "express";
import {
  getPublishedBlog,
  listPublishedBlogs,
} from "../controllers/blogsController.js";

export const blogsRouter = Router();

blogsRouter.get("/", listPublishedBlogs);
blogsRouter.get("/:slug", getPublishedBlog);
