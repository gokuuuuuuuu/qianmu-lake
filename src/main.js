import "./style.css";
import { io } from "socket.io-client";

("use strict");

// ════════════════════════════════════════
//  BACKGROUND CANVAS
// ════════════════════════════════════════
const bgC = document.getElementById("bgCanvas"),
  bgX = bgC.getContext("2d");
let BW, BH;
const rnd = (a, b) => a + Math.random() * (b - a);

function resizeBG() {
  BW = bgC.width = innerWidth;
  BH = bgC.height = innerHeight;
}
resizeBG();
addEventListener("resize", () => {
  resizeBG();
  initBG();
});

let blobs = [],
  motes = [];

function initBG() {
  blobs = Array.from({ length: 6 }, () => ({
    x: rnd(0.05, 0.95),
    y: rnd(0.05, 0.9),
    rx: rnd(180, 320),
    ry: rnd(80, 160),
    hue: rnd(210, 230),
    sat: rnd(50, 70),
    lit: rnd(18, 30),
    alpha: rnd(0.15, 0.3),
    vx: rnd(-0.00006, 0.00006),
    vy: rnd(-0.00005, 0.00005),
  }));
  motes = Array.from({ length: 80 }, mkMote);
}

function mkMote() {
  return {
    x: rnd(0, 1),
    y: rnd(0, 1),
    r: rnd(0.4, 1.6),
    vx: rnd(-0.05, 0.05),
    vy: rnd(-0.09, -0.015),
    hue: rnd(200, 230),
    alpha: rnd(0.04, 0.14),
    life: rnd(0, 1),
    decay: rnd(0.001, 0.0035),
    w: rnd(0, Math.PI * 2),
    ws: rnd(0.006, 0.018),
    wa: rnd(0.02, 0.15),
  };
}

initBG();

function drawBG() {
  bgX.clearRect(0, 0, BW, BH);
  bgX.fillStyle = "#0a1628";
  bgX.fillRect(0, 0, BW, BH);
  blobs.forEach((b) => {
    b.x += b.vx;
    b.y += b.vy;
    if (b.x < -0.15) b.x = 1.15;
    if (b.x > 1.15) b.x = -0.15;
    if (b.y < -0.15) b.y = 1.15;
    if (b.y > 1.15) b.y = -0.15;
    bgX.save();
    bgX.translate(b.x * BW, b.y * BH);
    bgX.scale(1, b.ry / b.rx);
    const gr = bgX.createRadialGradient(0, 0, 0, 0, 0, b.rx);
    gr.addColorStop(0, `hsla(${b.hue},${b.sat}%,${b.lit}%,${b.alpha})`);
    gr.addColorStop(1, `hsla(${b.hue},${b.sat}%,${b.lit}%,0)`);
    bgX.fillStyle = gr;
    bgX.beginPath();
    bgX.arc(0, 0, b.rx, 0, Math.PI * 2);
    bgX.fill();
    bgX.restore();
  });
  motes.forEach((m, i) => {
    m.w += m.ws;
    m.x += m.vx + Math.sin(m.w) * m.wa * 0.007;
    m.y += m.vy;
    m.life -= m.decay;
    if (m.life <= 0 || m.y < -0.01) {
      motes[i] = mkMote();
      motes[i].y = 1.01;
      motes[i].life = 0.02;
      return;
    }
    const a = m.alpha * Math.min(m.life * 4, 1) * Math.min((1 - m.life) * 4, 1);
    if (a < 0.003) return;
    bgX.beginPath();
    bgX.arc(m.x * BW, m.y * BH, m.r, 0, Math.PI * 2);
    bgX.fillStyle = `hsla(${m.hue},50%,55%,${a})`;
    bgX.fill();
  });
}

// ════════════════════════════════════════
//  BUBBLES
// ════════════════════════════════════════
const bubC = document.getElementById("bubbleCanvas"),
  bubX = bubC.getContext("2d");
const BCX = 170,
  BCY = 170;
const bubbles = Array.from({ length: 40 }, () => mkBubble());

function mkBubble() {
  const a = rnd(0, Math.PI * 2),
    d = rnd(72, 135);
  return {
    x: BCX + Math.cos(a) * d,
    y: BCY + Math.sin(a) * d,
    r: rnd(3, 14),
    vx: Math.cos(a) * rnd(0.12, 0.36),
    vy: Math.sin(a) * rnd(0.12, 0.36) - rnd(0.06, 0.22),
    hue: rnd(202, 232),
    alpha: rnd(0.22, 0.68),
    life: rnd(0, 1),
    decay: rnd(0.005, 0.012),
    wobble: rnd(0, Math.PI * 2),
    ws: rnd(0.01, 0.026),
    wa: rnd(0.04, 0.18),
  };
}

function drawBubbles() {
  bubX.clearRect(0, 0, 340, 340);
  bubbles.forEach((b, i) => {
    b.wobble += b.ws;
    b.x += b.vx + Math.sin(b.wobble) * b.wa;
    b.y += b.vy;
    b.life += b.decay;
    if (b.life >= 1 || Math.hypot(b.x - BCX, b.y - BCY) > 180) {
      bubbles[i] = mkBubble();
      bubbles[i].life = 0;
      return;
    }
    const a = b.alpha * Math.sin(b.life * Math.PI);
    if (a < 0.005) return;
    bubX.beginPath();
    bubX.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    bubX.strokeStyle = `hsla(${b.hue},65%,60%,${a * 0.88})`;
    bubX.lineWidth = 1.1;
    bubX.stroke();
    const ig = bubX.createRadialGradient(
      b.x - b.r * 0.25,
      b.y - b.r * 0.28,
      0,
      b.x,
      b.y,
      b.r,
    );
    ig.addColorStop(0, `hsla(${b.hue},62%,82%,${a * 0.48})`);
    ig.addColorStop(0.6, `hsla(${b.hue},55%,62%,${a * 0.14})`);
    ig.addColorStop(1, `hsla(${b.hue},50%,52%,0)`);
    bubX.fillStyle = ig;
    bubX.fill();
    bubX.beginPath();
    bubX.arc(b.x - b.r * 0.28, b.y - b.r * 0.3, b.r * 0.22, 0, Math.PI * 2);
    bubX.fillStyle = `rgba(255,255,255,${a * 0.52})`;
    bubX.fill();
    if (b.r > 6) {
      bubX.beginPath();
      bubX.arc(b.x + b.r * 0.28, b.y + b.r * 0.2, b.r * 0.1, 0, Math.PI * 2);
      bubX.fillStyle = `rgba(255,255,255,${a * 0.22})`;
      bubX.fill();
    }
  });
}

// ════════════════════════════════════════
//  RING CANVAS
// ════════════════════════════════════════
const ringC = document.getElementById("ringCanvas"),
  ringX = ringC.getContext("2d");
let ringAngle = 0,
  ringVal = 0,
  ringTarget = 0;

function drawRing(val) {
  const S = 340,
    cx = 170,
    cy = 170,
    R = 152;
  ringX.clearRect(0, 0, S, S);

  ringX.beginPath();
  ringX.arc(cx, cy, R, 0, Math.PI * 2);
  ringX.strokeStyle = "rgba(58,139,235,.15)";
  ringX.lineWidth = 1.3;
  ringX.stroke();

  ringAngle += 0.004;
  [
    [R + 9, 1, 0.1, [5, 13]],
    [R + 20, -1.4, 0.065, [2, 16]],
    [R + 33, 0.75, 0.045, [3, 20]],
  ].forEach(([r, dir, op, dash]) => {
    ringX.save();
    ringX.translate(cx, cy);
    ringX.rotate(ringAngle * dir);
    ringX.setLineDash(dash);
    ringX.beginPath();
    ringX.arc(0, 0, r, 0, Math.PI * 2);
    ringX.strokeStyle = `rgba(58,139,235,${op})`;
    ringX.lineWidth = 0.78;
    ringX.stroke();
    ringX.setLineDash([]);
    ringX.restore();
  });

  for (let t = 0; t < 36; t++) {
    const a = (Math.PI * 2 * t) / 36,
      isL = t % 9 === 0;
    ringX.beginPath();
    ringX.moveTo(cx + Math.cos(a) * (R - 1), cy + Math.sin(a) * (R - 1));
    ringX.lineTo(
      cx + Math.cos(a) * (R + (isL ? 9 : 4)),
      cy + Math.sin(a) * (R + (isL ? 9 : 4)),
    );
    ringX.strokeStyle = `rgba(58,139,235,${isL ? 0.25 : 0.1})`;
    ringX.lineWidth = isL ? 1.1 : 0.58;
    ringX.stroke();
  }

  const frac = Math.min(val / 12000, 1),
    sa = -Math.PI * 0.75,
    ea = sa + frac * Math.PI * 1.5;
  ringX.save();
  ringX.shadowBlur = 11;
  ringX.shadowColor = "rgba(58,139,235,.35)";
  ringX.beginPath();
  ringX.arc(cx, cy, R, sa, ea);
  ringX.strokeStyle = "rgba(58,139,235,.75)";
  ringX.lineWidth = 2.6;
  ringX.lineCap = "round";
  ringX.stroke();
  ringX.restore();

  if (val > 0) {
    const ex = cx + Math.cos(ea) * R,
      ey = cy + Math.sin(ea) * R;
    ringX.beginPath();
    ringX.arc(ex, ey, 4.5, 0, Math.PI * 2);
    ringX.fillStyle = "rgba(58,139,235,.90)";
    ringX.fill();
    ringX.beginPath();
    ringX.arc(ex, ey, 9, 0, Math.PI * 2);
    ringX.fillStyle = "rgba(58,139,235,.18)";
    ringX.fill();
  }
}

// ════════════════════════════════════════
//  MAIN RENDER LOOP
// ════════════════════════════════════════
function loop() {
  drawBG();
  drawBubbles();
  ringVal += (ringTarget - ringVal) * 0.038;
  drawRing(ringVal);
  requestAnimationFrame(loop);
}

setTimeout(() => {
  resizeBG();
  initBG();
  loop();
}, 60);

// ════════════════════════════════════════
//  DATA & REALTIME
// ════════════════════════════════════════
const LEVELS = [
  { min: 2000, label: "森林瀑布", color: "#5aafff" },
  { min: 500, label: "城市公园", color: "#e0b050" },
  { min: 0, label: "城市住宅", color: "#e06050" },
];
const getLevel = (v) =>
  LEVELS.find((l) => v >= l.min) || LEVELS[LEVELS.length - 1];

let curVal = 0;

function animNum(from, to, el) {
  const t0 = performance.now(),
    dur = 700;
  (function s(now) {
    const t = Math.min((now - t0) / dur, 1),
      e = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (to - from) * e).toLocaleString("zh-CN");
    if (t < 1) requestAnimationFrame(s);
  })(t0);
}

function updateDisplay(val) {
  animNum(curVal, val, document.getElementById("anionValue"));
  ringTarget = val;
  curVal = val;
  const lv = getLevel(val),
    tag = document.getElementById("levelTag");
  tag.textContent = lv.label;
  tag.style.cssText = `margin-top:14px;font-size:11.5px;letter-spacing:.15em;padding:5px 20px;border-radius:20px;background:rgba(15,35,70,.7);border:1px solid ${lv.color}40;color:${lv.color};transition:all .5s;backdrop-filter:blur(10px);`;
}

updateDisplay(curVal);

// ── Loading Screen 控制 ──
let dataReady = false;
const ldProgBar = document.getElementById("ldProgBar");

function dismissLoading() {
  if (dataReady) return;
  dataReady = true;
  if (ldProgBar) ldProgBar.style.width = "100%";
  setTimeout(() => {
    const ls = document.getElementById("loadingScreen");
    if (ls) {
      ls.classList.add("fade-out");
      setTimeout(() => ls.remove(), 700);
    }
    const page = document.querySelector(".page");
    if (page) page.style.opacity = "1";
  }, 300);
}

// ── Socket.IO 实时连接 ──
const socket = io();

socket.on("connect", () => {
  console.log("[Socket.IO] 已连接");
  if (ldProgBar) ldProgBar.style.width = "60%";
});

socket.on("ws-message", (msg) => {
  try {
    const data = JSON.parse(msg);
    const value = Number(data.ion_value) || 0;
    const updateTime = data.update_time || new Date().toLocaleString("zh-CN");
    updateDisplay(value);
    pushLive(value);
    document.getElementById("updateTime").textContent = updateTime;
    document.getElementById("topTime").textContent = updateTime;
    // 收到第二条数据（折线图开始绘制）后关闭加载页
    if (cD.length >= 2) dismissLoading();
  } catch (e) {
    console.warn("[Socket.IO] 消息解析失败", e);
  }
});

socket.on("disconnect", () => {
  console.log("[Socket.IO] 连接断开，自动重连中...");
});

// ════════════════════════════════════════
//  CHART
// ════════════════════════════════════════
const CC = document.getElementById("chartCanvas"),
  CX = CC.getContext("2d");
let cD = [],
  cL = [],
  pbI = 0,
  playing = false,
  piv = null,
  liveMode = true;

pbI = 0;

function pushLive(val) {
  const now = new Date();
  cD.push(val);
  cL.push(
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  );
  if (cD.length > 72) {
    cD.shift();
    cL.shift();
    // 播放中时修正索引，防止偏移
    if (playing && pbI > 0) pbI--;
  }
  if (liveMode) {
    pbI = cD.length - 1;
    drawChart(pbI);
    updateTL();
  }
}

function resizeChart() {
  const r = CC.parentElement.getBoundingClientRect();
  CC.width = r.width;
  const colH = document
    .querySelector(".col-chart")
    .getBoundingClientRect().height;
  CC.height = Math.max(180, Math.min(360, colH - 44 - 28 - 56 - 56));
  drawChart(pbI);
}

function drawChart(upto) {
  const W = CC.width,
    H = CC.height;
  CX.clearRect(0, 0, W, H);
  const P = { t: 14, r: 12, b: 28, l: 52 },
    cw = W - P.l - P.r,
    ch = H - P.t - P.b;
  const sl = cD.slice(0, upto + 1);
  if (sl.length < 1) return;
  const rawMn = Math.min(...sl) * 0.88,
    rawMx = Math.max(...sl) * 1.06;
  const mn = rawMn === rawMx ? rawMn - 1 : rawMn,
    mx = rawMn === rawMx ? rawMx + 1 : rawMx;
  const tx = (i) =>
      P.l + (cD.length <= 1 ? cw / 2 : (i / (cD.length - 1)) * cw),
    ty = (v) => P.t + ch - ((v - mn) / (mx - mn)) * ch;

  // grid
  CX.strokeStyle = "rgba(58,139,235,.1)";
  CX.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const y = P.t + (g / 4) * ch;
    CX.beginPath();
    CX.moveTo(P.l, y);
    CX.lineTo(W - P.r, y);
    CX.stroke();
    CX.fillStyle = "rgba(140,185,235,.4)";
    CX.font = "10px Noto Sans SC";
    CX.textAlign = "right";
    CX.fillText(
      Math.round(mx - (g / 4) * (mx - mn)).toLocaleString(),
      P.l - 6,
      y + 4,
    );
  }

  // area
  const ag = CX.createLinearGradient(0, P.t, 0, H - P.b);
  ag.addColorStop(0, "rgba(58,139,235,.18)");
  ag.addColorStop(1, "rgba(58,139,235,.02)");
  CX.beginPath();
  CX.moveTo(tx(0), ty(sl[0]));
  for (let i = 1; i < sl.length; i++) {
    const cpx = (tx(i - 1) + tx(i)) / 2;
    CX.bezierCurveTo(cpx, ty(sl[i - 1]), cpx, ty(sl[i]), tx(i), ty(sl[i]));
  }
  CX.lineTo(tx(sl.length - 1), H - P.b);
  CX.lineTo(tx(0), H - P.b);
  CX.closePath();
  CX.fillStyle = ag;
  CX.fill();

  // line
  const lg = CX.createLinearGradient(0, 0, W, 0);
  lg.addColorStop(0, "#2a6adb");
  lg.addColorStop(0.5, "#3b8beb");
  lg.addColorStop(1, "#5aaaf8");
  CX.beginPath();
  CX.moveTo(tx(0), ty(sl[0]));
  for (let i = 1; i < sl.length; i++) {
    const cpx = (tx(i - 1) + tx(i)) / 2;
    CX.bezierCurveTo(cpx, ty(sl[i - 1]), cpx, ty(sl[i]), tx(i), ty(sl[i]));
  }
  CX.save();
  CX.shadowBlur = 6;
  CX.shadowColor = "rgba(58,139,235,.35)";
  CX.strokeStyle = lg;
  CX.lineWidth = 2.2;
  CX.stroke();
  CX.restore();

  // live endpoint
  const ex = tx(sl.length - 1),
    ey = ty(sl[sl.length - 1]);
  CX.beginPath();
  CX.arc(ex, ey, 9, 0, Math.PI * 2);
  CX.fillStyle = "rgba(58,139,235,.15)";
  CX.fill();
  CX.beginPath();
  CX.arc(ex, ey, 4.2, 0, Math.PI * 2);
  CX.fillStyle = "#0a1628";
  CX.fill();
  CX.save();
  CX.shadowBlur = 7;
  CX.shadowColor = "rgba(58,139,235,.6)";
  CX.beginPath();
  CX.arc(ex, ey, 4.2, 0, Math.PI * 2);
  CX.strokeStyle = "#3b8beb";
  CX.lineWidth = 1.7;
  CX.stroke();
  CX.restore();
  CX.fillStyle = "rgba(140,200,255,.5)";
  CX.font = "9px Noto Sans SC";
  CX.textAlign = "center";
  CX.fillText("实时", ex, ey - 12);

  // x-labels
  const step = Math.ceil(sl.length / 6);
  CX.fillStyle = "rgba(140,185,235,.35)";
  CX.font = "10px Noto Sans SC";
  CX.textAlign = "center";
  for (let i = 0; i < sl.length; i += step)
    CX.fillText(cL[i], tx(i), H - P.b + 14);

  // timeline sync
  const pct = (upto / (cD.length - 1)) * 100;
  document.getElementById("tlProg").style.width = pct + "%";
  document.getElementById("tlThumb").style.left = pct + "%";
}

function updateTL() {
  if (cL[pbI]) document.getElementById("tlTime").textContent = cL[pbI];
}

function togglePlay() {
  playing ? stopPlay() : startPlay();
}

function startPlay() {
  liveMode = false;
  if (pbI >= cD.length - 1) pbI = 0;
  playing = true;
  document.getElementById("playBtn").textContent = "⏸";
  piv = setInterval(() => {
    if (pbI < cD.length - 1) {
      pbI++;
      drawChart(pbI);
      updateTL();
    } else stopPlay();
  }, 80);
}

function stopPlay() {
  playing = false;
  liveMode = true;
  document.getElementById("playBtn").textContent = "▶";
  clearInterval(piv);
  pbI = cD.length - 1;
  drawChart(pbI);
}

function seekTL(e) {
  liveMode = false;
  const r = document.getElementById("tlTrack").getBoundingClientRect();
  pbI = Math.round(
    Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (cD.length - 1),
  );
  stopPlay();
  drawChart(pbI);
  updateTL();
}

// Event listeners
document.getElementById("playBtn").addEventListener("click", togglePlay);
document.getElementById("tlTrack").addEventListener("click", seekTL);

setTimeout(() => {
  resizeChart();
  drawChart(pbI);
}, 100);
addEventListener("resize", () => setTimeout(resizeChart, 100));
