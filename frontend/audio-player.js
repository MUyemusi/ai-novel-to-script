const NOISE_STORAGE_KEY = "xugou_noise_settings";
const NOISE_OPTIONS = {
  off: {
    label: "关闭环境音",
    src: "",
  },
  fireplace: {
    label: "篝火",
    src: "assets/audio/fireplace.mp3",
  },
  rain: {
    label: "雨声",
    src: "assets/audio/rain.mp3",
  },
};

const noiseState = {
  selected: "off",
  enabled: false,
  currentTime: 0,
  volume: 0.45,
  resumePending: false,
  saveTimer: null,
};

let noiseAudio = null;
let noiseSelect = null;

function initNoisePlayer() {
  noiseAudio = new Audio();
  noiseAudio.loop = true;
  noiseAudio.preload = "auto";

  loadNoiseState();
  noiseSelect = document.getElementById("noiseSelect");

  if (noiseSelect) {
    syncNoiseSelect();
    noiseSelect.addEventListener("change", handleNoiseSelectionChange);
  }

  noiseAudio.addEventListener("loadedmetadata", restoreNoiseTimeAfterLoad);
  noiseAudio.addEventListener("timeupdate", throttleNoiseStateSave);
  noiseAudio.addEventListener("play", persistNoiseState);
  noiseAudio.addEventListener("pause", persistNoiseState);

  window.addEventListener("pagehide", persistNoiseState);
  window.addEventListener("beforeunload", persistNoiseState);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  if (noiseState.enabled && NOISE_OPTIONS[noiseState.selected]?.src) {
    playSelectedNoise({ shouldResume: true });
  }
}

function handleNoiseSelectionChange(event) {
  const nextValue = event.target.value;
  if (!NOISE_OPTIONS[nextValue]) {
    return;
  }

  if (nextValue === "off") {
    stopNoisePlayback();
    return;
  }

  noiseState.selected = nextValue;
  noiseState.enabled = true;
  noiseState.currentTime = 0;
  playSelectedNoise({ shouldResume: false, forceFromStart: true });
}

function playSelectedNoise({ shouldResume = true, forceFromStart = false } = {}) {
  const option = NOISE_OPTIONS[noiseState.selected];
  if (!option?.src) {
    stopNoisePlayback();
    return;
  }

  noiseState.enabled = true;
  noiseAudio.volume = noiseState.volume;

  if (!noiseAudio.src || !noiseAudio.src.endsWith(option.src)) {
    noiseAudio.src = option.src;
    noiseState.resumePending = shouldResume;
  } else if (forceFromStart) {
    noiseState.currentTime = 0;
    safelySeekNoise(0);
  }

  const playPromise = noiseAudio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      noiseState.resumePending = true;
      waitForNextUserGesture();
    });
  }

  persistNoiseState();
}

function stopNoisePlayback() {
  noiseState.enabled = false;
  noiseState.selected = "off";
  noiseState.currentTime = 0;
  noiseState.resumePending = false;
  noiseAudio.pause();
  noiseAudio.removeAttribute("src");
  noiseAudio.load();
  syncNoiseSelect();
  persistNoiseState();
}

function restoreNoiseTimeAfterLoad() {
  if (!noiseState.resumePending) {
    if (noiseState.currentTime > 0) {
      safelySeekNoise(noiseState.currentTime);
    }
    return;
  }

  safelySeekNoise(noiseState.currentTime);
  noiseState.resumePending = false;
}

function safelySeekNoise(timeValue) {
  if (!Number.isFinite(timeValue) || timeValue <= 0) {
    return;
  }

  const duration = noiseAudio.duration;
  if (Number.isFinite(duration) && duration > 0) {
    noiseAudio.currentTime = Math.min(timeValue, Math.max(duration - 0.25, 0));
    return;
  }

  noiseAudio.currentTime = timeValue;
}

function waitForNextUserGesture() {
  const resume = () => {
    if (noiseState.enabled && NOISE_OPTIONS[noiseState.selected]?.src) {
      playSelectedNoise({ shouldResume: true });
    }
    document.removeEventListener("click", resume);
    document.removeEventListener("keydown", resume);
    document.removeEventListener("touchstart", resume);
  };

  document.addEventListener("click", resume, { once: true });
  document.addEventListener("keydown", resume, { once: true });
  document.addEventListener("touchstart", resume, { once: true });
}

function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    persistNoiseState();
  }
}

function throttleNoiseStateSave() {
  if (noiseState.saveTimer) {
    return;
  }

  noiseState.saveTimer = window.setTimeout(() => {
    noiseState.saveTimer = null;
    persistNoiseState();
  }, 1000);
}

function loadNoiseState() {
  try {
    const raw = window.localStorage.getItem(NOISE_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return;
    }

    if (typeof parsed.selected === "string" && NOISE_OPTIONS[parsed.selected]) {
      noiseState.selected = parsed.selected;
    }
    if (typeof parsed.enabled === "boolean") {
      noiseState.enabled = parsed.enabled;
    }
    if (Number.isFinite(parsed.currentTime)) {
      noiseState.currentTime = parsed.currentTime;
    }
    if (Number.isFinite(parsed.volume)) {
      noiseState.volume = parsed.volume;
    }
  } catch (error) {
    console.warn("Failed to load saved noise settings.", error);
  }
}

function persistNoiseState() {
  if (noiseAudio && !noiseAudio.paused && Number.isFinite(noiseAudio.currentTime)) {
    noiseState.currentTime = noiseAudio.currentTime;
  }

  window.localStorage.setItem(
    NOISE_STORAGE_KEY,
    JSON.stringify({
      selected: noiseState.selected,
      enabled: noiseState.enabled,
      currentTime: noiseState.currentTime,
      volume: noiseState.volume,
    }),
  );
}

function syncNoiseSelect() {
  if (!noiseSelect) {
    return;
  }

  if (!noiseState.enabled || !NOISE_OPTIONS[noiseState.selected]?.src) {
    noiseSelect.value = "off";
    return;
  }

  noiseSelect.value = noiseState.selected;
}

document.addEventListener("DOMContentLoaded", initNoisePlayer);
