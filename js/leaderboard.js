/* ============================================================
   leaderboard.js — Final fixed version
   ============================================================ */

var ART = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';

// ── NAV ──
document.querySelector('.navbar__hamburger').addEventListener('click', function () {
  document.querySelector('.mobile-nav').classList.toggle('open');
});

// ── RANDOM HEADER / EMPTY STATE IMAGES ──
function randId() {
  return Math.floor(Math.random() * 151) + 1;
}

document.querySelector('.page-header__mon.left').src = ART + randId() + '.png';
document.querySelector('.page-header__mon.right').src = ART + randId() + '.png';
document.getElementById('trainer-empty-mon').src = ART + randId() + '.png';
document.getElementById('battle-empty-mon').src = ART + randId() + '.png';

// ── DATA HELPERS ──
function getTrainers() {
  return JSON.parse(localStorage.getItem('pp_trainers') || '[]');
}

function getBattles() {
  var data = localStorage.getItem('pp_battles');

  if (!data) return [];

  try {
    var parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// ── RANK BADGES ──
function getRankLabel(i) {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return '#' + (i + 1);
}

// ── TRAINERS ──
function renderTrainers() {
  var container = document.getElementById('trainer-grid');
  var empty = document.getElementById('trainer-empty');
  var trainers = getTrainers();

  container.innerHTML = '';

  if (!trainers.length) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  trainers.sort(function (a, b) {
    return (b.wins || 0) - (a.wins || 0);
  });

  trainers.forEach(function (trainer, i) {
    var total = (trainer.wins || 0) + (trainer.losses || 0);
    var rate = total ? Math.round(((trainer.wins || 0) / total) * 100) : 0;

    var card = document.createElement('div');
    card.className = 'trainer-card';

    card.innerHTML =
      '<div class="trainer-rank">' + getRankLabel(i) + '</div>' +
      '<img class="trainer-avatar" src="https://ui-avatars.com/api/?name=' + encodeURIComponent(trainer.name) + '&background=ffd6e7&color=333&size=128&bold=true&rounded=true" alt="' + trainer.name + '">' +
      '<div class="trainer-name">' + trainer.name + '</div>' +
      '<div class="trainer-stats">' +
        '<span class="stat-badge stat-badge--wins">🏆 ' + (trainer.wins || 0) + ' Wins</span>' +
        '<span class="stat-badge stat-badge--losses">💔 ' + (trainer.losses || 0) + ' Losses</span>' +
        '<span class="stat-badge stat-badge--rate">⚡ ' + rate + '%</span>' +
      '</div>' +
      '<div class="trainer-footer">' + ((trainer.pokemon || []).length) + ' Pokémon Collected</div>';

    container.appendChild(card);
  });
}

// ── NORMALIZE BATTLE RECORDS ──
function normalizeBattle(b) {
  return {
    player: b.player || b.playerName || 'Unknown Trainer',
    opponent: b.opponent || b.opponentName || 'Unknown Opponent',
    result: b.result || 'unknown',
    date: b.date || b.createdAt || null
  };
}

function formatBattleText(b) {
  if (b.result === 'win') {
    return b.player + ' defeated ' + b.opponent;
  }

  if (b.result === 'loss') {
    return b.player + ' lost to ' + b.opponent;
  }

  return b.player + ' battled ' + b.opponent;
}

function formatDate(dateStr) {
  if (!dateStr) return 'Recent battle';

  var d = new Date(dateStr);

  if (isNaN(d.getTime())) return 'Recent battle';

  return d.toLocaleDateString() + ' • ' + d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ── BATTLE FEED ──
function renderBattles() {
  var container = document.getElementById('battle-feed');
  var empty = document.getElementById('battle-empty');
  var battles = getBattles().slice().reverse().slice(0, 10);

  container.innerHTML = '';

  if (!battles.length) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  battles.forEach(function (battle) {
    var b = normalizeBattle(battle);

    var item = document.createElement('div');
    item.className = 'battle-item';

    item.innerHTML =
      '<div class="battle-item__left">' +
        '<div class="battle-item__title">' + formatBattleText(b) + '</div>' +
        '<div class="battle-item__meta">' + formatDate(b.date) + '</div>' +
      '</div>' +
      '<div class="battle-item__result ' + (b.result === 'win' ? 'win' : 'loss') + '">' +
        (b.result === 'win' ? 'WIN' : (b.result === 'loss' ? 'LOSS' : 'BATTLE')) +
      '</div>';

    container.appendChild(item);
  });
}

// ── INIT ──
renderTrainers();
renderBattles();