/**
 * Main Application Engine for Price Is Right Host Helper Dashboard
 * Built using ES Modules (vanjs-core & vanjs-ext).
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

// Global App Manager & State
export const PriceIsRightApp = {
  // Reactive state using van.state
  currentStep: van.state(1),
  roundNumber: van.state(1),
  teams: van.state([]),
  isHostBlurred: van.state(true),
  isLeaderboardOpen: van.state(false),

  roundData: {
    itemName: '',
    actualPrice: 0,
    minigameId: 'sliding-scale',
    minigameHostData: {},
    bids: {},
    winningTeamId: null,
    minigameResult: null
  },

  STORAGE_KEY: 'price_is_right_game_state_v2',

  init: function () {
    this.loadState();
    this.bindHeaderControls();
    this.renderStepNavigation();
    this.renderStep1();
    this.renderStep2();
    this.renderStep3();
    this.renderStep4();
    this.renderLeaderboardModal();
  },

  loadState: function () {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.teams && parsed.teams.length > 0) {
          this.teams.val = parsed.teams;
          this.roundNumber.val = parsed.roundNumber || 1;
        }
      } catch (e) {}
    }
  },

  saveState: function () {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        teams: this.teams.val,
        roundNumber: this.roundNumber.val
      }));
    } catch (e) {}
  },

  resetGame: function () {
    if (confirm('Are you sure you want to reset the entire game and clear all scores?')) {
      localStorage.removeItem(this.STORAGE_KEY);
      location.reload();
    }
  },

  goToStep: function (stepNum) {
    this.currentStep.val = stepNum;
    if (stepNum === 2) {
      this.renderHostMinigameConfig();
    }
  },

  bindHeaderControls: function () {
    const self = this;
    const leaderBtn = document.getElementById('open-leaderboard-btn');
    const resetBtn = document.getElementById('reset-game-btn');

    if (leaderBtn) {
      leaderBtn.onclick = () => self.isLeaderboardOpen.val = true;
    }

    if (resetBtn) {
      resetBtn.onclick = () => self.resetGame();
    }
  },

  renderStepNavigation: function () {
    const self = this;
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`step-indicator-${i}`);
      const sec = document.getElementById(`step-${i}-section`);

      if (el) {
        van.derive(() => {
          el.className = 'step-item';
          if (i < self.currentStep.val) el.classList.add('completed');
          else if (i === self.currentStep.val) el.classList.add('active');
        });
      }

      if (sec) {
        van.derive(() => {
          sec.style.display = (self.currentStep.val === i) ? 'block' : 'none';
        });
      }
    }
  },

  // ----------------------------------------------------
  // STEP 1: GAME SETUP
  // ----------------------------------------------------
  renderStep1: function () {
    const self = this;
    const countInput = document.getElementById('team-count-input');
    const container = document.getElementById('teams-grid-container');
    const startBtn = document.getElementById('start-game-btn');

    const defaultColors = ['#ffd700', '#00f2fe', '#f093fb', '#00e676', '#ff8c00', '#ff0844'];
    const defaultNames = ['Team Alpha', 'Team Bravo', 'Team Charlie', 'Team Delta', 'Team Echo', 'Team Foxtrot'];

    function buildTeamInputs(count) {
      if (!container) return;
      const { div, input } = van.tags;
      container.innerHTML = '';

      const currentList = self.teams.val;
      for (let i = 0; i < count; i++) {
        const name = currentList[i] ? currentList[i].name : (defaultNames[i] || `Team ${i + 1}`);
        const color = defaultColors[i % defaultColors.length];

        van.add(container,
          div({ class: 'team-input-card' },
            div({ class: 'team-color-badge', style: `background:${color};` }),
            input({
              type: 'text',
              class: 'form-control team-name-input',
              'data-index': i,
              value: name,
              placeholder: `Team ${i + 1} Name`
            })
          )
        );
      }
    }

    if (countInput) {
      countInput.oninput = (e) => buildTeamInputs(parseInt(e.target.value) || 2);
    }

    buildTeamInputs(self.teams.val.length > 0 ? self.teams.val.length : 4);

    if (startBtn) {
      startBtn.onclick = () => {
        const inputEls = container.querySelectorAll('.team-name-input');
        const newTeams = [];
        inputEls.forEach((inp, idx) => {
          newTeams.push({
            id: 'team_' + idx,
            name: inp.value.trim() || `Team ${idx + 1}`,
            color: defaultColors[idx % defaultColors.length],
            totalScore: (self.teams.val[idx] && self.teams.val[idx].totalScore) || 0
          });
        });

        self.teams.val = newTeams;
        self.saveState();
        self.goToStep(2);
      };
    }
  },

  // ----------------------------------------------------
  // STEP 2: SECRET HOST PREP PHASE
  // ----------------------------------------------------
  renderStep2: function () {
    const self = this;
    const titleEl = document.getElementById('round-number-title');
    const blurContent = document.getElementById('host-secret-content');
    const blurBtn = document.getElementById('toggle-host-blur-btn');
    const selectEl = document.getElementById('minigame-select');
    const beginBtn = document.getElementById('begin-public-round-btn');

    if (titleEl) {
      van.derive(() => titleEl.textContent = `Round ${self.roundNumber.val}`);
    }

    if (blurContent && blurBtn) {
      van.derive(() => {
        if (self.isHostBlurred.val) {
          blurContent.classList.add('blurred');
          blurBtn.textContent = '👁️ Reveal Host Info';
        } else {
          blurContent.classList.remove('blurred');
          blurBtn.textContent = '🙈 Hide Secret Info';
        }
      });

      blurBtn.onclick = () => self.isHostBlurred.val = !self.isHostBlurred.val;
    }

    if (selectEl) {
      selectEl.onchange = () => self.renderHostMinigameConfig();
    }

    if (beginBtn) {
      beginBtn.onclick = () => {
        const priceInput = document.getElementById('actual-price-input');
        const itemInput = document.getElementById('item-name-input');
        const price = parseFloat(priceInput ? priceInput.value : 0);

        if (isNaN(price) || price <= 0) {
          alert('Please enter a valid actual price greater than $0!');
          return;
        }

        const mgId = selectEl ? selectEl.value : 'sliding-scale';
        const handler = window.MiniGameRegistry[mgId];
        const configContainer = document.getElementById('minigame-host-config-container');
        let hostData = {};

        if (handler && handler.getHostData && configContainer) {
          hostData = handler.getHostData(configContainer);
        }

        self.roundData = {
          itemName: (itemInput && itemInput.value.trim()) || `Item #${self.roundNumber.val}`,
          actualPrice: price,
          minigameId: mgId,
          minigameHostData: hostData,
          bids: {},
          winningTeamId: null,
          minigameResult: null
        };

        self.goToStep(3);
      };
    }
  },

  renderHostMinigameConfig: function () {
    const selectEl = document.getElementById('minigame-select');
    const priceInput = document.getElementById('actual-price-input');
    const configContainer = document.getElementById('minigame-host-config-container');

    if (!selectEl || !configContainer) return;
    const mgId = selectEl.value;
    const handler = window.MiniGameRegistry[mgId];
    const price = parseFloat(priceInput ? priceInput.value : 100) || 100;

    if (handler && handler.renderHostConfig) {
      handler.renderHostConfig(configContainer, price);
    } else {
      configContainer.innerHTML = '';
    }
  },

  // ----------------------------------------------------
  // STEP 3: PUBLIC BIDDING & MINI-GAME PHASE
  // ----------------------------------------------------
  renderStep3: function () {
    const self = this;
    const pubRoundEl = document.getElementById('pub-round-num');
    const pubItemEl = document.getElementById('pub-item-name');
    const container = document.getElementById('bidding-teams-container');
    const lockBtn = document.getElementById('lock-bids-btn');
    const activeArea = document.getElementById('active-minigame-area');
    const revealBtn = document.getElementById('go-reveal-btn');

    if (pubRoundEl) pubRoundEl.textContent = self.roundNumber.val;
    if (pubItemEl) pubItemEl.textContent = self.roundData.itemName;

    if (container) {
      const { div, span, input } = van.tags;
      container.innerHTML = '';

      self.teams.val.forEach(team => {
        van.add(container,
          div({ class: 'bidding-card', id: `bidding-card-${team.id}` },
            div({ class: 'team-name-tag' },
              span({ style: `width:12px; height:12px; border-radius:50%; background:${team.color}; display:inline-block;` }),
              team.name
            ),
            div({ class: 'bid-input-wrap' },
              span({ class: 'currency-symbol' }, '$'),
              input({
                type: 'number',
                class: 'form-control bid-input',
                'data-team-id': team.id,
                placeholder: '0.00',
                step: '0.01'
              })
            )
          )
        );
      });
    }

    if (activeArea) {
      activeArea.style.display = 'none';
      activeArea.innerHTML = '';
    }
    if (revealBtn) revealBtn.style.display = 'none';

    if (lockBtn) {
      lockBtn.disabled = false;
      lockBtn.style.display = 'inline-flex';

      lockBtn.onclick = () => {
        const bidInputs = container.querySelectorAll('.bid-input');
        const bids = {};
        let valid = true;

        bidInputs.forEach(inp => {
          const tId = inp.getAttribute('data-team-id');
          const val = parseFloat(inp.value);
          if (isNaN(val) || val < 0) valid = false;
          else bids[tId] = val;
        });

        if (!valid) {
          alert('Please enter valid numeric bids for all teams!');
          return;
        }

        self.roundData.bids = bids;

        // Lock inputs visually
        container.querySelectorAll('.bidding-card').forEach(c => c.classList.add('locked'));
        bidInputs.forEach(i => i.disabled = true);
        lockBtn.style.display = 'none';

        // Determine Bidding Phase Winner (Highest Accuracy)
        const price = self.roundData.actualPrice;
        let highestAcc = -1;
        let winningTeam = self.teams.val[0];

        self.teams.val.forEach(team => {
          const bid = bids[team.id];
          const diff = Math.abs(price - bid);
          const acc = Math.max(0, 100 - ((diff / price) * 100));
          team.bid = bid;
          if (acc > highestAcc) {
            highestAcc = acc;
            winningTeam = team;
          }
        });

        self.roundData.winningTeamId = winningTeam.id;

        // Render Active Mini-Game UI
        if (activeArea) {
          activeArea.style.display = 'block';
          const handler = window.MiniGameRegistry[self.roundData.minigameId];
          if (handler && handler.renderPublicPlay) {
            handler.renderPublicPlay(
              activeArea,
              winningTeam,
              self.roundData.minigameHostData,
              self.roundData.actualPrice,
              (res) => {
                self.roundData.minigameResult = res;
                if (revealBtn) revealBtn.style.display = 'inline-flex';
              }
            );
          }
        }
      };
    }

    if (revealBtn) {
      revealBtn.onclick = () => self.goToStep(4);
    }
  },

  // ----------------------------------------------------
  // STEP 4: REVEAL PHASE
  // ----------------------------------------------------
  renderStep4: function () {
    const self = this;
    const priceTag = document.getElementById('reveal-actual-price');
    const recapTag = document.getElementById('minigame-recap-text');
    const container = document.getElementById('round-results-grid');
    const nextBtn = document.getElementById('next-round-btn');

    const actualPrice = self.roundData.actualPrice;
    const bids = self.roundData.bids;
    const minigameResult = self.roundData.minigameResult || { bonusPercent: 0, outcomeText: 'No Mini-Game Played' };
    const winningTeamId = self.roundData.winningTeamId;

    if (priceTag) priceTag.textContent = `$${actualPrice.toFixed(2)}`;
    if (recapTag) recapTag.textContent = minigameResult.outcomeText;

    // Closest Without Going Over Bonus (+5%)
    let closestDiff = Infinity;
    let closestTeamIds = [];

    self.teams.val.forEach(team => {
      const bid = bids[team.id] || 0;
      if (bid <= actualPrice) {
        const diff = actualPrice - bid;
        if (diff < closestDiff) {
          closestDiff = diff;
          closestTeamIds = [team.id];
        } else if (diff === closestDiff) {
          closestTeamIds.push(team.id);
        }
      }
    });

    if (container) {
      const { div, span, strong } = van.tags;
      container.innerHTML = '';

      const updatedTeams = self.teams.val.map(team => {
        const bid = bids[team.id] || 0;
        const diff = Math.abs(actualPrice - bid);
        let rawAcc = Math.max(0, 100 - ((diff / actualPrice) * 100));
        rawAcc = parseFloat(rawAcc.toFixed(1));

        const gotClosest = closestTeamIds.includes(team.id);
        const closestVal = gotClosest ? 5.0 : 0.0;

        const isMgWinner = (team.id === winningTeamId);
        const mgVal = isMgWinner ? (minigameResult.bonusPercent || 0) : 0;

        const totalRound = parseFloat((rawAcc + closestVal + mgVal).toFixed(1));
        const newTotalScore = parseFloat(((team.totalScore || 0) + totalRound).toFixed(1));

        van.add(container,
          div({ class: `result-card ${gotClosest ? 'winner' : ''}` },
            gotClosest ? span({ class: 'closest-badge' }, '+5% Closest Under!') : div(),
            div({ class: 'team-name-tag' },
              span({ style: `width:14px; height:14px; border-radius:50%; background:${team.color}; display:inline-block;` }),
              team.name
            ),
            div({ class: 'score-breakdown-list' },
              div({ class: 'score-row' }, span('Team Bid:'), strong(`$${bid.toFixed(2)}`)),
              div({ class: 'score-row' }, span('Raw Accuracy:'), strong(`${rawAcc}%`)),
              div({ class: 'score-row' }, span('Closest Bonus:'), strong(`+${closestVal}%`)),
              div({ class: 'score-row' }, span('Mini-Game Bonus:'), strong(`+${mgVal}%`)),
              div({ class: 'score-row total-row' }, span('Total Round Score:'), span(`${totalRound}%`))
            )
          )
        );

        return { ...team, totalScore: newTotalScore };
      });

      self.teams.val = updatedTeams;
      self.saveState();
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        self.roundNumber.val++;
        self.saveState();
        self.goToStep(2);
      };
    }
  },

  // ----------------------------------------------------
  // MASTER LEADERBOARD MODAL
  // ----------------------------------------------------
  renderLeaderboardModal: function () {
    const self = this;
    const modal = document.getElementById('leaderboard-modal');
    const closeBtn = document.getElementById('close-leaderboard-btn');
    const tbody = document.getElementById('leaderboard-table-body');

    if (modal) {
      van.derive(() => {
        if (self.isLeaderboardOpen.val) modal.classList.add('open');
        else modal.classList.remove('open');
      });

      modal.onclick = (e) => {
        if (e.target === modal) self.isLeaderboardOpen.val = false;
      };
    }

    if (closeBtn) {
      closeBtn.onclick = () => self.isLeaderboardOpen.val = false;
    }

    if (tbody) {
      const { tr, td, span } = van.tags;
      van.derive(() => {
        tbody.innerHTML = '';
        const sorted = [...self.teams.val].sort((a, b) => b.totalScore - a.totalScore);
        sorted.forEach((team, idx) => {
          const rankClass = idx < 3 ? `rank-${idx + 1}` : '';
          van.add(tbody,
            tr(
              td(span({ class: `rank-badge ${rankClass}` }, idx + 1)),
              td({ style: 'font-weight:700;' },
                span({ style: `width:10px; height:10px; border-radius:50%; background:${team.color}; display:inline-block; margin-right:6px;` }),
                team.name
              ),
              td({ style: 'font-weight:800; color:var(--primary-gold); font-size:1.1rem;' }, `${team.totalScore.toFixed(1)} pts`)
            )
          );
        });
      });
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  PriceIsRightApp.init();
});
