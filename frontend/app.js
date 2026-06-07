const API_BASE_URL = "http://127.0.0.1:8000";

const elements = {};
const state = {
  notebooks: [],
  sidebarOpen: false,
};

function initWelcomePage() {
  elements.memorySidebar = document.getElementById("memorySidebar");
  elements.memoryList = document.getElementById("memoryList");
  elements.openSidebarBtn = document.getElementById("openSidebarBtn");
  elements.closeSidebarBtn = document.getElementById("closeSidebarBtn");
  elements.startCreateBtn = document.getElementById("startCreateBtn");
  elements.createMemoryBtn = document.getElementById("createMemoryBtn");

  elements.memorySidebar.classList.remove("open");

  elements.openSidebarBtn.addEventListener("click", () => {
    setSidebarOpen(!state.sidebarOpen);
  });
  elements.closeSidebarBtn.addEventListener("click", () => {
    setSidebarOpen(false);
  });
  elements.startCreateBtn.addEventListener("click", async () => {
    await createNotebookAndOpenScriptPage();
  });
  elements.createMemoryBtn.addEventListener("click", async () => {
    await createNotebookAndOpenScriptPage();
  });

  setSidebarOpen(state.sidebarOpen);
  loadNotebookMemories();
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
  try {
    const response = await fetch(`${API_BASE_URL}/notebooks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: buildNotebookTitle(),
        description: "新的剧本改编创作流程",
      }),
    });
    const notebook = await response.json();
    if (!response.ok) {
      throw new Error(notebook.detail || "创建记忆失败");
    }

    goToScriptPage(notebook.id);
  } catch (error) {
    console.warn("Failed to create notebook before opening script page.", error);
    goToScriptPage();
  }
}

function goToScriptPage(notebookId = "") {
  const query = notebookId ? `?notebook=${encodeURIComponent(notebookId)}` : "";
  window.location.href = `script.html${query}`;
}

function buildNotebookTitle() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `叙构创作 ${month}-${day} ${hour}:${minute}`;
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
