import express from "express";
import cors from "cors";
import userRoute from "./routes/userRoute";
import classRoomRoute from "./routes/classRoomRoute";
import { swaggerRouter } from "./swagger";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use("/public", express.static(path.join(__dirname, "public")));

app.use(swaggerRouter);
app.use("/api/users", userRoute);
app.use("/api/classrooms", classRoomRoute);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
