/* ============================================================
   pokedex.js — Pokédex page
   ============================================================ */

var API = 'https://pokeapi.co/api/v2/pokemon/';
var ART = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';

var currentPokemon = null;

// ── HELPERS ──
function randId() {
  return Math.floor(Math.random() * 151) + 1; // first 151 for cleaner random set
}

function randArt() {
  return ART + randId() + '.png';
}

function showEmpty(show) {
  document.getElementById('empty-state').style.display = show ? 'block' : 'none';
}

function clearCards() {
  var grid = document.getElementById('pokemon-grid');
  var empty = document.getElementById('empty-state');

  Array.from(grid.children).forEach(function(el) {
    if (el.id !== 'empty-state') el.remove();
  });

  empty.style.display = 'none';
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
document.querySelector('.navbar__hamburger').addEventListener('click', function () {
  document.querySelector('.mobile-nav').classList.toggle('open');
});

// ── HEADER ART ──
document.querySelector('.page-header__mon.left').src = randArt();
document.querySelector('.page-header__mon.right').src = randArt();
document.getElementById('empty-mon').src = randArt();

// ── ACTIVE TRAINER ──
function getActiveTrainerId() {
  var active = sessionStorage.getItem('active_trainer');

  if (active) return parseInt(active);

  // fallback: if profile page had set viewing_trainer earlier
  var viewing = sessionStorage.getItem('viewing_trainer');
  if (viewing) {
    sessionStorage.setItem('active_trainer', viewing);
    return parseInt(viewing);
  }

  return null;
}

function loadActiveTrainer() {
  var badge = document.getElementById('active-trainer-badge');
  var trainerId = getActiveTrainerId();
  var trainers = JSON.parse(localStorage.getItem('pp_trainers') || '[]');

  if (!trainerId) {
    badge.textContent = 'Active Trainer: None selected';
    return;
  }

  var trainer = trainers.find(function(t) {
    return t.id === trainerId;
  });

  if (!trainer) {
    badge.textContent = 'Active Trainer: None selected';
    return;
  }

  badge.textContent = 'Active Trainer: ' + trainer.name;
}

// ── SEARCH DATA HELPERS ──
function searchByPartialName(query) {
  fetch('https://pokeapi.co/api/v2/pokemon?limit=1302')
    .then(function(res) {
      return res.json();
    })
    .then(function(data) {
      var names = data.results.filter(function(p) {
        return p.name.indexOf(query) !== -1;
      }).slice(0, 12);

      clearCards();

      if (names.length === 0) {
        showEmpty(true);
        return;
      }

      names.forEach(function(p) {
        fetchPokemon(p.name);
      });
    })
    .catch(function() {
      showEmpty(true);
    });
}

// ── FETCH POKEMON ──
function fetchPokemon(query) {
  fetch(API + query)
    .then(function(res) {
      if (!res.ok) throw new Error('Not found');
      return res.json();
    })
    .then(function(data) {
      renderCard(data);
    })
    .catch(function() {
      // handled elsewhere when needed
    });
}

function loadRandomPokemon() {
  clearCards();

  var used = {};

  while (Object.keys(used).length < 9) {
    used[randId()] = true;
  }

  Object.keys(used).forEach(function(id) {
    fetchPokemon(id);
  });
}

// ── RENDER CARD ──
function renderCard(pokemon) {
  var grid = document.getElementById('pokemon-grid');

  var card = document.createElement('div');
  card.className = 'pokedex-card';

  var image =
    (pokemon.sprites.other &&
     pokemon.sprites.other['official-artwork'] &&
     pokemon.sprites.other['official-artwork'].front_default)
      ? pokemon.sprites.other['official-artwork'].front_default
      : pokemon.sprites.front_default;

  var typesHTML = '';
  pokemon.types.forEach(function(t) {
    var typeName = t.type.name;
    typesHTML += '<span class="type-badge" style="background:' + typeColor(typeName) + '">' + typeName + '</span>';
  });

  card.innerHTML =
    '<img class="pokedex-card__img" src="' + image + '" alt="' + pokemon.name + '">' +
    '<div class="pokedex-card__id">#' + pokemon.id + '</div>' +
    '<div class="pokedex-card__name">' + pokemon.name + '</div>' +
    '<div class="pokedex-card__types">' + typesHTML + '</div>';

  card.addEventListener('click', function() {
    openModal(pokemon);
  });

  grid.insertBefore(card, document.getElementById('empty-state'));
}

// ── SEARCH EVENTS ──
document.getElementById('search-btn').addEventListener('click', handleSearch);
document.getElementById('search-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') handleSearch();
});

function handleSearch() {
  var query = document.getElementById('search-input').value.trim().toLowerCase();

  clearCards();

  if (!query) {
    loadRandomPokemon();
    return;
  }

  searchByPartialName(query);
}

// ── MODAL ──
function openModal(pokemon) {
  currentPokemon = pokemon;

  var image =
    (pokemon.sprites.other &&
     pokemon.sprites.other['official-artwork'] &&
     pokemon.sprites.other['official-artwork'].front_default)
      ? pokemon.sprites.other['official-artwork'].front_default
      : pokemon.sprites.front_default;

  document.getElementById('modal-img').src = image;
  document.getElementById('modal-img').alt = pokemon.name;
  document.getElementById('modal-id').textContent = '#' + pokemon.id;
  document.getElementById('modal-name').textContent = pokemon.name;

  document.getElementById('stat-hp').textContent = pokemon.stats[0].base_stat;
  document.getElementById('stat-attack').textContent = pokemon.stats[1].base_stat;
  document.getElementById('stat-defense').textContent = pokemon.stats[2].base_stat;

  var typesBox = document.getElementById('modal-types');
  typesBox.innerHTML = '';

  pokemon.types.forEach(function(t) {
    var span = document.createElement('span');
    span.className = 'type-badge';
    span.textContent = t.type.name;
    span.style.background = typeColor(t.type.name);
    typesBox.appendChild(span);
  });

  document.getElementById('pokemon-modal').classList.add('open');
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('pokemon-modal').addEventListener('click', function(e) {
  if (e.target.id === 'pokemon-modal') closeModal();
});

function closeModal() {
  document.getElementById('pokemon-modal').classList.remove('open');
}

// ── CATCH ──
document.getElementById('catch-btn').addEventListener('click', function() {

  var trainerId = getActiveTrainerId();
  if (!trainerId) {
    alert('Select a trainer first');
    return;
  }

  var trainers = JSON.parse(localStorage.getItem('pp_trainers') || '[]');
  var t = trainers.find(x => x.id === trainerId);

  if (!t) return;

  var p = currentPokemon;

  showCatchAnimation(p, function() {

    var newPokemon = {
      id: p.id,
      name: p.name,
      level: Math.floor(Math.random()*5)+1,
      types: p.types.map(x => x.type.name)
    };

    if (!t.pokemon) t.pokemon = [];
    t.pokemon.push(newPokemon);

    localStorage.setItem('pp_trainers', JSON.stringify(trainers));

  });

function showCatchAnimation(pokemon, onSuccess) {

  var overlay = document.getElementById('catch-overlay');
  var poke = document.getElementById('catch-pokemon');
  var ball = document.getElementById('catch-ball');
  var flash = document.getElementById('catch-flash');
  var text = document.getElementById('catch-text');

  // image
  var img =
    (pokemon.sprites.other &&
     pokemon.sprites.other['official-artwork'] &&
     pokemon.sprites.other['official-artwork'].front_default)
    ? pokemon.sprites.other['official-artwork'].front_default
    : pokemon.sprites.front_default;

  poke.src = img;

  overlay.classList.add('show');

  // STEP 1: flash
  setTimeout(() => flash.classList.add('active'), 200);

  // STEP 2: capture
  setTimeout(() => poke.classList.add('capture'), 400);

  // STEP 3: ball drop
  setTimeout(() => ball.classList.add('drop'), 700);

  // STEP 4: shakes
  setTimeout(() => ball.classList.add('shake'), 1100);
  setTimeout(() => ball.classList.remove('shake'), 1600);

  setTimeout(() => ball.classList.add('shake'), 1800);
  setTimeout(() => ball.classList.remove('shake'), 2300);

  setTimeout(() => ball.classList.add('shake'), 2500);
  setTimeout(() => ball.classList.remove('shake'), 3000);

  // STEP 5: success chance (90%)
  setTimeout(() => {

    var success = Math.random() < 0.9;

    if (success) {
      text.textContent = pokemon.name + ' was caught!';
      if (onSuccess) onSuccess();
    } else {
      text.textContent = pokemon.name + ' broke free!';
    }

    text.classList.add('show');

  }, 3200);

  // RESET
  setTimeout(() => {
    overlay.classList.remove('show');
    poke.classList.remove('capture');
    text.classList.remove('show');
    flash.classList.remove('active');
  }, 4500);
}
showCatchAnimation(currentPokemon);
closeModal();
loadActiveTrainer();
});

// ── RANDOM BUTTON ──
document.getElementById('random-btn').addEventListener('click', function() {
  document.getElementById('search-input').value = '';
  loadRandomPokemon();
});

// ── INIT ──
loadActiveTrainer();
loadRandomPokemon();