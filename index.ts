import express from "express";
import cors from "cors";
import userRoute from "./routes/userRoute";
import { swaggerRouter } from "./swagger";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(swaggerRouter);
app.use("/api/users", userRoute);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
