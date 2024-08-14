import express from "express";
import cors from "cors";
import userRoute from "./routes/userRoute";
import classRoomRoute from "./routes/classRoomRoute";
import postRoute from "./routes/postRoute";
import { swaggerRouter } from "./swagger";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(swaggerRouter);
app.use("/api/users", userRoute);
app.use("/api/classrooms", classRoomRoute);
app.use("/api/posts", postRoute);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
