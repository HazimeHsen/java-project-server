import { Router, Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { body, param, validationResult } from "express-validator";

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/users/{userId}/classes:
 *   get:
 *     summary: Get classes of a user
 *     description: Retrieves a list of classrooms associated with a specified user.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: List of user classes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   createdBy:
 *                     type: integer
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.get(
  "/:userId/classes",
  [
    param("userId")
      .isInt({ gt: 0 })
      .withMessage("User ID must be a valid positive integer")
      .toInt(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
console.log(userId);

    try {
      const classes = await prisma.classRoom.findMany({
        where: {
          members: {
            some: {
              userId: Number(userId),
            },
          },
        },
      });

      res.json(classes);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  }
);


/**
 * @swagger
 * /api/classrooms:
 *   post:
 *     summary: Create a new class
 *     description: Creates a new classroom with the given name, description, and creator ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Math 101
 *               description:
 *                 type: string
 *                 example: Introduction to basic math concepts.
 *               creatorId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Classroom created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 createdBy:
 *                   type: integer
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  [
    body("name")
      .notEmpty()
      .withMessage("Class name is required")
      .isString()
      .withMessage("Class name must be a string"),
    body("description")
      .notEmpty()
      .withMessage("Description is required")
      .isString()
      .withMessage("Description must be a string"),
    body("creatorId")
      .isInt({ gt: 0 })
      .withMessage("Creator ID must be a valid positive integer")
      .toInt(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, creatorId } = req.body;

    try {
      const classRoom = await prisma.classRoom.create({
        data: {
          name,
          description,
          createdBy: Number(creatorId),
          members: {
            create: { userId: Number(creatorId), role: Role.ADMIN },
          },
        },
      });

      res.status(201).json(classRoom);
    } catch (error) {
      console.error("Failed to create class:", error);
      res.status(500).json({ error: "Failed to create class" });
    }
  }
);

/**
 * @swagger
 * /api/classrooms/{classId}/add-member:
 *   post:
 *     summary: Add a member to a class
 *     description: Adds a member to a classroom with the specified role.
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         description: ID of the classroom
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 2
 *               role:
 *                 type: string
 *                 example: MEMBER
 *     responses:
 *       201:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 classId:
 *                   type: integer
 *                 userId:
 *                   type: integer
 *                 role:
 *                   type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  "/:classId/add-member",
  [
    param("classId")
      .isInt({ gt: 0 })
      .withMessage("Class ID must be a valid positive integer")
      .toInt(),
    body("userId")
      .isInt({ gt: 0 })
      .withMessage("User ID must be a valid positive integer")
      .toInt(),
    body("role")
      .isString()
      .withMessage("Role must be a string")
      .isIn(Object.values(Role))
      .withMessage("Invalid role"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { classId } = req.params;
    const { userId, role } = req.body;

    try {
      const member = await prisma.classMember.create({
        data: {
          classId: Number(classId),
          userId: Number(userId),
          role,
        },
      });

      res.status(201).json(member);
    } catch (error) {
      console.error("Failed to add member:", error);
      res.status(500).json({ error: "Failed to add member" });
    }
  }
);

/**
 * @swagger
 * /api/classrooms/{classId}/members:
 *   get:
 *     summary: Get members of a class
 *     description: Retrieves a list of members for a specified classroom.
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         description: ID of the classroom
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: List of class members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   classId:
 *                     type: integer
 *                   userId:
 *                     type: integer
 *                   role:
 *                     type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.get(
  "/:classId/members",
  [
    param("classId")
      .isInt({ gt: 0 })
      .withMessage("Class ID must be a valid positive integer")
      .toInt(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { classId } = req.params;

    try {
      const members = await prisma.classMember.findMany({
        where: { classId: Number(classId) },
        include: { user: true },
      });

      res.json(members);
    } catch (error) {
      console.error("Failed to fetch members:", error);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  }
);

export default router;
