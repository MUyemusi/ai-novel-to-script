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
  elements.previewModal = document.getElementById("previewModal");

  document.getElementById("topLoadExampleBtn").addEventListener("click", loadExampleNovel);
  document.getElementById("panelLoadExampleBtn").addEventListener("click", loadExampleNovel);
  document.getElementById("clearTextBtn").addEventListener("click", clearNovelText);
  document.getElementById("generateYamlBtn").addEventListener("click", () => showComingSoon("剧本 YAML 生成"));
  document.getElementById("cleanScriptBtn").addEventListener("click", () => showComingSoon("清洗渲染剧本"));
  document.getElementById("previewScriptBtn").addEventListener("click", () => showComingSoon("最终剧本预览"));
  document.getElementById("closePreviewBtn").addEventListener("click", closePreviewModal);

  elements.parseChaptersBtn.addEventListener("click", () => showComingSoon("章节识别前端接入"));
  elements.novelInput.addEventListener("input", handleTextInput);
  elements.txtUpload.addEventListener("change", handleTxtUpload);

  updateTextStats();
  showStatus("等待输入小说文本", "info");
  console.log("AI 小说转剧本工具前端已初始化。");
}

function handleTextInput() {
  state.rawNovelText = elements.novelInput.value;
  const count = updateTextStats();
  if (count > 0) {
    showStatus(`已输入 ${count} 字`, "success");
    elements.parseChaptersBtn.classList.add("ready");
  } else {
    showStatus("等待输入小说文本", "info");
    elements.parseChaptersBtn.classList.remove("ready");
  }
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
    updateTextStats();
    elements.parseChaptersBtn.classList.toggle("ready", state.rawNovelText.trim().length > 0);
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
    updateTextStats();
    elements.parseChaptersBtn.classList.toggle("ready", state.rawNovelText.trim().length > 0);
    showStatus("示例小说加载成功", "success");
  } catch (error) {
    showStatus("示例小说加载失败，请确认后端服务已启动", "error");
  }
}

function clearNovelText() {
  elements.novelInput.value = "";
  state.rawNovelText = "";
  elements.txtUpload.value = "";
  updateTextStats();
  elements.parseChaptersBtn.classList.remove("ready");
  showStatus("已清空输入内容", "info");
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

function closePreviewModal() {
  state.previewModalOpen = false;
  elements.previewModal.hidden = true;
}

document.addEventListener("DOMContentLoaded", initApp);
