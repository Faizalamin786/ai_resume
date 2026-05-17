import express from "express";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import resumeRouter from "./routes/resume.routes.js";
import cors from "cors";
import { config } from "dotenv";
config();

const app = express();

const allowedOrigins = [
  process.env.ALLOWED_SITE,
  "https://ai-resume-zeta-ten.vercel.app",
    "https://ai-resume-ekjrlamkz-faizals-projects-96c8bb70.vercel.app"
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/users", userRouter);
app.use("/api/resumes", resumeRouter);

export default app;