/**
 * Main Application Engine for Perc Is Right Host Helper Dashboard
 * Built using ES Modules (vanjs-core & vanjs-ext).
 *
 * Architecture: teams = vanX.reactive([]) makes every team property a
 * reactive van.state under the hood. Reading team.totalScore inside a
 * VanJS getter (() => team.totalScore) auto-subscribes to changes.
 * Writing team.totalScore = X triggers all subscribed DOM nodes.
 * No manual "version counter" needed.
 */

import van from "vanjs-core";
import * as vanX from "vanjs-ext";

import { slidingScale } from "./minigames/sliding-scale.js";
import { highLowWheel } from "./minigames/high-low-wheel.js";
import { shellGame } from "./minigames/shell-game.js";
import { rangeFinder } from "./minigames/range-finder.js";
import { clockGame } from "./minigames/clock-game.js";
import { tenChances } from "./minigames/ten-chances.js";

window.MiniGameRegistry = {
  'sliding-scale': slidingScale,
  'high-low-wheel': highLowWheel,
  'shell-game': shellGame,
  'range-finder': rangeFinder,
  'clock-game': clockGame,
  'ten-chances': tenChances
};

const { div, span, input, tr, td, strong } = van.tags;
const STORAGE_KEY = 'perc_is_right_game_state_v3';
const DEFAULT_NAMES = ['Team Alpha', 'Team Bravo', 'Team Charlie', 'Team Delta', 'Team Echo', 'Team Foxtrot'];
const DEFAULT_COLORS = ['#ffd700', '#00f2fe', '#f093fb', '#00e676', '#ff8c00', '#ff0844'];

// ----------------------------------------------------
// REACTIVE STATE
// ----------------------------------------------------
const currentStep = van.state(1);
const roundNumber = van.state(1);
const teams = vanX.reactive([]);
const isLeaderboardOpen = van.state(false);
const bidsLocked = van.state(false);
const lastCalculatedRound = van.state(0);

const itemName = van.state('');
const actualPrice = van.state(0);
const minigameId = van.state('sliding-scale');
const winningTeamId = van.state(null);

let minigameHostData = {};
const minigameResult = van.state(null);

// Helper to build a fresh team object
const makeTeam = (idx, overrides = {}) => ({
  id: overrides.id || ('team_' + idx),
  name: overrides.name || DEFAULT_NAMES[idx % DEFAULT_NAMES.length],
  color: overrides.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
  totalScore: overrides.totalScore || 0,
  bid: null,
  bidScore: 0,
  gotClosest: false,
  closestVal: 0,
  mgVal: 0,
  mgLabel: 'Mini-Game Bonus:',
  totalRound: 0
});

// ----------------------------------------------------
// STATE UTILITIES
// ----------------------------------------------------
const saveState = () => {
  const snapshot = vanX.compact(teams).map(t => ({
    id: t.id, name: t.name, color: t.color, totalScore: t.totalScore
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    teams: snapshot,
    roundNumber: roundNumber.val,
    lastCalculatedRound: lastCalculatedRound.val
  }));
};

const loadState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    if (parsed?.teams?.length > 0) {
      vanX.replace(teams, parsed.teams.map((t, idx) => makeTeam(idx, {
        id: t.id,
        name: (t.name && t.name.trim() && t.name.trim() !== 'Team') ? t.name : undefined,
        color: t.color,
        totalScore: parseFloat(t.totalScore) || 0
      })));
      roundNumber.val = parsed.roundNumber || 1;
      lastCalculatedRound.val = parsed.lastCalculatedRound || 0;
    }
  } catch (e) { /* ignore corrupt state */ }
};

const syncTeamsCount = (count) => {
  while (teams.length < count) {
    teams.push(makeTeam(teams.length));
  }
  if (teams.length > count) teams.splice(count);
};

const resetGame = () => {
  if (confirm('Are you sure you want to reset the entire game and clear all scores?')) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
};

const goToStep = (stepNum) => {
  currentStep.val = stepNum;

  if (stepNum === 2) {
    // Reset host form
    const priceInput = document.getElementById('actual-price-input');
    const itemInput = document.getElementById('item-name-input');
    if (priceInput) priceInput.value = '';
    if (itemInput) itemInput.value = '';
    // Clear bids
    bidsLocked.val = false;
    for (let i = 0; i < teams.length; i++) teams[i].bid = null;
    renderHostMinigameConfig();
  } else if (stepNum === 3) {
    // Clear bids and minigame area
    bidsLocked.val = false;
    for (let i = 0; i < teams.length; i++) teams[i].bid = null;
    const activeArea = document.getElementById('active-minigame-area');
    if (activeArea) { activeArea.style.display = 'none'; activeArea.innerHTML = ''; }
  } else if (stepNum === 4) {
    calculateRoundResults();
  }
};

// ----------------------------------------------------
// DECLARATIVE BINDINGS
// All getters read reactive team properties directly.
// vanX.reactive() makes each property a van.state.
// ----------------------------------------------------
const bindDeclarativeElements = () => {
  // 1. Step bar indicators & section visibility
  for (let i = 1; i <= 4; i++) {
    const indicator = document.getElementById(`step-indicator-${i}`);
    const section = document.getElementById(`step-${i}-section`);
    if (indicator) van.derive(() => {
      indicator.className = `step-item ${i < currentStep.val ? 'completed' : i === currentStep.val ? 'active' : ''}`;
    });
    if (section) van.derive(() => {
      section.style.display = currentStep.val === i ? 'block' : 'none';
    });
  }

  // 2. Header team score chips — reads team.name and team.totalScore reactively
  const headerScores = document.getElementById('header-team-scores');
  if (headerScores) {
    vanX.list(headerScores, teams, ({val: t}) => div({ class: 'header-score-chip' },
      span({ class: 'chip-dot', style: `background:${t.color};` }),
      span({ class: 'chip-name' }, () => `${t.name}:`),
      span({ class: 'chip-score' }, () => `$${Math.round(t.totalScore)}`)
    ));
  }

  // 3. Step 1: Team name inputs
  const teamsGrid = document.getElementById('teams-grid-container');
  if (teamsGrid) {
    vanX.list(teamsGrid, teams, ({val: team}) => div({ class: 'team-input-card' },
      div({ class: 'team-color-badge', style: `width:12px;height:12px;border-radius:50%;background:${team.color};display:inline-block;margin-right:6px;` }),
      input({
        type: 'text', class: 'team-name-input',
        value: () => team.name,
        placeholder: 'Team Name',
        oninput: (e) => { team.name = e.target.value; }
      })
    ));
  }

  // 4. Step 3: Round & item heading
  const pubRoundEl = document.getElementById('pub-round-num');
  if (pubRoundEl) van.derive(() => pubRoundEl.textContent = roundNumber.val);
  const pubItemEl = document.getElementById('pub-item-name');
  if (pubItemEl) van.derive(() => pubItemEl.textContent = itemName.val);

  // 5. Step 3: Bidding cards
  const biddingContainer = document.getElementById('bidding-teams-container');
  if (biddingContainer) {
    vanX.list(biddingContainer, teams, ({val: team}) => div({
      class: () => `bidding-card${bidsLocked.val ? ' locked' : ''}`,
      id: `bidding-card-${team.id}`
    },
      div({ class: 'team-name-tag' },
        span({ style: `width:12px;height:12px;border-radius:50%;background:${team.color};display:inline-block;` }),
        () => team.name
      ),
      div({ class: 'bid-input-wrap' },
        span({ class: 'currency-symbol' }, '$'),
        input({
          type: 'number', class: 'bid-input',
          placeholder: '0.00', step: '0.01', min: '0',
          onkeydown: (e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); },
          disabled: () => bidsLocked.val,
          value: () => team.bid ?? '',
          oninput: (e) => {
            const val = e.target.value.trim();
            const num = parseFloat(val);
            team.bid = (val === '' || isNaN(num) || num < 0) ? null : num;
          }
        })
      )
    ));
  }

  // 6. Step 4: Actual price & recap
  const priceTag = document.getElementById('reveal-actual-price');
  if (priceTag) van.derive(() => priceTag.textContent = `$${Math.round(actualPrice.val)}`);
  const recapTag = document.getElementById('minigame-recap-text');
  if (recapTag) van.derive(() => recapTag.textContent = minigameResult.val?.outcomeText || 'No Mini-Game Played');

  // 7. Step 4: Results breakdown cards — all getters read reactive properties
  const resultsContainer = document.getElementById('round-results-grid');
  if (resultsContainer) {
    vanX.list(resultsContainer, teams, ({val: team}) => {
      return div({ class: () => `result-card${team.gotClosest ? ' winner' : ''}` },
        () => team.gotClosest
          ? span({ class: 'closest-badge' }, () => `🏆 +$${Math.round(team.closestVal)} Closest Under!`)
          : '',
        div({ class: 'team-name-tag' },
          span({ style: `width:14px;height:14px;border-radius:50%;background:${team.color};display:inline-block;` }),
          () => team.name
        ),
        div({ class: 'score-breakdown-list' },
          div({ class: 'score-row' }, span('Team Bid:'),
            strong(() => team.bid != null ? `$${Math.round(team.bid)}` : '$0')),
          div({ class: 'score-row' }, span('Bid Score ($):'),
            strong(() => `$${Math.round(team.bidScore)}`)),
          div({ class: 'score-row' }, span('Closest Bonus (+5%):'),
            strong(() => team.gotClosest ? `+$${Math.round(team.closestVal)}` : '$0')),
          div({ class: 'score-row' },
            span(() => team.mgLabel),
            strong(() => {
              const isWinner = (team.id === winningTeamId.val);
              const isFailed = (minigameResult.val?.success === false);
              if (isWinner || (isFailed && team.mgVal > 0)) {
                const sign = team.mgVal >= 0 ? '+' : '-';
                return `${sign}$${Math.abs(team.mgVal)}`;
              }
              return '$0';
            })),
          div({ class: 'score-row total-row' }, span('Total Round Score:'),
            span(() => `$${Math.round(team.totalRound)}`))
        )
      );
    });
  }

  // 8. Leaderboard modal table — rebuilt whenever any team.totalScore changes
  const tbody = document.getElementById('leaderboard-table-body');
  if (tbody) {
    van.derive(() => {
      // Reading every team's totalScore subscribes to all of them
      const data = [];
      for (let i = 0; i < teams.length; i++) {
        data.push({ name: teams[i].name, color: teams[i].color, totalScore: teams[i].totalScore });
      }
      data.sort((a, b) => b.totalScore - a.totalScore);

      tbody.innerHTML = '';
      data.forEach((t, idx) => {
        van.add(tbody, tr(
          td(span({ class: `rank-badge ${idx < 3 ? `rank-${idx + 1}` : ''}` }, idx + 1)),
          td({ style: 'font-weight:700;' },
            span({ style: `width:10px;height:10px;border-radius:50%;background:${t.color};display:inline-block;margin-right:6px;` }),
            t.name
          ),
          td({ style: 'font-weight:800;font-size:1.1rem;' }, `$${Math.round(t.totalScore)}`)
        ));
      });
    });
  }
};

// ----------------------------------------------------
// STEP CONTROLS / EVENT HANDLERS
// ----------------------------------------------------
const renderHostMinigameConfig = () => {
  const selectEl = document.getElementById('minigame-select');
  const priceInput = document.getElementById('actual-price-input');
  const configContainer = document.getElementById('minigame-host-config-container');
  if (!selectEl || !configContainer) return;
  const handler = window.MiniGameRegistry[selectEl.value];
  const price = parseFloat(priceInput?.value || 100) || 100;
  if (handler?.renderHostConfig) {
    handler.renderHostConfig(configContainer, price);
  } else {
    configContainer.innerHTML = '';
  }
};

const setupControls = () => {
  const selectEl = document.getElementById('minigame-select');
  const beginBtn = document.getElementById('begin-public-round-btn');
  const countInput = document.getElementById('team-count-input');
  const startBtn = document.getElementById('start-game-btn');
  const lockBtn = document.getElementById('lock-bids-btn');
  const nextBtn = document.getElementById('next-round-btn');
  const leaderBtn = document.getElementById('open-leaderboard-btn');
  const resetBtn = document.getElementById('reset-game-btn');
  const burgerBtn = document.getElementById('hamburger-btn');
  const dropdown = document.getElementById('hamburger-dropdown');

  // Header dropdown
  if (burgerBtn && dropdown) {
    burgerBtn.onclick = (e) => { e.stopPropagation(); dropdown.classList.toggle('show'); };
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== burgerBtn) dropdown.classList.remove('show');
    });
  }
  if (leaderBtn) leaderBtn.onclick = () => { dropdown?.classList.remove('show'); isLeaderboardOpen.val = true; };
  if (resetBtn) resetBtn.onclick = () => { dropdown?.classList.remove('show'); resetGame(); };

  // Step 1
  if (countInput) {
    countInput.value = teams.length || 4;
    countInput.oninput = (e) => syncTeamsCount(Math.max(2, Math.min(6, parseInt(e.target.value) || 4)));
  }
  if (startBtn) {
    startBtn.onclick = () => {
      // Sanitize names: if user left it blank, assign default
      for (let i = 0; i < teams.length; i++) {
        const name = teams[i].name;
        if (!name || !name.trim() || name.trim() === 'Team') {
          teams[i].name = DEFAULT_NAMES[i % DEFAULT_NAMES.length];
        }
      }
      saveState();
      goToStep(2);
    };
  }

  // Step 2
  if (selectEl) selectEl.onchange = renderHostMinigameConfig;
  if (beginBtn) {
    beginBtn.onclick = () => {
      const priceInput = document.getElementById('actual-price-input');
      const itemInput = document.getElementById('item-name-input');
      const price = parseFloat(priceInput?.value || 0);
      if (isNaN(price) || price <= 0) return alert('Please enter a valid actual price greater than $0!');

      itemName.val = itemInput?.value.trim() || `Item #${roundNumber.val}`;
      actualPrice.val = price;
      minigameId.val = selectEl?.value || 'sliding-scale';

      const handler = window.MiniGameRegistry[minigameId.val];
      const configContainer = document.getElementById('minigame-host-config-container');
      minigameHostData = (handler?.getHostData && configContainer) ? handler.getHostData(configContainer) : {};
      minigameResult.val = null;
      winningTeamId.val = null;
      goToStep(3);
    };
  }

  // Step 3
  if (lockBtn) {
    van.derive(() => { lockBtn.style.display = bidsLocked.val ? 'none' : 'inline-flex'; });

    lockBtn.onclick = () => {
      const bidInputs = document.querySelectorAll('#bidding-teams-container .bid-input');
      let valid = true;

      for (let i = 0; i < teams.length; i++) {
        const inp = bidInputs[i];
        const raw = inp ? inp.value.trim() : '';
        const val = parseFloat(raw);
        if (raw === '' || isNaN(val) || val < 0) { valid = false; teams[i].bid = null; }
        else { teams[i].bid = val; }
      }
      if (!valid) return alert('Please enter valid numeric bids for all teams!');

      const bidValues = [];
      for (let i = 0; i < teams.length; i++) bidValues.push(teams[i].bid);
      if (new Set(bidValues).size < bidValues.length) {
        return alert('Duplicate bids are not allowed! Each team must enter a unique dollar amount to prevent ties.');
      }

      bidsLocked.val = true;
      const price = actualPrice.val;

      // Find winner: closest under (fallback to closest overall)
      let winningTeam = null, closestUnderDiff = Infinity, closestOverallDiff = Infinity, closestOverallTeam = teams[0];
      for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        const diff = Math.abs(price - team.bid);
        if (diff < closestOverallDiff) { closestOverallDiff = diff; closestOverallTeam = team; }
        if (team.bid <= price) {
          const underDiff = price - team.bid;
          if (underDiff < closestUnderDiff) { closestUnderDiff = underDiff; winningTeam = team; }
        }
      }
      winningTeam = winningTeam || closestOverallTeam;
      winningTeamId.val = winningTeam.id;

      // Show minigame
      const activeArea = document.getElementById('active-minigame-area');
      const revealBtn = document.getElementById('reveal-results-btn');
      if (revealBtn) {
        revealBtn.style.display = 'none';
        revealBtn.classList.remove('pulse-glow');
        revealBtn.onclick = () => goToStep(4);
      }
      if (activeArea) {
        activeArea.style.display = 'block';
        const handler = window.MiniGameRegistry[minigameId.val];
        handler?.renderPublicPlay?.(activeArea, winningTeam, minigameHostData, price, (res) => {
          minigameResult.val = res;
          if (revealBtn) {
            revealBtn.style.display = 'inline-flex';
            revealBtn.classList.add('pulse-glow');
            revealBtn.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
    };
  }

  // Step 4
  if (nextBtn) {
    nextBtn.onclick = () => {
      roundNumber.val++;
      minigameResult.val = null;
      winningTeamId.val = null;
      saveState();
      goToStep(2);
    };
  }

  // Leaderboard modal
  const modal = document.getElementById('leaderboard-modal');
  const closeBtn = document.getElementById('close-leaderboard-btn');
  if (modal) {
    van.derive(() => {
      if (isLeaderboardOpen.val) {
        if (modal.showModal && !modal.open) modal.showModal();
        else modal.setAttribute('open', 'true');
      } else {
        if (modal.close && modal.open) modal.close();
        else modal.removeAttribute('open');
      }
    });
    modal.onclick = (e) => { if (e.target === modal) isLeaderboardOpen.val = false; };
  }
  if (closeBtn) closeBtn.onclick = () => isLeaderboardOpen.val = false;
};

// ----------------------------------------------------
// ROUND SCORING
// Writes directly to reactive team properties.
// Every DOM node reading those properties auto-updates.
// ----------------------------------------------------
const calculateRoundResults = () => {
  // Guard: don't double-count the same round
  if (lastCalculatedRound.val >= roundNumber.val) return;

  const price = actualPrice.val;

  // Find closest-under team(s)
  let closestUnderDiff = Infinity;
  let closestTeamIds = [];
  for (let i = 0; i < teams.length; i++) {
    const bid = parseFloat(teams[i].bid);
    if (!isNaN(bid) && bid >= 0 && bid <= price) {
      const diff = price - bid;
      if (diff < closestUnderDiff) { closestUnderDiff = diff; closestTeamIds = [teams[i].id]; }
      else if (diff === closestUnderDiff) { closestTeamIds.push(teams[i].id); }
    }
  }
  // Fallback: closest overall if everyone overbid
  if (closestTeamIds.length === 0) {
    let closestOverallDiff = Infinity;
    for (let i = 0; i < teams.length; i++) {
      const bid = parseFloat(teams[i].bid);
      if (!isNaN(bid)) {
        const diff = Math.abs(price - bid);
        if (diff < closestOverallDiff) { closestOverallDiff = diff; closestTeamIds = [teams[i].id]; }
        else if (diff === closestOverallDiff) { closestTeamIds.push(teams[i].id); }
      }
    }
  }

  const res = minigameResult.val;
  const nonWinningCount = Math.max(1, teams.length - 1);
  const potentialBonus = (res?.potentialBonusDollars !== undefined)
    ? res.potentialBonusDollars
    : Math.max(1, Math.round(price * 0.10));
  const isMgFailed = res?.success === false;
  const splitBonusPerOther = isMgFailed ? Math.max(1, Math.round(potentialBonus / nonWinningCount)) : 0;

  // Score each team — each assignment triggers reactive UI updates
  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const bid = parseFloat(team.bid);
    const validBid = (!isNaN(bid) && bid >= 0) ? bid : 0;
    const diff = Math.abs(price - validBid);

    team.bidScore = Math.max(0, price - diff);
    team.gotClosest = closestTeamIds.includes(team.id);
    team.closestVal = (team.gotClosest && price > 0) ? Math.max(1, Math.round(price * 0.05)) : 0;

    const isWinner = (team.id === winningTeamId.val);
    if (isWinner) {
      if (typeof res?.bonusDollars === 'number' && !isNaN(res.bonusDollars)) {
        team.mgVal = Math.round(res.bonusDollars);
      } else {
        const pct = parseFloat(res?.bonusPercent) || 0;
        team.mgVal = (pct > 0 && price > 0) ? Math.max(1, Math.round(price * (pct / 100))) : 0;
      }
      team.mgLabel = 'Mini-Game Bonus:';
    } else if (isMgFailed && splitBonusPerOther > 0) {
      team.mgVal = splitBonusPerOther;
      team.mgLabel = 'Opponent Missed Steal:';
    } else {
      team.mgVal = 0;
      team.mgLabel = 'Mini-Game Bonus:';
    }

    team.totalRound = team.bidScore + team.closestVal + team.mgVal;
    team.totalScore = (team.totalScore || 0) + team.totalRound;
  }

  lastCalculatedRound.val = roundNumber.val;
  saveState();
};

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
loadState();
bindDeclarativeElements();
setupControls();
if (teams.length === 0) syncTeamsCount(4);
