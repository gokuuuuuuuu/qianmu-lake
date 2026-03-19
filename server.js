import express from "express";
import { createClient } from "redis";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ── Redis 配置 ──
// 接入真实 Redis 时修改这里
const REDIS_CONFIG = {
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  // password: process.env.REDIS_PASSWORD || '',
};
const REDIS_KEYS = {
  value: "anion:value", // 负氧离子浓度
  updateTime: "anion:update_time", // 更新时间
};

// ── 是否使用虚拟数据（无 Redis 时自动降级） ──
let useMock = true;
let redisClient = null;

async function connectRedis() {
  try {
    redisClient = createClient(REDIS_CONFIG);
    redisClient.on("error", () => {
      useMock = true;
    });
    await redisClient.connect();
    useMock = false;
    console.log("[Redis] 已连接");
  } catch {
    useMock = true;
    console.log("[Redis] 未连接，使用虚拟数据");
  }
}

// ── 虚拟数据生成 ──
function mockValue() {
  return Math.round(
    8500 + (Math.random() - 0.5) * 1400 + Math.sin(Date.now() / 55000) * 900,
  );
}

// ── API 接口 ──
app.get("/api/anion", async (_req, res) => {
  try {
    if (useMock) {
      return res.json({
        value: mockValue(),
        updateTime: new Date().toLocaleString("zh-CN"),
      });
    }
    const [value, updateTime] = await Promise.all([
      redisClient.get(REDIS_KEYS.value),
      redisClient.get(REDIS_KEYS.updateTime),
    ]);
    res.json({
      value: Number(value) || 0,
      updateTime: updateTime || new Date().toLocaleString("zh-CN"),
    });
  } catch {
    // Redis 读取失败，降级到虚拟数据
    res.json({
      value: mockValue(),
      updateTime: new Date().toLocaleString("zh-CN"),
    });
  }
});

// ── 静态文件（生产环境） ──
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ── 启动 ──
await connectRedis();
app.listen(PORT, () => {
  console.log(`[Server] http://localhost:${PORT}`);
  console.log(`[Server] 数据模式: ${useMock ? "虚拟数据" : "Redis"}`);
});
