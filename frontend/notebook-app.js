const API_BASE_URL = "http://127.0.0.1:8000";

const state = {
  notebooks: [],
  selectedNotebookId: "",
  conversations: [],
  currentView: "home",
  isCreatingNotebook: false,
  isSendingMessage: false,
};

const elements = {};

function initApp() {
  elements.scriptGeneratorBtn = document.getElementById("scriptGeneratorBtn");
  elements.homeBtn = document.getElementById("homeBtn");
  elements.statusBanner = document.getElementById("statusBanner");
  elements.homeView = document.getElementById("homeView");
  elements.workspaceView = document.getElementById("workspaceView");
  elements.createNotebookForm = document.getElementById("createNotebookForm");
  elements.notebookTitleInput = document.getElementById("notebookTitleInput");
  elements.notebookDescriptionInput = document.getElementById("notebookDescriptionInput");
  elements.createNotebookBtn = document.getElementById("createNotebookBtn");
  elements.homeNotebookGrid = document.getElementById("homeNotebookGrid");
  elements.homeNotebookCount = document.getElementById("homeNotebookCount");
  elements.homeMessageCount = document.getElementById("homeMessageCount");
  elements.homeUpdatedAt = document.getElementById("homeUpdatedAt");
  elements.sidebarNotebookList = document.getElementById("sidebarNotebookList");
  elements.chatNotebookTitle = document.getElementById("chatNotebookTitle");
  elements.chatMessageCount = document.getElementById("chatMessageCount");
  elements.chatStream = document.getElementById("chatStream");
  elements.chatComposerForm = document.getElementById("chatComposerForm");
  elements.chatInput = document.getElementById("chatInput");
  elements.sendMessageBtn = document.getElementById("sendMessageBtn");
  elements.summaryDescription = document.getElementById("summaryDescription");
  elements.summaryMessageCount = document.getElementById("summaryMessageCount");
  elements.summaryCreatedAt = document.getElementById("summaryCreatedAt");
  elements.summaryUpdatedAt = document.getElementById("summaryUpdatedAt");
  elements.summaryText = document.getElementById("summaryText");
  elements.summaryLastMessage = document.getElementById("summaryLastMessage");

  if (elements.scriptGeneratorBtn) {
    elements.scriptGeneratorBtn.addEventListener("click", () => goToScriptGenerator(state.selectedNotebookId));
  }
  if (elements.homeBtn) {
    elements.homeBtn.addEventListener("click", showHomeView);
  }
  elements.createNotebookForm.addEventListener("submit", handleCreateNotebook);
  elements.chatComposerForm.addEventListener("submit", handleSendMessage);

  loadNotebooks();
}

async function loadNotebooks() {
  setStatus("正在加载笔记本列表……", "info");

  try {
    const response = await fetch(`${API_BASE_URL}/notebooks`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "笔记本列表加载失败");
    }

    state.notebooks = data.notebooks || [];
    renderNotebookCollections();
    renderNotebookMetrics();

    if (!state.notebooks.length) {
      showHomeView();
      setStatus("当前还没有笔记本，可以先创建一个。", "info");
      return;
    }

    if (!state.selectedNotebookId) {
      state.selectedNotebookId = state.notebooks[0].id;
    }

    setStatus("笔记本列表加载成功。", "success");
  } catch (error) {
    setStatus(error.message || "笔记本列表加载失败。", "error");
    renderNotebookCollections();
    renderNotebookMetrics();
  }
}

async function handleCreateNotebook(event) {
  event.preventDefault();
  if (state.isCreatingNotebook) {
    return;
  }

  const title = elements.notebookTitleInput.value.trim();
  const description = elements.notebookDescriptionInput.value.trim();
  if (!title) {
    setStatus("请先填写笔记本名称。", "warning");
    elements.notebookTitleInput.focus();
    return;
  }

  state.isCreatingNotebook = true;
  updateActionState();
  setStatus("正在创建笔记本……", "info");

  try {
    const response = await fetch(`${API_BASE_URL}/notebooks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, description }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "创建笔记本失败");
    }

    elements.createNotebookForm.reset();
    await loadNotebooks();
    state.selectedNotebookId = data.id;
    await openNotebook(data.id);
    setStatus(`笔记本“${data.title}”创建成功。`, "success");
  } catch (error) {
    setStatus(error.message || "创建笔记本失败。", "error");
  } finally {
    state.isCreatingNotebook = false;
    updateActionState();
  }
}

async function openNotebook(notebookId) {
  state.selectedNotebookId = notebookId;
  state.currentView = "workspace";
  updateView();
  renderNotebookCollections();
  renderWorkspaceShell();
  setStatus("正在加载对话历史……", "info");

  try {
    const response = await fetch(`${API_BASE_URL}/notebooks/${notebookId}/conversations`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "对话历史加载失败");
    }

    state.conversations = data.conversations || [];
    syncNotebookSummary(data.notebook);
    renderNotebookCollections();
    renderWorkspaceShell();
    setStatus(`已进入笔记本“${data.notebook.title}”。点击卡片可跳转到主剧本生成页。`, "success");
  } catch (error) {
    setStatus(error.message || "对话历史加载失败。", "error");
  }
}

async function handleSendMessage(event) {
  event.preventDefault();
  if (state.isSendingMessage || !state.selectedNotebookId) {
    return;
  }

  const message = elements.chatInput.value.trim();
  if (!message) {
    setStatus("请输入要发送的内容。", "warning");
    elements.chatInput.focus();
    return;
  }

  state.isSendingMessage = true;
  updateActionState();
  setStatus("正在联系 AI 创作助理……", "info");

  try {
    const response = await fetch(`${API_BASE_URL}/notebooks/${state.selectedNotebookId}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "消息发送失败");
    }

    elements.chatInput.value = "";
    state.conversations = data.conversations || [];
    syncNotebookSummary(data.notebook);
    renderNotebookCollections();
    renderWorkspaceShell();
    setStatus("消息已发送。", "success");
  } catch (error) {
    setStatus(error.message || "发送失败，请重试。", "error");
  } finally {
    state.isSendingMessage = false;
    updateActionState();
  }
}

function syncNotebookSummary(summary) {
  state.notebooks = state.notebooks
    .map((item) => (item.id === summary.id ? summary : item))
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}

function renderNotebookCollections() {
  const cards = state.notebooks.length
    ? state.notebooks.map((notebook) => buildNotebookCard(notebook, "card")).join("")
    : '<div class="empty-chat"><p class="muted">还没有笔记本，先创建一个开始吧。</p></div>';
  elements.homeNotebookGrid.innerHTML = cards;

  const sidebarItems = state.notebooks.length
    ? state.notebooks.map((notebook) => buildNotebookCard(notebook, "sidebar")).join("")
    : '<div class="empty-chat"><p class="muted">暂无笔记本。</p></div>';
  elements.sidebarNotebookList.innerHTML = sidebarItems;

  document.querySelectorAll("[data-open-notebook]").forEach((node) => {
    node.addEventListener("click", () => {
      openNotebook(node.dataset.openNotebook);
    });
  });

  document.querySelectorAll("[data-script-link]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      goToScriptGenerator(node.dataset.scriptLink);
    });
  });
}

function renderNotebookMetrics() {
  const notebookCount = state.notebooks.length;
  const messageCount = state.notebooks.reduce((total, notebook) => total + (notebook.message_count || 0), 0);
  const latestUpdate = state.notebooks[0]?.updated_at || "-";

  elements.homeNotebookCount.textContent = String(notebookCount);
  elements.homeMessageCount.textContent = String(messageCount);
  elements.homeUpdatedAt.textContent = formatTimestamp(latestUpdate);
}

function renderWorkspaceShell() {
  const currentNotebook = getCurrentNotebook();

  if (!currentNotebook) {
    elements.chatNotebookTitle.textContent = "请选择笔记本";
    elements.chatMessageCount.textContent = "0 条消息";
    elements.chatStream.innerHTML = '<div class="empty-chat"><p class="muted">从左侧或首页选择一个笔记本，开始继续历史对话。</p></div>';
    renderNotebookSummary(null);
    return;
  }

  elements.chatNotebookTitle.textContent = currentNotebook.title;
  elements.chatMessageCount.textContent = `${currentNotebook.message_count || 0} 条消息`;
  elements.chatStream.innerHTML = state.conversations.length
    ? state.conversations.map(buildMessageBubble).join("")
    : '<div class="empty-chat"><p class="muted">这个笔记本还没有历史消息，先发送第一条内容吧。</p></div>';
  renderNotebookSummary(currentNotebook);
  elements.chatStream.scrollTop = elements.chatStream.scrollHeight;
}

function renderNotebookSummary(notebook) {
  if (!notebook) {
    elements.summaryDescription.textContent = "-";
    elements.summaryMessageCount.textContent = "0";
    elements.summaryCreatedAt.textContent = "-";
    elements.summaryUpdatedAt.textContent = "-";
    elements.summaryText.textContent = "-";
    elements.summaryLastMessage.textContent = "-";
    return;
  }

  elements.summaryDescription.textContent = notebook.description || "这个笔记本暂时还没有补充说明。";
  elements.summaryMessageCount.textContent = String(notebook.message_count || 0);
  elements.summaryCreatedAt.textContent = formatTimestamp(notebook.created_at);
  elements.summaryUpdatedAt.textContent = formatTimestamp(notebook.updated_at);
  elements.summaryText.textContent = notebook.summary || "暂无摘要。";
  elements.summaryLastMessage.textContent = notebook.last_message_preview || "暂无最近消息。";
}

function buildNotebookCard(notebook, variant) {
  const activeClass = notebook.id === state.selectedNotebookId ? " active" : "";
  const classes = variant === "sidebar" ? `sidebar-item${activeClass}` : "notebook-card";
  return `
    <article class="${classes}" data-open-notebook="${escapeHtml(notebook.id)}">
      <strong>${escapeHtml(notebook.title)}</strong>
      <p class="meta-line">${escapeHtml(notebook.description || "暂无说明")}</p>
      <p class="meta-line">消息数：${notebook.message_count} · 更新于 ${escapeHtml(formatTimestamp(notebook.updated_at))}</p>
      <p class="meta-line">${escapeHtml(notebook.last_message_preview || "暂无最近消息")}</p>
      <button type="button" class="btn secondary full-width" data-script-link="${escapeHtml(notebook.id)}">进入剧本生成页</button>
    </article>
  `;
}

function buildMessageBubble(message) {
  const roleLabel = message.role === "user" ? "用户" : message.role === "assistant" ? "AI 助理" : "系统";
  return `
    <div class="message-row ${escapeHtml(message.role)}">
      <article class="message-bubble">
        <span class="message-role">${escapeHtml(roleLabel)}</span>
        <div class="message-content">${escapeHtml(message.content)}</div>
        <span class="message-time">${escapeHtml(formatTimestamp(message.created_at))}</span>
      </article>
    </div>
  `;
}

function updateView() {
  const showWorkspace = state.currentView === "workspace" && Boolean(state.selectedNotebookId);
  elements.homeView.hidden = showWorkspace;
  elements.workspaceView.hidden = !showWorkspace;
}

function showHomeView() {
  state.currentView = "home";
  updateView();
  renderNotebookCollections();
  renderNotebookMetrics();
  setStatus("你可以选择已有笔记本，或创建一个新的。", "info");
}

function focusCreateNotebookForm() {
  showHomeView();
  elements.notebookTitleInput.focus();
}

function goToScriptGenerator(notebookId = "") {
  const query = notebookId ? `?notebook=${encodeURIComponent(notebookId)}` : "";
  window.location.href = `script.html${query}`;
}

function updateActionState() {
  elements.createNotebookBtn.disabled = state.isCreatingNotebook;
  elements.sendMessageBtn.disabled = state.isSendingMessage || !state.selectedNotebookId;
}

function getCurrentNotebook() {
  return state.notebooks.find((notebook) => notebook.id === state.selectedNotebookId) || null;
}

function setStatus(message, type = "info") {
  // 状态栏已删除，不再显示冗余提示
  console.log(`[Status: ${type}] ${message}`);
}

function formatTimestamp(value) {
  if (!value || value === "-") {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
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

document.addEventListener("DOMContentLoaded", initApp);
