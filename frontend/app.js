const API_BASE_URL = "http://127.0.0.1:8000";

const elements = {};
const state = {
  notebooks: [],
  sidebarOpen: false,
  createModalOpen: false,
  isCreatingNotebook: false,
  snowAnimationFrame: 0,
  snowFlakes: [],
  snowCanvasReady: false,
};

function initWelcomePage() {
  elements.memorySidebar = document.getElementById("memorySidebar");
  elements.memoryList = document.getElementById("memoryList");
  elements.openSidebarBtn = document.getElementById("openSidebarBtn");
  elements.closeSidebarBtn = document.getElementById("closeSidebarBtn");
  elements.startCreateBtn = document.getElementById("startCreateBtn");
  elements.createNotebookModal = document.getElementById("createNotebookModal");
  elements.closeNotebookModalBtn = document.getElementById("closeNotebookModalBtn");
  elements.createNotebookForm = document.getElementById("createNotebookForm");
  elements.notebookTitleInput = document.getElementById("notebookTitleInput");
  elements.notebookDescriptionInput = document.getElementById("notebookDescriptionInput");
  elements.createNotebookMessage = document.getElementById("createNotebookMessage");
  elements.submitNotebookBtn = document.getElementById("submitNotebookBtn");
  elements.snowCanvas = document.getElementById("snowCanvas");

  elements.memorySidebar.classList.remove("open");

  elements.openSidebarBtn.addEventListener("click", () => {
    setSidebarOpen(!state.sidebarOpen);
  });
  elements.closeSidebarBtn.addEventListener("click", () => {
    setSidebarOpen(false);
  });
  elements.startCreateBtn.addEventListener("click", () => {
    openCreateNotebookModal();
  });
  elements.closeNotebookModalBtn.addEventListener("click", closeCreateNotebookModal);
  elements.createNotebookModal.addEventListener("click", handleModalBackdropClick);
  elements.createNotebookForm.addEventListener("submit", handleCreateNotebookSubmit);
  document.addEventListener("keydown", handleGlobalKeydown);

  setSidebarOpen(state.sidebarOpen);
  updateCreateNotebookActionState();
  loadNotebookMemories();
  initSnowCanvas();
}

async function loadNotebookMemories() {
  try {
    const response = await fetch(`${API_BASE_URL}/notebooks`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "记忆列表加载失败");
    }

    state.notebooks = data.notebooks || [];
    renderMemoryList();
  } catch (error) {
    elements.memoryList.innerHTML = `<div class="memory-item"><p class="memory-meta">${escapeHtml(error.message || "记忆列表加载失败")}</p></div>`;
  }
}

function renderMemoryList() {
  if (!state.notebooks.length) {
    elements.memoryList.innerHTML = '<div class="memory-item"><p class="memory-meta">当前还没有记忆内容，点击“开始新创作”开始。</p></div>';
    return;
  }

  elements.memoryList.innerHTML = state.notebooks
    .map(
      (notebook, index) => `
        <article class="memory-item${index === 0 ? " is-active" : ""}" data-memory-id="${escapeHtml(notebook.id)}">
          <h3>${escapeHtml(notebook.title)}</h3>
          <p class="memory-time">${escapeHtml(formatTimestamp(notebook.updated_at))}</p>
          <p class="memory-meta">${escapeHtml(notebook.summary || notebook.description || "暂无摘要")}</p>
        </article>
      `
    )
    .join("");

  document.querySelectorAll("[data-memory-id]").forEach((node) => {
    node.addEventListener("click", () => {
      goToScriptPage(node.dataset.memoryId);
    });
  });
}

function setSidebarOpen(isOpen) {
  state.sidebarOpen = isOpen;
  elements.memorySidebar.classList.toggle("open", isOpen);
}

async function createNotebookAndOpenScriptPage() {
  const title = elements.notebookTitleInput.value.trim();
  const description = elements.notebookDescriptionInput.value.trim();
  if (!title) {
    setCreateNotebookMessage("请先填写笔记本名称。");
    elements.notebookTitleInput.focus();
    return;
  }

  if (state.isCreatingNotebook) {
    return;
  }

  state.isCreatingNotebook = true;
  updateCreateNotebookActionState();
  setCreateNotebookMessage("");

  try {
    const response = await fetch(`${API_BASE_URL}/notebooks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
      }),
    });
    const notebook = await response.json();
    if (!response.ok) {
      throw new Error(notebook.detail || "创建记忆失败");
    }

    closeCreateNotebookModal();
    goToScriptPage(notebook.id);
  } catch (error) {
    console.warn("Failed to create notebook before opening script page.", error);
    setCreateNotebookMessage(error.message || "创建笔记本失败，请稍后重试。");
  } finally {
    state.isCreatingNotebook = false;
    updateCreateNotebookActionState();
  }
}

async function handleCreateNotebookSubmit(event) {
  event.preventDefault();
  await createNotebookAndOpenScriptPage();
}

function goToScriptPage(notebookId = "") {
  const query = notebookId ? `?notebook=${encodeURIComponent(notebookId)}` : "";
  window.location.href = `script.html${query}`;
}

function openCreateNotebookModal() {
  state.createModalOpen = true;
  elements.createNotebookModal.hidden = false;
  setCreateNotebookMessage("");
  window.requestAnimationFrame(() => {
    elements.notebookTitleInput.focus();
  });
}

function closeCreateNotebookModal() {
  if (state.isCreatingNotebook) {
    return;
  }

  state.createModalOpen = false;
  elements.createNotebookModal.hidden = true;
  elements.createNotebookForm.reset();
  setCreateNotebookMessage("");
}

function handleModalBackdropClick(event) {
  if (event.target === elements.createNotebookModal) {
    closeCreateNotebookModal();
  }
}

function handleGlobalKeydown(event) {
  if (event.key === "Escape" && state.createModalOpen) {
    closeCreateNotebookModal();
  }
}

function setCreateNotebookMessage(message) {
  elements.createNotebookMessage.textContent = message;
  elements.createNotebookMessage.hidden = !message;
  elements.createNotebookMessage.classList.toggle("is-error", Boolean(message));
}

function updateCreateNotebookActionState() {
  elements.submitNotebookBtn.disabled = state.isCreatingNotebook;
  elements.submitNotebookBtn.textContent = state.isCreatingNotebook ? "创建中…" : "创建笔记本";
}

function initSnowCanvas() {
  if (!elements.snowCanvas) {
    return;
  }

  const context = elements.snowCanvas.getContext("2d");
  if (!context) {
    return;
  }

  elements.snowCanvasContext = context;
  state.snowCanvasReady = true;
  rebuildSnowField();
  window.addEventListener("resize", rebuildSnowField);
  startSnowLoop();
}

function rebuildSnowField() {
  if (!state.snowCanvasReady) {
    return;
  }

  const rect = elements.snowCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));

  elements.snowCanvas.width = Math.floor(width * dpr);
  elements.snowCanvas.height = Math.floor(height * dpr);
  elements.snowCanvas.style.width = `${width}px`;
  elements.snowCanvas.style.height = `${height}px`;
  elements.snowCanvasContext.setTransform(dpr, 0, 0, dpr, 0, 0);

  const density = Math.max(92, Math.round((width * height) / 18000));
  state.snowFlakes = Array.from({ length: density }, (_, index) => createSnowFlake(width, height, index));
}

function createSnowFlake(width, height, index) {
  const layer = index % 4;
  const depth = 0.35 + layer * 0.2 + Math.random() * 0.08;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 1.2 + depth * (1.8 + Math.random() * 3.2),
    speedY: 16 + depth * (24 + Math.random() * 38),
    sway: 12 + Math.random() * 32,
    swaySpeed: 0.35 + Math.random() * 0.85,
    opacity: 0.42 + depth * 0.34,
    blur: depth * 0.8,
    twinkle: Math.random() * Math.PI * 2,
    driftSeed: Math.random() * Math.PI * 2,
  };
}

function startSnowLoop() {
  if (state.snowAnimationFrame) {
    window.cancelAnimationFrame(state.snowAnimationFrame);
  }

  const startTime = performance.now();
  let previousTime = startTime;

  const frame = (timestamp) => {
    const delta = Math.min((timestamp - previousTime) / 1000, 0.032);
    const elapsed = (timestamp - startTime) / 1000;
    previousTime = timestamp;
    renderSnowFrame(delta, elapsed);
    state.snowAnimationFrame = window.requestAnimationFrame(frame);
  };

  state.snowAnimationFrame = window.requestAnimationFrame(frame);
}

function renderSnowFrame(delta, elapsed) {
  if (!state.snowCanvasReady) {
    return;
  }

  const canvas = elements.snowCanvas;
  const context = elements.snowCanvasContext;
  const width = parseFloat(canvas.style.width) || canvas.clientWidth || 0;
  const height = parseFloat(canvas.style.height) || canvas.clientHeight || 0;
  if (!width || !height) {
    return;
  }

  context.clearRect(0, 0, width, height);

  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(196, 227, 255, 0.34)");
  gradient.addColorStop(0.48, "rgba(244, 250, 255, 0.14)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  state.snowFlakes.forEach((flake) => {
    flake.y += flake.speedY * delta;
    const lateralShift = Math.sin(elapsed * flake.swaySpeed + flake.driftSeed) * flake.sway * delta;
    flake.x += lateralShift;

    if (flake.y > height + flake.radius * 4) {
      flake.y = -flake.radius * 6;
      flake.x = Math.random() * width;
    }
    if (flake.x < -30) {
      flake.x = width + 20;
    } else if (flake.x > width + 30) {
      flake.x = -20;
    }

    const pulse = 0.82 + Math.sin(elapsed * 2.2 + flake.twinkle) * 0.18;
    const alpha = flake.opacity * pulse;
    const glowRadius = flake.radius * (2.2 + pulse * 0.8);

    context.beginPath();
    context.fillStyle = `rgba(255, 255, 255, ${Math.min(alpha * 1.12, 0.98)})`;
    context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
    context.fill();

    context.beginPath();
    context.fillStyle = `rgba(210, 235, 255, ${alpha * 0.34})`;
    context.arc(flake.x, flake.y, glowRadius, 0, Math.PI * 2);
    context.fill();
  });

  context.fillStyle = "rgba(255, 255, 255, 0.05)";
  for (let i = 0; i < 26; i += 1) {
    const noiseX = pseudoRandom(i * 12.3 + elapsed * 0.4) * width;
    const noiseY = pseudoRandom(i * 4.7 + elapsed * 0.18) * height;
    context.fillRect(noiseX, noiseY, 1, 1);
  }
}

function pseudoRandom(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function formatTimestamp(value) {
  if (!value) {
    return "暂无时间";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

document.addEventListener("DOMContentLoaded", initWelcomePage);
window.addEventListener("pageshow", () => {
  if (elements.memoryList) {
    loadNotebookMemories();
  }
});
