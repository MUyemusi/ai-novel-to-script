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
  isGeneratingYaml: false,
  validationResult: null,
  previewReady: false,
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
  elements.previewScriptName = document.getElementById("previewScriptName");
  elements.previewDescription = document.getElementById("previewDescription");
  elements.progressSteps = Array.from(document.querySelectorAll(".progress-step"));
  elements.structureTabs = Array.from(document.querySelectorAll(".structure-tab"));
  elements.structureViews = {
    chapters: document.getElementById("chaptersView"),
    characters: document.getElementById("charactersView"),
    summary: document.getElementById("summaryView"),
  };
  
  // Adaptation profile elements
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

  document.getElementById("topLoadExampleBtn").addEventListener("click", loadExampleNovel);
  document.getElementById("panelLoadExampleBtn").addEventListener("click", loadExampleNovel);
  document.getElementById("clearTextBtn").addEventListener("click", clearNovelText);
  document.getElementById("generateYamlBtn").addEventListener("click", generateYaml);
  document.getElementById("openStructureBtn").addEventListener("click", openStructureModal);
  document.getElementById("cleanScriptBtn").addEventListener("click", () => showComingSoon("清洗渲染剧本"));
  document.getElementById("previewScriptBtn").addEventListener("click", openPreviewModal);
  document.getElementById("closePreviewBtn").addEventListener("click", closePreviewModal);
  document.getElementById("closeStructureBtn").addEventListener("click", closeStructureModal);
  document.getElementById("modalResetBtn").addEventListener("click", closePreviewModal);
  elements.previewModal.addEventListener("click", handleModalBackdropClick);
  elements.structureModal.addEventListener("click", handleStructureModalBackdropClick);

  elements.parseChaptersBtn.addEventListener("click", parseChapters);
  elements.novelInput.addEventListener("input", handleTextInput);
  elements.txtUpload.addEventListener("change", handleTxtUpload);
  elements.structureTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchStructureTab(tab.dataset.structureTab));
  });
  
  // Adaptation profile event listeners
  elements.toneSelect.addEventListener("change", handleAdaptationInputChange);
  elements.mediumSelect.addEventListener("change", handleAdaptationInputChange);
  elements.toneIntensity.addEventListener("input", handleAdaptationInputChange);
  elements.adaptationDegree.addEventListener("input", handleAdaptationInputChange);
  elements.dialoguePreservationDegree.addEventListener("input", handleAdaptationInputChange);

  updateTextStats();
  resetChapterResults();
  resetYamlResults();
  updateActionButtons();
  showStatus("等待输入小说文本", "info");
  loadAndRenderStyleOptions();
  checkBackendStylesApi();
  switchStructureTab("chapters");
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
    renderYamlResult(data);
    showStatus(data.message || "剧本 YAML 生成成功。", "success");
  } catch (error) {
    state.generatedYaml = "";
    state.generatedSummary = null;
    state.generatedCharacters = [];
    renderYamlError(error.message || "剧本 YAML 生成失败，请确认后端服务已启动。");
    showStatus("剧本 YAML 生成失败，请检查文本和后端服务。", "error");
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
  state.isGeneratingYaml = false;
  elements.yamlOutput.value = "";
  elements.scriptSummary.hidden = true;
  elements.charactersTable.hidden = true;
  elements.charactersList.innerHTML = "";
  elements.charactersEmptyState.hidden = false;
  elements.yamlStatusBadge.textContent = "未生成";
  elements.summaryEmptyState.hidden = false;
  elements.previewScriptName.textContent = "《剧本预览》";
  elements.previewDescription.textContent = "生成 YAML 后，可在这里查看最终剧本预览样式。";
  closePreviewModal();
  renderYamlMessage("识别至少 3 章后可生成 YAML。", "info");
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
  elements.yamlStatusBadge.textContent = "已生成";
  renderYamlMessage(data.message || "剧本 YAML 生成成功。", "success");
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
  elements.scriptSummary.hidden = true;
  elements.charactersTable.hidden = true;
  elements.charactersList.innerHTML = "";
  elements.yamlStatusBadge.textContent = "失败";
  renderYamlMessage(message, "error");
}

function updateActionButtons() {
  const hasText = state.rawNovelText.trim().length > 0;
  const hasStructure = state.chapters.length > 0;
  const hasEnoughChapters = state.chapters.length >= 3;
  const canGenerateYaml = hasEnoughChapters && !state.isGeneratingYaml;
  const hasYaml = Boolean(state.generatedYaml);

  elements.parseChaptersBtn.classList.toggle("ready", hasText);
  elements.openStructureBtn.classList.toggle("ready", hasStructure);
  elements.openStructureBtn.classList.toggle("disabled-action", !hasStructure);
  elements.openStructureBtn.disabled = !hasStructure;
  elements.openStructureBtn.setAttribute("aria-disabled", String(!hasStructure));
  elements.generateYamlBtn.classList.toggle("ready", canGenerateYaml);
  elements.generateYamlBtn.classList.toggle("disabled-action", !canGenerateYaml);
  elements.generateYamlBtn.disabled = !canGenerateYaml;
  elements.generateYamlBtn.setAttribute("aria-disabled", String(!canGenerateYaml));
  document.getElementById("cleanScriptBtn").classList.toggle("disabled-action", !hasYaml);
  document.getElementById("cleanScriptBtn").disabled = !hasYaml;
  document.getElementById("cleanScriptBtn").setAttribute("aria-disabled", String(!hasYaml));
  document.getElementById("previewScriptBtn").classList.toggle("disabled-action", !hasYaml);
  document.getElementById("previewScriptBtn").disabled = !hasYaml;
  document.getElementById("previewScriptBtn").setAttribute("aria-disabled", String(!hasYaml));
  updateProgressStep();
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
  updateProgressStep();
}

function closeStructureModal() {
  state.structureModalOpen = false;
  elements.structureModal.hidden = true;
}

function openPreviewModal() {
  if (!state.generatedYaml) {
    showStatus("生成 YAML 后才能预览最终剧本。", "warning");
    return;
  }

  const previewTitle = state.generatedSummary?.title || "剧本预览";
  const sceneCount = state.generatedSummary?.scene_count || 0;
  const characterCount = state.generatedSummary?.character_count || 0;
  elements.previewScriptName.textContent = `《${previewTitle}》`;
  elements.previewDescription.textContent = `当前已生成 ${sceneCount} 个场景、${characterCount} 位人物的结构稿。最终剧本排版将在后续 PR 中继续完善。`;
  state.previewModalOpen = true;
  elements.previewModal.hidden = false;
  updateProgressStep();
}

function handleModalBackdropClick(event) {
  if (event.target === elements.previewModal) {
    closePreviewModal();
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

      // Update state with defaults from API
      state.adaptationProfile = defaults;

      // Render tone options
      elements.toneSelect.innerHTML = toneOptions
        .map((tone) => `<option value="${escapeHtml(tone)}">${escapeHtml(tone)}</option>`)
        .join("");

      // Render medium options
      elements.mediumSelect.innerHTML = mediumOptions
        .map((medium) => `<option value="${escapeHtml(medium)}">${escapeHtml(medium)}</option>`)
        .join("");

      initializeAdaptationProfile();
    } else {
      throw new Error("API returned non-200 status");
    }
  } catch (error) {
    // Fallback to local defaults if API fails
    console.warn("Failed to load style options from API, using local defaults.", error);
    elements.toneSelect.innerHTML = TONE_STYLES
      .map((tone) => `<option value="${escapeHtml(tone)}">${escapeHtml(tone)}</option>`)
      .join("");

    elements.mediumSelect.innerHTML = MEDIA_TYPES
      .map((medium) => `<option value="${escapeHtml(medium)}">${escapeHtml(medium)}</option>`)
      .join("");

    initializeAdaptationProfile();
  }
}

function initializeAdaptationProfile() {
  // Initialize dropdowns with saved or default values
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

  // Update state
  state.adaptationProfile.tone_style = toneStyle;
  state.adaptationProfile.medium = mediumType;
  state.adaptationProfile.tone_intensity = toneIntensity;
  state.adaptationProfile.adaptation_degree = adaptationDegree;
  state.adaptationProfile.dialogue_preservation_degree = dialoguePreservationDegree;

  // Update slider value displays
  elements.toneIntensityValue.textContent = `${toneIntensity}%`;
  elements.adaptationDegreeValue.textContent = `${adaptationDegree}%`;
  elements.dialoguePreservationDegreeValue.textContent = `${dialoguePreservationDegree}%`;

  // Update summary text
  const summaryText = `以${toneStyle}风格生成，风格体现程度为 ${toneIntensity}%；适配${mediumType}，调整自由度为 ${adaptationDegree}%；原文对白保留度为 ${dialoguePreservationDegree}%。`;
  elements.adaptationSummaryText.textContent = summaryText;
}

function handleAdaptationInputChange() {
  updateAdaptationSummary();
  if (state.generatedYaml) {
    resetYamlResults();
  }
  updateActionButtons();
}

function checkBackendStylesApi() {
  // Check if backend styles API is available for diagnostic purposes
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

  if (state.generatedYaml) {
    return 3;
  }

  if (state.rawNovelText.trim().length > 0 || state.chapters.length > 0) {
    return 2;
  }

  return 1;
}

document.addEventListener("DOMContentLoaded", initApp);
