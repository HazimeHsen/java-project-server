import { Router, Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { body, param, validationResult } from "express-validator";
import multer from "multer";
import path from "path";

const router = Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/**
 * @swagger
 * /api/classrooms/upload:
 *   post:
 *     summary: Upload a file
 *     description: Uploads a file and saves it to the public folder.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { fileType, userId, classId, fileName } = req.body;
    console.log(fileType, userId, classId, fileName);

    const fileUrl = `${req.protocol}://${req.get("host")}/public/${
      req.file.filename
    }`;

    try {
      const fileUpload = await prisma.fileUpload.create({
        data: {
          filePath: fileUrl,
          fileType,
          userId: Number(userId),
          classId: Number(classId),
          fileName,
        },
      });

      res
        .status(201)
        .json({ message: "File uploaded successfully", fileUpload });
    } catch (error) {
      console.error("Error saving file metadata:", error);
      res.status(500).json({ error: "Failed to save file metadata" });
    }
  }
);

/**
 * @swagger
 * /api/classrooms/{classId}/files:
 *   get:
 *     summary: Get files for a class
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         description: ID of the classroom
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of files for the class
 *       404:
 *         description: Class not found
 *       500:
 *         description: Server error
 */
router.get("/:classId/files", async (req: Request, res: Response) => {
  const { classId } = req.params;

  try {
    const files = await prisma.fileUpload.findMany({
      where: {
        classId: Number(classId),
      },
      include: {
        user: true,
        class: true,
        comments: {
          include: {
            author: true,
          },
        },
      },
    });

    res.json(files);
  } catch (error) {
    console.error("Failed to fetch files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

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

    try {
      const classes = await prisma.classRoom.findMany({
        where: {
          members: {
            some: {
              userId: Number(userId),
            },
          },
        },
        include: {
          members: {
            include: {
              user: true,
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
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { classId } = req.params;
    const { userId } = req.body;

    try {
      const member = await prisma.classMember.create({
        data: {
          classId: Number(classId),
          userId: Number(userId),
          role: Role.NORMAL,
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

/**
 * @swagger
 * /api/classrooms/{classId}/available-members/{currentUserId}:
 *   get:
 *     summary: Get available users for a class
 *     description: Retrieves a list of users who are not in the specified class and are not the current user.
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         description: ID of the classroom
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: path
 *         name: currentUserId
 *         required: true
 *         description: ID of the current user
 *         schema:
 *           type: integer
 *           example: 2
 *     responses:
 *       200:
 *         description: List of available users
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
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.get(
  "/:classId/available-members/:currentUserId",
  [
    param("classId")
      .isInt({ gt: 0 })
      .withMessage("Class ID must be a valid positive integer")
      .toInt(),
    param("currentUserId")
      .isInt({ gt: 0 })
      .withMessage("Current User ID must be a valid positive integer")
      .toInt(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { classId, currentUserId } = req.params;

    try {
      const allUsers = await prisma.user.findMany({
        where: {
          id: {
            not: Number(currentUserId),
          },
        },
      });

      const classMembers = await prisma.classMember.findMany({
        where: {
          classId: Number(classId),
        },
        select: {
          userId: true,
        },
      });

      const memberIds = classMembers.map((member) => member.userId);

      const availableUsers = allUsers.filter(
        (user) => !memberIds.includes(user.id)
      );

      res.json(availableUsers);
    } catch (error) {
      console.error("Failed to fetch available users:", error);
      res.status(500).json({ error: "Failed to fetch available users" });
    }
  }
);

/**
 * @swagger
 * /api/files/{fileId}/comments:
 *   post:
 *     summary: Add a comment to a file
 *     description: Adds a comment to a specific file upload.
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         description: ID of the file
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: This is a comment.
 *               authorId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 content:
 *                   type: string
 *                 fileId:
 *                   type: integer
 *                 authorId:
 *                   type: integer
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post(
  "/:classId/files/:fileId/comments",

  async (req: Request, res: Response) => {
    const { fileId } = req.params;
    const { content, authorId } = req.body;
    console.log(content, authorId, fileId);

    try {
      const newComment = await prisma.comment.create({
        data: {
          content,
          fileId: Number(fileId),
          authorId: Number(authorId),
        },
      });

      res.status(201).json(newComment);
    } catch (error) {
      console.error("Failed to add comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  }
);

/**
 * @swagger
 * /api/files/{fileId}/comments:
 *   get:
 *     summary: Get comments for a file
 *     description: Retrieves a list of comments for a specific file upload.
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         description: ID of the file
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of comments for the file
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   content:
 *                     type: string
 *                   fileId:
 *                     type: integer
 *                   authorId:
 *                     type: integer
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.get(
  "/files/:fileId/comments",
  [
    param("fileId")
      .isInt({ gt: 0 })
      .withMessage("File ID must be a valid positive integer")
      .toInt(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fileId } = req.params;

    try {
      const comments = await prisma.comment.findMany({
        where: { fileId: Number(fileId) },
        include: { author: true },
      });

      res.json(comments);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  }
);

/**
 * @swagger
 * /api/classrooms/{classId}/update-member-role:
 *   put:
 *     summary: Update a user's role in a classroom
 *     description: Updates the role of a specified user in a classroom.
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         description: ID of the classroom
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: body
 *         name: body
 *         description: Data to update the user's role
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: integer
 *                   example: 2
 *                 role:
 *                   type: string
 *                   enum:
 *                     - NORMAL
 *                     - MODERATOR
 *                   example: NORMAL
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Role updated successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                         example: User ID must be a valid positive integer
 *                       param:
 *                         type: string
 *                         example: userId
 *       404:
 *         description: Member not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Member not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to update role
 */
router.put(
  "/:classId/update-member-role",

  async (req: Request, res: Response) => {
    const { classId } = req.params;
    const { userId, role } = req.body;
    console.log(userId, role, classId);

    try {
      const updatedMember = await prisma.classMember.updateMany({
        where: {
          classId: Number(classId),
          userId: Number(userId),
        },
        data: {
          role,
        },
      });

      if (updatedMember.count === 0) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.status(200).json({ message: "Role updated successfully" });
    } catch (error) {
      console.error("Failed to update role:", error);
      res.status(500).json({ error: "Failed to update role" });
    }
  }
);


router.post("/:classId/assignments", async (req: Request, res: Response) => {
  const { classId } = req.params;
  const { title, description, createdBy, fileId } = req.body;
  console.log(title, description, createdBy, fileId);

  try {
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        classId: Number(classId),
        createdBy: Number(createdBy),
        fileId: Number(fileId),
      },
    });

    const classMembers = await prisma.classMember.findMany({
      where: {
        classId: Number(classId),
        userId: {
          not: Number(createdBy),
        },
      },
    });

    const assignmentAssignments = classMembers.map((member) => ({
      assignmentId: assignment.id,
      userId: member.userId,
    }));

    await prisma.assignmentAssignmentTo.createMany({
      data: assignmentAssignments,
    });

    res.status(201).json({
      message: "Assignment created and assigned successfully",
      assignment,
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

router.get(
  "/:classId/:userId/assignments",
  async (req: Request, res: Response) => {
    const { classId, userId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      const assignments = await prisma.assignment.findMany({
        where: { classId: Number(classId) },
        include: {
          assignedTo: {
            where: { userId: Number(userId) },
          },
          file: true,
          submissions: {
            where: { userId: Number(userId) },
          },
        },
      });

      res.status(200).json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  }
);

router.post(
  "/:assignmentId/submit",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const { assignmentId } = req.params;
    const { userId } = req.body;
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Save file details to the database
      const submission = await prisma.submission.create({
        data: {
          assignmentId: Number(assignmentId),
          userId: Number(userId),
          fileName: file.originalname,
          filePath: file.path, // File path where the file is stored
        },
      });

      res.status(201).json({
        message: "Assignment submitted successfully",
        submission,
      });
    } catch (error) {
      console.error("Error submitting assignment:", error);
      res.status(500).json({ error: "Failed to submit assignment" });
    }
  }
);

router.get(
  "/:assignmentId/submissions",
  async (req: Request, res: Response) => {
    const { assignmentId } = req.params;

    try {
      const submissions = await prisma.submission.findMany({
        where: { assignmentId: Number(assignmentId) },
        include: {
          user: true,
        },
      });

      res.status(200).json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  }
);


export default router;
