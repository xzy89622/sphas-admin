<template>
  <div class="login-wrap" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
    <!-- ✅ 交互式粒子层（鼠标互动） -->
    <canvas ref="particleCanvasRef" class="particle-canvas"></canvas>

    <!-- ✅ 3D 倾斜容器 -->
    <div class="tilt-wrap" :style="tiltStyle">
      <!-- ✅ 高级感：高光跟随鼠标（shine） -->
      <el-card ref="cardRef" class="login-card" shadow="always">
        <div class="brand">
          <div class="logo">SPHAS</div>
          <div class="desc">管理员登录</div>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" status-icon>
          <el-form-item label="账号" prop="username">
            <el-input v-model="form.username" placeholder="请输入账号" clearable @keyup.enter="submit" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="请输入密码"
              @keyup.enter="submit"
            />
          </el-form-item>

          <!-- ✅ 验证码 -->
          <el-form-item label="验证码" prop="captchaInput">
            <div class="captcha-row">
              <el-input v-model="form.captchaInput" placeholder="请输入验证码" clearable @keyup.enter="submit" />
              <div class="captcha-box" @click="refreshCaptcha" title="点击刷新验证码">
                <canvas ref="captchaCanvasRef" :width="110" :height="40"></canvas>
              </div>
            </div>
            <div class="help">看不清？点击验证码图片刷新</div>
          </el-form-item>

          <el-button type="primary" class="btn" :loading="loading" @click="submit">登录</el-button>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";

import http from "../api/http";
import { setToken } from "../utils/token";
import bgUrl from "../assets/login-bg-tech.png";

const router = useRouter();
const formRef = ref(null);
const cardRef = ref(null);
const loading = ref(false);

const form = reactive({
  username: "",
  password: "",
  captchaInput: "",
});

// ====================
// ✅ 验证码（前端本地）
// ====================
const captchaCanvasRef = ref(null);
const captchaCode = ref("");

function genCaptchaText(len = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function drawCaptcha(text) {
  const canvas = captchaCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(100,116,139,0.45)`;
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.lineTo(Math.random() * w, Math.random() * h);
    ctx.stroke();
  }

  for (let i = 0; i < 28; i++) {
    ctx.fillStyle = `rgba(148,163,184,0.65)`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }

  ctx.font = "bold 20px Arial";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = "#111827";

  const gap = w / (text.length + 1);
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const x = gap * (i + 1);
    const y = h / 2;
    const angle = (Math.random() - 0.5) * 0.4;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }
}

function refreshCaptcha() {
  captchaCode.value = genCaptchaText(4);
  drawCaptcha(captchaCode.value);
  form.captchaInput = "";
}

// ====================
// ✅ 表单校验规则
// ====================
const rules = {
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  captchaInput: [
    { required: true, message: "请输入验证码", trigger: "blur" },
    {
      validator: (_, value, cb) => {
        const input = String(value || "").trim().toUpperCase();
        const real = String(captchaCode.value || "").trim().toUpperCase();
        if (!input) return cb(new Error("请输入验证码"));
        if (input !== real) return cb(new Error("验证码错误，请重试"));
        cb();
      },
      trigger: "blur",
    },
  ],
};

// ====================
// ✅ token 提取：兼容后端直接返回字符串
// ====================
function extractToken(res) {
  if (typeof res === "string" && res.length > 0) return res;
  if (typeof res?.data === "string" && res.data.length > 0) return res.data;

  const p = res;
  const candidates = [
    p?.token,
    p?.accessToken,
    p?.data?.token,
    p?.data?.accessToken,
    p?.data?.data?.token,
    p?.data?.data?.accessToken,
    p?.data?.data?.data?.token,
    p?.data?.data?.data?.accessToken,
  ];
  return candidates.find((x) => typeof x === "string" && x.length > 0) || "";
}

// ====================
// ✅ 登录
// ====================
async function submit() {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  loading.value = true;
  try {
    const res = await http.post("/auth/login", {
      username: form.username.trim(),
      password: form.password,
    });

    const token = extractToken(res);
    if (!token) {
      console.log("login response (no token) =", res);
      ElMessage.error("登录失败：未获取到 token（已在控制台打印响应）");
      refreshCaptcha();
      return;
    }

    setToken(token);
    ElMessage.success("登录成功");
    router.replace("/dashboard");
  } catch (e) {
    refreshCaptcha();
  } finally {
    loading.value = false;
  }
}

// ====================
// ✅ 3D 倾斜 + 卡片高光跟随鼠标（背景不动）
// ====================
const mouse = ref({ x: -9999, y: -9999 });
const hovering = ref(false);

function updateCardShine(clientX, clientY) {
  // el-card 的根节点是一个 DOM 元素（里面再包 .el-card__body）
  const el = cardRef.value?.$el || cardRef.value;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  // 限制范围，避免离开边界时出现跳变
  const cx = Math.max(0, Math.min(rect.width, x));
  const cy = Math.max(0, Math.min(rect.height, y));

  // CSS 变量控制高光中心点
  el.style.setProperty("--hx", `${cx}px`);
  el.style.setProperty("--hy", `${cy}px`);

  // 高光强度：中心越近越亮（可选）
  const dx = cx - rect.width / 2;
  const dy = cy - rect.height / 2;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.sqrt((rect.width / 2) ** 2 + (rect.height / 2) ** 2) || 1;
  const intensity = 1 - dist / maxDist; // 0~1
  el.style.setProperty("--hi", `${(0.18 + intensity * 0.22).toFixed(3)}`); // 0.18~0.40
}

function onMouseMove(e) {
  hovering.value = true;
  mouse.value = { x: e.clientX, y: e.clientY };
  updateCardShine(e.clientX, e.clientY);
}

function onMouseLeave() {
  hovering.value = false;

  // 离开时让高光回到中心并降低强度（更自然）
  const el = cardRef.value?.$el || cardRef.value;
  if (el) {
    el.style.setProperty("--hx", `50%`);
    el.style.setProperty("--hy", `50%`);
    el.style.setProperty("--hi", `0.18`);
  }
}

const tiltStyle = computed(() => {
  if (!hovering.value) {
    return {
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)",
    };
  }

  const vw = window.innerWidth || 1;
  const vh = window.innerHeight || 1;
  const nx = mouse.value.x / vw - 0.5;
  const ny = mouse.value.y / vh - 0.5;

  const max = 8; // 倾斜最大角度
  const ry = nx * max;
  const rx = -ny * max;

  return {
    transform: `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`,
  };
});

// ====================
// ✅ 粒子背景（鼠标互动）
// ====================
const particleCanvasRef = ref(null);
let rafId = 0;
let particles = [];
let dpr = 1;

function resizeCanvas() {
  const canvas = particleCanvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();

  dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);

  const ctx = canvas.getContext("2d");
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.min(120, Math.max(60, Math.floor((rect.width * rect.height) / 18000)));
  particles = Array.from({ length: count }).map(() => ({
    x: Math.random() * rect.width,
    y: Math.random() * rect.height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: 1 + Math.random() * 1.8,
    a: 0.25 + Math.random() * 0.45,
  }));
}

function tick() {
  const canvas = particleCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  const mx = hovering.value ? mouse.value.x : -9999;
  const my = hovering.value ? mouse.value.y : -9999;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    const dxm = mx - p.x;
    const dym = my - p.y;
    const dm = Math.sqrt(dxm * dxm + dym * dym) || 1;
    if (dm < 180) {
      p.vx += (dxm / dm) * 0.0035;
      p.vy += (dym / dm) * 0.0035;
    }

    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > rect.width) p.vx *= -1;
    if (p.y < 0 || p.y > rect.height) p.vy *= -1;

    p.vx *= 0.985;
    p.vy *= 0.985;

    ctx.beginPath();
    ctx.fillStyle = `rgba(120, 220, 255, ${p.a})`;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();

    for (let j = i + 1; j < particles.length; j++) {
      const q = particles[j];
      const dx = p.x - q.x;
      const dy = p.y - q.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const alpha = (1 - dist / 120) * 0.18;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(90, 200, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }
  }

  rafId = requestAnimationFrame(tick);
}

onMounted(() => {
  refreshCaptcha();

  // ✅ 静态背景图（不移动）
  document.documentElement.style.setProperty("--login-bg-url", `url("${bgUrl}")`);

  // ✅ 初始化高光变量（居中）
  const el = cardRef.value?.$el || cardRef.value;
  if (el) {
    el.style.setProperty("--hx", `50%`);
    el.style.setProperty("--hy", `50%`);
    el.style.setProperty("--hi", `0.18`);
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  rafId = requestAnimationFrame(tick);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeCanvas);
  cancelAnimationFrame(rafId);
});
</script>

<style scoped>
/* ✅ 背景：更亮 + 蓝色光晕（完全静止） */
.login-wrap {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  overflow: hidden;

  background-image:
    radial-gradient(900px 520px at 65% 25%, rgba(56, 189, 248, 0.35), transparent 60%),
    radial-gradient(720px 420px at 25% 70%, rgba(99, 102, 241, 0.18), transparent 62%),
    linear-gradient(180deg, rgba(2, 6, 23, 0.22), rgba(2, 6, 23, 0.32)),
    var(--login-bg-url);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  background-attachment: fixed;
}

/* ✅ 粒子层 */
.particle-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* ✅ 3D 倾斜容器 */
.tilt-wrap {
  position: relative;
  z-index: 1;
  transition: transform 180ms ease;
  transform-style: preserve-3d;
  will-change: transform;
}

/* ✅ 登录卡片：玻璃拟态 + 发光边 + 高光跟随鼠标 */
.login-card {
  width: 420px;
  border-radius: 18px;
  overflow: hidden;

  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  border: 1px solid rgba(125, 211, 252, 0.25);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.22),
    0 0 0 1px rgba(59, 130, 246, 0.18) inset,
    0 0 30px rgba(56, 189, 248, 0.16);

  position: relative;
}

/* ✅ 高光层（关键）：使用 CSS 变量 --hx --hy 控制中心点 */
.login-card::before {
  content: "";
  position: absolute;
  inset: -2px;
  pointer-events: none;

  /* 高光：中心很亮，四周渐隐 */
  background:
    radial-gradient(
      520px 320px at var(--hx, 50%) var(--hy, 50%),
      rgba(255, 255, 255, var(--hi, 0.18)),
      rgba(255, 255, 255, 0) 60%
    );

  mix-blend-mode: screen;
  opacity: 1;
}

/* ✅ 细微边缘反射（更像玻璃） */
.login-card::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;

  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0) 40%),
    linear-gradient(315deg, rgba(56, 189, 248, 0.10), rgba(255, 255, 255, 0) 55%);
  opacity: 0.55;
}

/* 让内容层在高光之上 */
.login-card :deep(.el-card__body) {
  position: relative;
  z-index: 2;
}

.brand {
  text-align: center;
  margin-bottom: 14px;
}

.logo {
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 1px;
  color: #0f172a;
}

.desc {
  margin-top: 6px;
  font-size: 13px;
  color: #475569;
}

.btn {
  width: 100%;
  margin-top: 6px;
  height: 40px;
  border-radius: 10px;
}

.captcha-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.captcha-box {
  width: 110px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}

.help {
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
}
</style>
