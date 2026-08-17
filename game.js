// 펭귄의 북극 모험 - 초등학교 4학년도 읽기 쉬운 주석으로 달아 두었어요.

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const overlayScore = document.getElementById("overlay-score");
const overlayKicker = document.getElementById("overlay-kicker");
const startBtn = document.getElementById("start-btn");
const nightBtn = document.getElementById("night-btn");
const shopBtn = document.getElementById("shop-btn");
const shopEl = document.getElementById("shop");
const shopClose = document.getElementById("shop-close");
const shopCoinsEl = document.getElementById("shop-coins");
const shopMsgEl = document.getElementById("shop-msg");
const nickEl = document.getElementById("nick");
const nickInput = document.getElementById("nick-input");
const nickSave = document.getElementById("nick-save");
const nickMsgEl = document.getElementById("nick-msg");
const nickLabel = document.getElementById("nick-label");
const nickNameEl = document.getElementById("nick-name");
const rankBtn = document.getElementById("rank-btn");
const rankEl = document.getElementById("rank");
const rankClose = document.getElementById("rank-close");
const rankList = document.getElementById("rank-list");
const rankHello = document.getElementById("rank-hello");
const rankTabScore = document.getElementById("rank-tab-score");
const rankTabCoin = document.getElementById("rank-tab-coin");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const fishEl = document.getElementById("fish");
const coinEl = document.getElementById("coin");
const heartEl = document.getElementById("heart");
const starEl = document.getElementById("star");
const mushroomEl = document.getElementById("mushroom");
const stageEl = document.getElementById("stage");

const GROUND = 448;
const GRAVITY = 0.62;
const JUMP = -13.5;
const FISH_GRAVITY = 0.55;
const FISH_BOUNCE = -9.2;

const penguin = {
  x: 120,
  y: GROUND,
  w: 72,
  h: 84,
  vy: 0,
  onGround: true,
};

const sprites = {
  penguin: null,
  bear: null,
  wolf: null,
  hunter: null,
};

function removeBackground(img, kind) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0);
  const imageData = x.getImageData(0, 0, c.width, c.height);
  const d = imageData.data;
  const w = c.width;
  const h = c.height;
  const br = d[0];
  const bg = d[1];
  const bb = d[2];

  function isBg(i) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const dist = Math.abs(r - br) + Math.abs(g - bg) + Math.abs(b - bb);
    if (kind === "bear") {
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      if (Math.max(r, g, b) < 90) return false;
      if (r > b + 6) return false;
      if (spread < 24) return false;
      return dist < 50 && b > r + 14;
    }
    return dist < 70;
  }

  const seen = new Uint8Array(w * h);
  const stack = [];
  function push(px, py) {
    if (px < 0 || py < 0 || px >= w || py >= h) return;
    const idx = py * w + px;
    if (seen[idx]) return;
    seen[idx] = 1;
    if (isBg(idx * 4)) stack.push(idx);
  }

  for (let px = 0; px < w; px++) {
    push(px, 0);
    push(px, h - 1);
  }
  for (let py = 0; py < h; py++) {
    push(0, py);
    push(w - 1, py);
  }

  while (stack.length) {
    const idx = stack.pop();
    const i = idx * 4;
    d[i + 3] = 0;
    const px = idx % w;
    const py = (idx / w) | 0;
    push(px + 1, py);
    push(px - 1, py);
    push(px, py + 1);
    push(px, py - 1);
  }

  x.putImageData(imageData, 0, 0);

  let opaque = 0;
  for (let i = 3; i < d.length; i += 4) {
    if (d[i] > 12) opaque += 1;
  }
  if (opaque < w * h * 0.08) {
    const fallback = document.createElement("canvas");
    fallback.width = img.width;
    fallback.height = img.height;
    fallback.getContext("2d").drawImage(img, 0, 0);
    return fallback;
  }
  return cropSprite(c);
}

function cropSprite(c) {
  const x = c.getContext("2d");
  const imageData = x.getImageData(0, 0, c.width, c.height);
  const d = imageData.data;
  let minX = c.width;
  let minY = c.height;
  let maxX = 0;
  let maxY = 0;
  for (let py = 0; py < c.height; py++) {
    for (let px = 0; px < c.width; px++) {
      if (d[(py * c.width + px) * 4 + 3] > 12) {
        if (px < minX) minX = px;
        if (py < minY) minY = py;
        if (px > maxX) maxX = px;
        if (py > maxY) maxY = py;
      }
    }
  }
  if (maxX < minX) return c;
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out.getContext("2d").drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

function loadSprite(name, src) {
  const img = new Image();
  img.onload = () => {
    sprites[name] = removeBackground(img, name);
  };
  img.src = src;
}

loadSprite("penguin", "assets/penguin.png");
loadSprite("bear", "assets/bear.png");
loadSprite("wolf", "assets/wolf.png");
loadSprite("hunter", "assets/hunter.png");

const STAGES = [
  {
    id: 1,
    name: "얼음 평원",
    goal: 800,
    baseSpeed: 5.6,
    spawnMin: 110,
    spawnRange: 90,
    fishChance: 0.75,
    kinds: ["ice", "ice", "ice", "bear"],
  },
  {
    id: 2,
    name: "북극곰 마을",
    goal: 2000,
    baseSpeed: 6.6,
    spawnMin: 95,
    spawnRange: 80,
    fishChance: 0.6,
    kinds: ["ice", "bear", "bear", "wolf"],
  },
  {
    id: 3,
    name: "늑대 마을",
    goal: 3800,
    baseSpeed: 7.8,
    spawnMin: 82,
    spawnRange: 70,
    fishChance: 0.5,
    kinds: ["ice", "bear", "wolf", "wolf", "hunter"],
  },
  {
    id: 4,
    name: "사냥꾼의 기지",
    goal: 6000,
    baseSpeed: 9,
    spawnMin: 72,
    spawnRange: 58,
    fishChance: 0.45,
    kinds: ["ice", "bear", "wolf", "hunter", "hunter"],
  },
  {
    id: 5,
    name: "목적지",
    goal: Infinity,
    baseSpeed: 10.4,
    spawnMin: 62,
    spawnRange: 48,
    fishChance: 0.4,
    kinds: ["ice", "bear", "wolf", "hunter", "hunter", "bear"],
  },
];

let running = false;
let speed = 6;
let distance = 0;
let score = 0;
let fishCount = 0;
let best = Number(localStorage.getItem("penguin-best") || 0);
let spawnTimer = 0;
let snow = [];
let stars = [];
let obstacles = [];
let fishes = [];
let holes = [];
let hills = [];
let coins = [];
let boxes = [];
let pickups = [];
let frame = 0;
let stageIndex = 0;
let stageBanner = 0;
let invincible = 0;
let hitAnim = null;
let coinCount = Number(localStorage.getItem("penguin-coins") || 0);
let runCoins = 0;
let shopOpen = false;
let nickOpen = false;
let rankOpen = false;
let rotateOpen = false;
let rankMode = "score";
let nickname = (localStorage.getItem("penguin-nick") || "").trim();
let pendingHearts = Number(localStorage.getItem("penguin-hearts") || 0);
let pendingTrail = false;
let pendingGuard = 0;
let pendingCloak = false;
let shield = 0;
let canDoubleJump = false;
let doubleJumpUsed = false;
let mushroomTime = 0;
let starTime = 0;
let starCount = Number(localStorage.getItem("penguin-stars") || 0);
let mushroomCount = Number(localStorage.getItem("penguin-mushrooms") || 0);
let trailTime = 0;
let cloakTime = 0;
let guardHits = 0;
let trail = [];
let rewardTimer = 50;
let popTexts = [];
let isNight = localStorage.getItem("penguin-night") === "1";

bestEl.textContent = best;

function currentStage() {
  return STAGES[stageIndex];
}

function resetGame() {
  penguin.y = GROUND;
  penguin.vy = 0;
  penguin.onGround = true;
  running = true;
  distance = 0;
  score = 0;
  fishCount = 0;
  runCoins = 0;
  shield = pendingHearts;
  pendingHearts = 0;
  savePendingHearts();
  doubleJumpUsed = false;
  mushroomTime = mushroomCount > 0 ? 600 : 0;
  canDoubleJump = mushroomCount > 0;
  starTime = starCount > 0 ? 240 : 0;
  spawnTimer = 130;
  rewardTimer = 40;
  frame = 0;
  stageIndex = 0;
  stageBanner = 90;
  invincible = starCount > 0 ? 240 : 60;
  trailTime = pendingTrail ? 600 : 0;
  pendingTrail = false;
  guardHits = pendingGuard;
  pendingGuard = 0;
  cloakTime = pendingCloak ? 600 : 0;
  if (cloakTime > 0) invincible = Math.max(invincible, cloakTime);
  pendingCloak = false;
  trail = [];
  hitAnim = null;
  speed = currentStage().baseSpeed;
  obstacles = [];
  fishes = [];
  holes = [];
  coins = [];
  boxes = [];
  pickups = [];
  popTexts = [];
  makeSnow();
  makeStars();
  makeHills();
  overlay.classList.add("hidden");
  closeShop();
  closeRank();
  startMusic();
  updateHud();
}

function makeSnow() {
  snow = [];
  const n = themeColors().snowN;
  const storm = currentStage().id === 5 ? 1.8 : 1;
  for (let i = 0; i < n; i++) {
    snow.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.4 + 0.8,
      v: (Math.random() * 1.2 + 0.4) * storm,
    });
  }
}

function makeStars() {
  stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * 220,
      r: Math.random() * 1.8 + 0.5,
      twinkle: Math.random() * Math.PI * 2,
    });
  }
}

function themeColors() {
  const themes = {
    1: {
      sky: isNight ? ["#0a1c3a", "#1a3a62", "#2a5a88"] : ["#8fd8ff", "#d8f2ff", "#f4fbff"],
      hill: isNight ? ["#8fb8d4", "#6f9cb8"] : ["#dff3ff", "#c5e8fb"],
      ground: isNight ? ["#d5e8f6", "#7aa8c8", "#5b8eae"] : ["#eaf7ff", "#b9e0f6", "#8fc7e6"],
      auroraA: "#7dffb3",
      auroraB: "#a8e7ff",
      aurora: isNight ? 0.45 : 0.22,
      canvas: isNight ? "#0b1b3a" : "#9ad7f5",
      snowN: 55,
    },
    2: {
      sky: isNight ? ["#1a1428", "#3a2a48", "#5a3a50"] : ["#ffd9b0", "#ffe8d0", "#fff6ea"],
      hill: isNight ? ["#8a7068", "#6a5850"] : ["#f0d8c0", "#e0c4a8"],
      ground: isNight ? ["#e8dcd0", "#a89080", "#7a6858"] : ["#fff3e6", "#e8cbb0", "#d0a888"],
      auroraA: "#ffd08a",
      auroraB: "#ffb070",
      aurora: isNight ? 0.35 : 0.14,
      canvas: isNight ? "#2a1c28" : "#f0c8a0",
      snowN: 45,
    },
    3: {
      sky: isNight ? ["#0c1028", "#1c2048", "#2a3060"] : ["#9bb4d8", "#c8d8ee", "#e8eef8"],
      hill: isNight ? ["#3a4560", "#2a3450"] : ["#7a90b0", "#5a708e"],
      ground: isNight ? ["#c8d4e4", "#6a7a90", "#4a5a70"] : ["#e4ecf4", "#a8b8c8", "#7a8ea0"],
      auroraA: "#b09cff",
      auroraB: "#7a8cff",
      aurora: isNight ? 0.52 : 0.26,
      canvas: isNight ? "#14182e" : "#9bb0cc",
      snowN: 85,
    },
    4: {
      sky: isNight ? ["#1a120c", "#3a2418", "#5a3820"] : ["#f0b878", "#ffd8a8", "#ffe8c8"],
      hill: isNight ? ["#4a3828", "#3a2a1c"] : ["#c8a078", "#b08860"],
      ground: isNight ? ["#d8c8b0", "#8a7058", "#6a5440"] : ["#f6e6cc", "#d2b48c", "#b89468"],
      auroraA: "#ffb060",
      auroraB: "#ff8060",
      aurora: isNight ? 0.18 : 0.08,
      canvas: isNight ? "#2a1a10" : "#e8b070",
      snowN: 40,
    },
    5: {
      sky: isNight ? ["#050818", "#101840", "#182060"] : ["#4a6aa8", "#7a90c8", "#b0c4e8"],
      hill: isNight ? ["#6078a8", "#405888"] : ["#c0d4f0", "#90a8d0"],
      ground: isNight ? ["#c8daf0", "#5a78a0", "#3a5880"] : ["#e0ecfa", "#90b0d0", "#6888b0"],
      auroraA: "#5dffb0",
      auroraB: "#d080ff",
      aurora: isNight ? 0.78 : 0.52,
      canvas: isNight ? "#080e24" : "#6a88c0",
      snowN: 130,
    },
  };
  return themes[currentStage().id] || themes[1];
}

function makeHills() {
  const id = currentStage().id;
  if (id === 1) {
    hills = [
      { x: 0, w: 340, h: 70, type: "berg" },
      { x: 300, w: 400, h: 95, type: "berg" },
      { x: 660, w: 300, h: 60, type: "berg" },
      { x: 920, w: 280, h: 110, type: "berg" },
    ];
  } else if (id === 2) {
    hills = [
      { x: 40, w: 210, h: 100, type: "den" },
      { x: 300, w: 250, h: 130, type: "den" },
      { x: 580, w: 190, h: 90, type: "berg" },
      { x: 820, w: 230, h: 120, type: "den" },
    ];
  } else if (id === 3) {
    hills = [
      { x: -30, w: 220, h: 260, type: "cliff" },
      { x: 180, w: 170, h: 200, type: "cliff" },
      { x: 420, w: 210, h: 280, type: "cliff" },
      { x: 680, w: 180, h: 190, type: "cliff" },
      { x: 900, w: 220, h: 250, type: "cliff" },
    ];
  } else if (id === 4) {
    hills = [
      { x: 60, w: 100, h: 78, type: "tent" },
      { x: 240, w: 70, h: 110, type: "pole" },
      { x: 430, w: 120, h: 86, type: "tent" },
      { x: 680, w: 130, h: 92, type: "cabin" },
      { x: 900, w: 90, h: 74, type: "tent" },
    ];
  } else {
    hills = [
      { x: 0, w: 180, h: 230, type: "spire" },
      { x: 220, w: 150, h: 180, type: "spire" },
      { x: 430, w: 210, h: 270, type: "spire" },
      { x: 700, w: 160, h: 200, type: "spire" },
      { x: 900, w: 190, h: 250, type: "spire" },
    ];
  }
}

function applyTheme() {
  const t = themeColors();
  document.body.classList.toggle("night", isNight);
  document.body.dataset.stage = String(currentStage().id);
  nightBtn.textContent = isNight ? "☀️ 낮으로 바꾸기" : "🌙 밤으로 바꾸기";
  canvas.style.background = t.canvas;
}

function jump() {
  if (shopOpen || nickOpen || rankOpen || hitAnim) return;
  if (!nickname) {
    openNickScreen();
    return;
  }
  if (!running) {
    resetGame();
    return;
  }
  if (penguin.onGround) {
    penguin.vy = JUMP;
    penguin.onGround = false;
    doubleJumpUsed = false;
    beep(520, 0.08);
  } else if (canDoubleJump && !doubleJumpUsed) {
    penguin.vy = JUMP;
    doubleJumpUsed = true;
    beep(640, 0.07);
  }
}

let audioCtx = null;
let musicGain = null;
let musicNodes = [];
let musicOn = localStorage.getItem("penguin-music") !== "0";
let musicPlaying = false;
let musicNextTime = 0;
let musicNote = 0;
let musicLoopId = 0;
const MUSIC_MELODY = [392, 523, 659, 784, 659, 523, 587, 523, 440, 523, 659, 523, 392, 330, 392, 0];
const MUSIC_BASS = [196, 196, 262, 262, 175, 175, 196, 196, 220, 220, 196, 196, 165, 165, 196, 0];
const MUSIC_NOTE = 0.3;

function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function getMusicGain() {
  const ctx = getAudio();
  if (!musicGain || musicGain.context !== ctx) {
    musicGain = ctx.createGain();
    musicGain.gain.value = 1;
    musicGain.connect(ctx.destination);
  }
  return musicGain;
}

function playTone(freq, when, dur, type, vol) {
  if (!freq || !musicOn || !musicPlaying) return;
  const ctx = getAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
  osc.connect(gain);
  gain.connect(getMusicGain());
  osc.start(when);
  osc.stop(when + dur + 0.02);
  musicNodes.push(osc);
  osc.addEventListener("ended", () => {
    musicNodes = musicNodes.filter((n) => n !== osc);
  });
}

function scheduleMusic() {
  if (!musicOn || !musicPlaying) return;
  const ctx = getAudio();
  const now = ctx.currentTime;
  if (musicNextTime < now) musicNextTime = now + 0.04;
  while (musicNextTime < now + 0.9) {
    const i = musicNote % MUSIC_MELODY.length;
    playTone(MUSIC_MELODY[i], musicNextTime, MUSIC_NOTE * 0.88, "triangle", 0.14);
    playTone(MUSIC_BASS[i], musicNextTime, MUSIC_NOTE * 0.96, "sine", 0.08);
    musicNextTime += MUSIC_NOTE;
    musicNote += 1;
  }
  musicLoopId = requestAnimationFrame(scheduleMusic);
}

function beginMusicLoop() {
  if (musicPlaying) return;
  const ctx = getAudio();
  getMusicGain().gain.cancelScheduledValues(ctx.currentTime);
  getMusicGain().gain.setValueAtTime(1, ctx.currentTime);
  musicPlaying = true;
  musicNextTime = ctx.currentTime + 0.05;
  musicNote = 0;
  scheduleMusic();
}

function startMusic() {
  if (!musicOn || musicPlaying) return;
  try {
    const ctx = getAudio();
    if (ctx.state === "suspended") {
      ctx.resume().then(beginMusicLoop).catch(() => {});
    } else {
      beginMusicLoop();
    }
  } catch (e) {
    // 음악이 안 나와도 게임은 계속돼요.
  }
}

function stopMusic() {
  musicPlaying = false;
  if (musicLoopId) cancelAnimationFrame(musicLoopId);
  musicLoopId = 0;
  try {
    if (audioCtx && musicGain) {
      musicGain.gain.cancelScheduledValues(audioCtx.currentTime);
      musicGain.gain.setValueAtTime(0, audioCtx.currentTime);
    }
    musicNodes.forEach((osc) => {
      try {
        osc.stop(0);
      } catch (e) {}
      try {
        osc.disconnect();
      } catch (e) {}
    });
    if (musicGain) {
      try {
        musicGain.disconnect();
      } catch (e) {}
      musicGain = null;
    }
  } catch (e) {}
  musicNodes = [];
}

function beep(freq, time) {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "triangle";
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + time);
  } catch (e) {
    // 소리가 안 나도 게임은 계속돼요.
  }
}

function spawnObstacle() {
  const stage = currentStage();
  const kind = stage.kinds[Math.floor(Math.random() * stage.kinds.length)];
  if (kind === "ice") {
    const ices = [
      { w: 68, h: 44, style: "chunk" },
      { w: 92, h: 60, style: "berg" },
      { w: 50, h: 78, style: "spike" },
      { w: 110, h: 40, style: "slab" },
    ];
    const ice = ices[Math.floor(Math.random() * ices.length)];
    obstacles.push({
      kind: "ice",
      style: ice.style,
      x: canvas.width + 40,
      y: GROUND - ice.h,
      w: ice.w,
      h: ice.h,
    });
  } else {
    const sizes = {
      bear: { w: 112, h: 72 },
      wolf: { w: 102, h: 60 },
      hunter: { w: 72, h: 94 },
    };
    const size = sizes[kind];
    obstacles.push({
      kind,
      x: canvas.width + 40,
      y: GROUND - size.h,
      w: size.w,
      h: size.h,
    });
  }

  if (Math.random() < stage.fishChance) {
    spawnFishHole(canvas.width + 170 + Math.random() * 140);
  }
}

function spawnRewards() {
  const roll = Math.random();
  if (roll < 0.5) {
    const baseX = canvas.width + 80 + Math.random() * 90;
    const baseY = GROUND - 88 - Math.random() * 18;
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      coins.push({
        x: baseX + i * 30,
        y: baseY + Math.sin(i * 0.9) * 8,
        w: 22,
        h: 22,
        vy: 0,
        taken: false,
      });
    }
  } else if (roll < 0.85) {
    boxes.push({
      x: canvas.width + 160 + Math.random() * 80,
      y: GROUND - 188,
      w: 52,
      h: 48,
      used: false,
    });
  } else {
    const kinds = ["star", "mushroom", "heart"];
    pickups.push({
      kind: kinds[Math.floor(Math.random() * kinds.length)],
      x: canvas.width + 140 + Math.random() * 70,
      y: GROUND - 118,
      w: 30,
      h: 30,
    });
  }
}

function addPopText(text, x, y) {
  popTexts.push({ text, x, y, life: 80 });
}

function popBox(box) {
  box.used = true;
  const roll = Math.random();
  if (roll < 0.5) {
    for (let i = 0; i < 4; i++) {
      coins.push({
        x: box.x + 4 + i * 6,
        y: box.y - 8,
        w: 20,
        h: 20,
        vy: -7 - Math.random() * 3,
        taken: false,
      });
    }
    addPopText("코인!", box.x, box.y - 18);
  } else if (roll < 0.7) {
    pickups.push({ kind: "star", x: box.x + 5, y: box.y - 28, w: 30, h: 30 });
    addPopText("별 · 무적!", box.x - 10, box.y - 18);
  } else if (roll < 0.88) {
    pickups.push({ kind: "mushroom", x: box.x + 5, y: box.y - 28, w: 30, h: 30 });
    addPopText("버섯 · 두 번 점프!", box.x - 30, box.y - 18);
  } else {
    pickups.push({ kind: "heart", x: box.x + 5, y: box.y - 28, w: 30, h: 30 });
    addPopText("하트 · 보호막!", box.x - 16, box.y - 18);
  }
  beep(760, 0.08);
}

function saveItemCounts() {
  localStorage.setItem("penguin-stars", String(starCount));
  localStorage.setItem("penguin-mushrooms", String(mushroomCount));
}

function addStar(activate) {
  starCount = Math.min(9, starCount + 1);
  saveItemCounts();
  if (activate && running && starTime <= 0) {
    starTime = 240;
    invincible = Math.max(invincible, 240);
  }
  updateHud();
}

function addMushroom(activate) {
  mushroomCount = Math.min(9, mushroomCount + 1);
  saveItemCounts();
  if (activate && running && mushroomTime <= 0) {
    mushroomTime = 600;
    canDoubleJump = true;
  }
  updateHud();
}

function takePickup(kind) {
  if (kind === "star") {
    addStar(true);
    addPopText("별 +1!", penguin.x, penguin.y - penguin.h - 10);
    beep(980, 0.12);
  } else if (kind === "mushroom") {
    addMushroom(true);
    addPopText("버섯 +1!", penguin.x - 10, penguin.y - penguin.h - 10);
    beep(700, 0.1);
  } else if (kind === "heart") {
    shield += 1;
    addPopText("하트 +1!", penguin.x, penguin.y - penguin.h - 10);
    beep(820, 0.1);
    updateHud();
  } else if (kind === "trail") {
    trailTime = 600;
    addPopText("트레일 · 빨라져요!", penguin.x - 24, penguin.y - penguin.h - 10);
    beep(900, 0.1);
  } else if (kind === "guard") {
    guardHits = Math.min(6, guardHits + 2);
    addPopText("방패 +2!", penguin.x, penguin.y - penguin.h - 10);
    beep(640, 0.1);
  } else if (kind === "cloak") {
    cloakTime = 600;
    invincible = Math.max(invincible, 600);
    addPopText("투명망토 10초!", penguin.x - 16, penguin.y - penguin.h - 10);
    beep(420, 0.14);
  }
}

function spawnFishHole(x) {
  holes.push({
    x,
    w: 54,
    h: 18,
  });
  fishes.push({
    x: x + 13,
    y: GROUND,
    w: 28,
    h: 18,
    vy: FISH_BOUNCE - Math.random() * 1.8,
    taken: false,
  });
}

function updateTrail() {
  if (trailTime > 0) {
    trail.push({
      x: penguin.x + 8 + Math.random() * 16,
      y: penguin.y - 12 - Math.random() * 48,
      life: 16 + Math.random() * 12,
      r: 3 + Math.random() * 6,
      warm: Math.random() > 0.45,
    });
  }
  for (const p of trail) {
    p.x -= speed * 0.85;
    p.life -= 1;
  }
  trail = trail.filter((p) => p.life > 0);
}

function hitBox(a, b, pad = 10) {
  return (
    a.x + pad < b.x + b.w - pad &&
    a.x + a.w - pad > b.x + pad &&
    a.y + pad < b.y + b.h - pad &&
    a.y + a.h - pad > b.y + pad
  );
}

function update() {
  if (!running) return;

  const stage = currentStage();
  frame += 1;
  if (stageBanner > 0) stageBanner -= 1;
  if (invincible > 0) invincible -= 1;
  if (mushroomTime > 0) {
    mushroomTime -= 1;
    if (mushroomTime <= 0 && mushroomCount > 0) {
      mushroomCount -= 1;
      saveItemCounts();
      if (mushroomCount > 0) {
        mushroomTime = 600;
        canDoubleJump = true;
      } else {
        canDoubleJump = false;
      }
      updateHud();
    }
  } else {
    canDoubleJump = mushroomCount > 0;
  }
  if (starTime > 0) {
    starTime -= 1;
    invincible = Math.max(invincible, 2);
    if (starTime <= 0 && starCount > 0) {
      starCount -= 1;
      saveItemCounts();
      if (starCount > 0) {
        starTime = 240;
        invincible = Math.max(invincible, 240);
      }
      updateHud();
    }
  }
  if (trailTime > 0) trailTime -= 1;
  if (cloakTime > 0) {
    cloakTime -= 1;
    invincible = Math.max(invincible, 2);
  }
  updateTrail();

  speed = stage.baseSpeed + Math.min(1.8, distance / 5000);
  if (trailTime > 0) speed += 3.2;
  distance += speed;
  score = Math.floor(distance / 8) + fishCount * 50 + runCoins * 10;
  checkStageUp();

  penguin.vy += GRAVITY;
  penguin.y += penguin.vy;
  if (penguin.y >= GROUND) {
    penguin.y = GROUND;
    penguin.vy = 0;
    penguin.onGround = true;
  }

  spawnTimer -= 1;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = stage.spawnMin + Math.random() * stage.spawnRange;
  }

  rewardTimer -= 1;
  if (rewardTimer <= 0) {
    spawnRewards();
    rewardTimer = 80 + Math.random() * 60;
  }

  obstacles.forEach((o) => (o.x -= speed));
  holes.forEach((h) => (h.x -= speed));
  coins.forEach((c) => {
    c.x -= speed;
    if (c.vy) {
      c.vy += 0.45;
      c.y += c.vy;
      if (c.y > GROUND - 24) {
        c.y = GROUND - 24;
        c.vy = 0;
      }
    }
  });
  boxes.forEach((b) => (b.x -= speed));
  pickups.forEach((p) => (p.x -= speed));
  fishes.forEach((f) => {
    f.x -= speed;
    f.vy += FISH_GRAVITY;
    f.y += f.vy;
    if (f.y >= GROUND) {
      f.y = GROUND;
      f.vy = FISH_BOUNCE;
    }
  });
  obstacles = obstacles.filter((o) => o.x + o.w > -40);
  holes = holes.filter((h) => h.x + h.w > -40);
  coins = coins.filter((c) => c.x + c.w > -20 && !c.taken);
  boxes = boxes.filter((b) => b.x + b.w > -20);
  pickups = pickups.filter((p) => p.x + p.w > -20);
  fishes = fishes.filter((f) => f.x + f.w > -20 && !f.taken);
  popTexts.forEach((t) => {
    t.life -= 1;
    t.y -= 0.7;
    t.x -= speed * 0.2;
  });
  popTexts = popTexts.filter((t) => t.life > 0);

  hills.forEach((h) => {
    h.x -= speed * 0.25;
    if (h.x + h.w < 0) h.x += canvas.width + h.w;
  });

  snow.forEach((s) => {
    s.y += s.v;
    s.x -= speed * 0.15;
    if (s.y > canvas.height) {
      s.y = -5;
      s.x = Math.random() * canvas.width;
    }
  });

  const penguinBox = { x: penguin.x, y: penguin.y - penguin.h, w: penguin.w, h: penguin.h };

  if (invincible <= 0) {
    for (const o of obstacles) {
      if (hitBox(penguinBox, o, 14)) {
        if (guardHits > 0) {
          guardHits -= 1;
          invincible = 70;
          addPopText("방패로 막았어요!", penguin.x - 20, penguin.y - penguin.h - 12);
          beep(440, 0.1);
          break;
        }
        if (shield > 0) {
          shield -= 1;
          invincible = 80;
          updateHud();
          beep(500, 0.1);
          break;
        }
        if (o.kind === "hunter") startShotHit(o);
        else if (o.kind === "bear" || o.kind === "wolf") startEatHit(o);
        else gameOver("bump");
        return;
      }
    }
  }

  for (const c of coins) {
    if (!c.taken && hitBox(penguinBox, c, 0)) {
      c.taken = true;
      runCoins += 1;
      coinCount += 1;
      saveCoins();
      beep(980, 0.06);
    }
  }

  for (const b of boxes) {
    if (!b.used && hitBox(penguinBox, b, 2)) popBox(b);
  }

  for (let i = pickups.length - 1; i >= 0; i--) {
    if (hitBox(penguinBox, pickups[i], 2)) {
      takePickup(pickups[i].kind);
      pickups.splice(i, 1);
    }
  }

  for (const f of fishes) {
    const fishBox = { x: f.x, y: f.y - f.h, w: f.w, h: f.h };
    if (!f.taken && hitBox(penguinBox, fishBox, 2)) {
      f.taken = true;
      fishCount += 1;
      beep(880, 0.1);
    }
  }

  updateHud();
}

function checkStageUp() {
  const stage = currentStage();
  if (stage.goal !== Infinity && score >= stage.goal && stageIndex < STAGES.length - 1) {
    stageIndex += 1;
    stageBanner = 140;
    invincible = 90;
    spawnTimer = 100;
    makeHills();
    makeSnow();
    applyTheme();
    beep(700, 0.12);
    updateHud();
  }
}

function saveCoins() {
  localStorage.setItem("penguin-coins", String(coinCount));
  saveMyRank();
}

function savePendingHearts() {
  localStorage.setItem("penguin-hearts", String(pendingHearts));
}

function loadRanks() {
  try {
    const data = JSON.parse(localStorage.getItem("penguin-ranks") || "[]");
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function saveRanks(ranks) {
  localStorage.setItem("penguin-ranks", JSON.stringify(ranks.slice(0, 30)));
}

function saveMyRank() {
  if (!nickname) return;
  const ranks = loadRanks();
  const mine = ranks.find((r) => r.nick === nickname);
  if (mine) {
    mine.best = Math.max(Number(mine.best) || 0, best, score);
    mine.coins = Math.max(Number(mine.coins) || 0, coinCount);
  } else {
    ranks.push({
      nick: nickname,
      best: Math.max(best, score),
      coins: coinCount,
    });
  }
  saveRanks(ranks);
}

function updateNickLabel() {
  if (!nickLabel || !nickNameEl) return;
  if (nickname) {
    nickNameEl.textContent = nickname;
    nickLabel.classList.remove("hidden");
  } else {
    nickLabel.classList.add("hidden");
  }
}

function greetOverlay() {
  if (!nickname || running) return;
  if (overlayKicker) {
    const heartsNow = pendingHearts + shield;
    overlayKicker.textContent =
      heartsNow > 0 ? `안녕, ${nickname}! · 보유 하트 ${heartsNow}개` : `안녕, ${nickname}!`;
  }
}

function openNickScreen() {
  nickOpen = true;
  if (nickEl) nickEl.classList.remove("hidden");
  overlay.classList.add("hidden");
  if (shopEl) shopEl.classList.add("hidden");
  shopOpen = false;
  if (rankEl) rankEl.classList.add("hidden");
  rankOpen = false;
  if (nickMsgEl) nickMsgEl.textContent = "";
  if (nickInput) {
    nickInput.value = nickname;
    nickInput.focus();
  }
}

function closeNickScreen() {
  nickOpen = false;
  if (nickEl) nickEl.classList.add("hidden");
  if (!running && !hitAnim && !shopOpen && !rankOpen && nickname) {
    overlay.classList.remove("hidden");
    startBtn.textContent = "시작하기";
    greetOverlay();
  }
}

function saveNickname() {
  const name = (nickInput ? nickInput.value : "").trim().replace(/\s+/g, " ");
  if (name.length < 1) {
    if (nickMsgEl) nickMsgEl.textContent = "닉네임을 써 주세요!";
    return;
  }
  if (name.length > 10) {
    if (nickMsgEl) nickMsgEl.textContent = "10글자까지만 쓸 수 있어요.";
    return;
  }
  nickname = name;
  localStorage.setItem("penguin-nick", nickname);
  saveMyRank();
  updateNickLabel();
  closeNickScreen();
  beep(760, 0.08);
}

// ---- 온라인 랭킹 (Supabase, 설정된 경우에만) ----
function supabaseCfg() {
  const c = window.PENGUIN_SUPABASE || {};
  return c.url && c.anonKey ? c : null;
}

function submitScoreOnline() {
  const cfg = supabaseCfg();
  if (!cfg || !nickname) return;
  const value = Math.max(best, score);
  if (value <= 0) return;
  try {
    // 점수 쓰기는 서버리스 함수(/api/submit-score)로만. 서비스 키는 서버에만 있고
    // 클라이언트에는 쓰기 권한이 없어 임의 점수 삽입을 막는다(읽기는 공개).
    fetch("/api/submit-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nick: nickname, score: value, coins: coinCount }),
    }).catch(() => {});
  } catch (e) {
    // 네트워크 오류가 나도 게임은 계속돼요.
  }
}

function fetchOnlineRanks() {
  const cfg = supabaseCfg();
  if (!cfg) return Promise.resolve(null);
  const col = rankMode === "coin" ? "coins" : "score";
  const url = `${cfg.url}/rest/v1/scores?select=nick,score,coins&order=${col}.desc&limit=200`;
  return fetch(url, {
    headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}` },
  }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
}

function normalizeLocalRanks() {
  return loadRanks().map((r) => ({
    nick: r.nick,
    score: Number(r.best) || 0,
    coins: Number(r.coins) || 0,
  }));
}

// 같은 닉네임은 최고 점수/코인만 남긴다.
function dedupeByNick(rows) {
  const map = new Map();
  rows.forEach((r) => {
    if (!r || !r.nick) return;
    const cur = map.get(r.nick);
    if (!cur) {
      map.set(r.nick, { nick: r.nick, score: Number(r.score) || 0, coins: Number(r.coins) || 0 });
    } else {
      cur.score = Math.max(cur.score, Number(r.score) || 0);
      cur.coins = Math.max(cur.coins, Number(r.coins) || 0);
    }
  });
  return [...map.values()];
}

function paintRank(rows, note) {
  if (!rankList) return;
  const sorted = rows.slice().sort((a, b) =>
    rankMode === "coin" ? b.coins - a.coins : b.score - a.score
  );
  if (!sorted.length) {
    rankList.innerHTML = `<li class="rank-empty">${rankMode === "coin" ? "아직 코인 기록이 없어요." : "아직 점수 기록이 없어요."}</li>`;
    return;
  }
  const medals = ["🥇", "🥈", "🥉"];
  const head = note ? `<li class="rank-empty">${note}</li>` : "";
  rankList.innerHTML =
    head +
    sorted
      .slice(0, 10)
      .map((r, i) => {
        const value = rankMode === "coin" ? `${r.coins}코인` : `${r.score}점`;
        const me = r.nick === nickname ? " me" : "";
        return `<li class="${me.trim()}"><span class="rank-place">${medals[i] || i + 1}</span><span>${r.nick}${r.nick === nickname ? " (나)" : ""}</span><strong>${value}</strong></li>`;
      })
      .join("");
}

function renderRank() {
  if (rankHello) {
    rankHello.textContent = nickname ? `나는 ${nickname}` : "아직 닉네임이 없어요.";
  }
  if (rankTabScore) rankTabScore.classList.toggle("on", rankMode === "score");
  if (rankTabCoin) rankTabCoin.classList.toggle("on", rankMode === "coin");
  if (!rankList) return;

  const cfg = supabaseCfg();
  if (!cfg) {
    paintRank(dedupeByNick(normalizeLocalRanks()));
    return;
  }
  rankList.innerHTML = `<li class="rank-empty">전 세계 기록 불러오는 중…</li>`;
  fetchOnlineRanks()
    .then((rows) => {
      if (!rankOpen) return;
      const online = (rows || []).map((r) => ({
        nick: r.nick,
        score: Number(r.score) || 0,
        coins: Number(r.coins) || 0,
      }));
      paintRank(dedupeByNick(online.concat(normalizeLocalRanks())));
    })
    .catch(() => {
      if (!rankOpen) return;
      paintRank(dedupeByNick(normalizeLocalRanks()), "인터넷 기록을 못 불러와 이 기기 기록만 보여요.");
    });
}

function openRank() {
  if (!nickname) {
    openNickScreen();
    return;
  }
  rankOpen = true;
  saveMyRank();
  if (rankEl) rankEl.classList.remove("hidden");
  overlay.classList.add("hidden");
  if (shopEl) shopEl.classList.add("hidden");
  shopOpen = false;
  renderRank();
}

function closeRank() {
  rankOpen = false;
  if (rankEl) rankEl.classList.add("hidden");
  if (!running && !hitAnim && !shopOpen && !nickOpen && nickname) overlay.classList.remove("hidden");
}

const SHOP_ITEMS = {
  heart: { price: 8, label: "하트 보호막" },
  star: { price: 15, label: "별 무적" },
  mushroom: { price: 12, label: "버섯 두 번 점프" },
  trail: { price: 16, label: "스피드 트레일" },
  guard: { price: 14, label: "방패" },
  cloak: { price: 20, label: "투명망토" },
};

function setShopMsg(text, ok = false) {
  if (!shopMsgEl) return;
  shopMsgEl.textContent = text;
  shopMsgEl.classList.toggle("ok", ok);
}

function renderShop() {
  if (shopCoinsEl) shopCoinsEl.textContent = coinCount;
  document.querySelectorAll(".shop-item").forEach((btn) => {
    const item = SHOP_ITEMS[btn.dataset.item];
    const heartsFull =
      btn.dataset.item === "heart" &&
      (running ? shield : pendingHearts + shield) >= 9;
    const starsFull = btn.dataset.item === "star" && starCount >= 9;
    const mushroomsFull = btn.dataset.item === "mushroom" && mushroomCount >= 9;
    const guardFull =
      btn.dataset.item === "guard" &&
      (running ? guardHits : pendingGuard + guardHits) >= 6;
    btn.disabled =
      !item || coinCount < item.price || heartsFull || starsFull || mushroomsFull || guardFull;
  });
}

function openShop() {
  if (!nickname) {
    openNickScreen();
    return;
  }
  shopOpen = true;
  setShopMsg("");
  if (shopEl) shopEl.classList.remove("hidden");
  overlay.classList.add("hidden");
  renderShop();
}

function closeShop() {
  shopOpen = false;
  if (shopEl) shopEl.classList.add("hidden");
  if (!running && !hitAnim && !nickOpen && !rankOpen && nickname) overlay.classList.remove("hidden");
}

function buyShopItem(kind) {
  const item = SHOP_ITEMS[kind];
  if (!item) return;
  const heartsNow = running ? shield : pendingHearts + shield;
  if (kind === "heart" && heartsNow >= 9) {
    setShopMsg("하트가 가득 찼어요!");
    renderShop();
    return;
  }
  const guardNow = running ? guardHits : pendingGuard + guardHits;
  if (kind === "guard" && guardNow >= 6) {
    setShopMsg("방패가 가득 찼어요!");
    renderShop();
    return;
  }
  if (coinCount < item.price) {
    setShopMsg("코인이 부족해요! 달리면서 모아 보세요.");
    renderShop();
    return;
  }
  coinCount -= item.price;
  saveCoins();
  if (running) {
    takePickup(kind);
  } else if (kind === "heart") {
    pendingHearts += 1;
    savePendingHearts();
  } else if (kind === "star") {
    pendingStar = true;
  } else if (kind === "mushroom") {
    pendingMushroom = true;
  } else if (kind === "trail") {
    pendingTrail = true;
  } else if (kind === "guard") {
    pendingGuard += 2;
  } else if (kind === "cloak") {
    pendingCloak = true;
  }
  setShopMsg(`${item.label} 샀어요!`, true);
  updateHud();
  renderShop();
}

const shStage = document.getElementById("sh-stage");
const shScore = document.getElementById("sh-score");
const shCoin = document.getElementById("sh-coin");
const shHeart = document.getElementById("sh-heart");
const shStar = document.getElementById("sh-star");
const shMushroom = document.getElementById("sh-mushroom");
const shFish = document.getElementById("sh-fish");
const shBest = document.getElementById("sh-best");

function updateHud() {
  const stage = currentStage();
  const heartsNow = running ? shield : shield + pendingHearts;
  const bestNow = Math.max(best, score);
  scoreEl.textContent = score;
  fishEl.textContent = fishCount;
  if (coinEl) coinEl.textContent = coinCount;
  if (heartEl) heartEl.textContent = heartsNow;
  if (starEl) starEl.textContent = starCount;
  if (mushroomEl) mushroomEl.textContent = mushroomCount;
  bestEl.textContent = bestNow;
  stageEl.textContent = `${stage.id} · ${stage.name}`;
  if (shopCoinsEl) shopCoinsEl.textContent = coinCount;

  // 플레이 화면 안(가로/전체화면) 미니 현황판
  if (shStage) shStage.textContent = stage.id;
  if (shScore) shScore.textContent = score;
  if (shCoin) shCoin.textContent = coinCount;
  if (shHeart) shHeart.textContent = heartsNow;
  if (shStar) shStar.textContent = starCount;
  if (shMushroom) shMushroom.textContent = mushroomCount;
  if (shFish) shFish.textContent = fishCount;
  if (shBest) shBest.textContent = bestNow;
}

// ---- 미니 현황판 아이콘: 게임 속 아이템과 동일한 모양으로 그린다 ----
function drawItemIcon(id, drawFn) {
  const cv = document.getElementById(id);
  if (!cv || !cv.getContext) return;
  const c = cv.getContext("2d");
  c.clearRect(0, 0, cv.width, cv.height);
  drawFn(c);
}

function iconCoin(c) {
  c.fillStyle = "#f4c430";
  c.beginPath();
  c.ellipse(11, 11, 8, 9, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#ffe56a";
  c.beginPath();
  c.ellipse(10, 10, 5, 6, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#c79212";
  c.font = "bold 11px Jua, Malgun Gothic, sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("₩", 11, 12);
}

function iconFish(c) {
  c.save();
  c.translate(9, 11);
  c.fillStyle = "#ff8a3d";
  c.beginPath();
  c.ellipse(0, 0, 7, 4.5, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(6, 0);
  c.lineTo(11, -5);
  c.lineTo(11, 5);
  c.closePath();
  c.fill();
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(-3, -1, 1.5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#222";
  c.beginPath();
  c.arc(-2.5, -1, 0.8, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function iconStar(c) {
  c.fillStyle = "#ffd24a";
  c.beginPath();
  const x = 11;
  const y = 11;
  const r = 9;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    const b = a + Math.PI / 5;
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    c.lineTo(x + Math.cos(b) * r * 0.45, y + Math.sin(b) * r * 0.45);
  }
  c.closePath();
  c.fill();
}

function iconMushroom(c) {
  c.fillStyle = "#e74c3c";
  c.beginPath();
  c.arc(11, 11, 8, Math.PI, 0);
  c.fill();
  c.fillStyle = "#f7f1e3";
  c.fillRect(7, 11, 8, 8);
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(8, 8, 2, 0, Math.PI * 2);
  c.arc(14, 8, 2, 0, Math.PI * 2);
  c.fill();
}

function iconHeart(c) {
  c.fillStyle = "#ff5b7a";
  const cx = 11;
  const cy = 10;
  c.beginPath();
  c.moveTo(cx, cy + 8);
  c.bezierCurveTo(cx + 11, cy - 1, cx + 6, cy - 11, cx, cy - 3);
  c.bezierCurveTo(cx - 6, cy - 11, cx - 11, cy - 1, cx, cy + 8);
  c.fill();
}

function renderHudIcons() {
  drawItemIcon("ic-coin", iconCoin);
  drawItemIcon("ic-heart", iconHeart);
  drawItemIcon("ic-star", iconStar);
  drawItemIcon("ic-mushroom", iconMushroom);
  drawItemIcon("ic-fish", iconFish);
}

function bangSound() {
  beep(150, 0.07);
  setTimeout(() => beep(90, 0.16), 70);
  setTimeout(() => beep(60, 0.14), 170);
}

function startShotHit(hunter) {
  running = false;
  hitAnim = {
    type: "shot",
    frame: 0,
    max: 85,
    hunterX: hunter.x,
    hunterY: hunter.y,
  };
  bangSound();
}

function chompSound() {
  beep(240, 0.08);
  setTimeout(() => beep(170, 0.1), 90);
  setTimeout(() => beep(210, 0.08), 200);
}

function startEatHit(eater) {
  running = false;
  hitAnim = {
    type: "eat",
    frame: 0,
    max: 90,
    eaterKind: eater.kind,
    bearX: eater.x,
    bearY: eater.y,
    bearW: eater.w,
    bearH: eater.h,
  };
  chompSound();
}

function updateHitAnim() {
  if (!hitAnim) return;
  hitAnim.frame += 1;
  frame += 1;
  if (hitAnim.frame >= hitAnim.max) {
    const type = hitAnim.type;
    const eaterKind = hitAnim.eaterKind;
    hitAnim = null;
    gameOver(type, eaterKind);
  }
}

function gameOver(type = "bump", eaterKind = "bear") {
  running = false;
  // 남은 하트는 잃지 않고 다음 판으로 이월(최대 9개)
  pendingHearts = Math.min(9, shield);
  savePendingHearts();
  shield = 0;
  starTime = 0;
  mushroomTime = 0;
  canDoubleJump = false;
  trailTime = 0;
  cloakTime = 0;
  guardHits = 0;
  trail = [];
  if (type !== "shot" && type !== "eat") beep(180, 0.2);
  if (score > best) {
    best = score;
    localStorage.setItem("penguin-best", String(best));
  }
  submitScoreOnline();
  overlayKicker.textContent = "게임 오버";
  overlayTitle.textContent = "잡혔어요!";
  if (type === "shot") {
    overlayText.textContent = `사냥꾼에게 잡혔어요. ${currentStage().id}단계 ${currentStage().name}까지 왔어요.`;
  } else if (type === "eat") {
    overlayText.textContent =
      eaterKind === "wolf"
        ? `늑대에게 잡혔어요. ${currentStage().id}단계 ${currentStage().name}까지 왔어요.`
        : `북극곰에게 잡혔어요. ${currentStage().id}단계 ${currentStage().name}까지 왔어요.`;
  } else {
    overlayText.textContent = `${currentStage().id}단계 ${currentStage().name}까지 왔어요. 다시 도전해서 더 멀리 달려 보세요.`;
  }
  overlayScore.textContent = `점수 ${score} · 이번 코인 ${runCoins} · 총 코인 ${coinCount} · 물고기 ${fishCount}마리 · 최고 ${best} · 다음 판 하트 ${pendingHearts}개`;
  overlayScore.classList.remove("hidden");
  startBtn.textContent = "다시 하기";
  overlay.classList.remove("hidden");
  stopMusic();
  updateHud();
}

function drawBackground() {
  const t = themeColors();
  const id = currentStage().id;
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, t.sky[0]);
  sky.addColorStop(0.45, t.sky[1]);
  sky.addColorStop(1, t.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const starry = isNight || id === 5;
  if (starry) {
    stars.forEach((s) => {
      const shine = 0.55 + Math.sin(frame / 18 + s.twinkle) * 0.45;
      ctx.fillStyle = `rgba(255,255,255,${shine})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const w = canvas.width;
  // 해 / 달 (부드러운 글로우, 화면 폭에 맞춘 위치)
  if (!isNight && id === 1) {
    drawGlowOrb(w * 0.82, 82, 28, "#ffe566", "255,230,140");
  } else if (!isNight && id === 4) {
    drawGlowOrb(w * 0.72, 210, 26, "#ff9a4a", "255,140,70");
  } else if (starry) {
    drawGlowOrb(w * 0.84, id === 5 ? 58 : 72, 26, "#fff6c8", "255,248,210");
  }

  // 낮 하늘에는 흘러가는 구름
  if (!starry) drawClouds();

  // 오로라 (화면 폭에 맞춰 가로로 늘림)
  ctx.save();
  ctx.scale(w / 960, 1);
  ctx.globalAlpha = t.aurora;
  ctx.fillStyle = t.auroraA;
  ctx.beginPath();
  ctx.moveTo(80, 40);
  ctx.bezierCurveTo(220, 10, 280, 90, 430, 40);
  ctx.bezierCurveTo(560, 5, 620, 80, 780, 30);
  ctx.lineTo(780, 90);
  ctx.bezierCurveTo(600, 120, 500, 40, 80, 100);
  ctx.fill();
  ctx.fillStyle = t.auroraB;
  ctx.beginPath();
  ctx.moveTo(200, 20);
  ctx.bezierCurveTo(340, 80, 500, 10, 700, 55);
  ctx.lineTo(700, 100);
  ctx.bezierCurveTo(480, 60, 330, 120, 200, 70);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // 먼 산맥 (패럴랙스: 뒤 레이어는 느리게 흐름)
  drawFarMountains(t);

  hills.forEach((h, i) => drawScenery(h, t.hill[i % 2]));

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  snow.forEach((s) => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = t.ground[0];
  ctx.fillRect(0, GROUND, canvas.width, canvas.height);
  ctx.fillStyle = t.ground[1];
  ctx.fillRect(0, GROUND, canvas.width, 18);
  ctx.fillStyle = t.ground[2];
  const gap = id === 3 ? 36 : 48;
  for (let x = -((frame * speed) % gap); x < canvas.width; x += gap) {
    ctx.fillRect(x, GROUND + 10, id === 5 ? 18 : 28, 5);
  }
}

// 부드러운 글로우가 있는 해/달. glowRGB 는 "r,g,b" 문자열.
function drawGlowOrb(x, y, r, core, glowRGB) {
  ctx.fillStyle = `rgba(${glowRGB},0.16)`;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(${glowRGB},0.4)`;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// 지평선 위로 반복되는 삼각 산맥 실루엣.
function drawPeaks(startX, h, spacing) {
  const w = canvas.width;
  const baseY = GROUND + 4;
  ctx.beginPath();
  ctx.moveTo(startX - spacing, baseY);
  for (let x = startX - spacing; x < w + spacing; x += spacing) {
    ctx.lineTo(x + spacing / 2, baseY - h);
    ctx.lineTo(x + spacing, baseY);
  }
  ctx.lineTo(w + spacing, baseY);
  ctx.closePath();
  ctx.fill();
}

// 두 겹의 먼 산맥이 서로 다른 속도로 흐른다(패럴랙스).
function drawFarMountains(t) {
  const prev = ctx.globalAlpha;
  const off1 = (frame * speed * 0.12) % 300;
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = t.hill[1];
  drawPeaks(-off1, 150, 300);
  const off2 = (frame * speed * 0.26) % 220;
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = t.hill[0];
  drawPeaks(-off2 - 50, 105, 220);
  ctx.globalAlpha = prev;
}

function puff(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.85, y + 6, r * 0.72, 0, Math.PI * 2);
  ctx.arc(x - r * 0.85, y + 6, r * 0.72, 0, Math.PI * 2);
  ctx.fill();
}

// 낮 하늘을 천천히 흘러가는 구름 몇 조각.
function drawClouds() {
  const w = canvas.width;
  const span = w + 220;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  const bases = [0.12, 0.46, 0.78];
  bases.forEach((fx, i) => {
    const drift = (frame * speed * (0.14 + i * 0.03)) % span;
    let cx = fx * w - drift;
    cx = ((cx % span) + span) % span - 110;
    puff(cx, 54 + i * 30, 26 + i * 6);
  });
}

function drawScenery(h, color) {
  ctx.fillStyle = color;
  if (h.type === "den") {
    ctx.beginPath();
    ctx.ellipse(h.x + h.w / 2, GROUND, h.w / 2, h.h, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = isNight ? "#1a1210" : "#4a342c";
    ctx.beginPath();
    ctx.ellipse(h.x + h.w / 2, GROUND - 8, h.w * 0.22, h.h * 0.42, 0, Math.PI, 0);
    ctx.fill();
    return;
  }
  if (h.type === "cliff") {
    ctx.beginPath();
    ctx.moveTo(h.x, GROUND);
    ctx.lineTo(h.x + 20, GROUND - h.h);
    ctx.lineTo(h.x + h.w * 0.55, GROUND - h.h * 0.82);
    ctx.lineTo(h.x + h.w - 10, GROUND - h.h * 0.95);
    ctx.lineTo(h.x + h.w, GROUND);
    ctx.closePath();
    ctx.fill();
    return;
  }
  if (h.type === "tent") {
    ctx.beginPath();
    ctx.moveTo(h.x, GROUND);
    ctx.lineTo(h.x + h.w / 2, GROUND - h.h);
    ctx.lineTo(h.x + h.w, GROUND);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(80,40,10,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(h.x + h.w / 2, GROUND - h.h);
    ctx.lineTo(h.x + h.w / 2, GROUND);
    ctx.stroke();
    if (isNight) {
      ctx.fillStyle = "rgba(255, 180, 70, 0.7)";
      ctx.beginPath();
      ctx.arc(h.x + h.w / 2, GROUND - h.h * 0.35, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  if (h.type === "pole") {
    ctx.fillStyle = "#6b4a2f";
    ctx.fillRect(h.x + h.w / 2 - 3, GROUND - h.h, 6, h.h);
    ctx.fillStyle = "#c0392b";
    ctx.beginPath();
    ctx.moveTo(h.x + h.w / 2 + 3, GROUND - h.h + 6);
    ctx.lineTo(h.x + h.w, GROUND - h.h + 18);
    ctx.lineTo(h.x + h.w / 2 + 3, GROUND - h.h + 30);
    ctx.closePath();
    ctx.fill();
    return;
  }
  if (h.type === "cabin") {
    ctx.fillStyle = "#8b5a32";
    ctx.fillRect(h.x + 10, GROUND - h.h * 0.62, h.w - 20, h.h * 0.62);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(h.x, GROUND - h.h * 0.58);
    ctx.lineTo(h.x + h.w / 2, GROUND - h.h);
    ctx.lineTo(h.x + h.w, GROUND - h.h * 0.58);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = isNight ? "#ffe08a" : "#6ec7ff";
    ctx.fillRect(h.x + h.w / 2 - 8, GROUND - h.h * 0.42, 16, 16);
    return;
  }
  if (h.type === "spire") {
    ctx.beginPath();
    ctx.moveTo(h.x, GROUND);
    ctx.lineTo(h.x + h.w * 0.28, GROUND - h.h);
    ctx.lineTo(h.x + h.w * 0.48, GROUND - h.h * 0.7);
    ctx.lineTo(h.x + h.w * 0.7, GROUND - h.h * 0.92);
    ctx.lineTo(h.x + h.w, GROUND);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.moveTo(h.x + h.w * 0.28, GROUND - h.h);
    ctx.lineTo(h.x + h.w * 0.34, GROUND - h.h * 0.7);
    ctx.lineTo(h.x + h.w * 0.22, GROUND - h.h * 0.55);
    ctx.closePath();
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(h.x, GROUND);
  ctx.lineTo(h.x + h.w * 0.35, GROUND - h.h);
  ctx.lineTo(h.x + h.w * 0.62, GROUND - h.h * 0.7);
  ctx.lineTo(h.x + h.w, GROUND);
  ctx.fill();
}

function drawPenguin() {
  const shot = hitAnim && hitAnim.type === "shot";
  const eaten = hitAnim && hitAnim.type === "eat";
  const eatP = eaten ? Math.min(1, hitAnim.frame / 55) : 0;
  if (eaten && eatP > 0.92) return;

  const waddling = running && penguin.onGround && !shot && !eaten;
  const step = Math.sin(frame / 5.2);
  const waddleTilt = waddling ? step * 0.26 : 0;
  const waddleBob = waddling ? Math.abs(step) * 5 : 0;
  const waddleSway = waddling ? step * 4 : 0;

  const tilt = shot ? 0.7 + hitAnim.frame * 0.012 : eaten ? 0.35 + eatP * 1.1 : penguin.onGround ? waddleTilt : -0.2;

  const px = eaten
    ? penguin.x + penguin.w / 2 + (hitAnim.bearX + hitAnim.bearW * 0.32 - (penguin.x + penguin.w / 2)) * eatP
    : penguin.x + penguin.w / 2 + waddleSway;
  const py = eaten
    ? penguin.y - penguin.h / 2 + (hitAnim.bearY + hitAnim.bearH * 0.4 - (penguin.y - penguin.h / 2)) * eatP
    : penguin.y - waddleBob;

  ctx.save();
  if (cloakTime > 0 && !shot && !eaten) {
    ctx.globalAlpha = 0.26 + Math.sin(frame / 6) * 0.08;
  }
  ctx.translate(px, py);
  if (eaten) {
    ctx.scale(1 - eatP * 0.9, 1 - eatP * 0.9);
    ctx.rotate(tilt);
    ctx.imageSmoothingEnabled = false;
    if (sprites.penguin) {
      ctx.drawImage(sprites.penguin, -penguin.w / 2, -penguin.h / 2, penguin.w, penguin.h);
    }
  } else {
    ctx.rotate(tilt);
    ctx.imageSmoothingEnabled = false;
    if (sprites.penguin) {
      ctx.drawImage(sprites.penguin, -penguin.w / 2, -penguin.h, penguin.w, penguin.h);
    } else {
      ctx.fillStyle = "#1b2636";
      roundOval(-penguin.w / 2, -penguin.h, penguin.w, penguin.h);
    }
    if (shot) {
      for (let i = 0; i < 4; i++) {
        const a = hitAnim.frame / 5 + (i * Math.PI) / 2;
        drawTinyStar(Math.cos(a) * 38, -penguin.h - 8 + Math.sin(a) * 12, 6, "#ffd24a");
      }
    }
  }
  ctx.restore();
}

function roundOval(x, y, w, h) {
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function icePath(o) {
  const style = o.style || "chunk";
  ctx.beginPath();
  if (style === "spike") {
    ctx.moveTo(o.x + 4, o.y + o.h);
    ctx.lineTo(o.x + o.w * 0.18, o.y + o.h * 0.42);
    ctx.lineTo(o.x + o.w * 0.48, o.y);
    ctx.lineTo(o.x + o.w * 0.78, o.y + o.h * 0.36);
    ctx.lineTo(o.x + o.w - 3, o.y + o.h);
  } else if (style === "slab") {
    ctx.moveTo(o.x, o.y + o.h);
    ctx.lineTo(o.x + 8, o.y + 10);
    ctx.lineTo(o.x + o.w * 0.35, o.y + 2);
    ctx.lineTo(o.x + o.w * 0.72, o.y + 8);
    ctx.lineTo(o.x + o.w - 4, o.y + 14);
    ctx.lineTo(o.x + o.w, o.y + o.h);
  } else if (style === "berg") {
    ctx.moveTo(o.x, o.y + o.h);
    ctx.lineTo(o.x + 10, o.y + o.h * 0.55);
    ctx.lineTo(o.x + o.w * 0.28, o.y + 8);
    ctx.lineTo(o.x + o.w * 0.52, o.y);
    ctx.lineTo(o.x + o.w * 0.8, o.y + 14);
    ctx.lineTo(o.x + o.w - 2, o.y + o.h * 0.48);
    ctx.lineTo(o.x + o.w, o.y + o.h);
  } else {
    ctx.moveTo(o.x + 2, o.y + o.h);
    ctx.lineTo(o.x + 10, o.y + 12);
    ctx.lineTo(o.x + o.w * 0.5, o.y);
    ctx.lineTo(o.x + o.w - 8, o.y + 14);
    ctx.lineTo(o.x + o.w, o.y + o.h);
  }
  ctx.closePath();
}

function drawIce(o) {
  const night = isNight;
  icePath(o);
  const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
  grad.addColorStop(0, night ? "#d8f4ff" : "#f5fdff");
  grad.addColorStop(0.35, night ? "#8fd0ef" : "#b9eeff");
  grad.addColorStop(1, night ? "#3f88b0" : "#5fb8d8");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = night ? "#7eb6d4" : "#4aa3c8";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.save();
  icePath(o);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.moveTo(o.x + o.w * 0.18, o.y + 6);
  ctx.lineTo(o.x + o.w * 0.42, o.y + 2);
  ctx.lineTo(o.x + o.w * 0.38, o.y + o.h * 0.45);
  ctx.lineTo(o.x + o.w * 0.12, o.y + o.h * 0.4);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(o.x + o.w * 0.55, o.y + o.h * 0.25);
  ctx.lineTo(o.x + o.w * 0.7, o.y + o.h * 0.55);
  ctx.lineTo(o.x + o.w * 0.62, o.y + o.h * 0.78);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(o.x + o.w * 0.32, o.y + o.h * 0.22, 5, 3, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(o.x + o.w * 0.72, o.y + o.h * 0.38, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = night ? "#e8f6ff" : "#ffffff";
  ctx.beginPath();
  ctx.ellipse(o.x + o.w * 0.5, o.y + 7, o.w * 0.34, 7, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBear(o) {
  if (!sprites.bear) return;
  const eating =
    hitAnim && hitAnim.type === "eat" && hitAnim.eaterKind !== "wolf" && Math.abs(o.x - hitAnim.bearX) < 1;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (eating) {
    const chomp = 1 + Math.sin(hitAnim.frame / 5) * 0.08;
    ctx.translate(o.x + o.w / 2, o.y + o.h);
    ctx.scale(chomp, 2 - chomp);
    ctx.drawImage(sprites.bear, -o.w / 2, -o.h, o.w, o.h);
  } else {
    ctx.drawImage(sprites.bear, o.x, o.y, o.w, o.h);
  }
  ctx.restore();
}

function drawWolf(o) {
  if (!sprites.wolf) return;
  const eating =
    hitAnim && hitAnim.type === "eat" && hitAnim.eaterKind === "wolf" && Math.abs(o.x - hitAnim.bearX) < 1;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (eating) {
    const chomp = 1 + Math.sin(hitAnim.frame / 5) * 0.08;
    ctx.translate(o.x + o.w / 2, o.y + o.h);
    ctx.scale(chomp, 2 - chomp);
    ctx.drawImage(sprites.wolf, -o.w / 2, -o.h, o.w, o.h);
  } else {
    ctx.drawImage(sprites.wolf, o.x, o.y, o.w, o.h);
  }
  ctx.restore();
}

function drawTinyStar(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    const b = a + Math.PI / 5;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(b) * r * 0.45, y + Math.sin(b) * r * 0.45);
  }
  ctx.closePath();
  ctx.fill();
}

function drawHunter(o) {
  if (!sprites.hunter) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sprites.hunter, o.x + o.w, o.y, -o.w, o.h);
  ctx.restore();
}

function drawHole(h) {
  const cx = h.x + h.w / 2;
  const cy = GROUND + 5;

  ctx.fillStyle = isNight ? "#9ec4dc" : "#d7eef8";
  ctx.beginPath();
  ctx.ellipse(cx, cy, h.w / 2 + 7, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isNight ? "#143a58" : "#1b5574";
  ctx.beginPath();
  ctx.ellipse(cx, cy, h.w / 2, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isNight ? "#0a2438" : "#0e334c";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1.5, h.w / 2 - 10, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, h.w / 2 - 2, 6, 0, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
}

function drawFish(f) {
  ctx.save();
  ctx.translate(f.x + f.w / 2, f.y - f.h / 2);
  ctx.rotate(f.vy * 0.06);
  ctx.fillStyle = "#ff8a3d";
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(22, -8);
  ctx.lineTo(22, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-4, -2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(-3, -2, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCoin(c) {
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2;
  ctx.fillStyle = "#f4c430";
  ctx.beginPath();
  ctx.ellipse(cx, cy, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe56a";
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy - 1, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c79212";
  ctx.font = "bold 12px Jua, Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("₩", cx, cy + 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawBox(b) {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2 + 2;
  const s = b.w * 0.52;

  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.72);
  ctx.bezierCurveTo(cx + s * 1.05, cy + s * 0.05, cx + s * 0.62, cy - s * 0.85, cx, cy - s * 0.22);
  ctx.bezierCurveTo(cx - s * 0.62, cy - s * 0.85, cx - s * 1.05, cy + s * 0.05, cx, cy + s * 0.72);
  ctx.closePath();
  ctx.fillStyle = b.used ? "#e3b7c4" : "#ff4f78";
  ctx.fill();
  ctx.strokeStyle = b.used ? "#b07a8a" : "#d81b60";
  ctx.lineWidth = 3;
  ctx.stroke();

  if (!b.used) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff8e1";
    ctx.font = "26px Jua, Malgun Gothic, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", cx, cy + 4);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
}

function drawPickup(p) {
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  if (p.kind === "star") {
    drawTinyStar(cx, cy, 14, "#ffd24a");
  } else if (p.kind === "mushroom") {
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 12, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#f7f1e3";
    roundRect(cx - 6, cy - 2, 12, 12, 4);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 6, 3, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 6, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === "heart") {
    ctx.fillStyle = "#ff5b7a";
    ctx.beginPath();
    ctx.moveTo(cx, cy + 10);
    ctx.bezierCurveTo(cx + 16, cy - 2, cx + 8, cy - 14, cx, cy - 4);
    ctx.bezierCurveTo(cx - 8, cy - 14, cx - 16, cy - 2, cx, cy + 10);
    ctx.fill();
  }
}

function draw() {
  drawBackground();
  holes.forEach(drawHole);
  obstacles.forEach((o) => {
    if (o.kind === "ice") drawIce(o);
    if (o.kind === "bear") drawBear(o);
    if (o.kind === "wolf") drawWolf(o);
    if (o.kind === "hunter") drawHunter(o);
  });
  boxes.forEach(drawBox);
  coins.forEach((c) => {
    if (!c.taken) drawCoin(c);
  });
  pickups.forEach(drawPickup);
  fishes.forEach((f) => {
    if (!f.taken) drawFish(f);
  });
  drawTrailFx();
  drawPenguin();
  drawGuardFx();
  if (hitAnim && hitAnim.type === "eat") {
    const eater = {
      x: hitAnim.bearX,
      y: hitAnim.bearY,
      w: hitAnim.bearW,
      h: hitAnim.bearH,
    };
    if (hitAnim.eaterKind === "wolf") drawWolf(eater);
    else drawBear(eater);
  }
  drawHitEffect();
  popTexts.forEach(drawPopText);
  drawStageHud();
}

function drawTrailFx() {
  trail.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / 22);
    ctx.fillStyle = p.warm ? "#fff4b0" : "#7ad8ff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawGuardFx() {
  if (guardHits <= 0) return;
  const cx = penguin.x + penguin.w / 2;
  const cy = penguin.y - penguin.h / 2;
  const pulse = 1 + Math.sin(frame / 7) * 0.05;
  ctx.save();
  ctx.strokeStyle = "rgba(70, 170, 255, 0.95)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 50 * pulse, 60 * pulse, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(120, 200, 255, 0.16)";
  ctx.fill();
  ctx.fillStyle = "#1f6aa8";
  ctx.font = "18px Jua, Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`🛡️${guardHits}`, cx, penguin.y - penguin.h - 10);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawPopText(t) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, t.life / 20);
  ctx.fillStyle = isNight ? "#fff4c4" : "#7a3b00";
  ctx.font = "22px Jua, Malgun Gothic, sans-serif";
  ctx.fillText(t.text, t.x, t.y);
  ctx.restore();
}

function drawHitEffect() {
  if (!hitAnim) return;
  if (hitAnim.type === "eat") {
    drawEatEffect();
    return;
  }
  if (hitAnim.type !== "shot") return;

  const t = hitAnim.frame;
  if (t < 14) {
    ctx.fillStyle = `rgba(255, 236, 170, ${0.5 * (1 - t / 14)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const bx = penguin.x + penguin.w - 6;
  const by = penguin.y - 42;
  const scale = 0.55 + Math.min(t, 16) / 16;
  const alpha = t < 28 ? 1 : Math.max(0, 1 - (t - 28) / 40);

  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  ctx.fillStyle = "#ffcf4a";
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((i / 8) * Math.PI * 2 + t * 0.04);
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, -46);
    ctx.lineTo(0, -22);
    ctx.lineTo(-10, -46);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = "#fff4c4";
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e74c3c";
  ctx.font = "34px Jua, Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("탕!", 0, 2);
  ctx.restore();

  if (t < 22) {
    const hx = hitAnim.hunterX - 28;
    const hy = hitAnim.hunterY + 46;
    ctx.fillStyle = `rgba(255, 210, 80, ${1 - t / 22})`;
    ctx.beginPath();
    ctx.arc(hx, hy, 10 + t * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEatEffect() {
  const t = hitAnim.frame;
  const alpha = t < 30 ? 1 : Math.max(0, 1 - (t - 30) / 40);
  const bx = hitAnim.bearX + hitAnim.bearW - 10;
  const by = hitAnim.bearY - 8;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(bx, by);
  ctx.scale(0.85 + Math.min(t, 12) / 20, 0.85 + Math.min(t, 12) / 20);

  ctx.fillStyle = "#fff7d6";
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e67e22";
  ctx.font = "32px Jua, Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("냠!", 0, 2);
  ctx.restore();
}

function drawStageHud() {
  if (!running && stageBanner <= 0) return;

  const stage = currentStage();
  ctx.fillStyle = isNight ? "rgba(230,245,255,0.85)" : "rgba(20,50,80,0.55)";
  ctx.font = "20px Jua, Malgun Gothic, sans-serif";
  if (running) {
    ctx.fillText(`${stage.id}단계  ${stage.name}`, 24, 36);
    if (invincible > 0 && cloakTime <= 0 && invincible % 8 < 4) {
      ctx.globalAlpha = 0.45;
      drawPenguin();
      ctx.globalAlpha = 1;
    }
    let buffY = 62;
    if (cloakTime > 0) {
      ctx.fillText(`👻 망토 ${Math.ceil(cloakTime / 60)}초`, 24, buffY);
      buffY += 24;
    }
    if (trailTime > 0) {
      ctx.fillText(`💨 트레일 ${Math.ceil(trailTime / 60)}초`, 24, buffY);
      buffY += 24;
    }
    if (guardHits > 0) {
      ctx.fillText(`🛡️ 방패 ${guardHits}`, 24, buffY);
    }
  }

  if (stageBanner > 0) {
    const alpha = Math.min(1, stageBanner / 20);
    ctx.fillStyle = `rgba(12, 36, 64, ${0.55 * alpha})`;
    roundRect(canvas.width / 2 - 210, 150, 420, 110, 24);
    ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.textAlign = "center";
    ctx.font = "28px Jua, Malgun Gothic, sans-serif";
    ctx.fillText(`${stage.id}단계 시작!`, canvas.width / 2, 198);
    ctx.font = "22px Jua, Malgun Gothic, sans-serif";
    ctx.fillText(stage.name, canvas.width / 2, 234);
    ctx.textAlign = "left";
  }
}

function loop() {
  if (running && !shopOpen && !rankOpen && !nickOpen && !rotateOpen) update();
  else updateHitAnim();
  draw();
  requestAnimationFrame(loop);
}

startBtn.addEventListener("click", () => {
  if (!nickname) {
    openNickScreen();
    return;
  }
  resetGame();
});
window.addEventListener("pointerdown", () => {
  try {
    getAudio();
  } catch (e) {}
}, { once: true });
if (nickSave) nickSave.addEventListener("click", saveNickname);
if (nickInput) {
  nickInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveNickname();
    }
  });
}
if (rankBtn) rankBtn.addEventListener("click", openRank);
if (rankClose) rankClose.addEventListener("click", closeRank);
if (rankTabScore) {
  rankTabScore.addEventListener("click", () => {
    rankMode = "score";
    renderRank();
  });
}
if (rankTabCoin) {
  rankTabCoin.addEventListener("click", () => {
    rankMode = "coin";
    renderRank();
  });
}
if (shopBtn) shopBtn.addEventListener("click", openShop);
if (shopClose) shopClose.addEventListener("click", closeShop);
document.querySelectorAll(".shop-item").forEach((btn) => {
  btn.addEventListener("click", () => buyShopItem(btn.dataset.item));
});
nightBtn.addEventListener("click", () => {
  isNight = !isNight;
  localStorage.setItem("penguin-night", isNight ? "1" : "0");
  applyTheme();
});

// ---- 음악 켜기/끄기 ----
const musicBtn = document.getElementById("music-btn");
function updateMusicUi() {
  if (musicBtn) {
    musicBtn.textContent = musicOn ? "🎵 음악 켬" : "🔇 음악 끔";
    musicBtn.classList.toggle("off", !musicOn);
  }
  const tm = document.getElementById("t-music");
  if (tm) tm.textContent = musicOn ? "🎵" : "🔇";
}
function toggleMusic() {
  musicOn = !musicOn;
  localStorage.setItem("penguin-music", musicOn ? "1" : "0");
  if (musicOn) {
    if (running) startMusic();
  } else {
    stopMusic();
  }
  updateMusicUi();
}
if (musicBtn) musicBtn.addEventListener("click", toggleMusic);
updateMusicUi();

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    if (nickOpen) return;
    e.preventDefault();
    jump();
  }
});
canvas.addEventListener("pointerdown", jump);

// ---- 전체화면 & 화면 방향 ----
const fsBtn = document.getElementById("fs-btn");
const fsRotateBtn = document.getElementById("fs-rotate");
const rotateEl = document.getElementById("rotate");
const stageBox = document.querySelector(".stage");
const tRank = document.getElementById("t-rank");
const tShop = document.getElementById("t-shop");
const tNight = document.getElementById("t-night");
const tMusic = document.getElementById("t-music");
const tFs = document.getElementById("t-fs");

function fullscreenEl() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function inFullscreen() {
  return !!fullscreenEl() || document.body.classList.contains("fs");
}

function requestFs() {
  const req =
    stageBox.requestFullscreen ||
    stageBox.webkitRequestFullscreen ||
    stageBox.webkitRequestFullScreen;
  if (req) {
    try {
      const p = req.call(stageBox);
      if (p && p.catch) p.catch(() => document.body.classList.add("fs"));
    } catch (_) {
      document.body.classList.add("fs");
    }
  } else {
    // iOS Safari 등 표준 전체화면 미지원 기기: 유사 전체화면으로 대체
    document.body.classList.add("fs");
  }
  syncFsUi();
}

function exitFs() {
  const exit =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.webkitCancelFullScreen;
  if (fullscreenEl() && exit) {
    try {
      exit.call(document);
    } catch (_) {}
  }
  document.body.classList.remove("fs");
  syncFsUi();
}

function toggleFs() {
  if (inFullscreen()) exitFs();
  else requestFs();
}

function syncFsUi() {
  const on = inFullscreen();
  if (tFs) tFs.textContent = on ? "✕" : "⛶";
  if (fsBtn) fsBtn.textContent = on ? "⛶ 전체화면 끄기" : "⛶ 전체화면";
  fitCanvas();
}

// 가로/전체화면처럼 화면을 꽉 채우는 모드인지.
function isFillMode() {
  return (
    inFullscreen() ||
    window.matchMedia("(orientation: landscape) and (max-height: 600px)").matches
  );
}

/*
 * 화면비율 최적화: 내부 높이(540)와 게임 로직(GROUND 등)은 그대로 두고,
 * 꽉 채움 모드에서는 내부 폭만 화면 비율에 맞춰 바꿔 여백 없이 채운다.
 * 수평 로직은 이미 canvas.width 기준이라 안전하다.
 */
function fitCanvas() {
  let targetW = 960;
  if (isFillMode()) {
    const ratio = window.innerWidth / Math.max(1, window.innerHeight);
    targetW = Math.max(720, Math.min(1400, Math.round(540 * ratio)));
  }
  if (canvas.width !== targetW) {
    canvas.width = targetW;
    // 배경 장식을 새 폭에 맞춰 다시 생성 (지면 높이/게임 로직은 무변경)
    makeSnow();
    makeStars();
    makeHills();
  }
}

if (fsBtn) fsBtn.addEventListener("click", toggleFs);
if (fsRotateBtn) fsRotateBtn.addEventListener("click", requestFs);
if (tFs) tFs.addEventListener("click", toggleFs);
if (tRank) tRank.addEventListener("click", () => rankBtn && rankBtn.click());
if (tShop) tShop.addEventListener("click", () => shopBtn && shopBtn.click());
if (tNight) tNight.addEventListener("click", () => nightBtn && nightBtn.click());
if (tMusic) tMusic.addEventListener("click", toggleMusic);
document.addEventListener("fullscreenchange", syncFsUi);
document.addEventListener("webkitfullscreenchange", syncFsUi);

function isTouchLike() {
  return (
    (navigator.maxTouchPoints || 0) > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

// 좁고 세로인 터치 화면(휴대전화)에서만 회전 안내를 띄운다.
function isPortraitPhone() {
  const portrait = window.matchMedia("(orientation: portrait)").matches;
  return portrait && window.innerWidth <= 820 && isTouchLike();
}

function checkOrientation() {
  const show = isPortraitPhone();
  rotateOpen = show;
  if (rotateEl) rotateEl.classList.toggle("hidden", !show);
}

function onViewport() {
  checkOrientation();
  fitCanvas();
}
window.addEventListener("resize", onViewport);
window.addEventListener("orientationchange", onViewport);

makeSnow();
makeStars();
makeHills();
applyTheme();
renderHudIcons();
updateHud();
updateNickLabel();
onViewport();
if (!nickname) openNickScreen();
else {
  overlay.classList.remove("hidden");
  greetOverlay();
}
draw();
loop();
