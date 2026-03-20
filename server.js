import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { WebSocket } from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ── 静态文件（生产环境） ──
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const server = createServer(app);

// ── Socket.IO 服务端 ──
const io = new SocketIOServer(server);

io.on("connection", (socket) => {
  console.log(`[Socket.IO] 客户端连接 (${io.engine.clientsCount})`);
  socket.on("disconnect", () => {
    console.log(`[Socket.IO] 客户端断开 (${io.engine.clientsCount})`);
  });
});

// ── 远程 WebSocket 代理 ──
const REMOTE_WS_URI = "ws://8.137.125.214:8092";
const REMOTE_WS_HEADERS = { token: "dinglan" };
let remoteWs = null;
let remoteRetryDelay = 1000;
let fakeDataTimer = null;
let dataTimeout = null;
const DATA_TIMEOUT_MS = 10000; // 10秒没收到数据就启动模拟

function randomValue() {
  return Math.round(2500 + Math.random() * 1000);
}

function startFakeData() {
  if (fakeDataTimer) return;
  console.log("[模拟数据] 开始生成模拟数据 (2500-3500)");
  fakeDataTimer = setInterval(() => {
    const now = new Date();
    const msg = JSON.stringify({
      ion_value: randomValue(),
      update_time: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`,
    });
    io.emit("ws-message", msg);
  }, 2000);
}

function stopFakeData() {
  if (fakeDataTimer) {
    console.log("[模拟数据] 停止模拟数据");
    clearInterval(fakeDataTimer);
    fakeDataTimer = null;
  }
}

// 重置数据超时计时器：每次收到真实数据时调用
function resetDataTimeout() {
  clearTimeout(dataTimeout);
  stopFakeData();
  dataTimeout = setTimeout(() => {
    console.log(`[WS 代理] ${DATA_TIMEOUT_MS / 1000}秒未收到数据，启动模拟`);
    startFakeData();
  }, DATA_TIMEOUT_MS);
}

function connectRemoteWS() {
  remoteWs = new WebSocket(REMOTE_WS_URI, { headers: REMOTE_WS_HEADERS });

  remoteWs.on("open", () => {
    console.log("[WS 代理] 已连接远程服务器");
    remoteRetryDelay = 1000;
    // 连接成功后开始计时，等待数据
    resetDataTimeout();
  });

  remoteWs.on("message", (data) => {
    const msg = data.toString();
    io.emit("ws-message", msg);
    // 收到真实数据，重置超时计时器
    resetDataTimeout();
  });

  remoteWs.on("close", () => {
    clearTimeout(dataTimeout);
    console.log(`[WS 代理] 远程连接断开，${remoteRetryDelay / 1000}s 后重连`);
    startFakeData();
    setTimeout(connectRemoteWS, remoteRetryDelay);
    remoteRetryDelay = Math.min(remoteRetryDelay * 2, 30000);
  });

  remoteWs.on("error", (err) => {
    console.error("[WS 代理] 远程连接错误", err.message);
    remoteWs.close();
  });
}

// ── 启动 ──
connectRemoteWS();
server.listen(PORT, () => {
  console.log(`[Server] http://localhost:${PORT}`);
});
