function isDeterministic(round) {
  return round === 3 || round === 5 || round === 7;
}

function getAllUsedOpponents(opponents, round) {
  const usedOpponents = [];
  for (let i = 1; i < round; i++) {
    if (opponents.player1[i] !== null) {
      usedOpponents.push(opponents.player1[i]);
    }
    if (opponents.player8[i] !== null) {
      usedOpponents.push(opponents.player8[i]);
    }
  }
  return usedOpponents;
}

function getUsedOpponentsByRoundRange(opponents, startRound, endRound) {
  const usedOpponents = [];
  for (let i = startRound; i <= endRound; i++) {
    if (opponents.player1[i] !== null) {
      usedOpponents.push(opponents.player1[i]);
    }
    if (opponents.player8[i] !== null) {
      usedOpponents.push(opponents.player8[i]);
    }
  }
  return usedOpponents;
}

function getCurrentRoundOpponents(opponents, round, currentPlayer) {
  const otherPlayer = currentPlayer === "player1" ? "player8" : "player1";
  const usedInCurrentRound = [];

  if (opponents[otherPlayer][round] !== null) {
    usedInCurrentRound.push(opponents[otherPlayer][round]);
  }

  return usedInCurrentRound;
}

function getRemainingPlayers(opponents, firstOpponentId) {
  const usedOpponents = getUsedOpponentsByRoundRange(opponents, 1, 5);
  const remainingPlayers = [];

  for (let i = 2; i <= 8; i++) {
    if (i !== firstOpponentId && !usedOpponents.includes(i)) {
      remainingPlayers.push(i);
    }
  }

  return remainingPlayers;
}

function getLastRemainingPlayer(opponents, firstOpponentId) {
  const usedOpponents = getUsedOpponentsByRoundRange(opponents, 1, 6);

  for (let i = 2; i <= 8; i++) {
    if (i !== firstOpponentId && !usedOpponents.includes(i)) {
      return i;
    }
  }

  return null;
}

function countRemainingPlayers(opponents, firstOpponentId) {
  const usedOpponents = getUsedOpponentsByRoundRange(opponents, 1, 6);
  let count = 0;

  for (let i = 2; i <= 8; i++) {
    if (i !== firstOpponentId && !usedOpponents.includes(i)) {
      count++;
    }
  }

  return count;
}
