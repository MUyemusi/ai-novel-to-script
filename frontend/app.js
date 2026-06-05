const state = {
  rawNovelText: "",
  chapters: [],
  generatedYaml: "",
  validationResult: null,
  previewReady: false,
  previewModalOpen: false,
};

const API_BASE_URL = "http://127.0.0.1:8000";

const elements = {};

function initApp() {
  elements.novelInput = document.getElementById("novelInput");
  elements.wordCount = document.getElementById("wordCount");
  elements.inputStatus = document.getElementById("inputStatus");
  elements.txtUpload = document.getElementById("txtUpload");
  elements.parseChaptersBtn = document.getElementById("parseChaptersBtn");
  elements.generateYamlBtn = document.getElementById("generateYamlBtn");
  elements.chapterCount = document.getElementById("chapterCount");
  elements.chapterRequirement = document.getElementById("chapterRequirement");
  elements.chapterRequirementText = document.getElementById("chapterRequirementText");
  elements.chapterMessage = document.getElementById("chapterMessage");
  elements.chapterList = document.getElementById("chapterList");
  elements.previewModal = document.getElementById("previewModal");

  document.getElementById("topLoadExampleBtn").addEventListener("click", loadExampleNovel);
  document.getElementById("panelLoadExampleBtn").addEventListener("click", loadExampleNovel);
  document.getElementById("clearTextBtn").addEventListener("click", clearNovelText);
  document.getElementById("generateYamlBtn").addEventListener("click", () => showComingSoon("剧本 YAML 生成"));
  document.getElementById("cleanScriptBtn").addEventListener("click", () => showComingSoon("清洗渲染剧本"));
  document.getElementById("previewScriptBtn").addEventListener("click", () => showComingSoon("最终剧本预览"));
  document.getElementById("closePreviewBtn").addEventListener("click", closePreviewModal);

  elements.parseChaptersBtn.addEventListener("click", parseChapters);
  elements.novelInput.addEventListener("input", handleTextInput);
  elements.txtUpload.addEventListener("change", handleTxtUpload);

  updateTextStats();
  resetChapterResults();
  showStatus("等待输入小说文本", "info");
  console.log("AI 小说转剧本工具前端已初始化。");
}

function handleTextInput() {
  state.rawNovelText = elements.novelInput.value;
  resetChapterResults();
  const count = updateTextStats();
  if (count > 0) {
    showStatus(`已输入 ${count} 字`, "success");
  } else {
    showStatus("等待输入小说文本", "info");
  }
  updateActionButtons();
}

function handleTxtUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const isTxtFile = file.name.toLowerCase().endsWith(".txt") || file.type === "text/plain";
  if (!isTxtFile) {
    showStatus("请上传 .txt 文本文件", "warning");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    elements.novelInput.value = String(reader.result || "");
    state.rawNovelText = elements.novelInput.value;
    resetChapterResults();
    updateTextStats();
    updateActionButtons();
    showStatus("TXT 文件读取成功", "success");
  };
  reader.onerror = () => {
    showStatus("TXT 文件读取失败", "error");
  };
  reader.readAsText(file, "utf-8");
}

async function loadExampleNovel() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/examples/novel`);
    if (!response.ok) {
      throw new Error("Example novel request failed");
    }

    const data = await response.json();
    elements.novelInput.value = data.text || "";
    state.rawNovelText = elements.novelInput.value;
    resetChapterResults();
    updateTextStats();
    updateActionButtons();
    showStatus("示例小说加载成功", "success");
  } catch (error) {
    showStatus("示例小说加载失败，请确认后端服务已启动", "error");
  }
}

function clearNovelText() {
  elements.novelInput.value = "";
  state.rawNovelText = "";
  state.chapters = [];
  elements.txtUpload.value = "";
  updateTextStats();
  resetChapterResults();
  updateActionButtons();
  showStatus("已清空输入内容", "info");
}

async function parseChapters() {
  if (!state.rawNovelText.trim()) {
    showStatus("请先输入或加载小说文本。", "warning");
    renderChapterSummary({
      chapter_count: 0,
      is_valid: false,
      min_required: 3,
      message: "请先输入或加载小说文本。",
      statusType: "warning",
    });
    renderChapterCards([]);
    return;
  }

  showStatus("正在识别章节……", "info");
  renderChapterSummary({
    chapter_count: 0,
    is_valid: false,
    min_required: 3,
    message: "正在识别章节……",
    statusType: "info",
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/chapters/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: state.rawNovelText }),
    });
    if (!response.ok) {
      throw new Error("Chapter parse request failed");
    }

    const result = await response.json();
    state.chapters = result.chapters || [];
    renderChapterSummary(result);
    renderChapterCards(state.chapters);
    updateActionButtons();
    showStatus(result.message, result.is_valid ? "success" : "warning");
  } catch (error) {
    state.chapters = [];
    renderChapterSummary({
      chapter_count: 0,
      is_valid: false,
      min_required: 3,
      message: "章节识别失败，请确认后端服务已启动。",
      statusType: "error",
    });
    renderChapterCards([]);
    updateActionButtons();
    showStatus("章节识别失败，请确认后端服务已启动。", "error");
  }
}

function renderChapterSummary(result) {
  const count = result.chapter_count || 0;
  const isValid = Boolean(result.is_valid);
  const statusType = result.statusType || (isValid ? "success" : count > 0 ? "warning" : "info");
  const requirementText = isValid
    ? "满足生成要求"
    : count > 0
      ? `不满足 ${result.min_required || 3} 章要求`
      : "尚未识别章节";

  elements.chapterCount.textContent = String(count);
  elements.chapterRequirement.className = `stat-card ${statusType}`;
  elements.chapterRequirementText.textContent = requirementText;
  elements.chapterMessage.textContent = result.message || "输入小说文本后点击“识别章节”。";
  elements.chapterMessage.className = `chapter-message ${statusType}`;
}

function renderChapterCards(chapters) {
  if (!chapters.length) {
    elements.chapterList.innerHTML = '<div class="empty-state">暂无章节结果</div>';
    return;
  }

  elements.chapterList.innerHTML = chapters
    .map((chapter) => {
      const title = escapeHtml(chapter.title || "未命名章节");
      const summary = escapeHtml(chapter.summary || "暂无摘要预览");
      const chapterId = escapeHtml(chapter.chapter_id || "");
      const order = chapter.order || "";
      const contentLength = chapter.content_length || 0;

      return `
        <article class="chapter-card">
          <h3>第 ${order} 章：${title}</h3>
          <span class="chapter-id">${chapterId}</span>
          <p class="chapter-summary">摘要：${summary}</p>
          <div class="chapter-length">字数：${contentLength}</div>
        </article>
      `;
    })
    .join("");
}

function resetChapterResults() {
  state.chapters = [];
  renderChapterSummary({
    chapter_count: 0,
    is_valid: false,
    min_required: 3,
    message: "输入小说文本后点击“识别章节”。",
    statusType: "info",
  });
  renderChapterCards([]);
}

function updateActionButtons() {
  const hasText = state.rawNovelText.trim().length > 0;
  const hasEnoughChapters = state.chapters.length >= 3;

  elements.parseChaptersBtn.classList.toggle("ready", hasText);
  elements.generateYamlBtn.classList.toggle("ready", hasEnoughChapters);
  elements.generateYamlBtn.classList.toggle("disabled-action", !hasEnoughChapters);
  elements.generateYamlBtn.setAttribute("aria-disabled", String(!hasEnoughChapters));
}

function updateTextStats() {
  const count = state.rawNovelText.replace(/\s/g, "").length;
  elements.wordCount.textContent = `${count} 字`;
  return count;
}

function showStatus(message, type = "info") {
  elements.inputStatus.textContent = message;
  elements.inputStatus.className = `status-line ${type}`;
}

function showComingSoon(featureName) {
  showStatus(`${featureName} 将在后续 PR 中实现。`, "info");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function closePreviewModal() {
  state.previewModalOpen = false;
  elements.previewModal.hidden = true;
}

document.addEventListener("DOMContentLoaded", initApp);
