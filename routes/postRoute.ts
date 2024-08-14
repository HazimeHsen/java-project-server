import { Router, Request, Response } from "express";
import { PrismaClient, PostType } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Create a new post in a class
router.post("/", async (req: Request, res: Response) => {
  const { title, content, classRoomId, authorId, postType } = req.body;

  try {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        classRoomId,
        authorId,
        postType,
      },
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Get all posts in a class
router.get("/:classRoomId/posts", async (req: Request, res: Response) => {
  const { classRoomId } = req.params;

  try {
    const posts = await prisma.post.findMany({
      where: { classRoomId: parseInt(classRoomId) },
      include: { author: true, comments: true },
    });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

export default router;
