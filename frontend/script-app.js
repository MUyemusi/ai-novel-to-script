const TONE_STYLES = [
  "现实",
  "严肃",
  "诙谐",
  "深刻",
  "浪漫",
  "悬疑",
  "热血",
  "治愈",
  "冷峻",
  "诗意",
];

const MEDIA_TYPES = [
  "影视剧",
  "短剧",
  "舞台剧",
  "广播剧",
  "分镜初稿",
  "有声书改编",
];

const state = {
  rawNovelText: "",
  chapters: [],
  generatedYaml: "",
  generatedSummary: null,
  generatedCharacters: [],
  linkedNotebookId: "",
  linkedNotebookSummary: null,
  pendingScriptState: null,
  lastSavedScriptStateSignature: "",
  styleOptionsReady: false,
  isRestoringScriptState: false,
  scriptStatePersistTimer: null,
  isGeneratingYaml: false,
  isValidatingYaml: false,
  isPartialRendering: false,
  isChatOpen: false,
  isSendingMessage: false,
  isDraggingChatTrigger: false,
  chatTriggerMoved: false,
  chatTriggerPointerId: null,
  chatTriggerOffsetX: 0,
  chatTriggerOffsetY: 0,
  conversations: [],
  validationResult: null,
  readableScriptText: "",
  readableScriptValid: false,
  finalScriptText: "",
  finalScriptConfirmed: false,
  generatedMode: "",
  generatedWarnings: [],
  previewReady: false,
  readableScriptModalOpen: false,
  previewModalOpen: false,
  structureModalOpen: false,
  adaptationProfile: {
    tone_style: "现实",
    medium: "影视剧",
    tone_intensity: 50,
    adaptation_degree: 50,
    dialogue_preservation_degree: 60,
  },
};

const API_BASE_URL = "http://127.0.0.1:8000";
const CHAT_TRIGGER_POSITION_KEY = "xvg.chatTriggerPosition";

const elements = {};

function initApp() {
  elements.novelInput = document.getElementById("novelInput");
  elements.wordCount = document.getElementById("wordCount");
  elements.inputStatus = document.getElementById("inputStatus");
  elements.txtUpload = document.getElementById("txtUpload");
  elements.parseChaptersBtn = document.getElementById("parseChaptersBtn");
  elements.openStructureBtn = document.getElementById("openStructureBtn");
  elements.generateYamlBtn = document.getElementById("generateYamlBtn");
  elements.chapterCount = document.getElementById("chapterCount");
  elements.chapterRequirement = document.getElementById("chapterRequirement");
  elements.chapterRequirementText = document.getElementById("chapterRequirementText");
  elements.chapterMessage = document.getElementById("chapterMessage");
  elements.chapterList = document.getElementById("chapterList");
  elements.yamlOutput = document.getElementById("yamlOutput");
  elements.yamlMessage = document.getElementById("yamlMessage");
  elements.yamlStatusBadge = document.getElementById("yamlStatusBadge");
  elements.validateYamlButton = document.getElementById("validateYamlButton");
  elements.downloadYamlButton = document.getElementById("downloadYamlButton");
  elements.renderScriptButton = document.getElementById("renderScriptButton");
  elements.yamlValidationPanel = document.getElementById("yamlValidationPanel");
  elements.validationStatusText = document.getElementById("validationStatusText");
  elements.validationValidBadge = document.getElementById("validationValidBadge");
  elements.validationMetrics = document.getElementById("validationMetrics");
  elements.validationIssues = document.getElementById("validationIssues");
  elements.readableScriptModal = document.getElementById("readableScriptModal");
  elements.readableScriptOutput = document.getElementById("readableScriptOutput");
  elements.readableScriptMeta = document.getElementById("readableScriptMeta");
  elements.partialRenderTargetSelect = document.getElementById("partialRenderTargetSelect");
  elements.partialRenderButton = document.getElementById("partialRenderButton");
  elements.partialRenderStatus = document.getElementById("partialRenderStatus");
  elements.scriptSummary = document.getElementById("scriptSummary");
  elements.summaryChapterCount = document.getElementById("summaryChapterCount");
  elements.summarySceneCount = document.getElementById("summarySceneCount");
  elements.summaryCharacterCount = document.getElementById("summaryCharacterCount");
  elements.summaryCoverageRate = document.getElementById("summaryCoverageRate");
  elements.charactersTable = document.getElementById("charactersTable");
  elements.charactersList = document.getElementById("charactersList");
  elements.charactersEmptyState = document.getElementById("charactersEmptyState");
  elements.summaryEmptyState = document.getElementById("summaryEmptyState");
  elements.previewModal = document.getElementById("previewModal");
  elements.structureModal = document.getElementById("structureModal");
  elements.finalScriptTextarea = document.getElementById("finalScriptTextarea");
  elements.finalScriptStatus = document.getElementById("finalScriptStatus");
  elements.exportWordButton = document.getElementById("exportWordButton");
  elements.confirmFinalScriptButton = document.getElementById("confirmFinalScriptButton");
  elements.openPreviewFromReadableBtn = document.getElementById("openPreviewFromReadableBtn");
  elements.progressSteps = Array.from(document.querySelectorAll(".progress-step"));
  elements.structureTabs = Array.from(document.querySelectorAll(".structure-tab"));
  elements.structureViews = {
    chapters: document.getElementById("chaptersView"),
    characters: document.getElementById("charactersView"),
    summary: document.getElementById("summaryView"),
  };

  elements.chatDrawer = document.getElementById("chatDrawer");
  elements.chatStream = document.getElementById("chatStream");
  elements.chatInput = document.getElementById("chatInput");
  elements.openChatBtn = document.getElementById("openChatBtn");
  elements.closeChatBtn = document.getElementById("closeChatBtn");
  elements.chatComposerForm = document.getElementById("chatComposerForm");
  elements.chatBadge = document.getElementById("chatBadge");

  elements.toneSelect = document.getElementById("toneSelect");
  elements.mediumSelect = document.getElementById("mediumSelect");
  elements.toneIntensity = document.getElementById("toneIntensity");
  elements.toneIntensityValue = document.getElementById("toneIntensityValue");
  elements.adaptationDegree = document.getElementById("adaptationDegree");
  elements.adaptationDegreeValue = document.getElementById("adaptationDegreeValue");
  elements.dialoguePreservationDegree = document.getElementById("dialoguePreservationDegree");
  elements.dialoguePreservationDegreeValue = document.getElementById("dialoguePreservationDegreeValue");
  elements.adaptationSummaryText = document.getElementById("adaptationSummaryText");
  elements.backendStatus = document.getElementById("backendStatus");

  document.getElementById("openStartPageBtn").addEventListener("click", () => {
    window.location.href = "index.html";
  });
  document.getElementById("openNotebookPageBtn").addEventListener("click", () => {
    window.location.href = "notebook.html";
  });
  document.getElementById("panelLoadExampleBtn").addEventListener("click", loadExampleNovel);
  document.getElementById("clearTextBtn").addEventListener("click", clearNovelText);
  document.getElementById("generateYamlBtn").addEventListener("click", generateYaml);
  document.getElementById("openStructureBtn").addEventListener("click", openStructureModal);
  elements.validateYamlButton.addEventListener("click", validateCurrentYaml);
  elements.downloadYamlButton.addEventListener("click", downloadCurrentYaml);
  elements.renderScriptButton.addEventListener("click", renderReadableScript);
  elements.partialRenderTargetSelect.addEventListener("change", updateActionButtons);
  elements.partialRenderButton.addEventListener("click", renderPartialActOrScene);
  elements.openPreviewFromReadableBtn.addEventListener("click", openScriptPreviewModal);
  document.getElementById("closeReadableScriptBtn").addEventListener("click", closeReadableScriptModal);
  document.getElementById("closePreviewBtn").addEventListener("click", closePreviewModal);
  document.getElementById("closeStructureBtn").addEventListener("click", closeStructureModal);
  elements.exportWordButton.addEventListener("click", exportFinalScriptToWord);
  elements.confirmFinalScriptButton.addEventListener("click", confirmFinalScript);
  elements.readableScriptModal.addEventListener("click", handleReadableScriptModalBackdropClick);
  elements.previewModal.addEventListener("click", handleModalBackdropClick);
  elements.structureModal.addEventListener("click", handleStructureModalBackdropClick);
  document.addEventListener("keydown", handleGlobalKeydown);

  elements.parseChaptersBtn.addEventListener("click", parseChapters);
  elements.novelInput.addEventListener("input", handleTextInput);
  elements.yamlOutput.addEventListener("input", handleYamlInput);
  elements.txtUpload.addEventListener("change", handleTxtUpload);
  elements.structureTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchStructureTab(tab.dataset.structureTab));
  });

  elements.toneSelect.addEventListener("change", handleAdaptationInputChange);
  elements.mediumSelect.addEventListener("change", handleAdaptationInputChange);
  elements.toneIntensity.addEventListener("input", handleAdaptationInputChange);
  elements.adaptationDegree.addEventListener("input", handleAdaptationInputChange);
  elements.dialoguePreservationDegree.addEventListener("input", handleAdaptationInputChange);

  elements.openChatBtn.addEventListener("click", handleChatTriggerClick);
  elements.openChatBtn.addEventListener("pointerdown", handleChatTriggerPointerDown);
  elements.closeChatBtn.addEventListener("click", () => toggleChatDrawer(false));
  elements.chatComposerForm.addEventListener("submit", handleChatSubmit);

  updateTextStats();
  resetChapterResults();
  resetYamlResults();
  updateActionButtons();
  showStatus("等待输入小说文本", "info");
  initializeMemorySource();
  loadAndRenderStyleOptions();
  checkBackendStylesApi();
  switchStructureTab("chapters");
  initializeChatTriggerPosition();
  window.addEventListener("resize", handleWindowResize);
  console.log("AI 小说转剧本工具前端已初始化。");
}

function handleTextInput() {
  state.rawNovelText = elements.novelInput.value;
  resetChapterResults();
  resetYamlResults();
  switchStructureTab("chapters");
  const count = updateTextStats();
  if (count > 0) {
    showStatus(`已输入 ${count} 字`, "success");
  } else {
    showStatus("等待输入小说文本", "info");
  }
  updateActionButtons();
  scheduleScriptStatePersist();
}

function handleYamlInput() {
  state.generatedYaml = getCurrentYaml();
  resetYamlValidation();
  resetReadableScript();
  resetFinalScriptText("YAML 已修改，最终稿已清空。请重新渲染并确认最终剧本。");
  updateActionButtons();
  scheduleScriptStatePersist();
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
    resetYamlResults();
    switchStructureTab("chapters");
    updateTextStats();
    updateActionButtons();
    showStatus("TXT 文件读取成功", "success");
    scheduleScriptStatePersist();
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
    resetYamlResults();
    switchStructureTab("chapters");
    updateTextStats();
    updateActionButtons();
    showStatus("示例小说加载成功", "success");
    scheduleScriptStatePersist();
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
  resetYamlResults();
  closeStructureModal();
  switchStructureTab("chapters");
  updateActionButtons();
  showStatus("已清空输入内容", "info");
  scheduleScriptStatePersist();
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
    switchStructureTab("chapters");
    return;
  }

  resetYamlResults();
  switchStructureTab("chapters");
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
    scheduleScriptStatePersist();
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
    switchStructureTab("chapters");
    updateActionButtons();
    showStatus("章节识别失败，请确认后端服务已启动。", "error");
    scheduleScriptStatePersist();
  }
}

async function generateYaml() {
  if (state.isGeneratingYaml) {
    return;
  }

  if (!state.rawNovelText.trim()) {
    renderYamlMessage("请先输入或加载小说文本。", "warning");
    showStatus("请先输入或加载小说文本。", "warning");
    return;
  }

  if (state.chapters.length < 3) {
    renderYamlMessage("章节不足 3 章，请先识别章节并满足生成要求。", "warning");
    showStatus("章节不足 3 章，暂不能生成 YAML。", "warning");
    updateActionButtons();
    return;
  }

  state.isGeneratingYaml = true;
  updateActionButtons();
  renderYamlMessage("正在生成 YAML……", "info");
  elements.yamlStatusBadge.textContent = "生成中";

  try {
    const response = await fetch(`${API_BASE_URL}/api/script/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: state.rawNovelText,
        adaptation_profile: buildAdaptationProfileRequest(),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "YAML 生成失败");
    }

    state.generatedYaml = data.yaml || "";
    state.generatedSummary = data.summary || null;
    state.generatedCharacters = data.characters || [];
    state.generatedMode = data.generation_mode || "";
    state.generatedWarnings = data.warnings || [];
    renderYamlResult(data);
    await persistScriptState({ immediate: true });
  } catch (error) {
    state.generatedYaml = "";
    state.generatedSummary = null;
    state.generatedCharacters = [];
    state.generatedMode = "";
    state.generatedWarnings = [];
    renderYamlError(error.message || "YAML 生成失败，请检查文本和后端服务。");
    showStatus("YAML 生成失败，请检查文本和后端服务。", "error");
  } finally {
    state.isGeneratingYaml = false;
    updateActionButtons();
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
  closeStructureModal();
}

function resetYamlResults() {
  state.generatedYaml = "";
  state.generatedSummary = null;
  state.generatedCharacters = [];
  state.generatedMode = "";
  state.generatedWarnings = [];
  state.isGeneratingYaml = false;
  state.isValidatingYaml = false;
  state.isPartialRendering = false;
  state.validationResult = null;
  renderYamlIdleState("识别至少 3 章后可生成 YAML。");
  closePreviewModal();
}

function renderYamlIdleState(message) {
  elements.yamlOutput.value = "";
  elements.scriptSummary.hidden = true;
  elements.charactersTable.hidden = true;
  elements.charactersList.innerHTML = "";
  elements.charactersEmptyState.hidden = false;
  elements.yamlStatusBadge.textContent = "未生成";
  elements.summaryEmptyState.hidden = false;
  resetYamlValidation();
  resetReadableScript();
  resetFinalScriptText();
  renderYamlMessage(message, "info");
}

function buildAdaptationProfileRequest() {
  return {
    tone: {
      style: elements.toneSelect.value,
      intensity: parseInt(elements.toneIntensity.value, 10),
    },
    target: {
      medium: elements.mediumSelect.value,
      adaptation_degree: parseInt(elements.adaptationDegree.value, 10),
    },
    dialogue: {
      preservation_degree: parseInt(elements.dialoguePreservationDegree.value, 10),
    },
  };
}

function renderYamlResult(data) {
  elements.yamlOutput.value = data.yaml || "";
  state.validationResult = null;
  resetYamlValidation();
  resetReadableScript();
  resetFinalScriptText("已生成新的 YAML，最终稿已清空。请重新渲染并确认最终剧本。");
  elements.yamlStatusBadge.textContent = "已更新";
  renderYamlMessage("YAML 已更新，可继续校验、下载或清洗为剧本。", "success");
  renderScriptSummary(data.summary || {});
  renderCharacters(data.characters || []);
  switchStructureTab(data.characters?.length ? "characters" : "summary");
}

function renderScriptSummary(summary) {
  elements.summaryChapterCount.textContent = String(summary.chapter_count || 0);
  elements.summarySceneCount.textContent = String(summary.scene_count || 0);
  elements.summaryCharacterCount.textContent = String(summary.character_count || 0);
  elements.summaryCoverageRate.textContent = summary.chapter_coverage_rate || "-";
  elements.scriptSummary.hidden = false;
  elements.summaryEmptyState.hidden = true;
}

function renderCharacters(characters) {
  if (!characters.length) {
    elements.charactersTable.hidden = true;
    elements.charactersList.innerHTML = "";
    elements.charactersEmptyState.hidden = false;
    return;
  }

  elements.charactersList.innerHTML = characters
    .map((character) => {
      const name = escapeHtml(character.name || "未命名人物");
      const role = escapeHtml(character.role || "未标注");
      const description = escapeHtml(character.description || "暂无描述");
      const characterId = escapeHtml(character.character_id || "");

      return `
        <article class="character-row">
          <div>
            <strong>${name}</strong>
            <span>${characterId}</span>
          </div>
          <p>${role}</p>
          <p>${description}</p>
        </article>
      `;
    })
    .join("");
  elements.charactersTable.hidden = false;
  elements.charactersEmptyState.hidden = true;
}

function renderYamlMessage(message, type = "info") {
  elements.yamlMessage.textContent = message;
  elements.yamlMessage.className = `yaml-message ${type}`;
}

function renderYamlError(message) {
  elements.yamlOutput.value = "";
  state.validationResult = null;
  resetYamlValidation();
  resetReadableScript();
  resetFinalScriptText();
  elements.scriptSummary.hidden = true;
  elements.charactersTable.hidden = true;
  elements.charactersList.innerHTML = "";
  elements.charactersEmptyState.hidden = false;
  elements.summaryEmptyState.hidden = false;
  elements.yamlStatusBadge.textContent = "失败";
  renderYamlMessage(message, "error");
}

async function validateCurrentYaml() {
  if (state.isValidatingYaml) {
    return;
  }

  const yamlText = getCurrentYaml();
  if (!yamlText.trim()) {
    renderYamlMessage("请先生成或输入 YAML 后再校验。", "warning");
    resetYamlValidation();
    return;
  }

  state.isValidatingYaml = true;
  elements.validateYamlButton.textContent = "校验中...";
  updateActionButtons();
  renderYamlMessage("正在校验 YAML...", "info");

  try {
    const response = await fetch(`${API_BASE_URL}/api/yaml/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ yaml: yamlText }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.detail || "YAML 校验请求失败");
    }

    state.validationResult = result;
    renderYamlValidationResult(result);
    const messageType = result.status === "error" ? "error" : result.status === "warning" ? "warning" : "success";
    renderYamlMessage(`YAML 校验完成：${formatValidationStatus(result.status)}`, messageType);
  } catch (error) {
    state.validationResult = null;
    renderYamlValidationError(error.message || "YAML 校验失败，请确认后端服务已启动。");
    renderYamlMessage("YAML 校验失败，请检查后端服务。", "error");
  } finally {
    state.isValidatingYaml = false;
    elements.validateYamlButton.textContent = "校验 YAML";
    updateActionButtons();
  }
}

function downloadCurrentYaml() {
  const yamlText = getCurrentYaml();
  if (!yamlText.trim()) {
    renderYamlMessage("请先生成或输入 YAML 后再下载。", "warning");
    return;
  }

  const blob = new Blob([yamlText], { type: "application/x-yaml;charset=utf-8" });
  downloadBlob(blob, "screenplay.yaml");
  renderYamlMessage("YAML 文件已准备下载。", "success");
}

function renderReadableScript() {
  const yamlText = getCurrentYaml();
  if (!yamlText.trim()) {
    renderYamlMessage("请先生成或输入 YAML 后再渲染剧本。", "warning");
    resetReadableScript();
    return;
  }

  try {
    const readableData = parseReadableScreenplay(yamlText);
    const { data, screenplay } = readableData;
    if (!screenplay || typeof screenplay !== "object") {
      throw new Error("YAML 中缺少 screenplay 对象。");
    }

    const renderedText = buildReadableScriptText(screenplay);
    state.readableScriptText = renderedText;
    state.readableScriptValid = true;
    elements.readableScriptOutput.value = renderedText;
    elements.readableScriptMeta.textContent = `${renderedText.split("\n").length} 行`;
    renderPartialRenderTargets(screenplay);
    logReadableScriptDebug(yamlText, data, screenplay, readableData.source, readableData.fallbackEnabled);
    renderYamlMessage("清洗剧本已准备完成。", "success");
    openReadableScriptModal();
    updateActionButtons();
    scheduleScriptStatePersist();
  } catch (error) {
    state.readableScriptText = "";
    state.readableScriptValid = false;
    elements.readableScriptOutput.value = "";
    elements.readableScriptMeta.textContent = "尚未渲染";
    renderYamlMessage("YAML 渲染失败，请检查格式或先点击校验。", "error");
    updateActionButtons();
    scheduleScriptStatePersist();
  }
}

async function renderPartialActOrScene() {
  if (state.isPartialRendering) {
    return;
  }

  const target = parsePartialRenderTarget(elements.partialRenderTargetSelect.value);
  if (!target) {
    renderPartialRenderStatus("请先选择要重渲染的幕或场。", "warning");
    return;
  }

  const currentData = parseCurrentScreenplayYaml();
  if (!currentData) {
    renderPartialRenderStatus("请先生成有效 YAML，并点击“清洗为剧本”。", "warning");
    return;
  }

  const acts = getActs(currentData.screenplay);
  if (!acts[target.actIndex] || (target.type === "scene" && !extractScenes(acts[target.actIndex])[target.sceneIndex])) {
    renderPartialRenderStatus("选择的幕或场不存在，请重新渲染可读剧本后再试。", "warning");
    return;
  }

  const sourceText = buildPartialRenderSourceText(currentData.screenplay, target);
  const targetLabel = formatPartialTargetLabel(currentData.screenplay, target);
  if (!window.confirm(`确认局部重渲染“${targetLabel}”？未选择的部分会保持不变。`)) {
    return;
  }

  state.isPartialRendering = true;
  elements.partialRenderButton.textContent = "重渲染中...";
  renderPartialRenderStatus(`正在局部重渲染：${targetLabel}`, "info");
  updateActionButtons();

  try {
    const response = await fetch(`${API_BASE_URL}/api/script/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: sourceText,
        adaptation_profile: buildAdaptationProfileRequest(),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "局部重渲染失败");
    }

    const generatedData = parseSimpleYaml(data.yaml || "");
    const generatedActs = getActs(generatedData && generatedData.screenplay);
    if (!generatedActs.length) {
      throw new Error("局部重渲染未返回可用幕内容。");
    }

    const beforeReadableText = buildReadableScriptText(currentData.screenplay);
    const replacement = buildPartialReplacement(acts, generatedActs, target);
    applyPartialReplacement(acts, target, replacement);
    refreshQualityReport(currentData.screenplay);

    const updatedReadableText = buildReadableScriptText(currentData.screenplay);
    const updatedYamlText = stringifyYaml(currentData.data);
    elements.yamlOutput.value = updatedYamlText;
    state.generatedYaml = updatedYamlText;
    state.readableScriptText = updatedReadableText;
    state.readableScriptValid = true;
    elements.readableScriptOutput.value = updatedReadableText;
    elements.readableScriptMeta.textContent = `${updatedReadableText.split("\n").length} 行`;
    renderPartialRenderTargets(currentData.screenplay, elements.partialRenderTargetSelect.value);

    const finalScriptSynced = updateFinalScriptAfterPartialRender(beforeReadableText, updatedReadableText, target);
    resetYamlValidation();
    renderPartialRenderStatus(
      finalScriptSynced === false
        ? `局部重渲染完成：${targetLabel}；最终稿未自动同步，请手动检查稿纸预览。`
        : `局部重渲染完成：${targetLabel}`,
      finalScriptSynced === false ? "warning" : "success",
    );
    renderYamlMessage(`清洗剧本已更新：${targetLabel}`, finalScriptSynced === false ? "warning" : "success");
    scheduleScriptStatePersist();
  } catch (error) {
    renderPartialRenderStatus(error.message || "局部重渲染失败，请检查后端服务。", "error");
    renderYamlMessage("局部重渲染失败，请检查所选内容和后端服务。", "error");
  } finally {
    state.isPartialRendering = false;
    elements.partialRenderButton.textContent = "局部重渲染";
    updateActionButtons();
  }
}

function renderPartialRenderStatus(message, type = "info", hidden = false) {
  elements.partialRenderStatus.textContent = message;
  elements.partialRenderStatus.className = `partial-render-status ${type}`;
  elements.partialRenderStatus.hidden = hidden;
}

function parsePartialRenderTarget(value) {
  if (!value) {
    return null;
  }
  const parts = value.split(":");
  if (parts[0] === "act" && parts.length >= 2) {
    return {
      type: "act",
      actIndex: Number(parts[1]),
      firstSceneNumber: Number(parts[2] || 1),
      sceneCount: Number(parts[3] || 0),
    };
  }
  if (parts[0] === "scene" && parts.length >= 3) {
    return {
      type: "scene",
      actIndex: Number(parts[1]),
      sceneIndex: Number(parts[2]),
      globalSceneNumber: Number(parts[3] || 1),
    };
  }
  return null;
}

function buildPartialRenderSourceText(screenplay, target) {
  const label = formatPartialTargetLabel(screenplay, target);
  const selectedText = extractPartialReadableSection(buildReadableScriptText(screenplay), target) || label;
  return [
    `第1章 ${label} 重渲染素材`,
    selectedText,
    `第2章 ${label} 对白与动作补写`,
    selectedText,
    `第3章 ${label} 结构整理`,
    selectedText,
  ].join("\n\n");
}

function buildPartialReplacement(currentActs, generatedActs, target) {
  const generatedAct = generatedActs[0];
  if (target.type === "act") {
    const originalAct = currentActs[target.actIndex] || {};
    return {
      ...generatedAct,
      act_id: originalAct.act_id || generatedAct.act_id,
      title: originalAct.title || generatedAct.title,
    };
  }

  const originalScene = currentActs[target.actIndex]?.scenes?.[target.sceneIndex] || {};
  const generatedScene = extractScenes(generatedAct)[0];
  if (!generatedScene) {
    throw new Error("局部重渲染未返回可用场景内容。");
  }
  return {
    ...generatedScene,
    scene_id: originalScene.scene_id || generatedScene.scene_id,
    title: originalScene.title || generatedScene.title,
    source_chapter_id: originalScene.source_chapter_id || generatedScene.source_chapter_id,
  };
}

function applyPartialReplacement(acts, target, replacement) {
  if (target.type === "act") {
    acts[target.actIndex] = replacement;
    return;
  }

  if (!Array.isArray(acts[target.actIndex].scenes)) {
    acts[target.actIndex].scenes = [];
  }
  acts[target.actIndex].scenes[target.sceneIndex] = replacement;
}

function updateFinalScriptAfterPartialRender(beforeReadableText, updatedReadableText, target) {
  if (!state.finalScriptText.trim()) {
    return true;
  }

  const previousSection = extractPartialReadableSection(beforeReadableText, target);
  const nextSection = extractPartialReadableSection(updatedReadableText, target);
  const replacedText = replacePartialSectionByHeading(state.finalScriptText, previousSection, nextSection, target);

  if (replacedText !== null) {
    state.finalScriptText = replacedText;
    elements.finalScriptStatus.textContent = "最终稿对应片段已随局部重渲染更新。";
    elements.finalScriptStatus.className = "final-script-status success";
  } else {
    elements.finalScriptStatus.textContent = "局部重渲染已完成，但未能在最终稿中定位对应片段；最终稿未被覆盖，请手动同步。";
    elements.finalScriptStatus.className = "final-script-status warning";
  }

  if (!elements.previewModal.hidden) {
    elements.finalScriptTextarea.value = state.finalScriptText;
  }
  return replacedText !== null;
}

function replacePartialSectionByHeading(finalText, previousSection, nextSection, target) {
  if (!previousSection || !nextSection) {
    return null;
  }

  if (finalText.includes(previousSection)) {
    return finalText.replace(previousSection, nextSection);
  }

  const lines = finalText.split("\n");
  const startIndex = findPartialSectionStart(lines, target);
  if (startIndex === -1) {
    return null;
  }

  const endIndex = findPartialSectionEnd(lines, target, startIndex);
  return [
    ...lines.slice(0, startIndex),
    ...nextSection.split("\n"),
    ...lines.slice(endIndex),
  ].join("\n");
}

function extractPartialReadableSection(readableText, target) {
  const lines = readableText.split("\n");
  const startIndex = findPartialSectionStart(lines, target);
  if (startIndex === -1) {
    return "";
  }
  const endIndex = findPartialSectionEnd(lines, target, startIndex);
  return lines.slice(startIndex, endIndex).join("\n").trimEnd();
}

function findPartialSectionStart(lines, target) {
  if (target.type === "act") {
    return lines.findIndex((line) => line.startsWith(`${target.firstSceneNumber}. `));
  }

  return lines.findIndex((line) => line.startsWith(`${target.globalSceneNumber}. `));
}

function findPartialSectionEnd(lines, target, startIndex) {
  if (target.type === "act") {
    const nextSceneNumber = target.firstSceneNumber + target.sceneCount;
    if (target.sceneCount > 0) {
      const nextSceneIndex = lines.findIndex(
        (line, index) => index > startIndex && line.startsWith(`${nextSceneNumber}. `),
      );
      if (nextSceneIndex !== -1) {
        return trimTrailingBlankLine(lines, nextSceneIndex);
      }
    }
    for (let index = startIndex + 1; index < lines.length; index += 1) {
      if (/^\d+\.\s+/.test(lines[index])) {
        return trimTrailingBlankLine(lines, index);
      }
    }
    return lines.length;
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (/^\d+\.\s+/.test(lines[index])) {
      return trimTrailingBlankLine(lines, index);
    }
  }
  return lines.length;
}

function trimTrailingBlankLine(lines, endIndex) {
  return endIndex > 0 && lines[endIndex - 1] === "" ? endIndex - 1 : endIndex;
}

function openScriptPreviewModal() {
  const sourceText = state.finalScriptConfirmed ? state.finalScriptText : state.readableScriptText;
  if (!sourceText.trim()) {
    renderYamlMessage("请先点击“清洗为剧本”，再打开稿纸预览。", "warning");
    return;
  }
  if (!state.finalScriptConfirmed && !state.readableScriptValid) {
    renderYamlMessage("当前可读剧本无效，请重新点击“清洗为剧本”。", "warning");
    return;
  }

  closeReadableScriptModal();
  elements.finalScriptTextarea.value = sourceText;
  elements.finalScriptStatus.textContent = state.finalScriptConfirmed
    ? "已载入上次确认的最终剧本，可继续编辑。"
    : "已载入当前可读剧本文本，可编辑后确认最终剧本。";
  elements.finalScriptStatus.className = "final-script-status";
  elements.previewModal.hidden = false;
  state.previewModalOpen = true;
  elements.finalScriptTextarea.focus();
  updateProgressStep();
}

function confirmFinalScript() {
  if (!state.readableScriptValid && !state.finalScriptConfirmed) {
    elements.finalScriptStatus.textContent = "当前可读剧本无效，请重新清洗为剧本后再确认。";
    elements.finalScriptStatus.className = "final-script-status warning";
    updateActionButtons();
    return;
  }

  state.finalScriptText = elements.finalScriptTextarea.value;
  if (!state.finalScriptText.trim()) {
    state.finalScriptConfirmed = false;
    elements.finalScriptStatus.textContent = "最终剧本文本为空，无法确认。";
    elements.finalScriptStatus.className = "final-script-status warning";
    updateActionButtons();
    return;
  }

  state.finalScriptConfirmed = Boolean(state.finalScriptText.trim());
  elements.finalScriptStatus.textContent = "最终剧本已确认，可用于 Word 导出。";
  elements.finalScriptStatus.className = "final-script-status success";
  renderYamlMessage("最终剧本已确认，可用于 Word 导出。", "success");
  updateActionButtons();
  scheduleScriptStatePersist();
}

function exportFinalScriptToWord() {
  const finalText = state.finalScriptText.trim();
  if (!finalText || !state.finalScriptConfirmed) {
    elements.finalScriptStatus.textContent = "请先点击“确认最终剧本”，再导出 Word。";
    elements.finalScriptStatus.className = "final-script-status warning";
    renderYamlMessage("请先确认最终剧本后再导出 Word。", "warning");
    updateActionButtons();
    return;
  }

  const originalText = elements.exportWordButton.textContent;
  elements.exportWordButton.textContent = "导出中...";
  elements.exportWordButton.disabled = true;
  elements.exportWordButton.setAttribute("aria-disabled", "true");

  try {
    const docxBlob = buildDocxBlob(finalText);
    downloadBlob(docxBlob, "screenplay.docx");
    elements.finalScriptStatus.textContent = "Word 文件已准备下载。";
    elements.finalScriptStatus.className = "final-script-status success";
    renderYamlMessage("Word 文件已准备下载。", "success");
  } finally {
    elements.exportWordButton.textContent = originalText;
    updateActionButtons();
  }
}

function handleGlobalKeydown(event) {
  if (event.key === "Escape" && state.previewModalOpen) {
    closePreviewModal();
    return;
  }
  if (event.key === "Escape" && state.readableScriptModalOpen) {
    closeReadableScriptModal();
  }
}

function getReadableScriptText() {
  return state.readableScriptValid ? state.readableScriptText : "";
}

function getCurrentYaml() {
  return elements.yamlOutput ? elements.yamlOutput.value : state.generatedYaml;
}

function formatValidationStatus(status) {
  const labels = {
    pass: "通过",
    warning: "有警告",
    error: "未通过",
  };
  return labels[status] || status || "未知";
}

function renderYamlValidationResult(result) {
  elements.yamlValidationPanel.hidden = false;
  elements.validationStatusText.textContent = `状态：${formatValidationStatus(result.status)}`;
  elements.validationValidBadge.textContent = result.valid ? "valid=True" : "valid=False";
  elements.validationValidBadge.className = `validation-badge ${result.valid ? "success" : "error"}`;
  elements.validationMetrics.innerHTML = renderValidationMetrics(result.summary || {});
  elements.validationIssues.innerHTML = renderValidationIssues(result.errors || [], result.warnings || []);
}

function renderValidationMetrics(summary) {
  const coverage = typeof summary.chapter_coverage_rate === "number"
    ? `${Math.round(summary.chapter_coverage_rate * 100)}%`
    : stringifyValue(summary.chapter_coverage_rate) || "-";
  const metrics = [
    ["章节数", summary.chapter_count || 0],
    ["场景数", summary.scene_count || 0],
    ["人物数", summary.character_count || 0],
    ["章节覆盖率", coverage],
  ];

  return metrics
    .map(([label, value]) => `
      <div class="validation-metric">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `)
    .join("");
}

function renderValidationIssues(errors, warnings) {
  const issueGroups = [
    ["错误", "error", errors],
    ["警告", "warning", warnings],
  ];

  return issueGroups
    .map(([title, type, issues]) => {
      if (!issues.length) {
        return `
          <div class="validation-issue-group ${type}">
            <h3>${title}</h3>
            <p class="validation-empty">无</p>
          </div>
        `;
      }

      const items = issues
        .map((issue) => `
          <li>
            <code>${escapeHtml(issue.path || "(root)")}</code>
            <span>${escapeHtml(issue.message || "")}</span>
          </li>
        `)
        .join("");

      return `
        <div class="validation-issue-group ${type}">
          <h3>${title}</h3>
          <ul>${items}</ul>
        </div>
      `;
    })
    .join("");
}

function renderYamlValidationError(message) {
  elements.yamlValidationPanel.hidden = false;
  elements.validationStatusText.textContent = "状态：请求失败";
  elements.validationValidBadge.textContent = "valid=False";
  elements.validationValidBadge.className = "validation-badge error";
  elements.validationMetrics.innerHTML = "";
  elements.validationIssues.innerHTML = `
    <div class="validation-issue-group error">
      <h3>错误</h3>
      <ul>
        <li>
          <code>request</code>
          <span>${escapeHtml(message)}</span>
        </li>
      </ul>
    </div>
  `;
}

function resetYamlValidation() {
  if (!elements.yamlValidationPanel) {
    return;
  }

  elements.yamlValidationPanel.hidden = true;
  elements.validationStatusText.textContent = "尚未校验";
  elements.validationValidBadge.textContent = "-";
  elements.validationValidBadge.className = "validation-badge";
  elements.validationMetrics.innerHTML = "";
  elements.validationIssues.innerHTML = "";
}

function resetReadableScript() {
  if (!elements.readableScriptModal) {
    return;
  }

  state.readableScriptText = "";
  state.readableScriptValid = false;
  closeReadableScriptModal();
  elements.readableScriptOutput.value = "";
  elements.readableScriptMeta.textContent = "尚未渲染";
  elements.partialRenderTargetSelect.innerHTML = '<option value="">选择要重渲染的幕或场</option>';
  renderPartialRenderStatus("选择幕或场后，可仅重渲染该部分。", "info", true);
}

function resetFinalScriptText(message = "") {
  state.finalScriptText = "";
  state.finalScriptConfirmed = false;
  if (elements.finalScriptTextarea) {
    elements.finalScriptTextarea.value = "";
  }
  if (elements.finalScriptStatus) {
    elements.finalScriptStatus.textContent = message || "编辑后点击“确认最终剧本”，保存为 Word 导出的文本来源。";
    elements.finalScriptStatus.className = "final-script-status";
  }
}

function restoreReadableAndFinalScriptState(scriptState) {
  const readableText = typeof scriptState.readable_script_text === "string"
    ? scriptState.readable_script_text
    : "";
  const readableValid = Boolean(scriptState.readable_script_valid && readableText.trim());
  const finalText = typeof scriptState.final_script_text === "string"
    ? scriptState.final_script_text
    : "";
  const finalConfirmed = Boolean(scriptState.final_script_confirmed && finalText.trim());

  state.readableScriptText = readableText;
  state.readableScriptValid = readableValid;
  state.finalScriptText = finalText;
  state.finalScriptConfirmed = finalConfirmed;

  if (readableText) {
    elements.readableScriptOutput.value = readableText;
    elements.readableScriptMeta.textContent = readableValid
      ? `${readableText.split("\n").length} 行`
      : "已恢复但未确认有效";

    const parsed = parseCurrentScreenplayYaml();
    if (parsed) {
      renderPartialRenderTargets(parsed.screenplay);
    }
  }

  if (finalConfirmed) {
    elements.finalScriptTextarea.value = finalText;
    elements.finalScriptStatus.textContent = "已恢复上次确认的最终剧本，可用于 Word 导出。";
    elements.finalScriptStatus.className = "final-script-status success";
  }
}

function updateActionButtons() {
  const hasText = state.rawNovelText.trim().length > 0;
  const hasStructure = state.chapters.length > 0;
  const hasEnoughChapters = state.chapters.length >= 3;
  const canGenerateYaml = hasEnoughChapters && !state.isGeneratingYaml;
  const hasYaml = Boolean(getCurrentYaml().trim());
  const canValidateYaml = hasYaml && !state.isValidatingYaml;
  const canRenderScript = hasYaml && Boolean(state.validationResult?.valid) && !state.isValidatingYaml;
  const hasReadableScript = state.readableScriptValid && Boolean(state.readableScriptText.trim());
  const hasFinalScript = state.finalScriptConfirmed && Boolean(state.finalScriptText.trim());
  const canOpenPreview = hasReadableScript || hasFinalScript;
  const canPartialRender = hasYaml
    && hasReadableScript
    && Boolean(elements.partialRenderTargetSelect.value)
    && !state.isPartialRendering;

  elements.parseChaptersBtn.classList.toggle("ready", hasText);
  elements.openStructureBtn.classList.toggle("ready", hasStructure);
  elements.openStructureBtn.classList.toggle("disabled-action", !hasStructure);
  elements.openStructureBtn.disabled = !hasStructure;
  elements.openStructureBtn.setAttribute("aria-disabled", String(!hasStructure));
  elements.generateYamlBtn.classList.toggle("ready", canGenerateYaml);
  elements.generateYamlBtn.classList.toggle("disabled-action", !canGenerateYaml);
  elements.generateYamlBtn.disabled = !canGenerateYaml;
  elements.generateYamlBtn.setAttribute("aria-disabled", String(!canGenerateYaml));
  elements.validateYamlButton.classList.toggle("ready", canValidateYaml);
  elements.validateYamlButton.classList.toggle("disabled-action", !canValidateYaml);
  elements.validateYamlButton.disabled = !canValidateYaml;
  elements.validateYamlButton.setAttribute("aria-disabled", String(!canValidateYaml));
  elements.downloadYamlButton.classList.toggle("ready", hasYaml);
  elements.downloadYamlButton.classList.toggle("disabled-action", !hasYaml);
  elements.downloadYamlButton.disabled = !hasYaml;
  elements.downloadYamlButton.setAttribute("aria-disabled", String(!hasYaml));
  elements.renderScriptButton.classList.toggle("ready", canRenderScript);
  elements.renderScriptButton.classList.toggle("disabled-action", !canRenderScript);
  elements.renderScriptButton.disabled = !canRenderScript;
  elements.renderScriptButton.setAttribute("aria-disabled", String(!canRenderScript));
  elements.partialRenderTargetSelect.disabled = !hasYaml || !hasReadableScript || state.isPartialRendering;
  elements.partialRenderButton.classList.toggle("ready", canPartialRender);
  elements.partialRenderButton.classList.toggle("disabled-action", !canPartialRender);
  elements.partialRenderButton.disabled = !canPartialRender;
  elements.partialRenderButton.setAttribute("aria-disabled", String(!canPartialRender));
  elements.openPreviewFromReadableBtn.classList.toggle("ready", canOpenPreview);
  elements.openPreviewFromReadableBtn.classList.toggle("disabled-action", !canOpenPreview);
  elements.openPreviewFromReadableBtn.disabled = !canOpenPreview;
  elements.openPreviewFromReadableBtn.setAttribute("aria-disabled", String(!canOpenPreview));
  elements.exportWordButton.classList.toggle("ready", hasFinalScript);
  elements.exportWordButton.classList.toggle("disabled-action", !hasFinalScript);
  elements.exportWordButton.disabled = !hasFinalScript;
  elements.exportWordButton.setAttribute("aria-disabled", String(!hasFinalScript));
  updateProgressStep();
}

function buildReadableScriptText(screenplayLike) {
  const screenplay = extractScreenplayRoot(screenplayLike) || {};
  const acts = extractActs(screenplay);
  const lines = [];

  if (!acts.length) {
    lines.push("暂无场景。");
    return lines.join("\n");
  }

  let hasAnyScene = false;
  let globalSceneNumber = 1;
  acts.forEach((act, actIndex) => {
    const scenes = extractScenes(act);

    if (!scenes.length) {
      return;
    }

    hasAnyScene = true;
    scenes.forEach((scene, sceneIndex) => {
      if (lines.length) {
        lines.push("切至：", "");
      }

      const sceneHeading = buildSceneHeading(scene, sceneIndex, globalSceneNumber);
      const narrativeParagraphs = buildSceneNarrativeParagraphs(scene);
      const dialogues = extractDialogues(scene);

      lines.push(`${globalSceneNumber}. ${sceneHeading}`, "");

      if (narrativeParagraphs.length) {
        narrativeParagraphs.forEach((paragraph) => {
          lines.push(paragraph, "");
        });
      }

      dialogues.forEach((dialogue) => {
        appendDialogueBlock(lines, dialogue);
      });

      globalSceneNumber += 1;
    });
  });

  if (!hasAnyScene) {
    return "暂无场景。";
  }

  return lines.join("\n").trimEnd();
}

function buildSceneHeading(scene, sceneIndex, globalSceneNumber) {
  const slugline = stringifyValue(scene?.slugline || scene?.slug_line || scene?.heading);
  if (slugline) {
    return normalizeSlugline(slugline);
  }

  const locationValue = stringifyValue(scene?.location || scene?.place || scene?.setting);
  const { sceneType, place } = extractSceneTypeAndPlace(scene, locationValue);
  const timeLabel = normalizeSceneTimeLabel(scene?.time || scene?.time_of_day || scene?.period);
  const safePlace = place || normalizeSceneFallbackPlace(scene, sceneIndex, globalSceneNumber);

  return [sceneType || "场景", safePlace, timeLabel].filter(Boolean).join(" ");
}

function normalizeSlugline(value) {
  return value
    .replace(/\bINT\.?\b/gi, "内景")
    .replace(/\bEXT\.?\b/gi, "外景")
    .replace(/\bINT\/EXT\.?\b/gi, "内外景")
    .replace(/\bEXT\/INT\.?\b/gi, "外内景")
    .replace(/\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSceneTypeAndPlace(scene, locationValue) {
  const explicitType = mapSceneTypeLabel(
    scene?.interior_exterior
      || scene?.int_ext
      || scene?.scene_type
      || scene?.scene_kind
      || scene?.space_type,
  );

  const normalizedLocation = locationValue.trim();
  const prefixedMatch = normalizedLocation.match(/^(内景|外景|内外景|外内景|内|外)\s*[-:：]?\s*(.+)$/);
  if (prefixedMatch) {
    return {
      sceneType: mapSceneTypeLabel(prefixedMatch[1]),
      place: prefixedMatch[2].trim(),
    };
  }

  return {
    sceneType: explicitType || "场景",
    place: normalizeScenePlace(normalizedLocation),
  };
}

function mapSceneTypeLabel(value) {
  const label = stringifyValue(value).trim().toLowerCase();
  if (!label) return "";
  if (label === "内" || label === "interior" || label === "inside" || label === "int" || label === "interior scene" || label === "内景") {
    return "内景";
  }
  if (label === "外" || label === "exterior" || label === "outside" || label === "ext" || label === "exterior scene" || label === "外景") {
    return "外景";
  }
  if (label === "int/ext" || label === "ext/int" || label === "mixed" || label === "内外景" || label === "外内景") {
    return "内外景";
  }
  return stringifyValue(value).trim();
}

function normalizeScenePlace(value) {
  const place = stringifyValue(value).trim();
  if (!place || place === "待定场景" || place.toLowerCase() === "unknown") {
    return "";
  }
  return place;
}

function normalizeSceneFallbackPlace(scene, sceneIndex, globalSceneNumber) {
  const sceneTitle = getSceneTitle(scene, sceneIndex);
  if (sceneTitle && !/^第\s*\d+\s*场$/.test(sceneTitle)) {
    return sceneTitle;
  }
  return `场景${globalSceneNumber}`;
}

function normalizeSceneTimeLabel(value) {
  const raw = stringifyValue(value).trim();
  const lower = raw.toLowerCase();
  if (!raw || raw === "待定时间" || lower === "unknown") {
    return "";
  }

  const map = {
    day: "日",
    daytime: "日",
    morning: "晨",
    noon: "午",
    afternoon: "下午",
    dusk: "黄昏",
    evening: "晚",
    night: "夜",
    midnight: "深夜",
    dawn: "黎明",
    sunrise: "清晨",
    sunset: "傍晚",
  };
  return map[lower] || raw;
}

function buildSceneNarrativeParagraphs(scene) {
  const paragraphs = [];
  appendParagraphIfPresent(paragraphs, scene?.summary);
  appendParagraphIfPresent(paragraphs, scene?.description);
  appendParagraphList(paragraphs, scene?.actions);
  appendParagraphIfPresent(paragraphs, scene?.action);
  appendParagraphIfPresent(paragraphs, scene?.narration);
  extractBeats(scene)
    .filter((beat) => !isDialogueBeat(beat))
    .forEach((beat) => appendBeatNarrativeParagraphs(paragraphs, beat));

  return uniqueParagraphs(paragraphs);
}

function appendParagraphList(target, value) {
  if (!Array.isArray(value)) {
    appendParagraphIfPresent(target, value);
    return;
  }
  value.forEach((item) => appendParagraphIfPresent(target, item));
}

function appendParagraphIfPresent(target, value) {
  const text = formatNarrativeParagraph(value);
  if (text) {
    target.push(text);
  }
}

function appendBeatNarrativeParagraphs(target, beat) {
  if (typeof beat === "string" || typeof beat === "number") {
    appendParagraphIfPresent(target, beat);
    return;
  }
  if (!beat || typeof beat !== "object") {
    return;
  }

  const candidates = [
    beat.description,
    beat.action,
    beat.narration,
    beat.summary,
    beat.content,
    beat.text,
    beat.line,
  ];
  candidates.forEach((candidate) => appendParagraphIfPresent(target, candidate));
}

function formatNarrativeParagraph(value) {
  if (typeof value === "string" || typeof value === "number") {
    const text = stringifyValue(value).trim();
    return text ? ensureSentenceEnding(text) : "";
  }
  if (value && typeof value === "object") {
    const text = stringifyValue(
      value.content
        || value.text
        || value.action
        || value.narration
        || value.description
        || value.summary
        || value.line,
    ).trim();
    return text ? ensureSentenceEnding(text) : "";
  }
  return "";
}

function ensureSentenceEnding(text) {
  if (!text) {
    return "";
  }
  return /[。！？!?…]$/.test(text) ? text : `${text}。`;
}

function uniqueParagraphs(values) {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    const text = stringifyValue(value).trim();
    if (!text) {
      return;
    }
    const key = text.replace(/\s+/g, " ");
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push(text);
  });
  return result;
}

function appendDialogueBlock(lines, dialogue) {
  const parsedDialogue = normalizeDialogueDisplay(dialogue);
  const characterName = parsedDialogue.character || "旁白";
  const lineText = parsedDialogue.line || "……";
  const parenthetical = stringifyValue(
    parsedDialogue.parenthetical
      || dialogue.parenthetical
      || dialogue.emotion
      || dialogue.tone
      || dialogue.mood
      || dialogue.语气
      || dialogue.状态,
  );

  lines.push(characterName);
  if (parenthetical) {
    lines.push(`（${parenthetical}）`);
  }
  lines.push(lineText, "");
}

function normalizeDialogueDisplay(dialogue) {
  const fallbackCharacter = stringifyValue(dialogue.character || dialogue.speaker || dialogue.name) || "旁白";
  const fallbackLine = stringifyValue(dialogue.line || dialogue.text || dialogue.dialogue || dialogue.content) || "……";
  const rawParenthetical = stringifyValue(
    dialogue.parenthetical
      || dialogue.emotion
      || dialogue.tone
      || dialogue.mood
      || dialogue.语气
      || dialogue.状态,
  );
  if (!isNarratorLikeName(fallbackCharacter)) {
    return {
      character: fallbackCharacter,
      line: fallbackLine,
      parenthetical: rawParenthetical,
    };
  }

  const parsed = parseNarrativeDialogueLine(fallbackLine);
  if (!parsed) {
    return {
      character: fallbackCharacter,
      line: fallbackLine,
      parenthetical: rawParenthetical,
    };
  }

  return {
    character: parsed.character,
    line: parsed.line,
    parenthetical: parsed.parenthetical || rawParenthetical,
  };
}

function isNarratorLikeName(value) {
  const name = stringifyValue(value).trim();
  return !name || name === "旁白" || /^narrator$/i.test(name);
}

function parseNarrativeDialogueLine(value) {
  const text = stringifyValue(value).trim();
  if (!text) {
    return null;
  }

  const sanitizedText = text.replace(/^旁白\s*[:：]?\s*/, "").trim();
  const match = sanitizedText.match(
    /^([\u4e00-\u9fa5A-Za-z0-9·・\-_]{1,16})([^“”"「」]{0,64}?)(?:(?:，|,)?(?:低声|轻声|冷冷地|平静地|缓缓地|轻轻地|沉声|压低声音|笑着|说道|说着|问道|问|回答|答道|喊道|道|说))?\s*[：:，,]?\s*[“"「]?(.+?)[”"」]?$/,
  );
  if (!match) {
    return null;
  }

  const character = stringifyValue(match[1]).trim();
  const stageText = stringifyValue(match[2]).trim();
  const quotedLine = stringifyValue(match[3]).trim();
  if (!character || !quotedLine) {
    return null;
  }

  return {
    character,
    parenthetical: normalizeDialogueParenthetical(stageText),
    line: ensureDialogueQuotes(quotedLine),
  };
}

function normalizeDialogueParenthetical(value) {
  const text = stringifyValue(value).trim().replace(/^[，,\s]+|[，,\s]+$/g, "");
  if (!text) {
    return "";
  }

  const shortEmotionMatch = text.match(/^(.{1,10}?着)/);
  if (shortEmotionMatch) {
    return shortEmotionMatch[1];
  }

  const compact = text.split(/[，。；、]/)[0].trim();
  if (compact.length <= 12) {
    return compact;
  }
  return text;
}

function ensureDialogueQuotes(value) {
  const text = stringifyValue(value).trim();
  if (!text) {
    return "……";
  }

  const stripped = text
    .replace(/^[\s"'“”‘’「」『』]+/, "")
    .replace(/[\s"'“”‘’「」『』]+$/, "")
    .trim();
  if (!stripped) {
    return "……";
  }

  if (/^[“「『].*[”」』]$/.test(text)) {
    return text;
  }
  return `“${stripped}”`;
}

function extractScreenplayRoot(parsedYaml) {
  if (!parsedYaml || typeof parsedYaml !== "object") {
    return null;
  }
  if (parsedYaml.screenplay && typeof parsedYaml.screenplay === "object" && !Array.isArray(parsedYaml.screenplay)) {
    return parsedYaml.screenplay;
  }
  if (parsedYaml.screen_play && typeof parsedYaml.screen_play === "object" && !Array.isArray(parsedYaml.screen_play)) {
    return parsedYaml.screen_play;
  }
  if (parsedYaml.script && typeof parsedYaml.script === "object" && !Array.isArray(parsedYaml.script)) {
    return parsedYaml.script;
  }
  if (Array.isArray(parsedYaml.acts) || Array.isArray(parsedYaml.scenes)) {
    return parsedYaml;
  }
  return null;
}

function extractActs(root) {
  const screenplay = extractScreenplayRoot(root) || root;
  if (!screenplay || typeof screenplay !== "object") {
    return [];
  }
  if (Array.isArray(screenplay.acts)) {
    return screenplay.acts.filter((act) => act && typeof act === "object");
  }
  if (Array.isArray(screenplay.scenes)) {
    return [{ title: screenplay.title || screenplay.meta?.title || "第1幕", scenes: screenplay.scenes }];
  }
  return [];
}

function extractScenes(act) {
  if (!act || typeof act !== "object") {
    return [];
  }
  const scenes = act.scenes || act.scene || act.sequences;
  if (Array.isArray(scenes)) {
    return scenes.filter((scene) => scene && typeof scene === "object");
  }
  if (scenes && typeof scenes === "object") {
    return [scenes];
  }
  return [];
}

function extractDialogues(scene) {
  const dialogues = [];
  appendDialogueItems(dialogues, scene?.dialogues);
  appendDialogueItems(dialogues, scene?.dialogue);
  appendDialogueItems(dialogues, scene?.lines);
  extractBeats(scene)
    .filter(isDialogueBeat)
    .forEach((beat) => {
      appendDialogueItems(dialogues, {
        character: beat.character || beat.speaker || beat.name,
        line: beat.line || beat.text || beat.dialogue || beat.content,
      });
    });
  return dedupeDialogues(
    dialogues.filter((dialogue) => stringifyValue(dialogue.line || dialogue.text || dialogue.dialogue || dialogue.content)),
  );
}

function appendDialogueItems(target, value) {
  if (!value) {
    return;
  }
  const items = Array.isArray(value) ? value : [value];
  items.forEach((item) => {
    if (typeof item === "string" || typeof item === "number") {
      target.push({ character: "旁白", line: stringifyValue(item) });
    } else if (item && typeof item === "object") {
      target.push({
        ...item,
        character: item.character || item.speaker || item.name || item.character_name || item.role || "旁白",
        line: item.line || item.text || item.dialogue || item.content || "",
      });
    }
  });
}

function dedupeDialogues(dialogues) {
  const seen = new Set();
  const result = [];

  dialogues.forEach((dialogue) => {
    const normalized = normalizeDialogueDisplay(dialogue);
    const key = [
      stringifyValue(normalized.character).trim(),
      stringifyValue(normalized.parenthetical).trim(),
      stringifyValue(normalized.line).trim(),
    ].join("::");
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push(dialogue);
  });

  return result;
}

function extractBeats(scene) {
  const beats = scene?.beats || scene?.beat;
  if (Array.isArray(beats)) {
    return beats.filter(Boolean);
  }
  if (beats) {
    return [beats];
  }
  return [];
}

function extractActions(scene) {
  const actions = [];
  appendActionItems(actions, scene?.actions);
  appendActionItems(actions, scene?.action);
  appendActionItems(actions, scene?.narration);
  appendActionItems(actions, scene?.description);
  appendActionItems(actions, scene?.summary);
  extractBeats(scene)
    .filter((beat) => !isDialogueBeat(beat) && isActionLikeBeat(beat))
    .forEach((beat) => appendActionItems(actions, beat));
  return uniqueNonEmpty(actions);
}

function appendActionItems(target, value) {
  if (!value) {
    return;
  }
  const items = Array.isArray(value) ? value : [value];
  items.forEach((item) => {
    const text = formatActionItem(item);
    if (text) {
      target.push(text);
    }
  });
}

function formatActionItem(item) {
  if (typeof item === "string" || typeof item === "number") {
    return stringifyValue(item);
  }
  if (item && typeof item === "object") {
    return stringifyValue(item.content || item.text || item.action || item.narration || item.description || item.summary || item.line);
  }
  return "";
}

function isDialogueBeat(beat) {
  if (!beat || typeof beat !== "object") {
    return false;
  }
  const type = stringifyValue(beat.type || beat.kind || beat.category).toLowerCase();
  return type.includes("dialogue") || type.includes("dialog") || type.includes("line") || type.includes("对白");
}

function isActionLikeBeat(beat) {
  if (!beat || typeof beat !== "object") {
    return false;
  }
  const type = stringifyValue(beat.type || beat.kind || beat.category).toLowerCase();
  return !type || type.includes("action") || type.includes("narration") || type.includes("beat") || type.includes("动作") || type.includes("旁白");
}

function formatBeat(beat) {
  if (typeof beat === "string" || typeof beat === "number") {
    return stringifyValue(beat);
  }
  const type = stringifyValue(beat.type || beat.kind || beat.category);
  const content = stringifyValue(beat.content || beat.text || beat.action || beat.narration || beat.summary || beat.line);
  return type && content ? `${type}：${content}` : content || type || "未注明节拍";
}

function getSceneTitle(scene, sceneIndex) {
  return (
    stringifyValue(scene?.title || scene?.scene_title || scene?.heading || scene?.name || scene?.scene_id || scene?.scene_number) ||
    `第${sceneIndex + 1}场`
  );
}

function getSceneChapterId(scene) {
  return (
    stringifyValue(scene?.source_chapter_id || scene?.source || scene?.chapter_id || scene?.source_chapters?.[0] || scene?.chapter) ||
    "暂无章节 ID"
  );
}

function extractCharacters(scene, screenplay) {
  const rawCharacters =
    scene?.characters ||
    scene?.characters_present ||
    scene?.character_names ||
    scene?.cast ||
    scene?.roles ||
    [];
  const names = normalizeCharacterNames(rawCharacters, screenplay);
  return names.length ? names : inferCharactersFromDialogues(extractDialogues(scene));
}

function normalizeCharacterNames(characters, screenplay) {
  const characterMap = buildCharacterNameMap(screenplay);
  const items = Array.isArray(characters) ? characters : characters ? [characters] : [];
  return items
    .map((character) => {
      if (typeof character === "string" || typeof character === "number") {
        const key = stringifyValue(character);
        return characterMap.get(key) || key;
      }
      if (character && typeof character === "object") {
        const key = stringifyValue(character.name || character.character || character.character_id || character.id || character.speaker);
        return characterMap.get(key) || key;
      }
      return "";
    })
    .filter(Boolean);
}

function buildCharacterNameMap(screenplay) {
  const map = new Map();
  const characters = Array.isArray(screenplay?.characters) ? screenplay.characters : [];
  characters.forEach((character) => {
    if (!character || typeof character !== "object") {
      return;
    }
    const name = stringifyValue(character.name || character.character || character.speaker);
    [character.character_id, character.id, character.name].forEach((key) => {
      const normalizedKey = stringifyValue(key);
      if (normalizedKey && name) {
        map.set(normalizedKey, name);
      }
    });
  });
  return map;
}

function inferCharactersFromDialogues(dialogues) {
  return uniqueNonEmpty(dialogues.map((dialogue) => stringifyValue(dialogue.character || dialogue.speaker || dialogue.name)));
}

function collectActChapterIds(act, scenes) {
  const chapterIds = []
    .concat(Array.isArray(act?.source_chapters) ? act.source_chapters : [])
    .concat(act?.source_chapter_id || act?.source || [])
    .concat(scenes.map((scene) => getSceneChapterId(scene)).filter((chapterId) => chapterId !== "暂无章节 ID"))
    .map((chapterId) => stringifyValue(chapterId))
    .filter(Boolean);
  return chapterIds.length ? Array.from(new Set(chapterIds)).join(", ") : "暂无章节 ID";
}

function uniqueNonEmpty(values) {
  return Array.from(new Set(values.map((value) => stringifyValue(value)).filter(Boolean)));
}

function getActs(screenplay) {
  return extractActs(screenplay);
}

function parseCurrentScreenplayYaml() {
  try {
    const data = parseSimpleYaml(getCurrentYaml());
    const screenplay = extractScreenplayRoot(data);
    if (!screenplay) {
      return null;
    }
    return { data, screenplay };
  } catch (error) {
    return null;
  }
}

function renderPartialRenderTargets(screenplay, selectedValue = "") {
  const acts = extractActs(screenplay);
  const options = ['<option value="">选择要重渲染的幕或场</option>'];
  let globalSceneNumber = 1;

  acts.forEach((act, actIndex) => {
    const actTitle = escapeHtml(stringifyValue(act.title || act.name || act.heading || act.act_id) || `第${actIndex + 1}幕`);
    const scenes = extractScenes(act);
    options.push(`<option value="act:${actIndex}:${globalSceneNumber}:${scenes.length}">第${actIndex + 1}幕：${actTitle}</option>`);

    scenes.forEach((scene, sceneIndex) => {
      const sceneTitle = escapeHtml(getSceneTitle(scene, sceneIndex));
      options.push(`<option value="scene:${actIndex}:${sceneIndex}:${globalSceneNumber}">第${actIndex + 1}幕 / 第${sceneIndex + 1}场：${sceneTitle}</option>`);
      globalSceneNumber += 1;
    });
  });

  elements.partialRenderTargetSelect.innerHTML = options.join("");
  if (selectedValue && elements.partialRenderTargetSelect.querySelector(`option[value="${selectedValue}"]`)) {
    elements.partialRenderTargetSelect.value = selectedValue;
  }
  renderPartialRenderStatus("选择幕或场后，可以仅重渲染该部分。", "info", true);
}

function formatPartialTargetLabel(screenplay, target) {
  const acts = extractActs(screenplay);
  const act = acts[target.actIndex] || {};
  const actTitle = stringifyValue(act.title || act.name || act.heading || act.act_id) || `第${target.actIndex + 1}幕`;
  if (target.type === "act") {
    return `第${target.actIndex + 1}幕：${actTitle}`;
  }

  const scenes = extractScenes(act);
  const scene = scenes[target.sceneIndex] || {};
  const sceneTitle = getSceneTitle(scene, target.sceneIndex);
  return `第${target.actIndex + 1}幕 / 第${target.sceneIndex + 1}场：${sceneTitle}`;
}

function refreshQualityReport(screenplay) {
  if (!screenplay || typeof screenplay !== "object") {
    return;
  }

  const acts = extractActs(screenplay);
  const scenes = acts.flatMap((act) => extractScenes(act));
  const coveredChapters = new Set(
    scenes
      .map((scene) => getSceneChapterId(scene))
      .filter((chapterId) => chapterId && chapterId !== "暂无章节 ID"),
  );
  const chapterCount = Number(screenplay.source_novel?.chapter_count || screenplay.quality_report?.chapter_count || coveredChapters.size || 0);
  const characterCount = Array.isArray(screenplay.characters) ? screenplay.characters.length : 0;
  const coverageRate = chapterCount > 0 ? Math.min(coveredChapters.size / chapterCount, 1) : 0;

  screenplay.quality_report = {
    ...(screenplay.quality_report || {}),
    chapter_count: chapterCount,
    scene_count: scenes.length,
    character_count: characterCount,
    chapter_coverage_rate: Number(coverageRate.toFixed(2)),
  };
}

function parseReadableScreenplay(yamlText) {
  const data = parseSimpleYaml(yamlText);
  const parsedRoot = extractParsedScreenplayRoot(data);
  if (parsedRoot && countScenes(parsedRoot) > 0) {
    return { data, screenplay: normalizeReadableScreenplay(parsedRoot), source: "parseSimpleYaml", fallbackEnabled: false };
  }

  const extracted = extractReadableScreenplayFromYamlText(yamlText);
  if (extracted) {
    return {
      data: { screenplay: extracted },
      screenplay: extracted,
      source: "textExtractor",
      fallbackEnabled: true,
      parsedData: data,
    };
  }

  return {
    data,
    screenplay: normalizeReadableScreenplay(parsedRoot || {}),
    source: "empty",
    fallbackEnabled: !parsedRoot || countScenes(parsedRoot) === 0,
  };
}

function logReadableScriptDebug(yamlText, data, root, source, fallbackEnabled = false) {
  const acts = extractActs(root);
  const sceneCount = countScenes(root);
  console.debug("[readable-script] YAML preview:", yamlText.slice(0, 500));
  console.debug("[readable-script] parsed top-level keys:", data && typeof data === "object" ? Object.keys(data) : []);
  console.debug("[readable-script] parsed.screenplay exists:", Boolean(data && data.screenplay));
  console.debug("[readable-script] acts length:", acts.length);
  console.debug("[readable-script] scenes total:", sceneCount);
  console.debug("[readable-script] fallback enabled:", Boolean(fallbackEnabled));
  console.debug("[readable-script] parser source:", source);
}

function countScenes(screenplay) {
  return extractActs(screenplay).reduce((total, act) => total + extractScenes(act).length, 0);
}

function extractParsedScreenplayRoot(parsedYaml) {
  if (!parsedYaml || typeof parsedYaml !== "object") {
    return null;
  }
  return parsedYaml.screenplay || parsedYaml.screen_play || parsedYaml.script || parsedYaml;
}

function createReadableScreenplay() {
  return {
    title: "",
    meta: {},
    characters: [],
    acts: [],
  };
}

function createReadableAct() {
  return {
    act_id: "",
    title: "",
    name: "",
    scenes: [],
  };
}

function createReadableScene() {
  return {
    scene_id: "",
    title: "",
    name: "",
    source_chapter_id: "",
    location: "",
    time: "",
    characters: [],
    summary: "",
    dialogues: [],
    actions: [],
    beats: [],
  };
}

function normalizeReadableScreenplay(screenplayLike) {
  const root = extractScreenplayRoot(screenplayLike) || screenplayLike || {};
  const screenplay = {
    ...root,
    title: stringifyValue(root.meta?.title || root.title) || "未命名剧本",
    meta: root.meta && typeof root.meta === "object" ? root.meta : {},
    characters: Array.isArray(root.characters) ? root.characters : [],
    acts: extractActs(root).map((act) => normalizeReadableAct(act)),
  };
  return screenplay;
}

function normalizeReadableAct(act) {
  return {
    ...act,
    act_id: stringifyValue(act.act_id || act.id || act.act_number),
    title: stringifyValue(act.title || act.act_title || act.name || act.heading || act.act_id),
    name: stringifyValue(act.name || act.title || act.act_title),
    scenes: extractScenes(act).map((scene) => normalizeReadableScene(scene)),
  };
}

function normalizeReadableScene(scene) {
  return {
    ...scene,
    scene_id: stringifyValue(scene.scene_id || scene.id || scene.scene_number),
    title: stringifyValue(scene.title || scene.scene_title || scene.name || scene.heading || scene.scene_id),
    name: stringifyValue(scene.name || scene.title || scene.scene_title),
    source_chapter_id: stringifyValue(scene.source_chapter_id || scene.source || scene.chapter_id || scene.source_chapters?.[0] || scene.chapter),
    location: stringifyValue(scene.location || scene.place || scene.setting),
    time: stringifyValue(scene.time || scene.time_of_day || scene.period),
    characters: ensureReadableListValue(scene.characters || scene.character_ids || scene.characters_present),
    summary: stringifyValue(scene.summary || scene.description || scene.synopsis),
    dialogues: extractDialogues(scene),
    actions: ensureReadableListValue(scene.actions || scene.action).length ? ensureReadableListValue(scene.actions || scene.action) : extractActions(scene),
    beats: ensureReadableListValue(scene.beats || scene.beat),
  };
}

function ensureReadableListValue(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined || value === "") {
    return [];
  }
  return [value];
}

function extractReadableScreenplayFromYamlText(yamlText) {
  const lines = normalizeYamlLines(yamlText);
  const screenplay = createReadableScreenplay();
  if (!lines.length) {
    return screenplay;
  }

  const characterMap = new Map();
  let rootIndent = null;
  let metaIndent = -1;
  let charactersIndent = -1;
  let actsIndent = -1;
  let currentCharacter = null;
  let currentCharacterIndent = -1;
  let currentAct = null;
  let currentActIndent = -1;
  let currentScene = null;
  let currentSceneIndent = -1;
  let scenesIndent = -1;
  let currentList = null;
  let currentListItem = null;
  let currentListItemIndent = -1;
  let currentListOwner = null;
  let inScenes = false;

  lines.forEach((line) => {
    const { indent, text } = line;
    const keyValue = splitYamlKeyValue(text);

    if (isScreenplayRootLine(text)) {
      rootIndent = indent;
      resetReadableYamlSectionState();
      return;
    }

    if (rootIndent !== null && indent <= rootIndent) {
      resetReadableYamlSectionState();
      return;
    }

    if (rootIndent === null && !isLikelyRootScreenplayLine(text) && actsIndent < 0 && metaIndent < 0 && charactersIndent < 0) {
      return;
    }

    if (metaIndent >= 0 && indent <= metaIndent) {
      metaIndent = -1;
    }
    if (charactersIndent >= 0 && indent <= charactersIndent) {
      charactersIndent = -1;
      currentCharacter = null;
      currentCharacterIndent = -1;
    }

    if (text === "meta:") {
      metaIndent = indent;
      charactersIndent = -1;
      actsIndent = -1;
      currentList = null;
      return;
    }
    if (text === "characters:") {
      charactersIndent = indent;
      metaIndent = -1;
      actsIndent = -1;
      currentCharacter = null;
      currentList = null;
      return;
    }
    if (text === "acts:") {
      actsIndent = indent;
      metaIndent = -1;
      charactersIndent = -1;
      currentCharacter = null;
      currentList = null;
      return;
    }

    if (!currentAct && keyValue && keyValue.key === "title") {
      screenplay.title = parseYamlScalar(keyValue.rawValue);
      return;
    }

    if (metaIndent >= 0 && indent > metaIndent && keyValue) {
      screenplay.meta[keyValue.key] = parseYamlScalar(keyValue.rawValue);
      if (keyValue.key === "title") {
        screenplay.title = parseYamlScalar(keyValue.rawValue);
      }
      return;
    }

    if (charactersIndent >= 0 && indent > charactersIndent && text.startsWith("- ")) {
      currentCharacter = {};
      currentCharacterIndent = indent;
      screenplay.characters.push(currentCharacter);
      assignListItemObject(currentCharacter, text.slice(2).trim());
      addCharacterMapEntries(characterMap, currentCharacter);
      currentList = null;
      return;
    }
    if (currentCharacter && charactersIndent >= 0 && indent > currentCharacterIndent && keyValue) {
      currentCharacter[keyValue.key] = parseYamlScalar(keyValue.rawValue);
      addCharacterMapEntries(characterMap, currentCharacter);
      return;
    }

    if (actsIndent >= 0 && text.startsWith("- ") && indent > actsIndent && (!currentAct || indent <= currentActIndent)) {
      currentAct = createReadableAct();
      currentActIndent = indent;
      screenplay.acts.push(currentAct);
      currentScene = null;
      currentSceneIndent = -1;
      scenesIndent = -1;
      currentList = null;
      currentListItem = null;
      currentListItemIndent = -1;
      currentListOwner = null;
      inScenes = false;
      assignListItemObject(currentAct, text.slice(2).trim());
      return;
    }

    if (!currentAct || actsIndent < 0 || indent <= actsIndent) {
      return;
    }

    if (text === "scenes:" && indent > currentActIndent) {
      currentScene = null;
      currentSceneIndent = -1;
      scenesIndent = indent;
      currentList = null;
      currentListItem = null;
      currentListItemIndent = -1;
      currentListOwner = null;
      inScenes = true;
      return;
    }

    if (text.startsWith("- ")) {
      const itemText = text.slice(2).trim();
      if (!inScenes) {
        if (currentList && indent > currentActIndent) {
          currentListItem = appendYamlListValue(currentAct, currentList, itemText);
          currentListItemIndent = indent;
          currentListOwner = "act";
        }
      } else if (indent > scenesIndent && (!currentScene || indent <= currentSceneIndent)) {
        currentScene = createReadableScene();
        currentSceneIndent = indent;
        currentAct.scenes.push(currentScene);
        currentList = null;
        currentListItem = null;
        currentListItemIndent = -1;
        currentListOwner = null;
        assignListItemObject(currentScene, itemText);
      } else if (currentList && currentScene && indent > currentSceneIndent) {
        currentListItem = appendYamlListValue(currentScene, currentList, itemText);
        currentListItemIndent = indent;
        currentListOwner = "scene";
      }
      return;
    }

    if (!keyValue) {
      return;
    }

    if (currentList && currentListItem && indent > currentListItemIndent && isNestedListObjectKey(keyValue.key)) {
      if (currentListOwner === "scene" || currentListOwner === "act") {
        currentListItem[keyValue.key] = parseYamlScalar(keyValue.rawValue);
        return;
      }
    }

    if (inScenes && currentScene && indent > currentSceneIndent) {
      const value = parseYamlScalar(keyValue.rawValue);
      if (keyValue.rawValue === "") {
        currentScene[keyValue.key] = ensureReadableListValue(currentScene[keyValue.key]);
        currentList = keyValue.key;
        currentListItem = null;
        currentListItemIndent = -1;
        currentListOwner = "scene";
      } else {
        currentScene[keyValue.key] = value;
        currentList = null;
        currentListItem = null;
        currentListItemIndent = -1;
        currentListOwner = null;
      }
      return;
    }

    if (keyValue.rawValue === "") {
      currentAct[keyValue.key] = ensureReadableListValue(currentAct[keyValue.key]);
      currentList = keyValue.key;
      currentListItem = null;
      currentListItemIndent = -1;
      currentListOwner = "act";
    } else {
      currentAct[keyValue.key] = parseYamlScalar(keyValue.rawValue);
      currentList = null;
      currentListItem = null;
      currentListItemIndent = -1;
      currentListOwner = null;
    }
  });

  normalizeExtractedReadableScreenplay(screenplay);
  hydrateSceneCharacters(screenplay, characterMap);
  return screenplay;

  function resetReadableYamlSectionState() {
    metaIndent = -1;
    charactersIndent = -1;
    actsIndent = -1;
    currentCharacter = null;
    currentCharacterIndent = -1;
    currentAct = null;
    currentActIndent = -1;
    currentScene = null;
    currentSceneIndent = -1;
    scenesIndent = -1;
    currentList = null;
    currentListItem = null;
    currentListItemIndent = -1;
    currentListOwner = null;
    inScenes = false;
  }
}

function normalizeYamlLines(yamlText) {
  return yamlText
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, "  ")
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .filter((line) => line.trim() && !line.trim().startsWith("#") && !line.trim().startsWith("```"))
    .map((raw) => ({
      indent: raw.length - raw.trimStart().length,
      text: raw.trim(),
    }));
}

function isScreenplayRootLine(text) {
  return text === "screenplay:" || text === "screen_play:" || text === "script:";
}

function isLikelyRootScreenplayLine(text) {
  return text === "meta:" || text === "acts:" || text === "characters:" || text.startsWith("title:");
}

function splitYamlKeyValue(text) {
  const separatorIndex = text.indexOf(":");
  if (separatorIndex === -1) {
    return null;
  }
  return {
    key: text.slice(0, separatorIndex).trim(),
    rawValue: text.slice(separatorIndex + 1).trim(),
  };
}

function assignListItemObject(target, itemText) {
  if (!itemText) {
    return;
  }
  const keyValue = splitYamlKeyValue(itemText);
  if (keyValue) {
    target[keyValue.key] = parseYamlScalar(keyValue.rawValue);
  }
}

function appendYamlListValue(target, key, itemText) {
  if (!Array.isArray(target[key])) {
    target[key] = [];
  }
  const keyValue = splitYamlKeyValue(itemText);
  if (keyValue) {
    const item = { [keyValue.key]: parseYamlScalar(keyValue.rawValue) };
    target[key].push(item);
    return item;
  } else {
    const item = parseYamlScalar(itemText);
    target[key].push(item);
    return item && typeof item === "object" ? item : null;
  }
}

function isNestedListObjectKey(key) {
  return [
    "type",
    "kind",
    "category",
    "speaker",
    "character",
    "character_name",
    "name",
    "line",
    "text",
    "dialogue",
    "content",
    "action",
    "narration",
    "description",
    "summary",
  ].includes(key);
}

function getActSceneListIndent(act) {
  return Number.isFinite(act.__sceneListIndent) ? act.__sceneListIndent : Number.POSITIVE_INFINITY;
}

function deleteTemporarySceneIndent(acts) {
  acts.forEach((act) => {
    delete act.__sceneListIndent;
  });
}

function normalizeExtractedReadableScreenplay(screenplay) {
  screenplay.meta = screenplay.meta && typeof screenplay.meta === "object" ? screenplay.meta : {};
  screenplay.title = stringifyValue(screenplay.meta.title || screenplay.title) || "未命名剧本";
  screenplay.characters = Array.isArray(screenplay.characters) ? screenplay.characters : [];
  screenplay.acts = ensureReadableListValue(screenplay.acts).map((act) => {
    const normalizedAct = {
      ...createReadableAct(),
      ...(act && typeof act === "object" ? act : {}),
    };
    normalizedAct.act_id = stringifyValue(normalizedAct.act_id || normalizedAct.id || normalizedAct.act_number);
    normalizedAct.title = stringifyValue(normalizedAct.title || normalizedAct.act_title || normalizedAct.name || normalizedAct.heading || normalizedAct.act_id);
    normalizedAct.name = stringifyValue(normalizedAct.name || normalizedAct.title);
    normalizedAct.scenes = ensureReadableListValue(normalizedAct.scenes).map((scene) => {
      const normalizedScene = {
        ...createReadableScene(),
        ...(scene && typeof scene === "object" ? scene : {}),
      };
      normalizedScene.scene_id = stringifyValue(normalizedScene.scene_id || normalizedScene.id || normalizedScene.scene_number);
      normalizedScene.title = stringifyValue(normalizedScene.title || normalizedScene.scene_title || normalizedScene.name || normalizedScene.heading || normalizedScene.scene_id);
      normalizedScene.name = stringifyValue(normalizedScene.name || normalizedScene.title);
      normalizedScene.source_chapter_id = stringifyValue(
        normalizedScene.source_chapter_id ||
          normalizedScene.source ||
          normalizedScene.chapter_id ||
          normalizedScene.source_chapters?.[0] ||
          normalizedScene.chapter,
      );
      normalizedScene.location = stringifyValue(normalizedScene.location || normalizedScene.place || normalizedScene.setting);
      normalizedScene.time = stringifyValue(normalizedScene.time || normalizedScene.time_of_day || normalizedScene.period);
      normalizedScene.characters = ensureReadableListValue(
        normalizedScene.characters || normalizedScene.character_ids || normalizedScene.characters_present,
      );
      normalizedScene.summary = stringifyValue(normalizedScene.summary || normalizedScene.description || normalizedScene.synopsis);
      normalizedScene.dialogues = extractDialogues(normalizedScene);
      normalizedScene.actions = ensureReadableListValue(normalizedScene.actions || normalizedScene.action);
      normalizedScene.beats = ensureReadableListValue(normalizedScene.beats || normalizedScene.beat);
      return normalizedScene;
    });
    return normalizedAct;
  });
  return screenplay;
}

function addCharacterMapEntries(characterMap, character) {
  const name = stringifyValue(character.name || character.character || character.speaker);
  if (!name) {
    return;
  }
  [character.character_id, character.id, character.name].forEach((key) => {
    const normalizedKey = stringifyValue(key);
    if (normalizedKey) {
      characterMap.set(normalizedKey, name);
    }
  });
}

function hydrateSceneCharacters(screenplay, characterMap) {
  screenplay.acts.forEach((act) => {
    extractScenes(act).forEach((scene) => {
      const ids = scene.characters || scene.character_ids || scene.characters_present;
      const names = normalizeCharacterNames(ids, screenplay);
      if (names.length) {
        scene.characters = names.map((name) => characterMap.get(name) || name);
      }
    });
  });
}

function parseSimpleYaml(yamlText) {
  const lines = yamlText
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, "  ")
    .split("\n")
    .map((line) => {
      const raw = line.replace(/\s+$/, "");
      return {
        indent: raw.length - raw.trimStart().length,
        text: raw.trim(),
      };
    })
    .filter((line) => line.text && !line.text.startsWith("#") && !line.text.startsWith("```"));

  if (!lines.length) {
    return {};
  }

  const parsed = parseYamlBlock(lines, 0, lines[0].indent);
  return parsed.value;
}

function parseYamlBlock(lines, startIndex, indent) {
  const firstLine = lines[startIndex];
  if (!firstLine || firstLine.indent < indent) {
    return { value: null, nextIndex: startIndex };
  }

  if (firstLine.text.startsWith("- ")) {
    return parseYamlList(lines, startIndex, indent);
  }

  return parseYamlMap(lines, startIndex, indent);
}

function hasYamlNestedBlock(nextLine, parentIndent) {
  if (!nextLine) {
    return false;
  }
  if (nextLine.indent > parentIndent) {
    return true;
  }
  return nextLine.indent === parentIndent && nextLine.text.startsWith("- ");
}

function getYamlNestedBlockIndent(nextLine, parentIndent) {
  if (!nextLine) {
    return parentIndent;
  }
  return nextLine.indent === parentIndent && nextLine.text.startsWith("- ")
    ? parentIndent
    : nextLine.indent;
}

function parseYamlMap(lines, startIndex, indent) {
  const result = {};
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) {
      break;
    }
    if (line.indent > indent) {
      index += 1;
      continue;
    }
    if (line.text.startsWith("- ")) {
      break;
    }

    const separatorIndex = line.text.indexOf(":");
    if (separatorIndex === -1) {
      throw new Error(`无法解析 YAML 行：${line.text}`);
    }

    const key = line.text.slice(0, separatorIndex).trim();
    const rawValue = line.text.slice(separatorIndex + 1).trim();
    if (!key) {
      throw new Error(`YAML key 为空：${line.text}`);
    }

    if (rawValue) {
      result[key] = parseYamlScalar(rawValue);
      index += 1;
    } else {
      const nextLine = lines[index + 1];
      if (!hasYamlNestedBlock(nextLine, indent)) {
        result[key] = null;
        index += 1;
      } else {
        const nested = parseYamlBlock(lines, index + 1, getYamlNestedBlockIndent(nextLine, indent));
        result[key] = nested.value;
        index = nested.nextIndex;
      }
    }
  }

  return { value: result, nextIndex: index };
}

function parseYamlList(lines, startIndex, indent) {
  const result = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) {
      break;
    }
    if (line.indent > indent) {
      index += 1;
      continue;
    }
    if (!line.text.startsWith("- ")) {
      break;
    }

    const itemText = line.text.slice(2).trim();
    const nextLine = lines[index + 1];
    const hasNestedBlock = nextLine && nextLine.indent > indent;

    if (!itemText) {
      if (hasNestedBlock) {
        const nested = parseYamlBlock(lines, index + 1, nextLine.indent);
        result.push(nested.value);
        index = nested.nextIndex;
      } else {
        result.push(null);
        index += 1;
      }
      continue;
    }

    if (looksLikeInlineMap(itemText)) {
      const item = parseInlineMapItem(itemText);
      if (hasNestedBlock) {
        const nested = parseYamlMap(lines, index + 1, nextLine.indent);
        result.push({ ...item, ...nested.value });
        index = nested.nextIndex;
      } else {
        result.push(item);
        index += 1;
      }
      continue;
    }

    result.push(parseYamlScalar(itemText));
    index += 1;
  }

  return { value: result, nextIndex: index };
}

function looksLikeInlineMap(value) {
  return /^[^:[\]{}]+:\s*/.test(value);
}

function parseInlineMapItem(value) {
  const separatorIndex = value.indexOf(":");
  const key = value.slice(0, separatorIndex).trim();
  const rawValue = value.slice(separatorIndex + 1).trim();
  return {
    [key]: rawValue ? parseYamlScalar(rawValue) : null,
  };
}

function parseYamlScalar(value) {
  if (value === "null" || value === "~") {
    return null;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (value.startsWith("[") && value.endsWith("]")) {
    return parseInlineArray(value);
  }
  if (value === "{}") {
    return {};
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  return value;
}

function parseInlineArray(value) {
  const inner = value.slice(1, -1).trim();
  if (!inner) {
    return [];
  }
  return inner.split(",").map((item) => parseYamlScalar(item.trim()));
}

function stringifyValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function stringifyYaml(value, indent = 0) {
  if (Array.isArray(value)) {
    return stringifyYamlArray(value, indent);
  }
  if (value && typeof value === "object") {
    return stringifyYamlObject(value, indent);
  }
  return `${" ".repeat(indent)}${formatYamlScalar(value)}`;
}

function stringifyYamlObject(objectValue, indent = 0) {
  const spaces = " ".repeat(indent);
  return Object.entries(objectValue)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        if (!value.length) {
          return `${spaces}${key}: []`;
        }
        return `${spaces}${key}:\n${stringifyYamlArray(value, indent + 2)}`;
      }
      if (value && typeof value === "object") {
        return `${spaces}${key}:\n${stringifyYamlObject(value, indent + 2)}`;
      }
      return `${spaces}${key}: ${formatYamlScalar(value)}`;
    })
    .join("\n");
}

function stringifyYamlArray(arrayValue, indent = 0) {
  const spaces = " ".repeat(indent);
  return arrayValue
    .map((item) => {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const entries = Object.entries(item);
        if (!entries.length) {
          return `${spaces}- {}`;
        }

        const [firstKey, firstValue] = entries[0];
        const firstLine = formatYamlListObjectFirstLine(firstKey, firstValue, indent);
        const restLines = entries
          .slice(1)
          .map(([key, value]) => stringifyYamlObject({ [key]: value }, indent + 2))
          .join("\n");
        return restLines ? `${firstLine}\n${restLines}` : firstLine;
      }
      if (Array.isArray(item)) {
        return `${spaces}-\n${stringifyYamlArray(item, indent + 2)}`;
      }
      return `${spaces}- ${formatYamlScalar(item)}`;
    })
    .join("\n");
}

function formatYamlListObjectFirstLine(key, value, indent) {
  const spaces = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (!value.length) {
      return `${spaces}- ${key}: []`;
    }
    return `${spaces}- ${key}:\n${stringifyYamlArray(value, indent + 2)}`;
  }
  if (value && typeof value === "object") {
    return `${spaces}- ${key}:\n${stringifyYamlObject(value, indent + 2)}`;
  }
  return `${spaces}- ${key}: ${formatYamlScalar(value)}`;
}

function formatYamlScalar(value) {
  if (value === null || value === undefined) {
    return '""';
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  const text = String(value);
  if (!text) {
    return '""';
  }
  if (/^[A-Za-z0-9_\-./]+$/.test(text)) {
    return text;
  }
  return JSON.stringify(text);
}

function buildDocxBlob(text) {
  const files = [
    {
      path: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
    },
    {
      path: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    },
    {
      path: "word/document.xml",
      content: buildDocumentXml(text),
    },
  ];

  return new Blob([createZipArchive(files)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

function buildDocumentXml(text) {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => buildWordParagraph(line || ""))
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function buildWordParagraph(line) {
  const leadingSpaces = line.match(/^\s*/)[0].length;
  const indent = Math.min(leadingSpaces * 180, 2160);
  const text = escapeXml(line.trimStart());
  return `<w:p>
    <w:pPr>
      <w:ind w:left="${indent}"/>
      <w:spacing w:after="120" w:line="360" w:lineRule="auto"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Microsoft YaHei" w:eastAsia="Microsoft YaHei" w:hAnsi="Microsoft YaHei"/>
        <w:sz w:val="22"/>
      </w:rPr>
      <w:t xml:space="preserve">${text}</w:t>
    </w:r>
  </w:p>`;
}

function createZipArchive(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.path);
    const dataBytes = encoder.encode(file.content);
    const crc = crc32(dataBytes);
    const localHeader = createZipLocalHeader(nameBytes, dataBytes, crc);
    const centralHeader = createZipCentralHeader(nameBytes, dataBytes, crc, offset);

    localParts.push(localHeader, dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  });

  const centralSize = centralParts.reduce((size, part) => size + part.length, 0);
  const endRecord = createZipEndRecord(files.length, centralSize, offset);
  const totalSize = offset + centralSize + endRecord.length;
  const zipBytes = new Uint8Array(totalSize);
  let cursor = 0;

  [...localParts, ...centralParts, endRecord].forEach((part) => {
    zipBytes.set(part, cursor);
    cursor += part.length;
  });

  return zipBytes;
}

function createZipLocalHeader(nameBytes, dataBytes, crc) {
  const header = new Uint8Array(30 + nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0800, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, dataBytes.length, true);
  view.setUint32(22, dataBytes.length, true);
  view.setUint16(26, nameBytes.length, true);
  view.setUint16(28, 0, true);
  header.set(nameBytes, 30);
  return header;
}

function createZipCentralHeader(nameBytes, dataBytes, crc, offset) {
  const header = new Uint8Array(46 + nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0x0800, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, dataBytes.length, true);
  view.setUint32(24, dataBytes.length, true);
  view.setUint16(28, nameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, offset, true);
  header.set(nameBytes, 46);
  return header;
}

function createZipEndRecord(fileCount, centralSize, centralOffset) {
  const record = new Uint8Array(22);
  const view = new DataView(record.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, fileCount, true);
  view.setUint16(10, fileCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  view.setUint16(20, 0, true);
  return record;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc ^= bytes[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function downloadBlob(blob, filename) {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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

async function initializeMemorySource() {
  const params = new URLSearchParams(window.location.search);
  const notebookId = params.get("notebook");
  state.linkedNotebookId = notebookId || "";

  if (!state.linkedNotebookId) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/notebooks/${encodeURIComponent(state.linkedNotebookId)}/conversations`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "记忆来源加载失败");
    }

    state.linkedNotebookSummary = data.notebook || null;
    state.conversations = data.conversations || [];
    state.pendingScriptState = data.script_state || null;
    
    if (state.linkedNotebookId) {
      elements.openChatBtn.hidden = false;
      updateChatBadge();
      renderChatStream();
    }
    
    applyPendingScriptState();
  } catch (error) {
    state.linkedNotebookSummary = null;
    console.warn("Failed to load notebook context.", error);
  }
}

function renderMemorySource(notebook) {
  return notebook;
}

function getScriptStateSnapshot() {
  return {
    raw_text: state.rawNovelText,
    chapters: state.chapters,
    adaptation_profile: {
      ...state.adaptationProfile,
    },
    generated_yaml: state.generatedYaml,
    generated_summary: state.generatedSummary,
    generated_characters: state.generatedCharacters,
    readable_script_text: state.readableScriptText,
    readable_script_valid: state.readableScriptValid,
    final_script_text: state.finalScriptText,
    final_script_confirmed: state.finalScriptConfirmed,
    active_step: getActiveStep(),
  };
}

function buildScriptStatePayload() {
  return {
    ...getScriptStateSnapshot(),
    updated_at: new Date().toISOString(),
  };
}

function scheduleScriptStatePersist() {
  if (!state.linkedNotebookId || state.isRestoringScriptState) {
    return;
  }

  if (state.scriptStatePersistTimer) {
    window.clearTimeout(state.scriptStatePersistTimer);
  }

  state.scriptStatePersistTimer = window.setTimeout(() => {
    persistScriptState();
  }, 300);
}

async function persistScriptState({ immediate = false } = {}) {
  if (!state.linkedNotebookId || state.isRestoringScriptState) {
    return;
  }

  if (state.scriptStatePersistTimer) {
    window.clearTimeout(state.scriptStatePersistTimer);
    state.scriptStatePersistTimer = null;
  }

  const snapshot = getScriptStateSnapshot();
  const signature = JSON.stringify(snapshot);
  if (!immediate && signature === state.lastSavedScriptStateSignature) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/notebooks/${encodeURIComponent(state.linkedNotebookId)}/script-state`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildScriptStatePayload()),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "记忆状态保存失败");
    }

    state.lastSavedScriptStateSignature = signature;
    state.linkedNotebookSummary = data.notebook || state.linkedNotebookSummary;
  } catch (error) {
    console.warn("Failed to persist latest script state.", error);
  }
}

function applyPendingScriptState() {
  if (!state.pendingScriptState || !state.styleOptionsReady) {
    return;
  }

  restoreScriptState(state.pendingScriptState);
  state.pendingScriptState = null;
}

function restoreScriptState(scriptState) {
  state.isRestoringScriptState = true;

  try {
    state.rawNovelText = scriptState.raw_text || "";
    elements.novelInput.value = state.rawNovelText;

    state.adaptationProfile = {
      ...state.adaptationProfile,
      ...(scriptState.adaptation_profile || {}),
    };
    initializeAdaptationProfile();

    state.chapters = Array.isArray(scriptState.chapters) ? scriptState.chapters : [];
    state.generatedYaml = scriptState.generated_yaml || "";
    state.generatedSummary = scriptState.generated_summary || null;
    state.generatedCharacters = Array.isArray(scriptState.generated_characters)
      ? scriptState.generated_characters
      : [];
    state.readableScriptText = typeof scriptState.readable_script_text === "string"
      ? scriptState.readable_script_text
      : "";
    state.readableScriptValid = Boolean(scriptState.readable_script_valid && state.readableScriptText.trim());
    state.finalScriptText = typeof scriptState.final_script_text === "string"
      ? scriptState.final_script_text
      : "";
    state.finalScriptConfirmed = Boolean(scriptState.final_script_confirmed && state.finalScriptText.trim());

    updateTextStats();

    if (state.chapters.length) {
      renderChapterSummary({
        chapter_count: state.chapters.length,
        is_valid: state.chapters.length >= 3,
        min_required: 3,
        message: "已恢复最近一次章节识别结果。",
        statusType: state.chapters.length >= 3 ? "success" : "warning",
      });
      renderChapterCards(state.chapters);
    } else {
      renderChapterSummary({
        chapter_count: 0,
        is_valid: false,
        min_required: 3,
        message: "当前还没有保存章节结果。",
        statusType: "info",
      });
      renderChapterCards([]);
    }

    if (state.generatedYaml) {
      renderYamlResult({
        yaml: state.generatedYaml,
        summary: state.generatedSummary,
        characters: state.generatedCharacters,
        message: "已恢复最近一次 YAML 生成结果。",
      });
      restoreReadableAndFinalScriptState(scriptState);
    } else {
      renderYamlIdleState(
        state.chapters.length >= 3
          ? "已恢复最近一次操作状态，可继续生成 YAML。"
          : "识别至少 3 章后可生成 YAML。",
      );
    }

    state.lastSavedScriptStateSignature = JSON.stringify(getScriptStateSnapshot());
    showStatus("已恢复最近一次操作状态。", "success");
    updateActionButtons();
  } finally {
    state.isRestoringScriptState = false;
  }
}

function toggleChatDrawer(isOpen) {
  state.isChatOpen = isOpen;
  elements.chatDrawer.classList.toggle("open", isOpen);
  if (isOpen) {
    elements.chatBadge.hidden = true;
    elements.chatInput.focus();
    renderChatStream();
  }
}

function initializeChatTriggerPosition() {
  if (!elements.openChatBtn) {
    return;
  }
  applyChatTriggerPosition(loadStoredChatTriggerPosition() || getDefaultChatTriggerPosition());
}

function getDefaultChatTriggerPosition() {
  const top = 96;
  const right = 28;
  const buttonSize = 60;
  return {
    x: Math.max(16, window.innerWidth - right - buttonSize),
    y: top,
  };
}

function loadStoredChatTriggerPosition() {
  try {
    const raw = window.localStorage.getItem(CHAT_TRIGGER_POSITION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!Number.isFinite(parsed?.x) || !Number.isFinite(parsed?.y)) {
      return null;
    }
    return clampChatTriggerPosition(parsed.x, parsed.y);
  } catch (error) {
    return null;
  }
}

function saveChatTriggerPosition(x, y) {
  try {
    window.localStorage.setItem(CHAT_TRIGGER_POSITION_KEY, JSON.stringify({ x, y }));
  } catch (error) {
    // Ignore storage failures and keep the current session position.
  }
}

function clampChatTriggerPosition(x, y) {
  const buttonWidth = elements.openChatBtn?.offsetWidth || 60;
  const buttonHeight = elements.openChatBtn?.offsetHeight || 60;
  const minX = 12;
  const minY = 84;
  const maxX = Math.max(minX, window.innerWidth - buttonWidth - 12);
  const maxY = Math.max(minY, window.innerHeight - buttonHeight - 12);
  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY),
  };
}

function applyChatTriggerPosition(position) {
  const next = clampChatTriggerPosition(position.x, position.y);
  elements.openChatBtn.style.left = `${next.x}px`;
  elements.openChatBtn.style.top = `${next.y}px`;
  elements.openChatBtn.style.right = "auto";
}

function handleChatTriggerPointerDown(event) {
  if (event.button !== 0) {
    return;
  }
  state.isDraggingChatTrigger = true;
  state.chatTriggerMoved = false;
  state.chatTriggerPointerId = event.pointerId;
  const rect = elements.openChatBtn.getBoundingClientRect();
  state.chatTriggerOffsetX = event.clientX - rect.left;
  state.chatTriggerOffsetY = event.clientY - rect.top;
  elements.openChatBtn.classList.add("dragging");
  elements.openChatBtn.setPointerCapture(event.pointerId);
  window.addEventListener("pointermove", handleChatTriggerPointerMove);
  window.addEventListener("pointerup", handleChatTriggerPointerUp);
  window.addEventListener("pointercancel", handleChatTriggerPointerUp);
}

function handleChatTriggerPointerMove(event) {
  if (!state.isDraggingChatTrigger || event.pointerId !== state.chatTriggerPointerId) {
    return;
  }
  const nextX = event.clientX - state.chatTriggerOffsetX;
  const nextY = event.clientY - state.chatTriggerOffsetY;
  const clamped = clampChatTriggerPosition(nextX, nextY);
  applyChatTriggerPosition(clamped);
  state.chatTriggerMoved = true;
}

function handleChatTriggerPointerUp(event) {
  if (event.pointerId !== state.chatTriggerPointerId) {
    return;
  }
  const rect = elements.openChatBtn.getBoundingClientRect();
  saveChatTriggerPosition(rect.left, rect.top);
  state.isDraggingChatTrigger = false;
  state.chatTriggerPointerId = null;
  elements.openChatBtn.classList.remove("dragging");
  window.removeEventListener("pointermove", handleChatTriggerPointerMove);
  window.removeEventListener("pointerup", handleChatTriggerPointerUp);
  window.removeEventListener("pointercancel", handleChatTriggerPointerUp);
}

function handleChatTriggerClick(event) {
  if (state.chatTriggerMoved) {
    event.preventDefault();
    state.chatTriggerMoved = false;
    return;
  }
  toggleChatDrawer(true);
}

function handleWindowResize() {
  if (!elements.openChatBtn) {
    return;
  }
  const rect = elements.openChatBtn.getBoundingClientRect();
  applyChatTriggerPosition({ x: rect.left, y: rect.top });
}

async function handleChatSubmit(event) {
  event.preventDefault();
  const message = elements.chatInput.value.trim();
  if (!message || state.isSendingMessage || !state.linkedNotebookId) {
    return;
  }

  state.isSendingMessage = true;
  elements.chatInput.value = "";
  
  // Optimistically add user message
  const userMsg = {
    role: "user",
    content: message,
    created_at: new Date().toISOString(),
  };
  state.conversations.push(userMsg);
  renderChatStream();

  try {
    // Before sending, we should persist the latest script state so the AI sees it
    await persistScriptState({ immediate: true });

    const response = await fetch(`${API_BASE_URL}/notebooks/${encodeURIComponent(state.linkedNotebookId)}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "消息发送失败");
    }

    state.conversations = data.conversations || [];
    state.linkedNotebookSummary = data.notebook || state.linkedNotebookSummary;
    renderChatStream();
    updateChatBadge();
  } catch (error) {
    console.error("Chat error:", error);
    showStatus("AI 助理响应失败，请重试。", "warning");
  } finally {
    state.isSendingMessage = false;
  }
}

function renderChatStream() {
  if (!state.conversations.length) {
    elements.chatStream.innerHTML = '<div class="empty-state">你可以问我关于角色设定、剧本逻辑或后续创作的建议。</div>';
    return;
  }

  elements.chatStream.innerHTML = state.conversations
    .map(msg => {
      const roleLabel = msg.role === "user" ? "用户" : msg.role === "assistant" ? "AI 助理" : "系统";
      return `
        <div class="message-row ${escapeHtml(msg.role)}">
          <div class="message-bubble">
            <span class="message-role">${escapeHtml(roleLabel)}</span>
            <div class="message-content">${escapeHtml(msg.content)}</div>
          </div>
          <div class="message-time">${formatChatTime(msg.created_at)}</div>
        </div>
      `;
    })
    .join("");
  
  elements.chatStream.scrollTop = elements.chatStream.scrollHeight;
}

function updateChatBadge() {
  const count = state.conversations.length;
  if (count > 0 && !state.isChatOpen) {
    elements.chatBadge.textContent = count;
    elements.chatBadge.hidden = false;
  } else {
    elements.chatBadge.hidden = true;
  }
}

function formatChatTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  updateProgressStep();
}

function openReadableScriptModal() {
  elements.readableScriptModal.hidden = false;
  state.readableScriptModalOpen = true;
  updateProgressStep();
}

function closeReadableScriptModal() {
  state.readableScriptModalOpen = false;
  elements.readableScriptModal.hidden = true;
  updateProgressStep();
}

function closeScriptPreviewModal() {
  closePreviewModal();
}

function closeStructureModal() {
  state.structureModalOpen = false;
  elements.structureModal.hidden = true;
}

function openPreviewModal() {
  openScriptPreviewModal();
}

function handleModalBackdropClick(event) {
  if (event.target === elements.previewModal) {
    closePreviewModal();
  }
}

function handleReadableScriptModalBackdropClick(event) {
  if (event.target === elements.readableScriptModal) {
    closeReadableScriptModal();
  }
}

function openStructureModal() {
  if (!state.chapters.length) {
    showStatus("识别章节成功后才能查看结构预览。", "warning");
    return;
  }

  state.structureModalOpen = true;
  elements.structureModal.hidden = false;
}

function handleStructureModalBackdropClick(event) {
  if (event.target === elements.structureModal) {
    closeStructureModal();
  }
}

async function loadAndRenderStyleOptions() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/script/styles`);
    if (response.ok) {
      const data = await response.json();
      const toneOptions = data.tone_options || TONE_STYLES;
      const mediumOptions = data.medium_options || MEDIA_TYPES;
      const defaults = data.defaults || state.adaptationProfile;

      state.adaptationProfile = defaults;

      elements.toneSelect.innerHTML = toneOptions
        .map((tone) => `<option value="${escapeHtml(tone)}">${escapeHtml(tone)}</option>`)
        .join("");

      elements.mediumSelect.innerHTML = mediumOptions
        .map((medium) => `<option value="${escapeHtml(medium)}">${escapeHtml(medium)}</option>`)
        .join("");

      initializeAdaptationProfile();
      state.styleOptionsReady = true;
      applyPendingScriptState();
    } else {
      throw new Error("API returned non-200 status");
    }
  } catch (error) {
    console.warn("Failed to load style options from API, using local defaults.", error);
    elements.toneSelect.innerHTML = TONE_STYLES
      .map((tone) => `<option value="${escapeHtml(tone)}">${escapeHtml(tone)}</option>`)
      .join("");

    elements.mediumSelect.innerHTML = MEDIA_TYPES
      .map((medium) => `<option value="${escapeHtml(medium)}">${escapeHtml(medium)}</option>`)
      .join("");

    initializeAdaptationProfile();
    state.styleOptionsReady = true;
    applyPendingScriptState();
  }
}

function initializeAdaptationProfile() {
  elements.toneSelect.value = state.adaptationProfile.tone_style;
  elements.mediumSelect.value = state.adaptationProfile.medium;
  elements.toneIntensity.value = state.adaptationProfile.tone_intensity;
  elements.adaptationDegree.value = state.adaptationProfile.adaptation_degree;
  elements.dialoguePreservationDegree.value = state.adaptationProfile.dialogue_preservation_degree;

  updateAdaptationSummary();
}

function updateAdaptationSummary() {
  const toneStyle = elements.toneSelect.value;
  const mediumType = elements.mediumSelect.value;
  const toneIntensity = parseInt(elements.toneIntensity.value, 10);
  const adaptationDegree = parseInt(elements.adaptationDegree.value, 10);
  const dialoguePreservationDegree = parseInt(elements.dialoguePreservationDegree.value, 10);

  state.adaptationProfile.tone_style = toneStyle;
  state.adaptationProfile.medium = mediumType;
  state.adaptationProfile.tone_intensity = toneIntensity;
  state.adaptationProfile.adaptation_degree = adaptationDegree;
  state.adaptationProfile.dialogue_preservation_degree = dialoguePreservationDegree;

  elements.toneIntensityValue.textContent = `${toneIntensity}%`;
  elements.adaptationDegreeValue.textContent = `${adaptationDegree}%`;
  elements.dialoguePreservationDegreeValue.textContent = `${dialoguePreservationDegree}%`;

  const summaryText = `以${toneStyle}风格生成，风格体现程度为 ${toneIntensity}%；适配${mediumType}，调整自由度为 ${adaptationDegree}%；原文对白保留度为 ${dialoguePreservationDegree}%。`;
  elements.adaptationSummaryText.textContent = summaryText;
}

function handleAdaptationInputChange() {
  updateAdaptationSummary();
  if (state.generatedYaml) {
    resetYamlResults();
  }
  updateActionButtons();
  scheduleScriptStatePersist();
}

function checkBackendStylesApi() {
  fetch(`${API_BASE_URL}/api/script/styles`)
    .then((response) => {
      if (response.ok) {
        elements.backendStatus.hidden = false;
        elements.backendStatus.className = "backend-status info";
        elements.backendStatus.textContent = "后端风格配置接口已连接。";
      } else {
        elements.backendStatus.hidden = false;
        elements.backendStatus.className = "backend-status error";
        elements.backendStatus.textContent = "后端风格配置接口无响应。";
      }
    })
    .catch(() => {
      elements.backendStatus.hidden = false;
      elements.backendStatus.className = "backend-status error";
      elements.backendStatus.textContent = "后端风格配置接口不可用。";
    });
}

function switchStructureTab(tabName) {
  elements.structureTabs.forEach((tab) => {
    const isActive = tab.dataset.structureTab === tabName;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  Object.entries(elements.structureViews).forEach(([viewName, view]) => {
    const isActive = viewName === tabName;
    view.hidden = !isActive;
    view.classList.toggle("active", isActive);
  });
}

function updateProgressStep() {
  const activeStep = getActiveStep();

  elements.progressSteps.forEach((step) => {
    const stepIndex = parseInt(step.dataset.step, 10);
    step.classList.toggle("active", stepIndex === activeStep);
    step.classList.toggle("is-complete", stepIndex < activeStep);
  });
}

function getActiveStep() {
  if (state.previewModalOpen) {
    return 5;
  }

  if (state.readableScriptModalOpen || state.readableScriptValid) {
    return 4;
  }

  if (state.generatedYaml) {
    return 3;
  }

  if (state.rawNovelText.trim().length > 0 || state.chapters.length > 0) {
    return 2;
  }

  return 1;
}

document.addEventListener("DOMContentLoaded", initApp);
