var ART = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';

var playerTrainer = null;
var opponentTrainer = null;
var battleRunning = false;

// ── NAV ──
document.querySelector('.navbar__hamburger').addEventListener('click', function () {
  document.querySelector('.mobile-nav').classList.toggle('open');
});

// ── STORAGE ──
function getTrainers() {
  return JSON.parse(localStorage.getItem('pp_trainers') || '[]');
}

function saveTrainers(list) {
  localStorage.setItem('pp_trainers', JSON.stringify(list));
}

function getActiveTrainerId() {
  var active = sessionStorage.getItem('active_trainer');
  if (active) return parseInt(active);

  var viewing = sessionStorage.getItem('viewing_trainer');
  if (viewing) {
    sessionStorage.setItem('active_trainer', viewing);
    return parseInt(viewing);
  }

  return null;
}

function randArtId() {
  return Math.floor(Math.random() * 151) + 1;
}

// ── HERO / PLACEHOLDERS ──
document.querySelector('.page-header__mon.left').src = ART + randArtId() + '.png';
document.querySelector('.page-header__mon.right').src = ART + randArtId() + '.png';
document.getElementById('player-placeholder-mon').src = ART + randArtId() + '.png';
document.getElementById('enemy-placeholder-mon').src = ART + randArtId() + '.png';

// ── TYPE / OPPONENT UI ──
document.getElementById('opponent-type').addEventListener('change', function () {
  var isTrainer = this.value === 'trainer';
  document.getElementById('trainer-select').disabled = !isTrainer;
});

// ── WINNER POPUP ──
function showWinnerPopup(text, subtext, pokemonId) {
  document.getElementById('winner-text').textContent = text;
  document.getElementById('winner-subtext').textContent = subtext || '';
  document.getElementById('winner-mon').src = ART + pokemonId + '.png';
  document.getElementById('winner-overlay').classList.add('show');
}

document.getElementById('close-winner').addEventListener('click', function () {
  document.getElementById('winner-overlay').classList.remove('show');
});

// ── HELPERS ──
function logLine(text, type) {
  var log = document.getElementById('battle-log');
  var div = document.createElement('div');
  div.className = 'log-entry';
  if (type) div.classList.add('log-entry--' + type);
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function clearLog() {
  document.getElementById('battle-log').innerHTML = '';
}

function hpClass(hp) {
  if (hp < 40) return 'hp-fill low';
  if (hp < 70) return 'hp-fill mid';
  return 'hp-fill';
}

function renderFighter(containerId, pokemon) {
  var hp = Math.max(0, Math.floor(pokemon.hp));
  var box = document.getElementById(containerId);

  box.className = 'fighter';
  box.innerHTML =
    '<h3>' + pokemon.name + '</h3>' +
    '<div class="fighter__sub">Lv. ' + (pokemon.level || 1) + '</div>' +
    '<img src="' + ART + pokemon.id + '.png" alt="' + pokemon.name + '">' +
    '<div class="hp-wrap">' +
      '<div class="hp-label">' +
        '<span>HP</span>' +
        '<span>' + hp + ' / 100</span>' +
      '</div>' +
      '<div class="hp-bar">' +
        '<div class="' + hpClass(hp) + '" style="width:' + hp + '%"></div>' +
      '</div>' +
    '</div>';
}

function renderPlaceholder(containerId, title, text, imgId) {
  var box = document.getElementById(containerId);
  box.className = 'fighter fighter--placeholder';
  box.innerHTML =
    '<img src="' + ART + imgId + '.png" alt="placeholder">' +
    '<h3>' + title + '</h3>' +
    '<p>' + text + '</p>';
}

function clonePartyForBattle(party) {
  return party.map(function (p) {
    return {
      id: p.id,
      name: p.name,
      level: p.level || 1,
      attack: p.attack || (55 + (p.level || 1) * 4),
      defense: p.defense || (50 + (p.level || 1) * 3),
      hp: 100
    };
  });
}

function createBattleRecord(playerWon) {
  var battles = JSON.parse(localStorage.getItem('pp_battles') || '[]');

  battles.push({
    id: Date.now(),
    date: new Date().toISOString(),
    playerId: playerTrainer.id,
    playerName: playerTrainer.name,
    opponentName: opponentTrainer.name,
    opponentType: document.getElementById('opponent-type').value,
    result: playerWon ? 'win' : 'loss'
  });

  localStorage.setItem('pp_battles', JSON.stringify(battles));
}

// ── INIT ──
function initPage() {
  var trainers = getTrainers();
  var activeId = getActiveTrainerId();

  playerTrainer = trainers.find(function (t) {
    return t.id === activeId;
  });

  var badge = document.getElementById('active-trainer-badge');
  var select = document.getElementById('trainer-select');
  select.innerHTML = '<option value="">Select Trainer</option>';

  if (!playerTrainer) {
    badge.textContent = 'Active Trainer: None selected';
    renderPlaceholder('player-box', 'No Trainer', 'Select a trainer first from the Trainers page.', randArtId());
    renderPlaceholder('enemy-box', 'Opponent', 'AI or trainer opponent will appear here.', randArtId());
    return;
  }

  badge.textContent = 'Active Trainer: ' + playerTrainer.name;

  trainers.forEach(function (t) {
    if (t.id !== activeId) {
      var opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      select.appendChild(opt);
    }
  });

  renderPlaceholder('player-box', playerTrainer.name, 'Your battle-ready Pokémon will appear here.', randArtId());
  renderPlaceholder('enemy-box', 'Opponent', 'Choose AI or another trainer and start battle.', randArtId());
}

// ── START BATTLE ──
document.getElementById('start-battle').addEventListener('click', function () {
  if (battleRunning) return;

  if (!playerTrainer || !playerTrainer.party || playerTrainer.party.length < 2) {
    alert('Your active trainer needs at least 2 Pokémon in the party.');
    return;
  }

  var opponentType = document.getElementById('opponent-type').value;

  if (opponentType === 'ai') {
    opponentTrainer = generateAI(playerTrainer.party.length);
  } else {
    var id = parseInt(document.getElementById('trainer-select').value);

    if (!id) {
      alert('Select a trainer opponent first.');
      return;
    }

    opponentTrainer = getTrainers().find(function (t) {
      return t.id === id;
    });

    if (!opponentTrainer || !opponentTrainer.party || opponentTrainer.party.length < 2) {
      alert('Selected opponent needs at least 2 Pokémon in the party.');
      return;
    }
  }

  runBattle();
});

// ── AI ──
function generateAI(size) {
  var team = [];
  var names = ['Nova Bot', 'Shadow Bot', 'Blaze Bot', 'Luna Bot', 'Volt Bot'];
  var botName = names[Math.floor(Math.random() * names.length)];

  for (var i = 0; i < size; i++) {
    var level = Math.floor(Math.random() * 5) + 1;

    team.push({
      id: randArtId(),
      name: 'Bot Mon',
      level: level,
      attack: 55 + level * 5 + Math.floor(Math.random() * 10),
      defense: 50 + level * 4 + Math.floor(Math.random() * 10),
      hp: 100
    });
  }

  return {
    id: -1,
    name: botName,
    party: team,
    wins: 0,
    losses: 0
  };
}

// ── BATTLE ──
function runBattle() {
  battleRunning = true;
  clearLog();

  var playerTeam = clonePartyForBattle(playerTrainer.party);
  var enemyTeam = clonePartyForBattle(opponentTrainer.party);

  logLine('Battle started! ' + playerTrainer.name + ' vs ' + opponentTrainer.name, 'system');

  function nextTurn() {
    if (playerTeam.length === 0 || enemyTeam.length === 0) {
      endBattle(playerTeam.length > 0);
      return;
    }

    var playerMon = playerTeam[0];
    var enemyMon = enemyTeam[0];

    renderFighter('player-box', playerMon);
    renderFighter('enemy-box', enemyMon);

    // Player attacks first
    var damageToEnemy = Math.max(
      8,
      Math.floor(playerMon.attack - enemyMon.defense / 2 + Math.random() * 15)
    );

    enemyMon.hp -= damageToEnemy;
    logLine(playerMon.name + ' hits ' + enemyMon.name + ' for ' + damageToEnemy + ' damage.', 'player');

    renderFighter('enemy-box', enemyMon);

    if (enemyMon.hp <= 0) {
      logLine(enemyMon.name + ' fainted!', 'system');
      enemyTeam.shift();
      setTimeout(nextTurn, 900);
      return;
    }

    // Enemy attacks back
    var damageToPlayer = Math.max(
      8,
      Math.floor(enemyMon.attack - playerMon.defense / 2 + Math.random() * 15)
    );

    playerMon.hp -= damageToPlayer;
    logLine(enemyMon.name + ' hits back for ' + damageToPlayer + ' damage.', 'enemy');

    renderFighter('player-box', playerMon);

    if (playerMon.hp <= 0) {
      logLine(playerMon.name + ' fainted!', 'system');
      playerTeam.shift();
    }

    setTimeout(nextTurn, 1100);
  }

  nextTurn();
}

// ── END ──
function endBattle(playerWon) {
  var trainers = getTrainers();
  var playerRef = trainers.find(function (t) {
    return t.id === playerTrainer.id;
  });

  if (playerWon) {
    logLine('🎉 ' + playerTrainer.name + ' wins the battle!', 'win');
    playerRef.wins = (playerRef.wins || 0) + 1;

    if (opponentTrainer.id !== -1) {
      var opponentRef = trainers.find(function (t) {
        return t.id === opponentTrainer.id;
      });
      if (opponentRef) opponentRef.losses = (opponentRef.losses || 0) + 1;
    }

    showWinnerPopup(
      playerTrainer.name + ' Wins!',
      'A clean victory in the arena.',
      playerTrainer.party[0].id
    );
  } else {
    logLine('💀 ' + opponentTrainer.name + ' wins the battle!', 'system');
    playerRef.losses = (playerRef.losses || 0) + 1;

    if (opponentTrainer.id !== -1) {
      var opponentRef2 = trainers.find(function (t) {
        return t.id === opponentTrainer.id;
      });
      if (opponentRef2) opponentRef2.wins = (opponentRef2.wins || 0) + 1;
    }

    showWinnerPopup(
      opponentTrainer.name + ' Wins!',
      'Your team was defeated this time.',
      opponentTrainer.party[0].id
    );
  }

  saveTrainers(trainers);
  createBattleRecord(playerWon);
  battleRunning = false;
}

initPage();
