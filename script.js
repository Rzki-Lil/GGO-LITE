const state = {
  currentRound: 7,
  opponents: {
    player1: Array(20).fill(null),
    player8: Array(20).fill(null),
  },
  firstOpponentId: 8,
  playerNames: {
    0: "batal",
    1: "Kamu",
    2: "Pemain 2",
    3: "Pemain 3",
    4: "Pemain 4",
    5: "Pemain 5",
    6: "Pemain 6",
    7: "Pemain 7",
    8: "Pemain 8",
  },
  editingPlayer: null,
  tempName: "",
  round3OpponentR5Match: null,
  firstRound3OpponentR5Match: null,
  selectedRound: null,

  updateInProgress: false,
  isLoading: false,
  errorMessage: "",
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();

  document
    .getElementById("reset-names-btn")
    .addEventListener("click", resetPlayerNames);
  document
    .getElementById("reset-matches-btn")
    .addEventListener("click", resetMatchData);

  document
    .getElementById("scan-names-btn")
    .addEventListener("click", openOcrModal);

  document
    .getElementById("close-modal")
    .addEventListener("click", closeOcrModal);

  setupOcrDropZone();

  document.addEventListener("paste", handlePaste);

  initializeUI();

  handleOpponentChange("player1", 1, state.firstOpponentId.toString());
  handleOpponentChange("player8", 1, "1");

  updateUI();
});

function cacheElements() {
  elements.playersContainer = document.getElementById("players-container");
  elements.matchInputsContainer = document.getElementById(
    "match-inputs-container"
  );
  elements.predictionsTable = document.getElementById("predictions-table");
  elements.predictionsTbody = document.getElementById("predictions-tbody");
  elements.thOpponentOf = document.getElementById("th-opponent-of");
  elements.ocrModal = document.getElementById("ocr-modal");
  elements.dropZone = document.getElementById("drop-zone");
  elements.fileInput = document.getElementById("file-input");
}

function initializeUI() {
  renderPlayersCards();
  renderMatchInputs();
  updatePredictionsTable();
}

function renderPlayersCards() {
  if (state.updateInProgress) return;
  state.updateInProgress = true;

  const fragment = document.createDocumentFragment();
  const playersContainer = elements.playersContainer;

  while (playersContainer.firstChild) {
    playersContainer.firstChild.remove();
  }

  const isMobile = window.innerWidth < 480;

  if (isMobile) {
    const gridDiv = document.createElement("div");
    gridDiv.style.display = "grid";
    gridDiv.style.gridTemplateColumns = "repeat(2, 1fr)";
    gridDiv.style.gap = "0.3rem";
    gridDiv.style.padding = "0.3rem";

    for (let i = 2; i <= 8; i++) {
      const isFirst = i === state.firstOpponentId;
      const card = createPlayerCard(i, isFirst);
      gridDiv.appendChild(card);
    }

    fragment.appendChild(gridDiv);
  } else {
    for (let i = 2; i <= 8; i++) {
      const isFirst = i === state.firstOpponentId;
      const card = createPlayerCard(i, isFirst);
      fragment.appendChild(card);
    }
  }

  elements.playersContainer.appendChild(fragment);
  state.updateInProgress = false;
}

function createPlayerCard(i, isFirst) {
  const card = document.createElement("div");
  card.className = `player-card ${isFirst ? "first-opponent" : ""}`;
  card.dataset.playerId = i;

  if (isFirst) {
    const label = document.createElement("div");
    label.className = "player-label";
    label.textContent = "Lawan Pertama";
    card.appendChild(label);
  }

  const name = document.createElement("div");
  name.className = "player-name";

  if (state.editingPlayer === i) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = state.playerNames[i];
    input.value = state.tempName || state.playerNames[i];

    input.addEventListener("blur", () => savePlayerName(i, input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        savePlayerNameAndContinue(i, input.value);
      }
    });

    name.appendChild(input);

    requestAnimationFrame(() => {
      input.focus();
      input.select();

      input.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  } else {
    name.textContent = state.playerNames[i];
    name.addEventListener("click", () => {
      if (!state.editingPlayer) startEditName(i);
    });
  }

  card.appendChild(name);
  return card;
}

function savePlayerNameAndContinue(playerId, value) {
  // Save the current name
  state.playerNames[playerId] = value?.trim()
    ? value
    : playerId === 1
    ? "Kamu"
    : `Pemain ${playerId}`;

  const nextPlayerId = playerId < 8 ? playerId + 1 : null;

  state.editingPlayer = null;

  renderPlayersCards();

  if (nextPlayerId) {
    setTimeout(() => {
      state.editingPlayer = nextPlayerId;
      state.tempName = state.playerNames[nextPlayerId];
      renderPlayersCards();

      setTimeout(() => {
        const input = document.querySelector(
          `.player-card[data-player-id="${nextPlayerId}"] input`
        );
        if (input) {
          input.focus();
          input.select();
        }
      }, 30);
    }, 20);
  }
}

function renderMatchInputs() {
  const container = elements.matchInputsContainer;

  while (container.firstChild) {
    container.firstChild.remove();
  }

  const firstOpponentSection = document.createElement("div");
  firstOpponentSection.className = "first-opponent-section";

  const sectionTitle = document.createElement("h3");
  sectionTitle.className = "section-title";
  sectionTitle.textContent = "Lawan Pertama";
  firstOpponentSection.appendChild(sectionTitle);

  const firstOpponentSelect = document.createElement("select");
  firstOpponentSelect.className = "match-select";

  for (let i = 2; i <= 8; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = state.playerNames[i];
    option.selected = i === state.firstOpponentId;
    firstOpponentSelect.appendChild(option);
  }

  firstOpponentSelect.addEventListener("change", (e) => {
    handleFirstOpponentChange(e.target.value);
  });

  firstOpponentSection.appendChild(firstOpponentSelect);
  elements.matchInputsContainer.appendChild(firstOpponentSection);

  const roundsContainer = document.createElement("div");
  roundsContainer.className = "rounds-container";

  [2, 4].forEach((round) => {
    const roundSection = document.createElement("div");
    roundSection.className = "round-section";

    const roundTitle = document.createElement("h3");
    roundTitle.className = "section-title";
    roundTitle.textContent = `Ronde ${round}`;
    roundSection.appendChild(roundTitle);

    const yourOpponentGroup = document.createElement("div");
    yourOpponentGroup.className = "input-group";

    const yourOpponentLabel = document.createElement("label");
    yourOpponentLabel.className = "input-label";
    yourOpponentLabel.textContent = "Lawan Kamu";
    yourOpponentGroup.appendChild(yourOpponentLabel);

    const player1Select = document.createElement("select");
    player1Select.className = "match-select";

    const cancelOption = document.createElement("option");
    cancelOption.value = "0";
    cancelOption.textContent = "Batal";
    player1Select.appendChild(cancelOption);

    for (let i = 2; i <= 8; i++) {
      if (i === state.firstOpponentId) continue;

      const isCurrentSelection = state.opponents.player1[round] === i;
      const isUsedElsewhere = isUsedInOtherRounds(
        state.opponents,
        round,
        "player1",
        i
      );

      if (!isCurrentSelection && isUsedElsewhere) continue;

      const option = document.createElement("option");
      option.value = i;
      option.textContent = state.playerNames[i];

      const currentRoundOpponents = getCurrentRoundOpponents(
        state.opponents,
        round,
        "player1"
      );

      if (currentRoundOpponents.includes(i)) {
        option.disabled = true;
      }

      player1Select.appendChild(option);
    }

    player1Select.value = state.opponents.player1[round] || "0";

    player1Select.addEventListener("change", (e) => {
      handleOpponentChange("player1", round, e.target.value);
    });

    yourOpponentGroup.appendChild(player1Select);
    roundSection.appendChild(yourOpponentGroup);

    const firstOpponentGroup = document.createElement("div");
    firstOpponentGroup.className = "input-group";

    const firstOpponentLabel = document.createElement("label");
    firstOpponentLabel.className = "input-label";
    firstOpponentLabel.textContent = `Lawan dari ${
      state.playerNames[state.firstOpponentId]
    }`;
    firstOpponentGroup.appendChild(firstOpponentLabel);

    const player8Select = document.createElement("select");
    player8Select.className = "match-select";

    const cancelOption8 = document.createElement("option");
    cancelOption8.value = "0";
    cancelOption8.textContent = "Batal";
    player8Select.appendChild(cancelOption8);

    for (let i = 2; i <= 8; i++) {
      if (i === state.firstOpponentId) continue;

      const isCurrentSelection = state.opponents.player8[round] === i;
      const isUsedElsewhere = isUsedInOtherRounds(
        state.opponents,
        round,
        "player8",
        i
      );

      if (!isCurrentSelection && isUsedElsewhere) continue;

      const option = document.createElement("option");
      option.value = i;
      option.textContent = state.playerNames[i];

      const currentRoundOpponents = getCurrentRoundOpponents(
        state.opponents,
        round,
        "player8"
      );

      if (currentRoundOpponents.includes(i)) {
        option.disabled = true;
      }

      player8Select.appendChild(option);
    }

    player8Select.value = state.opponents.player8[round] || "0";

    player8Select.addEventListener("change", (e) => {
      handleOpponentChange("player8", round, e.target.value);
    });

    firstOpponentGroup.appendChild(player8Select);
    roundSection.appendChild(firstOpponentGroup);

    roundsContainer.appendChild(roundSection);
  });

  elements.matchInputsContainer.appendChild(roundsContainer);

  const round6Helper = createRound6Helper();
  if (round6Helper) {
    elements.matchInputsContainer.appendChild(round6Helper);
  }
}

function createRound6Helper() {
  if (state.opponents.player1[3]) {
    const round6Helper = document.createElement("div");
    round6Helper.className = "round6-helper";

    const helperTitle = document.createElement("h3");
    helperTitle.className = "helper-title";
    helperTitle.textContent = "Ronde 6 & 7";
    round6Helper.appendChild(helperTitle);

    const helperText = document.createElement("p");
    helperText.className = "helper-text";

    if (isMobileDevice()) {
      helperText.innerHTML = `Lawan ${
        state.playerNames[state.opponents.player1[3]]
      } siapa di Ronde 5?`;
    } else {
      helperText.innerHTML = `Lawan ${
        state.playerNames[state.opponents.player1[3]]
      } siapa di Ronde 5?`;
    }

    round6Helper.appendChild(helperText);

    const helperSelect = document.createElement("select");
    helperSelect.className = "match-select";

    const cancelOption = document.createElement("option");
    cancelOption.value = "0";
    cancelOption.textContent = "Batal";
    helperSelect.appendChild(cancelOption);

    const allUsedOpponents = [];
    for (let round = 1; round <= 7; round++) {
      if (round !== 6) {
        if (state.opponents.player1[round])
          allUsedOpponents.push(state.opponents.player1[round]);
        if (state.opponents.player8[round])
          allUsedOpponents.push(state.opponents.player8[round]);
      }
    }

    for (let i = 2; i <= 8; i++) {
      if (
        (i !== state.round3OpponentR5Match && allUsedOpponents.includes(i)) ||
        i === state.firstOpponentId
      ) {
        continue;
      }

      const option = document.createElement("option");
      option.value = i;
      option.textContent = state.playerNames[i];
      helperSelect.appendChild(option);
    }

    helperSelect.value = state.round3OpponentR5Match || "0";

    helperSelect.addEventListener("change", handleRound3OpponentChange);

    round6Helper.appendChild(helperSelect);
    return round6Helper;
  }
  return null;
}

function handleRound3OpponentChange(e) {
  const value = e.target.value;

  if (value === "0") {
    state.round3OpponentR5Match = null;
    state.opponents.player1[6] = null;
    state.opponents.player8[6] = null;
    state.opponents.player1[7] = null;
    state.opponents.player8[7] = null;
  } else {
    const selectedOpponent = parseInt(value);
    state.round3OpponentR5Match = selectedOpponent;

    state.opponents.player1[6] = selectedOpponent;

    const usedOpponents = getUsedOpponentsByRoundRange(state.opponents, 1, 5);
    usedOpponents.push(selectedOpponent);

    const lastPlayer = getLastRemainingPlayer(
      state.opponents,
      state.firstOpponentId
    );
    if (lastPlayer) {
      state.opponents.player8[6] = lastPlayer;

      state.opponents.player1[7] = lastPlayer;
      state.opponents.player8[7] = selectedOpponent;
    }
  }

  requestAnimationFrame(updateUI);
}

let tbodyClickHandlerInitialized = false;

function updatePredictionsTable() {
  if (state.updateInProgress) return;
  state.updateInProgress = true;

  const tbody = elements.predictionsTbody;

  while (tbody.firstChild) {
    tbody.firstChild.remove();
  }

  const fragment = document.createDocumentFragment();

  elements.thOpponentOf.textContent = `Lawan dari ${
    state.playerNames[state.firstOpponentId]
  }`;

  for (let round = 1; round <= state.currentRound; round++) {
    const row = document.createElement("tr");
    row.className = isDeterministic(round) ? "deterministic" : "";
    if (state.selectedRound === round) {
      row.classList.add("selected");
    }

    row.dataset.round = round;
    row.style.cursor = "pointer";

    row.innerHTML = `
      <td>${round}</td>
      <td id="player1-r${round}"></td>
      <td id="player8-r${round}"></td>
    `;

    fragment.appendChild(row);
  }

  if (!tbodyClickHandlerInitialized) {
    tbody.addEventListener("click", (e) => {
      try {
        const row = e.target.closest("tr");
        if (row && row.dataset.round) {
          const round = parseInt(row.dataset.round);
          if (!isNaN(round)) {
            state.selectedRound = state.selectedRound === round ? null : round;
            updatePredictionsTable();
          }
        }
      } catch (error) {
        console.error("Error handling table click:", error);
      }
    });
    tbodyClickHandlerInitialized = true;
  }

  tbody.appendChild(fragment);

  for (let round = 1; round <= state.currentRound; round++) {
    const player1Cell = document.getElementById(`player1-r${round}`);
    const player8Cell = document.getElementById(`player8-r${round}`);

    if (player1Cell && player8Cell) {
      player1Cell.appendChild(getOpponentDisplay("player1", round));
      player8Cell.appendChild(getOpponentDisplay("player8", round));
    }
  }

  state.updateInProgress = false;
}

function getOpponentDisplay(player, round) {
  const opponent = state.opponents[player][round];
  const span = document.createElement("span");
  span.className = "player-text";

  if (round === 1 && player === "player8") {
    span.textContent = state.playerNames[1];
    span.className += " indigo-text";
  } else if (opponent === null && isDeterministic(round)) {
    if (round === 3) {
      if (player === "player1" && state.opponents.player8[2]) {
        span.textContent = state.playerNames[state.opponents.player8[2]];
        span.className += " emerald-text";
      } else if (player === "player8" && state.opponents.player1[2]) {
        span.textContent = state.playerNames[state.opponents.player1[2]];
        span.className += " indigo-text";
      } else {
        span.textContent = "-";
        span.className += " gray-text";
      }
    } else if (round === 5) {
      if (player === "player1" && state.opponents.player8[4]) {
        span.textContent = state.playerNames[state.opponents.player8[4]];
        span.className += " emerald-text";
      } else if (player === "player8" && state.opponents.player1[4]) {
        span.textContent = state.playerNames[state.opponents.player1[4]];
        span.className += " indigo-text";
      } else {
        span.textContent = "-";
        span.className += " gray-text";
      }
    } else {
      span.textContent = "-";
      span.className += " gray-text";
    }
  } else if (opponent === null) {
    span.textContent = "-";
    span.className += " gray-text";
  } else {
    span.textContent = state.playerNames[opponent];

    if (player === "player1") {
      span.className += " emerald-text";
    } else {
      span.className += " indigo-text";
    }
  }

  if (state.selectedRound === round) {
    span.className = span.className
      .replace("emerald-text", "")
      .replace("indigo-text", "")
      .replace("gray-text", "");
  }

  return span;
}

function handleOpponentChange(player, round, value) {
  const otherPlayer = player === "player1" ? "player8" : "player1";

  if (value === "0") {
    state.opponents[player][round] = null;

    if (round === 2) {
      state.opponents[player][3] = null;
      state.opponents[otherPlayer][3] = null;
    } else if (round === 4) {
      state.opponents[player][5] = null;
      state.opponents[otherPlayer][5] = null;
    } else if (round === 3 || round === 5) {
      state.opponents[player][6] = null;
      state.round3OpponentR5Match = null;
    } else if (round === 6) {
      state.opponents[player][7] = null;
      state.opponents[otherPlayer][7] = null;
    }
  } else {
    const opponentId = parseInt(value);
    if (state.opponents[otherPlayer][round] === opponentId) {
      alert("Lawan ini sudah dipilih oleh pemain lain di ronde yang sama");
      return;
    }

    if (isUsedInOtherRounds(state.opponents, round, player, opponentId)) {
      alert("Lawan ini sudah dipilih di ronde lain");
      return;
    }

    state.opponents[player][round] = opponentId;
  }

  updatePredictions();

  requestAnimationFrame(updateUI);
}

function updatePredictions() {
  if (!state.opponents.player1[2] && !state.opponents.player8[2]) return;

  const newOpponents = {
    player1: [...state.opponents.player1],
    player8: [...state.opponents.player8],
  };

  let hasChanges = false;

  if (
    state.opponents.player8[2] &&
    newOpponents.player1[3] !== state.opponents.player8[2]
  ) {
    newOpponents.player1[3] = state.opponents.player8[2];
    hasChanges = true;
  }

  if (
    state.opponents.player1[2] &&
    newOpponents.player8[3] !== state.opponents.player1[2]
  ) {
    newOpponents.player8[3] = state.opponents.player1[2];
    hasChanges = true;
  }

  if (
    state.opponents.player8[4] &&
    newOpponents.player1[5] !== state.opponents.player8[4]
  ) {
    newOpponents.player1[5] = state.opponents.player8[4];
    hasChanges = true;
  }

  if (
    state.opponents.player1[4] &&
    newOpponents.player8[5] !== state.opponents.player1[4]
  ) {
    newOpponents.player8[5] = state.opponents.player1[4];
    hasChanges = true;
  }

  if (newOpponents.player1[6] && newOpponents.player8[6]) {
    newOpponents.player1[7] = newOpponents.player8[6];
    newOpponents.player8[7] = newOpponents.player1[6];
    hasChanges = true;
  }

  if (hasChanges) {
    state.opponents = newOpponents;
  }
}

function handleFirstOpponentChange(playerId) {
  const id = parseInt(playerId);
  if (id !== 1 && id >= 2 && id <= 8) {
    state.firstOpponentId = id;
    resetMatchData();
    handleOpponentChange("player1", 1, id.toString());
    handleOpponentChange("player8", 1, "1");
    updateUI();
  }
}

function resetMatchData() {
  state.opponents = {
    player1: Array(20).fill(null),
    player8: Array(20).fill(null),
  };
  state.round3OpponentR5Match = null;
  state.firstRound3OpponentR5Match = null;

  // Reset all select elements to "batal" (0)
  const selects = document.querySelectorAll(".match-select");
  selects.forEach((select) => {
    if (select.value !== state.firstOpponentId.toString()) {
      // Don't reset first opponent
      select.value = "0";
    }
  });

  updateUI();
}

function startEditName(playerId) {
  state.editingPlayer = playerId;
  state.tempName = state.playerNames[playerId];

  renderPlayersCards();

  setTimeout(() => {
    const input = document.querySelector(
      `.player-card[data-player-id="${playerId}"] input`
    );
    if (input) {
      input.focus();
      input.select();
    }
  }, 20);
}

function savePlayerName(playerId, value) {
  state.playerNames[playerId] = value?.trim()
    ? value
    : playerId === 1
    ? "Kamu"
    : `Pemain ${playerId}`;

  state.editingPlayer = null;

  updateUI();
}

// Add resetPlayerNames function
function resetPlayerNames() {
  state.playerNames = {
    0: "batal",
    1: "Kamu",
    2: "Pemain 2",
    3: "Pemain 3",
    4: "Pemain 4",
    5: "Pemain 5",
    6: "Pemain 6",
    7: "Pemain 7",
    8: "Pemain 8",
  };
  state.editingPlayer = null;
  state.tempName = "";
  updateUI();
}

let updateUITimeout;
function updateUI() {
  if (updateUITimeout) {
    clearTimeout(updateUITimeout);
  }

  updateUITimeout = setTimeout(() => {
    renderPlayersCards();
    renderMatchInputs();
    updatePredictionsTable();
  }, 10);
}

function isMobileDevice() {
  return window.innerWidth < 768;
}

function isUsedInOtherRounds(opponents, currentRound, currentPlayer, playerId) {
  for (let round = 1; round <= 7; round++) {
    if (round === currentRound) continue;

    if (
      opponents.player1[round] === playerId ||
      opponents.player8[round] === playerId
    ) {
      return true;
    }
  }

  const otherPlayer = currentPlayer === "player1" ? "player8" : "player1";
  if (opponents[otherPlayer][currentRound] === playerId) {
    return true;
  }

  return false;
}

function openOcrModal() {
  elements.ocrModal.classList.add("show");

  state.errorMessage = "";
  const existingError = document.querySelector(".error-message");
  if (existingError) {
    existingError.style.display = "none";
  }

  setTimeout(() => {
    window.addEventListener("click", closeModalOnOutsideClick);
  }, 100);
}

function closeModalOnOutsideClick(event) {
  if (event.target === elements.ocrModal) {
    closeOcrModal();
  }
}

function closeOcrModal() {
  elements.ocrModal.classList.remove("show");
  window.removeEventListener("click", closeModalOnOutsideClick);
}

function setupOcrDropZone() {
  const dropZone = elements.dropZone;
  const fileInput = elements.fileInput;

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Harap pilih file gambar");
      return;
    }

    processImage(file);
  });

  dropZone.addEventListener("click", (e) => {
    if (e.target !== elements.fileInput) {
      fileInput.click();
    }
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];

      if (!file.type.startsWith("image/")) {
        showError("Harap seret file gambar");
        return;
      }

      processImage(file);
    }
  });
}

function handlePaste(event) {
  if (!elements.ocrModal.classList.contains("show")) return;

  const clipboardItems = event.clipboardData?.items;
  if (!clipboardItems) return;

  for (const item of clipboardItems) {
    if (item.type.startsWith("image/")) {
      const blob = item.getAsFile();

      processImage(blob);
      event.preventDefault();
      break;
    }
  }
}

async function processImage(imageData) {
  if (!imageData || state.isLoading) return;

  state.isLoading = true;
  state.errorMessage = "";
  showLoading(true);

  closeOcrModal();

  try {
    let formData = new FormData();

    if (imageData instanceof File) {
      formData.append("image", imageData);
    } else if (imageData instanceof Blob) {
      formData.append("image", new File([imageData], "clipboard-image.png"));
    }

    const response = await fetch(
      "https://settled-modern-stinkbug.ngrok-free.app/ocr",
      {
        method: "POST",
        body: formData,
        headers: {
          "Cache-Control": "no-cache",
        },
      }
    );

    const result = await response.json();

    // Check if server returned an error
    if (!response.ok || result.error) {
      throw new Error(
        result.error || "Terjadi kesalahan saat memproses gambar"
      );
    }

    if (result.success && result.players && result.players.length > 0) {
      result.players.slice(0, 7).forEach((player, index) => {
        const playerId = index + 2;
        if (playerId <= 8) {
          state.playerNames[playerId] = player.name.trim();
        }
      });

      showNotification("Berhasil memproses nama pemain!", false);
      updateUI();
    } else {
      showError("Tidak ada nama pemain yang terdeteksi dalam gambar");
    }
  } catch (error) {
    console.error("OCR processing error:", error);
    showError(
      error.message ||
        "Error memproses gambar. Pastikan server sedang berjalan."
    );
  } finally {
    state.isLoading = false;
    showLoading(false);

    if (elements.fileInput) {
      elements.fileInput.value = "";
    }
  }
}

function showError(message) {
  state.errorMessage = message;

  const existingError = document.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

  let statusContainer = document.querySelector(".ocr-status-container");
  if (!statusContainer) {
    statusContainer = document.createElement("div");
    statusContainer.className = "ocr-status-container";

    const playersContainer = document.getElementById("players-container");
    playersContainer.parentNode.insertBefore(statusContainer, playersContainer);
  }

  const errorEl = document.createElement("div");
  errorEl.className = "error-message";
  errorEl.textContent = message;
  statusContainer.appendChild(errorEl);

  setTimeout(() => {
    if (errorEl.parentNode) {
      errorEl.remove();

      if (statusContainer.childNodes.length === 0) {
        statusContainer.remove();
      }
    }
  }, 5000);
}

function showLoading(isLoading) {
  const existingLoader = document.querySelector(".loading-indicator");
  if (existingLoader) {
    existingLoader.remove();
  }

  if (isLoading) {
    let statusContainer = document.querySelector(".ocr-status-container");
    if (!statusContainer) {
      statusContainer = document.createElement("div");
      statusContainer.className = "ocr-status-container";

      const playersContainer = document.getElementById("players-container");
      playersContainer.parentNode.insertBefore(
        statusContainer,
        playersContainer
      );
    }

    const loadingEl = document.createElement("div");
    loadingEl.className = "loading-indicator";
    loadingEl.innerHTML = `
      <svg class="spinner" viewBox="0 0 50 50">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
      </svg>
      <span>Memproses gambar...</span>
    `;
    statusContainer.appendChild(loadingEl);
  } else {
    const statusContainer = document.querySelector(".ocr-status-container");
    const errorMessage = document.querySelector(".error-message");

    if (statusContainer && !errorMessage) {
      statusContainer.remove();
    }
  }
}

function showNotification(message, isError = false) {
  const existingNotification = document.querySelector(".processing-result");
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.className = `processing-result ${isError ? "error" : ""}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
