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
  generatedMode: "",
  generatedWarnings: [],
  isGeneratingYaml: false,
  isValidatingYaml: false,
  validationResult: null,
  finalScriptText: "",
  previewModalOpen: false,
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
  elements.readableScriptPanel = document.getElementById("readableScriptPanel");
  elements.readableScriptOutput = document.getElementById("readableScriptOutput");
  elements.readableScriptMeta = document.getElementById("readableScriptMeta");
  elements.previewScriptButton = document.getElementById("previewScriptButton");
  elements.scriptPreviewModal = document.getElementById("scriptPreviewModal");
  elements.finalScriptTextarea = document.getElementById("finalScriptTextarea");
  elements.finalScriptStatus = document.getElementById("finalScriptStatus");
  elements.closeScriptPreviewButton = document.getElementById("closeScriptPreviewButton");
  elements.cancelScriptPreviewButton = document.getElementById("cancelScriptPreviewButton");
  elements.exportWordButton = document.getElementById("exportWordButton");
  elements.confirmFinalScriptButton = document.getElementById("confirmFinalScriptButton");
  elements.scriptSummary = document.getElementById("scriptSummary");
  elements.summaryChapterCount = document.getElementById("summaryChapterCount");
  elements.summarySceneCount = document.getElementById("summarySceneCount");
  elements.summaryCharacterCount = document.getElementById("summaryCharacterCount");
  elements.summaryCoverageRate = document.getElementById("summaryCoverageRate");
  elements.charactersTable = document.getElementById("charactersTable");
  elements.charactersList = document.getElementById("charactersList");
  
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
  elements.validateYamlButton.addEventListener("click", validateCurrentYaml);
  elements.downloadYamlButton.addEventListener("click", downloadCurrentYaml);
  elements.renderScriptButton.addEventListener("click", renderReadableScript);
  elements.previewScriptButton.addEventListener("click", openScriptPreviewModal);
  elements.closeScriptPreviewButton.addEventListener("click", closeScriptPreviewModal);
  elements.cancelScriptPreviewButton.addEventListener("click", closeScriptPreviewModal);
  elements.exportWordButton.addEventListener("click", exportFinalScriptToWord);
  elements.confirmFinalScriptButton.addEventListener("click", confirmFinalScript);
  document.addEventListener("keydown", handleGlobalKeydown);

  elements.parseChaptersBtn.addEventListener("click", parseChapters);
  elements.novelInput.addEventListener("input", handleTextInput);
  elements.yamlOutput.addEventListener("input", handleYamlInput);
  elements.txtUpload.addEventListener("change", handleTxtUpload);
  
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
  console.log("AI 小说转剧本工具前端已初始化。");
}

function handleTextInput() {
  state.rawNovelText = elements.novelInput.value;
  resetChapterResults();
  resetYamlResults();
  const count = updateTextStats();
  if (count > 0) {
    showStatus(`已输入 ${count} 字`, "success");
  } else {
    showStatus("等待输入小说文本", "info");
  }
  updateActionButtons();
}

function handleYamlInput() {
  state.generatedYaml = getCurrentYaml();
  resetYamlValidation();
  resetReadableScript();
  resetFinalScriptText("YAML 已修改，最终稿已清空。请重新渲染并确认最终剧本。");
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

  resetYamlResults();
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
    showStatus(data.message || "剧本 YAML 生成成功。", "success");
  } catch (error) {
    state.generatedYaml = "";
    state.generatedSummary = null;
    state.generatedCharacters = [];
    state.generatedMode = "";
    state.generatedWarnings = [];
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
}

function resetYamlResults() {
  state.generatedYaml = "";
  state.generatedSummary = null;
  state.generatedCharacters = [];
  state.generatedMode = "";
  state.generatedWarnings = [];
  state.isGeneratingYaml = false;
  state.isValidatingYaml = false;
  state.validationResult = null;
  elements.yamlOutput.value = "";
  elements.scriptSummary.hidden = true;
  elements.charactersTable.hidden = true;
  elements.charactersList.innerHTML = "";
  elements.yamlStatusBadge.textContent = "未生成";
  elements.validateYamlButton.textContent = "校验 YAML";
  resetYamlValidation();
  resetReadableScript();
  resetFinalScriptText();
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
  state.validationResult = null;
  resetYamlValidation();
  resetReadableScript();
  resetFinalScriptText("已生成新的 YAML，最终稿已清空。请重新渲染并确认最终剧本。");
  const warnings = data.warnings || [];
  const modeLabel = formatGenerationMode(data.generation_mode, warnings);
  const messageParts = [
    modeLabel,
    data.message || "剧本 YAML 生成成功。",
    "最终稿已清空，请重新渲染并确认最终剧本。",
  ].concat(warnings);

  elements.yamlStatusBadge.textContent = modeLabel || "已生成";
  renderYamlMessage(
    messageParts.filter(Boolean).join(" | "),
    warnings.length ? "warning" : "success",
  );
  renderScriptSummary(data.summary || {});
  renderCharacters(data.characters || []);
}

function formatGenerationMode(mode, warnings = []) {
  if (mode === "llm") {
    if (warnings.length) {
      return "AI 生成成功，部分结构已自动修复";
    }
    return "AI 生成";
  }
  if (mode === "rule_fallback") {
    return "AI 生成不可用，已使用规则生成兜底";
  }
  if (mode === "rule") {
    return "规则生成";
  }
  return "";
}

function renderScriptSummary(summary) {
  elements.summaryChapterCount.textContent = String(summary.chapter_count || 0);
  elements.summarySceneCount.textContent = String(summary.scene_count || 0);
  elements.summaryCharacterCount.textContent = String(summary.character_count || 0);
  elements.summaryCoverageRate.textContent = summary.chapter_coverage_rate || "-";
  elements.scriptSummary.hidden = false;
}

function renderCharacters(characters) {
  if (!characters.length) {
    elements.charactersTable.hidden = true;
    elements.charactersList.innerHTML = "";
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
    const data = parseSimpleYaml(yamlText);
    const screenplay = data && typeof data === "object" ? data.screenplay : null;
    if (!screenplay || typeof screenplay !== "object") {
      throw new Error("YAML 中缺少 screenplay 对象。");
    }

    const renderedText = buildReadableScriptText(screenplay);
    elements.readableScriptOutput.value = renderedText;
    elements.readableScriptPanel.hidden = false;
    elements.readableScriptMeta.textContent = `${renderedText.split("\n").length} 行`;
    renderYamlMessage("可读剧本已渲染，可直接复制。", "success");
    updateActionButtons();
  } catch (error) {
    elements.readableScriptPanel.hidden = false;
    elements.readableScriptOutput.value = `渲染失败：${error.message || "YAML 解析失败，请先校验 YAML。"}`;
    elements.readableScriptMeta.textContent = "渲染失败";
    renderYamlMessage("YAML 渲染失败，请检查格式或先点击校验。", "error");
  }
}

function buildReadableScriptText(screenplay) {
  const title = stringifyValue(screenplay.title) || "未命名剧本";
  const acts = Array.isArray(screenplay.acts) ? screenplay.acts : [];
  const lines = [`《${title}》`, ""];

  if (!acts.length) {
    lines.push("暂无场景");
    return lines.join("\n");
  }

  acts.forEach((act, actIndex) => {
    const actTitle = stringifyValue(act.title || act.act_id) || `第${actIndex + 1}幕`;
    const scenes = Array.isArray(act.scenes) ? act.scenes : [];
    const actChapterLabel = collectActChapterIds(scenes);

    lines.push(`第${actIndex + 1}幕：${actTitle} (Chapter ID: ${actChapterLabel})`);
    if (act.summary) {
      lines.push(`  概述：${stringifyValue(act.summary)}`);
    }

    if (!scenes.length) {
      lines.push("  暂无场景");
      lines.push("");
      return;
    }

    scenes.forEach((scene, sceneIndex) => {
      const sceneTitle = stringifyValue(scene.title || scene.scene_id) || `场景${sceneIndex + 1}`;
      const chapterId = stringifyValue(scene.source_chapter_id) || "暂无章节 ID";
      const characters = normalizeCharacterNames(scene.characters);
      const dialogues = Array.isArray(scene.dialogues) ? scene.dialogues : [];

      lines.push(`  场景${sceneIndex + 1}：${sceneTitle} (Chapter ID: ${chapterId})`);
      if (scene.location || scene.time) {
        lines.push(`    时空：${stringifyValue(scene.location) || "未注明地点"} / ${stringifyValue(scene.time) || "未注明时间"}`);
      }
      if (scene.summary) {
        lines.push(`    场景概述：${stringifyValue(scene.summary)}`);
      }

      if (characters.length) {
        lines.push(`    角色：${characters.join("、")}`);
      } else {
        lines.push("    角色：暂无角色");
      }

      if (!dialogues.length) {
        lines.push("    对白：暂无对白");
      } else {
        lines.push("    对白：");
        dialogues.forEach((dialogue) => {
          const characterName = stringifyValue(dialogue && dialogue.character) || "未命名角色";
          const lineText = stringifyValue(dialogue && (dialogue.line || dialogue.text || dialogue.dialogue)) || "暂无对白";
          lines.push(`      ${characterName}：${lineText}`);
        });
      }
      lines.push("");
    });
  });

  return lines.join("\n").trimEnd();
}

function collectActChapterIds(scenes) {
  const chapterIds = scenes
    .map((scene) => stringifyValue(scene && scene.source_chapter_id))
    .filter(Boolean);
  return chapterIds.length ? Array.from(new Set(chapterIds)).join(", ") : "暂无章节 ID";
}

function normalizeCharacterNames(characters) {
  if (!Array.isArray(characters)) {
    return [];
  }

  return characters
    .map((character) => {
      if (typeof character === "string" || typeof character === "number") {
        return stringifyValue(character);
      }
      if (character && typeof character === "object") {
        return stringifyValue(character.name || character.character || character.character_id || character.id);
      }
      return "";
    })
    .filter(Boolean);
}

function openScriptPreviewModal() {
  const sourceText = state.finalScriptText || getReadableScriptText();
  if (!sourceText.trim()) {
    renderYamlMessage("请先点击“渲染剧本”，再打开稿纸预览。", "warning");
    return;
  }

  elements.finalScriptTextarea.value = sourceText;
  elements.finalScriptStatus.textContent = state.finalScriptText
    ? "已载入上次确认的最终剧本，可继续编辑。"
    : "已载入当前可读剧本文本，可编辑后确认最终剧本。";
  elements.finalScriptStatus.className = "final-script-status";
  elements.scriptPreviewModal.hidden = false;
  state.previewModalOpen = true;
  elements.finalScriptTextarea.focus();
}

function closeScriptPreviewModal() {
  elements.scriptPreviewModal.hidden = true;
  state.previewModalOpen = false;
}

function confirmFinalScript() {
  state.finalScriptText = elements.finalScriptTextarea.value;
  elements.finalScriptStatus.textContent = "最终剧本已确认，可用于后续 Word 导出。";
  elements.finalScriptStatus.className = "final-script-status success";
  renderYamlMessage("最终剧本已确认，可用于后续 Word 导出。", "success");
  updateActionButtons();
}

function exportFinalScriptToWord() {
  const finalText = state.finalScriptText.trim();
  if (!finalText) {
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
    closeScriptPreviewModal();
  }
}

function getReadableScriptText() {
  return elements.readableScriptOutput ? elements.readableScriptOutput.value : "";
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
    : "-";
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
  if (!elements.readableScriptPanel) {
    return;
  }

  elements.readableScriptPanel.hidden = true;
  elements.readableScriptOutput.value = "";
  elements.readableScriptMeta.textContent = "尚未渲染";
}

function resetFinalScriptText(message = "") {
  state.finalScriptText = "";
  if (elements.finalScriptTextarea) {
    elements.finalScriptTextarea.value = "";
  }
  if (elements.finalScriptStatus) {
    elements.finalScriptStatus.textContent = message || "编辑后点击“确认最终剧本”，保存为后续 Word 导出的文本来源。";
    elements.finalScriptStatus.className = "final-script-status";
  }
}

function updateActionButtons() {
  const hasText = state.rawNovelText.trim().length > 0;
  const hasEnoughChapters = state.chapters.length >= 3;
  const canGenerateYaml = hasEnoughChapters && !state.isGeneratingYaml;
  const hasYaml = Boolean(getCurrentYaml().trim());
  const canValidateYaml = hasYaml && !state.isValidatingYaml;
  const hasFinalScript = Boolean(state.finalScriptText.trim());
  const canOpenPreview = hasYaml || Boolean(state.finalScriptText.trim() || getReadableScriptText().trim());

  elements.parseChaptersBtn.classList.toggle("ready", hasText);
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
  elements.renderScriptButton.classList.toggle("ready", hasYaml);
  elements.renderScriptButton.classList.toggle("disabled-action", !hasYaml);
  elements.renderScriptButton.disabled = !hasYaml;
  elements.renderScriptButton.setAttribute("aria-disabled", String(!hasYaml));
  elements.previewScriptButton.classList.toggle("ready", canOpenPreview);
  elements.previewScriptButton.classList.toggle("disabled-action", !canOpenPreview);
  elements.previewScriptButton.disabled = !canOpenPreview;
  elements.previewScriptButton.setAttribute("aria-disabled", String(!canOpenPreview));
  elements.exportWordButton.classList.toggle("ready", hasFinalScript);
  elements.exportWordButton.classList.toggle("disabled-action", !hasFinalScript);
  elements.exportWordButton.disabled = !hasFinalScript;
  elements.exportWordButton.setAttribute("aria-disabled", String(!hasFinalScript));
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
    .filter((line) => line.text && !line.text.startsWith("#"));

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
      if (!nextLine || nextLine.indent <= indent) {
        result[key] = null;
        index += 1;
      } else {
        const nested = parseYamlBlock(lines, index + 1, nextLine.indent);
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

document.addEventListener("DOMContentLoaded", initApp);
