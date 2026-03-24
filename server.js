import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ── 静态文件（生产环境） ──
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const server = createServer(app);

// ── 启动 ──
server.listen(PORT, () => {
  console.log(`[Server] http://localhost:${PORT}`);
});
