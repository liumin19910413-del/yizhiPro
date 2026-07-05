import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  getDailyReport,
  getLessons,
  getTodayPayload,
  submitTask,
  updateProgress,
} from "./db.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: ["http://127.0.0.1:5179", "http://localhost:5179", "http://127.0.0.1:5173", "http://localhost:5173"],
});

app.get("/api/health", async () => ({
  ok: true,
  service: "after-school-star-api",
}));

app.get("/api/tasks/today", async () => getTodayPayload());

app.get("/api/textbook/lessons", async () => ({
  lessons: getLessons(),
}));

app.post("/api/progress/check", async (request) => {
  const { lessonId, confirmedBy } = request.body || {};
  if (!lessonId) {
    return { error: "lessonId is required" };
  }
  return updateProgress(lessonId, confirmedBy || "child");
});

app.post("/api/tasks/:taskKey/submit", async (request) => {
  const { taskKey } = request.params;
  return submitTask({
    taskKey,
    submissionType: request.body?.submissionType || "答题",
    answerData: request.body?.answerData || {},
    isCorrect: request.body?.isCorrect,
  });
});

app.get("/api/reports/daily", async () => getDailyReport());

app.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  reply.status(error.statusCode || 500).send({
    error: error.message || "Internal Server Error",
  });
});

const port = Number(process.env.API_PORT || 3333);
const host = process.env.API_HOST || "127.0.0.1";

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
