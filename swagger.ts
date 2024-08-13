import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Router } from "express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "API documentation for my application",
    },
  },
  apis: ["./routes/*.ts"],
};

const specs = swaggerJsdoc(swaggerOptions);

const router = Router();
router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

export { router as swaggerRouter };
