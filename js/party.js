
var ART = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
var SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';

function randId() {
  return Math.floor(Math.random() * 898) + 1;
}

function randArt() {
  return ART + randId() + '.png';
}

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

function showToast(message) {
  var toast = document.getElementById('party-toast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(function() {
    toast.classList.remove('show');
  }, 1800);
}

function typeColor(type) {
  var colors = {
    normal:   '#A8A77A',
    fire:     '#EE8130',
    water:    '#6390F0',
    electric: '#F7D02C',
    grass:    '#7AC74C',
    ice:      '#96D9D6',
    fighting: '#C22E28',
    poison:   '#A33EA1',
    ground:   '#E2BF65',
    flying:   '#A98FF3',
    psychic:  '#F95587',
    bug:      '#A6B91A',
    rock:     '#B6A136',
    ghost:    '#735797',
    dragon:   '#6F35FC',
    dark:     '#705746',
    steel:    '#B7B7CE',
    fairy:    '#D685AD'
  };
  return colors[type] || '#999';
}

// ── MOBILE NAV ──
document.querySelector('.navbar__hamburger').addEventListener('click', function() {
  document.querySelector('.mobile-nav').classList.toggle('open');
});

// ── HEADER / EMPTY IMAGES ──
document.querySelector('.page-header__mon.left').src = randArt();
document.querySelector('.page-header__mon.right').src = randArt();
document.getElementById('collection-empty-mon').src = randArt();
document.getElementById('missing-trainer-mon').src = randArt();

// ── LOAD PAGE ──
function loadPage() {
  var trainerId = getActiveTrainerId();
  var allTrainers = getTrainers();

  if (!trainerId) {
    showNoTrainer();
    return;
  }

  var trainer = allTrainers.find(function(t) {
    return t.id === trainerId;
  });

  if (!trainer) {
    showNoTrainer();
    return;
  }

  if (!trainer.party) trainer.party = [];
  if (!trainer.pokemon) trainer.pokemon = [];

  document.getElementById('active-trainer-badge').textContent = 'Active Trainer: ' + trainer.name;
  document.getElementById('missing-trainer').style.display = 'none';
  document.getElementById('party-layout').style.display = 'grid';

  renderParty(trainer);
  renderCollection(trainer);
}

function showNoTrainer() {
  document.getElementById('party-layout').style.display = 'none';
  document.getElementById('missing-trainer').style.display = 'block';
  document.getElementById('active-trainer-badge').textContent = 'Active Trainer: None selected';
}

// ── PARTY ──
function renderParty(trainer) {
  var grid = document.getElementById('party-grid');
  grid.innerHTML = '';

  var party = trainer.party || [];

  for (var i = 0; i < 6; i++) {
    var slot = document.createElement('div');

    if (party[i]) {
      slot.className = 'party-slot party-slot--filled';

      slot.innerHTML =
        '<img class="party-slot__img" src="' + SPRITE + party[i].id + '.png" alt="' + party[i].name + '">' +
        '<div class="party-slot__info">' +
          '<div class="party-slot__name">' + party[i].name + '</div>' +
          '<div class="party-slot__meta">Lv. ' + (party[i].level || 1) + '</div>' +
        '</div>' +
        '<button class="party-slot__remove">Remove</button>';

      (function(pokemonId) {
        slot.querySelector('.party-slot__remove').addEventListener('click', function() {
          removeFromParty(trainer.id, pokemonId);
        });
      })(party[i].id);

    } else {
      slot.className = 'party-slot';

      slot.innerHTML =
        '<div class="party-slot__empty">' + (i + 1) + '</div>' +
        '<div class="party-slot__info">' +
          '<div class="party-slot__name">Empty Slot</div>' +
          '<div class="party-slot__meta">Add a Pokémon from your collection</div>' +
        '</div>';
    }

    grid.appendChild(slot);
  }
}

// ── COLLECTION ──
function renderCollection(trainer) {
  var grid = document.getElementById('collection-grid');
  var empty = document.getElementById('collection-empty');

  grid.innerHTML = '';

  if (!trainer.pokemon || trainer.pokemon.length === 0) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  trainer.pokemon.forEach(function(p) {
    var inParty = trainer.party.some(function(x) {
      return x.id === p.id; // no duplicate species in party
    });

    var card = document.createElement('div');
    card.className = 'collection-card';

    var typesHTML = '';
    (p.types || []).forEach(function(type) {
      typesHTML += '<span class="type-badge-sm" style="background:' + typeColor(type) + '">' + type + '</span>';
    });

    card.innerHTML =
      '<img class="collection-card__img" src="' + SPRITE + p.id + '.png" alt="' + p.name + '">' +
      '<div class="collection-card__name">' + p.name + '</div>' +
      '<div class="collection-card__level">Lv. ' + (p.level || 1) + '</div>' +
      '<div class="collection-card__types">' + typesHTML + '</div>' +
      '<button class="collection-card__btn" ' + (inParty ? 'disabled' : '') + '>' + (inParty ? 'Already in Party' : 'Add to Party') + '</button>';

    if (!inParty) {
      card.querySelector('.collection-card__btn').addEventListener('click', function() {
        addToParty(trainer.id, p);
      });
    }

    grid.appendChild(card);
  });
}

// ── ADD / REMOVE ──
function addToParty(trainerId, pokemon) {
  var trainers = getTrainers();
  var trainer = trainers.find(function(t) {
    return t.id === trainerId;
  });

  if (!trainer) return;

  if (!trainer.party) trainer.party = [];

  if (trainer.party.length >= 6) {
    showToast('Party is full!');
    return;
  }

  var alreadyInParty = trainer.party.some(function(p) {
    return p.id === pokemon.id;
  });

  if (alreadyInParty) {
    showToast(pokemon.name + ' is already in the party!');
    return;
  }

  trainer.party.push(pokemon);
  saveTrainers(trainers);
  renderParty(trainer);
  renderCollection(trainer);
  showToast(pokemon.name + ' added to party!');
}

function removeFromParty(trainerId, pokemonId) {
  var trainers = getTrainers();
  var trainer = trainers.find(function(t) {
    return t.id === trainerId;
  });

  if (!trainer) return;

  trainer.party = trainer.party.filter(function(p) {
    return p.id !== pokemonId;
  });

  saveTrainers(trainers);
  renderParty(trainer);
  renderCollection(trainer);
  showToast('Removed from party');
}

// ── INIT ──
loadPage();
