/* ============================================================
   main.js — PokeProgrammers Home Page
   3 jobs: mobile nav, stats bar, leaderboard
   ============================================================ */


// ── 1. MOBILE NAV TOGGLE ──────────────────────────────────────
// When hamburger is clicked, add/remove "open" class on mobile menu
document.querySelector('.navbar__hamburger').addEventListener('click', function () {
  document.querySelector('.mobile-nav').classList.toggle('open');
});


// ── 2. STATS BAR ──────────────────────────────────────────────
// Read trainers and battles from localStorage, count and display
function loadStats() {
  const trainers = JSON.parse(localStorage.getItem('pp_trainers') || '[]');
  const battles  = JSON.parse(localStorage.getItem('pp_battles')  || '[]');

  // Count total pokemon and parties across all trainers
  let totalPokemon = 0;
  let totalParties = 0;
  trainers.forEach(function(t) {
    totalPokemon += (t.pokemon || []).length;
    if ((t.party || []).length > 0) totalParties++;
  });

  // Animate each stat number counting up from 0
  animateCount('stat-trainers', trainers.length);
  animateCount('stat-pokemon',  totalPokemon);
  animateCount('stat-battles',  battles.length);
  animateCount('stat-parties',  totalParties);
}

// Counts a number up from 0 to "target" over 1.5 seconds
function animateCount(elementId, target) {
  var el       = document.getElementById(elementId);
  var start    = 0;
  var duration = 1500; // ms
  var step     = Math.ceil(target / (duration / 16)); // increment per frame

  // Only animate if element exists and target is more than 0
  if (!el || target === 0) return;

  var timer = setInterval(function () {
    start += step;
    if (start >= target) {
      el.textContent = target; // snap to final value
      clearInterval(timer);
    } else {
      el.textContent = start;
    }
  }, 16);
}

// Use IntersectionObserver to trigger stats only when stats bar is visible
var statsBar = document.querySelector('.stats-bar');
var statsLoaded = false; // make sure it only runs once

var observer = new IntersectionObserver(function(entries) {
  if (entries[0].isIntersecting && !statsLoaded) {
    statsLoaded = true;
    loadStats();
  }
});
observer.observe(statsBar);


// ── 3. MINI LEADERBOARD ───────────────────────────────────────
// Read trainers, sort by wins, show top 3
function loadLeaderboard() {
  var trainers = JSON.parse(localStorage.getItem('pp_trainers') || '[]');

  // Sort by wins descending, take top 3
  var top3 = trainers.sort(function(a, b) {
    return (b.wins || 0) - (a.wins || 0);
  }).slice(0, 3);

  // Fill in each podium card
  top3.forEach(function(trainer, i) {
    var n = i + 1; // card numbers are 1, 2, 3
    var nameEl   = document.getElementById('leader-name-'   + n);
    var winsEl   = document.getElementById('leader-wins-'   + n);
    var avatarEl = document.getElementById('leader-avatar-' + n);

    if (nameEl)   nameEl.textContent = trainer.name || '---';
    if (winsEl)   winsEl.textContent = (trainer.wins || 0) + ' Wins';
    if (avatarEl) avatarEl.src = 'https://ui-avatars.com/api/?name='
      + encodeURIComponent(trainer.name || 'T')
      + '&background=ffd6e7&color=333&size=128&bold=true&rounded=true';
  });
}

loadLeaderboard();