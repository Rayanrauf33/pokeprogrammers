
 

var SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
var ART    = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';

function randId()  { return Math.floor(Math.random() * 898) + 1; }
function randArt() { return ART + randId() + '.png'; }

// ── Mobile nav ──
document.querySelector('.navbar__hamburger').addEventListener('click', function() {
  document.querySelector('.mobile-nav').classList.toggle('open');
});

// ── Random bg pokemon in header ──
document.querySelector('.profile-header__bg-mon.left').src  = randArt();
document.querySelector('.profile-header__bg-mon.right').src = randArt();
document.getElementById('no-pokemon-mon').src = randArt();
document.getElementById('no-battles-mon').src = randArt();


// ── LOAD TRAINER ──────────────────────────────────────────────
// Get the trainer ID saved by trainers.js when View was clicked
var trainerId = parseInt(sessionStorage.getItem('viewing_trainer'));

if (!trainerId) {
  // No trainer selected, go back to trainers page
  window.location.href = 'trainers.html';
}

var trainers = JSON.parse(localStorage.getItem('pp_trainers') || '[]');
var trainer  = trainers.find(function(t) { return t.id === trainerId; });

if (!trainer) {
  window.location.href = 'trainers.html';
}


// ── FILL PROFILE HEADER ───────────────────────────────────────
document.getElementById('profile-avatar').src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(trainer.name) + '&background=ffd6e7&color=333&size=128&bold=true&rounded=true';
document.getElementById('profile-name').textContent = trainer.name;
document.getElementById('profile-id').textContent   = 'ID #' + String(trainer.id).slice(-4);

document.getElementById('stat-wins').textContent         = trainer.wins    || 0;
document.getElementById('stat-losses').textContent       = trainer.losses  || 0;
document.getElementById('stat-total-pokemon').textContent = (trainer.pokemon || []).length;
document.getElementById('stat-party-size').textContent   = (trainer.party  || []).length;

// Pass trainer ID to party page via sessionStorage when manage party is clicked
document.getElementById('manage-party-btn').addEventListener('click', function() {
  sessionStorage.setItem('party_trainer', trainer.id);
});


// ── POKEMON COLLECTION ────────────────────────────────────────
var grid      = document.getElementById('pokemon-grid');
var noPokemon = document.getElementById('no-pokemon');
var pokemon   = trainer.pokemon || [];

document.getElementById('collection-subtitle').textContent =
  pokemon.length + ' Pokémon in collection.';

if (pokemon.length === 0) {
  noPokemon.style.display = 'block';
} else {
  noPokemon.style.display = 'none';
  pokemon.forEach(function(p) {
    var card = document.createElement('div');
    card.className = 'mon-card';
    card.innerHTML =
      '<img src="' + SPRITE + p.id + '.png" alt="' + p.name + '">' +
      '<div class="mon-card__name">' + p.name + '</div>' +
      '<div class="mon-card__level">Lv. ' + (p.level || 1) + '</div>' +
      '<div class="mon-card__types">' +
        (p.types || []).map(function(t) {
          return '<span class="type-badge-sm" style="background:' + typeColor(t) + ';color:#fff">' + t + '</span>';
        }).join('') +
      '</div>';
    grid.insertBefore(card, noPokemon);
  });
}


// ── BATTLE HISTORY ────────────────────────────────────────────
var battles   = JSON.parse(localStorage.getItem('pp_battles') || '[]');
var myBattles = battles.filter(function(b) {
  return b.winnerId === trainer.id || b.loserId === trainer.id;
});

var log       = document.getElementById('battle-log');
var noBattles = document.getElementById('no-battles');

if (myBattles.length === 0) {
  noBattles.style.display = 'block';
} else {
  noBattles.style.display = 'none';
  myBattles.forEach(function(b) {
    var won   = b.winnerId === trainer.id;
    var entry = document.createElement('div');
    entry.className = 'battle-entry ' + (won ? 'battle-entry--win' : 'battle-entry--loss');
    entry.innerHTML =
      '<span class="battle-entry__result">' + (won ? '🏆 WIN' : '💔 LOSS') + '</span>' +
      '<span class="battle-entry__vs">vs ' + (won ? b.loserName : b.winnerName) + '</span>' +
      '<span class="battle-entry__date">' + new Date(b.date).toLocaleDateString() + '</span>';
    log.insertBefore(entry, noBattles);
  });
}


// ── TYPE COLOR HELPER ─────────────────────────────────────────
function typeColor(type) {
  var colors = {
    fire:'#F08030', water:'#6890F0', grass:'#78C850', electric:'#F8D030',
    psychic:'#F85888', ice:'#98D8D8', dragon:'#7038F8', dark:'#705848',
    fairy:'#EE99AC', normal:'#A8A878', fighting:'#C03028', flying:'#A890F0',
    poison:'#A040A0', ground:'#E0C068', rock:'#B8A038', bug:'#A8B820',
    ghost:'#705898', steel:'#B8B8D0'
  };
  return colors[type] || '#888';
}
