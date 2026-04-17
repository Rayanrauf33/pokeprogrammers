/* ============================================================
   trainers.js — FIXED Active Trainer + existing features
   ============================================================ */

var ART    = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
var SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';

function randId()  { return Math.floor(Math.random() * 898) + 1; }
function randArt() { return ART + randId() + '.png'; }

// ── MOBILE NAV ──
document.querySelector('.navbar__hamburger').addEventListener('click', function() {
  document.querySelector('.mobile-nav').classList.toggle('open');
});

// ── HEADER IMAGES ──
document.querySelector('.page-header__mon.left').src  = randArt();
document.querySelector('.page-header__mon.right').src = randArt();
document.getElementById('empty-mon').src = randArt();

// ── STORAGE ──
function getTrainers() {
  return JSON.parse(localStorage.getItem('pp_trainers') || '[]');
}

function saveTrainers(list) {
  localStorage.setItem('pp_trainers', JSON.stringify(list));
}

function getActiveTrainer() {
  return parseInt(sessionStorage.getItem('active_trainer'));
}

// ── TOAST ──
function showToast(message) {
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(function() { toast.classList.add('show'); }, 10);

  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 400);
  }, 2000);
}

// ── CREATE ──
document.getElementById('create-btn').addEventListener('click', createTrainer);
document.getElementById('trainer-name-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') createTrainer();
});

function createTrainer() {
  var name = document.getElementById('trainer-name-input').value.trim();
  if (!name) return showToast('⚠️ Enter trainer name');

  var list = getTrainers();

  list.push({
    id: Date.now(),
    name: name,
    wins: 0,
    losses: 0,
    pokemon: [],
    party: []
  });

  saveTrainers(list);
  document.getElementById('trainer-name-input').value = '';

  renderTrainers();
  showToast('✅ Trainer created');
}

// ── RENDER ──
function renderTrainers(filter) {
  var trainers = getTrainers();
  var grid     = document.getElementById('trainers-grid');
  var empty    = document.getElementById('empty-state');
  var activeId = getActiveTrainer();

  if (filter) {
    trainers = trainers.filter(function(t) {
      return t.name.toLowerCase().includes(filter.toLowerCase());
    });
  }

  document.getElementById('trainer-count').textContent =
    trainers.length + ' Trainer' + (trainers.length !== 1 ? 's' : '');

  // clear old
  Array.from(grid.children).forEach(function(el) {
    if (el.id !== 'empty-state') el.remove();
  });

  if (trainers.length === 0) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  trainers.forEach(function(trainer) {
    grid.insertBefore(buildCard(trainer, activeId), empty);
  });
}

// ── CARD ──
function buildCard(trainer, activeId) {

  var isActive = (trainer.id === activeId);

  var card = document.createElement('div');
  card.className = 'trainer-card';

  var partyHTML = '';
  if (trainer.party && trainer.party.length > 0) {
    trainer.party.slice(0, 3).forEach(function(p) {
      partyHTML += '<img src="' + SPRITE + p.id + '.png">';
    });
  } else {
    partyHTML = '<span class="party-empty">No party yet</span>';
  }

  card.innerHTML =
    '<div class="trainer-card__top">' +
      '<img class="trainer-card__avatar" src="https://ui-avatars.com/api/?name=' + encodeURIComponent(trainer.name) + '&background=ffd6e7">' +
      '<div>' +
        '<div class="trainer-card__name">' + trainer.name + '</div>' +
        '<div class="trainer-card__id">ID #' + String(trainer.id).slice(-4) + '</div>' +
      '</div>' +
    '</div>' +

    '<div class="trainer-card__badges">' +
      '<span class="badge badge--wins">🏆 ' + (trainer.wins || 0) + '</span>' +
      '<span class="badge badge--losses">💔 ' + (trainer.losses || 0) + '</span>' +
      '<span class="badge badge--pokemon">⚡ ' + (trainer.pokemon || []).length + '</span>' +
    '</div>' +

    '<div class="trainer-card__party">' + partyHTML + '</div>' +

    '<div class="trainer-card__actions">' +
      '<button class="btn btn--primary select-btn">' + (isActive ? 'Selected' : 'Select') + '</button>' +
      '<button class="btn--edit">✏️ Edit</button>' +
      '<button class="btn--delete">🗑️ Delete</button>' +
      '<button class="btn--edit">👤 Profile</button>' +
    '</div>';

  // ── SELECT (FIXED) ──
  card.querySelector('.select-btn').addEventListener('click', function() {
    sessionStorage.setItem('active_trainer', trainer.id);
    renderTrainers(document.getElementById('search-input').value);
    showToast('🎯 ' + trainer.name + ' selected');
  });

  // ── PROFILE ──
  card.querySelectorAll('.btn--edit')[1].addEventListener('click', function() {
    sessionStorage.setItem('viewing_trainer', trainer.id);
    window.location.href = 'trainer-profile.html';
  });

  // ── EDIT ──
  card.querySelectorAll('.btn--edit')[0].addEventListener('click', function() {
    openEdit(trainer.id);
  });

  // ── DELETE ──
  card.querySelector('.btn--delete').addEventListener('click', function() {
    deleteTrainer(trainer.id);
  });

  return card;
}

// ── EDIT (unchanged) ──
var editingId = null;

function openEdit(id) {
  var trainer = getTrainers().find(function(t) { return t.id === id; });
  editingId = id;
  document.getElementById('edit-name-input').value = trainer.name;
  document.getElementById('modal-mon').src = randArt();
  document.getElementById('edit-modal').classList.add('open');
}

document.getElementById('save-edit-btn').addEventListener('click', function() {
  var newName = document.getElementById('edit-name-input').value.trim();

  var list = getTrainers();
  var t = list.find(x => x.id === editingId);
  t.name = newName;

  saveTrainers(list);
  renderTrainers();
  closeModal();
});

function closeModal() {
  document.getElementById('edit-modal').classList.remove('open');
}

document.getElementById('modal-close').addEventListener('click', closeModal);

// ── DELETE ──
function deleteTrainer(id) {
  var list = getTrainers().filter(x => x.id !== id);
  saveTrainers(list);

  if (getActiveTrainer() === id) {
    sessionStorage.removeItem('active_trainer');
  }

  renderTrainers();
}

// ── SEARCH ──
document.getElementById('search-input').addEventListener('input', function() {
  renderTrainers(this.value);
});

// ── INIT ──
renderTrainers();