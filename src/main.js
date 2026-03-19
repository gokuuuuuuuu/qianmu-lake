import "./style.css";

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
    hue: rnd(134, 158),
    sat: rnd(34, 52),
    lit: rnd(74, 84),
    alpha: rnd(0.04, 0.09),
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
    hue: rnd(130, 160),
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
  bgX.fillStyle = "#eef8f2";
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
    bgX.fillStyle = `hsla(${m.hue},40%,46%,${a})`;
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
    hue: rnd(132, 162),
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
    bubX.strokeStyle = `hsla(${b.hue},58%,50%,${a * 0.88})`;
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
  ringX.strokeStyle = "rgba(42,168,102,.09)";
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
    ringX.strokeStyle = `rgba(38,155,88,${op})`;
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
    ringX.strokeStyle = `rgba(36,150,85,${isL ? 0.19 : 0.08})`;
    ringX.lineWidth = isL ? 1.1 : 0.58;
    ringX.stroke();
  }

  const frac = Math.min(val / 12000, 1),
    sa = -Math.PI * 0.75,
    ea = sa + frac * Math.PI * 1.5;
  ringX.save();
  ringX.shadowBlur = 11;
  ringX.shadowColor = "rgba(38,180,100,.20)";
  ringX.beginPath();
  ringX.arc(cx, cy, R, sa, ea);
  ringX.strokeStyle = "rgba(34,172,96,.64)";
  ringX.lineWidth = 2.6;
  ringX.lineCap = "round";
  ringX.stroke();
  ringX.restore();

  if (val > 0) {
    const ex = cx + Math.cos(ea) * R,
      ey = cy + Math.sin(ea) * R;
    ringX.beginPath();
    ringX.arc(ex, ey, 4.5, 0, Math.PI * 2);
    ringX.fillStyle = "rgba(34,182,100,.90)";
    ringX.fill();
    ringX.beginPath();
    ringX.arc(ex, ey, 9, 0, Math.PI * 2);
    ringX.fillStyle = "rgba(34,182,100,.13)";
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
  { min: 10000, label: "森林瀑布级", color: "#189858" },
  { min: 2000, label: "自然清新级", color: "#20a860" },
  { min: 1000, label: "城市公园级", color: "#46bc7e" },
  { min: 500, label: "基础达标级", color: "#987010" },
  { min: 200, label: "偏低风险级", color: "#ae3c2c" },
  { min: 0, label: "高危预警级", color: "#941818" },
];
const getLevel = (v) =>
  LEVELS.find((l) => v >= l.min) || LEVELS[LEVELS.length - 1];

let curVal = 8200;

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
  tag.style.cssText = `margin-top:14px;font-size:11.5px;letter-spacing:.15em;padding:5px 20px;border-radius:20px;background:rgba(255,255,255,.68);border:1px solid ${lv.color}30;color:${lv.color};transition:all .5s;backdrop-filter:blur(10px);`;
}

updateDisplay(curVal);

async function fetchAnion() {
  try {
    const res = await fetch("/api/anion");
    const data = await res.json();
    return data;
  } catch {
    // 接口不可用时使用本地模拟
    return {
      value: Math.round(
        8500 +
          (Math.random() - 0.5) * 1400 +
          Math.sin(Date.now() / 55000) * 900,
      ),
      updateTime: new Date().toLocaleString("zh-CN"),
    };
  }
}

async function tick() {
  const data = await fetchAnion();
  updateDisplay(data.value);
  pushLive(data.value);
  document.getElementById("updateTime").textContent = data.updateTime;
  document.getElementById("topTime").textContent = data.updateTime;
}
setInterval(tick, 3000);
tick();

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

function genData(r) {
  const d = [],
    l = [],
    pts = r === "24h" ? 48 : r === "7d" ? 84 : 120,
    base = r === "24h" ? 8000 : r === "7d" ? 7500 : 7000;
  for (let i = 0; i < pts; i++) {
    const t = i / pts;
    d.push(
      Math.max(
        1800,
        Math.round(
          base +
            Math.sin(t * Math.PI * 2 * (r === "24h" ? 1 : 7)) * 1300 +
            Math.sin(t * Math.PI) * 650 +
            (Math.random() - 0.5) * 900,
        ),
      ),
    );
    if (r === "24h") {
      const h = Math.floor(i * 0.5),
        m = (i % 2) * 30;
      l.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    } else if (r === "7d") {
      l.push(
        `D${Math.floor(i / 12) + 1} ${String((i % 12) * 2).padStart(2, "0")}h`,
      );
    } else {
      l.push(`Day${Math.floor(i / 4) + 1}`);
    }
  }
  return { d, l };
}

function setRange(r, btn) {
  document
    .querySelectorAll(".c-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  const g = genData(r);
  cD = g.d;
  cL = g.l;
  pbI = cD.length - 1;
  liveMode = true;
  stopPlay();
  drawChart(pbI);
  updateTL();
}

const g0 = genData("24h");
cD = g0.d;
cL = g0.l;
pbI = cD.length - 1;

function pushLive(val) {
  const now = new Date();
  cD.push(val);
  cL.push(
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  );
  if (cD.length > 72) {
    cD.shift();
    cL.shift();
  }
  pbI = cD.length - 1;
  if (liveMode) drawChart(pbI);
  updateTL();
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
  if (sl.length < 2) return;
  const mn = Math.min(...sl) * 0.88,
    mx = Math.max(...sl) * 1.06;
  const tx = (i) => P.l + (i / (cD.length - 1)) * cw,
    ty = (v) => P.t + ch - ((v - mn) / (mx - mn)) * ch;

  // grid
  CX.strokeStyle = "rgba(42,168,102,.08)";
  CX.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const y = P.t + (g / 4) * ch;
    CX.beginPath();
    CX.moveTo(P.l, y);
    CX.lineTo(W - P.r, y);
    CX.stroke();
    CX.fillStyle = "rgba(10,80,44,.28)";
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
  ag.addColorStop(0, "rgba(34,162,88,.13)");
  ag.addColorStop(1, "rgba(34,162,88,.01)");
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
  lg.addColorStop(0, "#0a4828");
  lg.addColorStop(0.5, "#1e9e58");
  lg.addColorStop(1, "#42c87e");
  CX.beginPath();
  CX.moveTo(tx(0), ty(sl[0]));
  for (let i = 1; i < sl.length; i++) {
    const cpx = (tx(i - 1) + tx(i)) / 2;
    CX.bezierCurveTo(cpx, ty(sl[i - 1]), cpx, ty(sl[i]), tx(i), ty(sl[i]));
  }
  CX.save();
  CX.shadowBlur = 6;
  CX.shadowColor = "rgba(34,162,88,.22)";
  CX.strokeStyle = lg;
  CX.lineWidth = 2.2;
  CX.stroke();
  CX.restore();

  // live endpoint
  const ex = tx(sl.length - 1),
    ey = ty(sl[sl.length - 1]);
  CX.beginPath();
  CX.arc(ex, ey, 9, 0, Math.PI * 2);
  CX.fillStyle = "rgba(34,162,88,.09)";
  CX.fill();
  CX.beginPath();
  CX.arc(ex, ey, 4.2, 0, Math.PI * 2);
  CX.fillStyle = "white";
  CX.fill();
  CX.save();
  CX.shadowBlur = 7;
  CX.shadowColor = "rgba(34,182,95,.48)";
  CX.beginPath();
  CX.arc(ex, ey, 4.2, 0, Math.PI * 2);
  CX.strokeStyle = "#1e9e58";
  CX.lineWidth = 1.7;
  CX.stroke();
  CX.restore();
  CX.fillStyle = "rgba(8,76,40,.38)";
  CX.font = "9px Noto Sans SC";
  CX.textAlign = "center";
  CX.fillText("实时", ex, ey - 12);

  // x-labels
  const step = Math.ceil(sl.length / 6);
  CX.fillStyle = "rgba(8,76,40,.24)";
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
document.querySelectorAll(".c-btn").forEach((btn) => {
  btn.addEventListener("click", () => setRange(btn.dataset.range, btn));
});
document.getElementById("playBtn").addEventListener("click", togglePlay);
document.getElementById("tlTrack").addEventListener("click", seekTL);

setTimeout(() => {
  resizeChart();
  drawChart(pbI);
}, 100);
addEventListener("resize", () => setTimeout(resizeChart, 100));
