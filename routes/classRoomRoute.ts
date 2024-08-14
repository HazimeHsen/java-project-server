import { Router, Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Create a new class
router.post("/", async (req: Request, res: Response) => {
  const { name, description, creatorId } = req.body;

  try {
    const classRoom = await prisma.classRoom.create({
      data: {
        name,
        description,
        createdBy: creatorId,
        members: {
          create: { userId: creatorId, role: Role.ADMIN },
        },
      },
    });

    res.status(201).json(classRoom);
  } catch (error) {
    res.status(500).json({ error: "Failed to create class" });
  }
});

// Add a user to a class
router.post("/:classId/add-member", async (req: Request, res: Response) => {
  const { classId } = req.params;
  const { userId, role } = req.body;

  try {
    const member = await prisma.classMember.create({
      data: {
        classId: parseInt(classId),
        userId,
        role,
      },
    });

    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: "Failed to add member" });
  }
});

// Get all members of a class
router.get("/:classId/members", async (req: Request, res: Response) => {
  const { classId } = req.params;

  try {
    const members = await prisma.classMember.findMany({
      where: { classId: parseInt(classId) },
      include: { user: true },
    });

    res.json(members);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

export default router;
