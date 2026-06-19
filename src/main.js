import { AudioManager } from "./audio.js";
import { PrimeCrashGame } from "./game.js";

const defaultData = {
  1: { score: [0, 0, 0, 0, 0], level: 1 },
  2: { score: [0, 0, 0, 0, 0], level: 1 },
  3: { score: [0, 0, 0, 0, 0], level: 1 },
};

const SAVE_KEY = "primeCrashSave";

const modeDirections = {
  0: [
    "Please select the mode you play.",
    "",
    "",
  ],
  1: [
    "As level increases, flowed numbers become complex.",
    "This is for players who are good at calculation.",
    "",
  ],
  2: [
    "As level increases, numbers flow faster.",
    "This is for players who can calculate quickly.",
    "",
  ],
  3: [
    "As level increases, both the complexity and speed of flowed numbers change.",
    "This mode is the hardest of the three.",
    "I am waiting for skillful and challenging players.",
  ],
};

const screens = {
  start: document.querySelector("#startScreen"),
  mode: document.querySelector("#modeScreen"),
  level: document.querySelector("#levelScreen"),
  game: document.querySelector("#gameScreen"),
  result: document.querySelector("#resultScreen"),
};

const audio = new AudioManager();
const data = loadSaveData();
let selectedMode = 0;
let hoveredMode = 0;
let initialLevel = 1;
let game = null;
let lastResult = null;
let audioStarted = false;

const elements = {
  modeCards: [...document.querySelectorAll(".mode-card")],
  modeDirection1: document.querySelector("#modeDirection1"),
  modeDirection2: document.querySelector("#modeDirection2"),
  modeDirection3: document.querySelector("#modeDirection3"),
  titleStartButton: document.querySelector("#titleStartButton"),
  musicToggle: document.querySelector("#musicToggle"),
  resetButton: document.querySelector("#resetButton"),
  resetDialog: document.querySelector("#resetDialog"),
  resetYesButton: document.querySelector("#resetYesButton"),
  resetNoButton: document.querySelector("#resetNoButton"),
  modeSelectButton: document.querySelector("#modeSelectButton"),
  initialLevel: document.querySelector("#initialLevel"),
  startButton: document.querySelector("#startButton"),
  resultScore: document.querySelector("#resultScore"),
  resultLevel: document.querySelector("#resultLevel"),
  historyList: document.querySelector("#historyList"),
  okButton: document.querySelector("#okButton"),
  canvas: document.querySelector("#gameCanvas"),
};

init().catch((error) => {
  document.body.innerHTML = `<pre class="load-error">Failed to load prime crash.\n${error.message}</pre>`;
});

async function init() {
  const response = await fetch("circleNumbers.json");
  if (!response.ok) {
    throw new Error("circleNumbers.json could not be loaded.");
  }
  const numbers = await response.json();

  game = new PrimeCrashGame(elements.canvas, numbers, audio, {
    onEnd: handleGameEnd,
  });

  bindEvents();
  updateModeScreen();
  showScreen("start");
}

function bindEvents() {
  window.addEventListener("pointerdown", unlockAudioOnce, { once: true });
  window.addEventListener("keydown", unlockAudioOnce, { once: true });
  window.addEventListener("resize", updateModeScreen);

  elements.musicToggle.addEventListener("change", () => {
    audio.setMusicEnabled(elements.musicToggle.checked);
  });

  elements.resetButton.addEventListener("click", () => {
    audio.playSfx("select");
    showResetDialog();
  });

  elements.resetYesButton.addEventListener("click", () => {
    audio.playSfx("confirm");
    resetSaveData();
    hideResetDialog();
  });

  elements.resetNoButton.addEventListener("click", () => {
    audio.playSfx("cancel");
    hideResetDialog();
  });

  for (const card of elements.modeCards) {
    const mode = Number(card.dataset.mode);
    card.addEventListener("mouseenter", () => {
      if (isMobileLandscape()) {
        return;
      }
      hoveredMode = mode;
      updateModeScreen();
    });
    card.addEventListener("mouseleave", () => {
      if (isMobileLandscape()) {
        return;
      }
      hoveredMode = 0;
      updateModeScreen();
    });
    card.addEventListener("focus", () => {
      hoveredMode = mode;
      updateModeScreen();
    });
    card.addEventListener("blur", () => {
      hoveredMode = 0;
      updateModeScreen();
    });
    card.addEventListener("click", () => {
      if (isMobileLandscape()) {
        selectedMode = mode;
        hoveredMode = 0;
        audio.playSfx("select");
        updateModeScreen();
      } else {
        selectedMode = mode;
        continueToLevelScreen();
      }
    });
  }

  elements.modeSelectButton.addEventListener("click", () => {
    if (!selectedMode) {
      audio.playSfx("impossible");
      return;
    }
    continueToLevelScreen();
  });

  elements.titleStartButton.addEventListener("click", () => {
    audio.playSfx("confirm");
    selectedMode = 0;
    hoveredMode = 0;
    audio.setMusicEnabled(elements.musicToggle.checked);
    updateModeScreen();
    showScreen("mode");
    audio.playMusic("bgm1");
  });

  document.querySelector("[data-action='back-to-start']").addEventListener("click", () => {
    audio.playSfx("cancel");
    selectedMode = 0;
    updateModeScreen();
    showScreen("start");
  });

  document.querySelector("[data-action='back-to-mode']").addEventListener("click", () => {
    audio.playSfx("cancel");
    selectedMode = 0;
    hoveredMode = 0;
    initialLevel = 1;
    updateModeScreen();
    showScreen("mode");
    audio.playMusic("bgm1");
  });

  document.querySelectorAll("[data-level-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(button.dataset.levelStep);
      const nextLevel = initialLevel + step;
      if (nextLevel >= 1 && nextLevel <= data[selectedMode].level) {
        initialLevel = nextLevel;
        audio.playSfx("select");
        updateLevelScreen();
      } else {
        audio.playSfx("impossible");
      }
    });
  });

  elements.startButton.addEventListener("click", () => {
    audio.playSfx("confirm");
    audio.stopMusic();
    game.start(selectedMode, initialLevel);
    showScreen("game");
  });

  elements.okButton.addEventListener("click", () => {
    audio.playSfx("confirm");
    selectedMode = 0;
    hoveredMode = 0;
    initialLevel = 1;
    updateModeScreen();
    showScreen("mode");
    audio.playMusic("bgm1");
  });
}

function unlockAudioOnce() {
  audio.unlock();
  audioStarted = true;
}

function showScreen(name) {
  for (const [screenName, screen] of Object.entries(screens)) {
    screen.classList.toggle("hidden", screenName !== name);
  }
  if (name === "mode") {
    requestAnimationFrame(updateModeSelectButtonPosition);
  }
}

function updateModeScreen() {
  const activeMode = isMobileLandscape() ? selectedMode : hoveredMode;
  for (const card of elements.modeCards) {
    const mode = Number(card.dataset.mode);
    card.classList.toggle("selected", mode === activeMode);
    document.querySelector(`[data-best-score='${mode}']`).textContent = data[mode].score[0];
    document.querySelector(`[data-max-level='${mode}']`).textContent = data[mode].level;
  }

  elements.modeSelectButton.classList.toggle("hidden", !isMobileLandscape() || !selectedMode);
  updateModeSelectButtonPosition();

  const directions = modeDirections[activeMode] || modeDirections[0];
  elements.modeDirection1.textContent = directions[0];
  elements.modeDirection2.textContent = directions[1];
  elements.modeDirection3.textContent = directions[2];
}

function updateModeSelectButtonPosition() {
  if (!isMobileLandscape() || !selectedMode || screens.mode.classList.contains("hidden")) {
    elements.modeSelectButton.style.top = "";
    elements.modeSelectButton.style.bottom = "";
    return;
  }

  const modeGrid = screens.mode.querySelector(".mode-grid");
  const directionBox = screens.mode.querySelector(".direction-box");
  const screenRect = screens.mode.getBoundingClientRect();
  const gridRect = modeGrid.getBoundingClientRect();
  const directionRect = directionBox.getBoundingClientRect();
  const buttonRect = elements.modeSelectButton.getBoundingClientRect();
  const midpoint = (gridRect.bottom + directionRect.top) / 2 - screenRect.top;
  elements.modeSelectButton.style.top = `${midpoint - buttonRect.height / 2}px`;
  elements.modeSelectButton.style.bottom = "auto";
}

function continueToLevelScreen() {
  initialLevel = 1;
  audio.playSfx("confirm");
  updateLevelScreen();
  showScreen("level");
}

function isMobileLandscape() {
  return window.matchMedia("(max-width: 950px) and (orientation: landscape)").matches;
}

function updateLevelScreen() {
  elements.initialLevel.value = initialLevel;
  elements.initialLevel.textContent = initialLevel;
}

function showResetDialog() {
  elements.resetDialog.classList.remove("hidden");
  elements.resetNoButton.focus();
}

function hideResetDialog() {
  elements.resetDialog.classList.add("hidden");
  elements.resetButton.focus();
}

function resetSaveData() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Resetting is best-effort; in-memory data is still restored below.
  }

  const freshData = structuredClone(defaultData);
  for (const mode of [1, 2, 3]) {
    data[mode] = freshData[mode];
  }

  selectedMode = 0;
  hoveredMode = 0;
  initialLevel = 1;
  updateModeScreen();
}

function handleGameEnd(result) {
  lastResult = result;
  audio.playSfx("result");

  const scores = [...data[result.mode].score, result.score]
    .sort((a, b) => b - a)
    .slice(0, 5);
  data[result.mode].score = scores;
  if (result.initialLevel === 1) {
    data[result.mode].level = Math.max(data[result.mode].level, result.level);
  }
  saveData();

  updateResultScreen();
  showScreen("result");
}

function updateResultScreen() {
  elements.resultScore.textContent = lastResult.score;
  elements.resultLevel.textContent = lastResult.level;
  elements.historyList.innerHTML = "";

  let markedNew = false;
  const scores = data[lastResult.mode].score;
  scores.forEach((score, index) => {
    const item = document.createElement("li");
    item.textContent = `No.${index + 1}: ${score} points`;
    if (!markedNew && score === lastResult.score) {
      const marker = document.createElement("span");
      marker.className = "new-score";
      marker.textContent = "New!";
      item.append(marker);
      markedNew = true;
    }
    elements.historyList.append(item);
  });
}

function loadSaveData() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return structuredClone(defaultData);
    }
    const parsed = JSON.parse(raw);
    return normalizeSaveData(parsed);
  } catch {
    return structuredClone(defaultData);
  }
}

function normalizeSaveData(value) {
  const normalized = structuredClone(defaultData);
  for (const mode of [1, 2, 3]) {
    const item = value?.[mode];
    if (!item) {
      continue;
    }
    if (Array.isArray(item.score)) {
      normalized[mode].score = item.score
        .map((score) => Number(score))
        .filter((score) => Number.isFinite(score))
        .sort((a, b) => b - a)
        .slice(0, 5);
      while (normalized[mode].score.length < 5) {
        normalized[mode].score.push(0);
      }
    }
    const level = Number(item.level);
    if (Number.isInteger(level) && level >= 1 && level <= 10) {
      normalized[mode].level = level;
    }
  }
  return normalized;
}

function saveData() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Saving is best-effort; gameplay should continue even if storage is unavailable.
  }
}
