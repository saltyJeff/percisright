// Mini-Game 5: Clock Game (30-Second Rapid Fire) (ES Module) [UNUSED/DISABLED]
import van from "vanjs-core";

export const clockGame = {
  id: 'clock-game',
  name: 'Clock Game (30-Second Rapid Fire) [Disabled]',
  description: '30-second rapid fire guessing timer! Host taps Higher/Lower cues. Win +1% bonus for every 3 seconds left! (Disabled)',

  renderHostConfig: function (containerEl) {
    const { p } = van.tags;
    containerEl.innerHTML = '';
    van.add(containerEl, p({ class: 'text-muted', style: 'font-size:0.9rem;' }, 'No secret host setup needed. The host will operate the rapid-fire cues during the live 30-second round.'));
  },

  getHostData: function () {
    return {};
  },

  renderPublicPlay: function (containerEl, winnerTeam, hostData, itemPrice, onComplete) {
    const { div, p, span, strong, button, h4 } = van.tags;

    const timeLeft = van.state(30.0);
    const isRunning = van.state(false);
    const isCompleted = van.state(false);
    const isPulsing = van.state(false);
    const currentCue = van.state(null); // 'HIGHER', 'LOWER', or null
    let timerInterval = null;

    const startTimer = () => {
      if (isRunning.val || isCompleted.val) return;
      isRunning.val = true;

      timerInterval = setInterval(() => {
        timeLeft.val = parseFloat((timeLeft.val - 0.1).toFixed(1));
        if (timeLeft.val <= 0) {
          timeLeft.val = 0;
          stopTimer();
          isCompleted.val = true;
          currentCue.val = null;
          const maxPotential = Math.round(parseFloat(itemPrice || 100) * 0.10);
          onComplete?.({
            potentialBonusDollars: maxPotential,
            bonusDollars: 0,
            bonusPercent: 0,
            success: false,
            outcomeText: 'TIME UP! Clock ran out before correct price was guessed. (+0% Bonus)'
          });
        }
      }, 100);
    };

    const stopTimer = () => {
      isRunning.val = false;
      clearInterval(timerInterval);
    };

    const triggerPulse = (cueType) => {
      currentCue.val = cueType;
      isPulsing.val = true;
      setTimeout(() => isPulsing.val = false, 300);
    };

    containerEl.innerHTML = '';
    van.add(containerEl,
      div({ class: 'clock-game-box', style: 'text-align:center;' },
        div({ class: 'winner-banner' },
          '🏆 ', span('Winning Bidding Team: ', strong(() => winnerTeam?.name || 'Team'))
        ),

        div({
          class: () => `clock-display ${isPulsing.val ? 'pulse-glow' : ''}`,
          style: () => timeLeft.val <= 0 ? 'color: var(--accent-red);' : ''
        }, () => timeLeft.val <= 0 ? 'TIME UP!' : `${timeLeft.val.toFixed(1)}s`),

        // Live Higher/Lower Visual Cue Banner
        () => currentCue.val ? div({
          class: 'cue-banner pulse-glow',
          style: `font-size:2.2rem; font-weight:900; margin:1rem 0; padding:0.75rem 1.5rem; border-radius:12px; background:${currentCue.val === 'HIGHER' ? '#198754' : '#dc3545'}; color:#fff; text-shadow:0 2px 4px rgba(0,0,0,0.3);`
        }, currentCue.val === 'HIGHER' ? '⬆ HIGHER! (Guess Higher)' : '⬇ LOWER! (Guess Lower)') : '',

        div({ class: 'clock-controls' },
          () => !isRunning.val && !isCompleted.val && timeLeft.val > 0 ? button({
            class: 'btn btn-primary btn-lg',
            onclick: startTimer
          }, '▶ START CLOCK') : '',

          () => isRunning.val ? button({
            class: 'btn btn-secondary btn-lg',
            onclick: stopTimer
          }, '⏸ PAUSE') : '',

          button({
            class: 'btn btn-secondary btn-lg',
            disabled: () => isCompleted.val,
            onclick: () => {
              stopTimer();
              timeLeft.val = 30.0;
              currentCue.val = null;
            }
          }, '🔄 RESET')
        ),

        div({ id: 'cg-cue-panel', style: 'margin-top:2rem; padding:1.5rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-md);' },
          h4({ style: 'color:var(--text-muted); margin-bottom:1rem;' }, 'HOST LIVE FEEDBACK CUES'),
          div({ class: 'cue-buttons-row', style: 'display:flex; gap:1rem; justify-content:center;' },
            button({
              class: 'btn btn-accent btn-lg',
              style: 'background:#198754; color:#fff; font-weight:800; font-size:1.3rem;',
              disabled: () => isCompleted.val,
              onclick: () => triggerPulse('HIGHER')
            }, '⬆ HIGHER!'),
            button({
              class: 'btn btn-accent btn-lg',
              style: 'background:#dc3545; color:#fff; font-weight:800; font-size:1.3rem;',
              disabled: () => isCompleted.val,
              onclick: () => triggerPulse('LOWER')
            }, '⬇ LOWER!')
          ),
          div({ style: 'margin-top:1.5rem; display:flex; gap:1rem; justify-content:center; flex-wrap:wrap;' },
            button({
              class: 'btn btn-primary btn-lg',
              style: 'background:linear-gradient(135deg, #00e676, #00b0ff);',
              disabled: () => isCompleted.val,
              onclick: () => {
                stopTimer();
                isCompleted.val = true;
                currentCue.val = null;
                const bonusIntervals = Math.floor(timeLeft.val / 3);
                const bonusPercent = bonusIntervals * 1; // +1% per 3s

                const maxPotential = Math.round(parseFloat(itemPrice || 100) * 0.10);
                const awardedVal = Math.round(parseFloat(itemPrice || 100) * (bonusPercent / 100));

                onComplete({
                  potentialBonusDollars: maxPotential,
                  bonusDollars: awardedVal,
                  bonusPercent,
                  success: true,
                  outcomeText: `CORRECT GUESS with ${timeLeft.val.toFixed(1)}s remaining! (+${bonusPercent}% Bonus accuracy)`
                });
              }
            }, '🎯 CORRECT GUESS!'),
            button({
              class: 'btn btn-secondary btn-lg',
              style: 'background:#dc3545; color:#fff; border:none;',
              disabled: () => isCompleted.val,
              onclick: () => {
                stopTimer();
                isCompleted.val = true;
                currentCue.val = null;
                const maxPotential = Math.round(parseFloat(itemPrice || 100) * 0.10);

                onComplete({
                  potentialBonusDollars: maxPotential,
                  bonusDollars: 0,
                  bonusPercent: 0,
                  success: false,
                  outcomeText: 'OUT OF TIME / MISSED! Failed to guess price within 30s. (+0% Bonus)'
                });
              }
            }, '❌ TIME UP / MISSED')
          )
        )
      )
    );
  }
};
