// Mini-Game 3: Shell Game (3-Cup Shuffle) (ES Module)
import van from "vanjs-core";

export const shellGame = {
  id: 'shell-game',
  name: 'Shell Game (3-Cup Shuffle)',
  description: '3 cups hide +10%, 0%, and -5%. Win warmup question to strike the -5% cup, then pick a cup!',

  renderHostConfig: function (containerEl) {
    const { div, label, input, select, option } = van.tags;
    containerEl.innerHTML = '';
    van.add(containerEl,
      div({ class: 'form-group' },
        label('Warmup Question (Host Prompt)'),
        input({ type: 'text', id: 'sg-question', class: 'form-control', value: 'Is the item price higher than $50?', placeholder: 'e.g. Is the price higher than $100?' })
      ),
      div({ class: 'form-group' },
        label('Correct Warmup Answer'),
        select({ id: 'sg-answer', class: 'form-control' },
          option({ value: 'YES' }, 'YES / HIGHER'),
          option({ value: 'NO' }, 'NO / LOWER')
        )
      )
    );
  },

  getHostData: function (containerEl) {
    const qEl = containerEl.querySelector('#sg-question');
    const aEl = containerEl.querySelector('#sg-answer');
    return {
      question: qEl ? qEl.value : 'Is the item price higher than $50?',
      answer: aEl ? aEl.value : 'YES'
    };
  },

  renderPublicPlay: function (containerEl, winnerTeam, hostData, itemPrice, onComplete) {
    const { div, h3, p, span, strong, button } = van.tags;

    const cups = van.state([
      { id: 1, val: 10, label: '+10% Bonus', eliminated: false, revealed: false },
      { id: 2, val: 0, label: '0% Bonus', eliminated: false, revealed: false },
      { id: 3, val: -5, label: '-5% Penalty', eliminated: false, revealed: false }
    ].sort(() => Math.random() - 0.5));

    const phase = van.state('warmup'); // 'warmup' -> 'pick' -> 'done'
    const statusMsg = van.state('Click a cup to reveal your bonus point outcome!');

    containerEl.innerHTML = '';
    van.add(containerEl,
      div({ class: 'shell-game-box' },
        div({ class: 'winner-banner' },
          '🏆 ', span('Winning Bidding Team: ', strong(winnerTeam.name))
        ),

        // Phase 1: Warmup
        () => phase.val === 'warmup' ? div(
          h3({ style: 'color:var(--primary-gold); margin-bottom:0.5rem;' }, 'Phase 1: Warmup Challenge'),
          p({ class: 'minigame-desc', style: 'font-size:1.2rem; font-weight:700;' }, `"${hostData.question}"`),
          div({ style: 'display:flex; gap:1rem; justify-content:center; margin-top:1.5rem;' },
            button({
              class: 'btn btn-accent btn-lg',
              onclick: () => handleWarmup('YES')
            }, 'YES / HIGHER'),
            button({
              class: 'btn btn-accent btn-lg',
              onclick: () => handleWarmup('NO')
            }, 'NO / LOWER')
          )
        ) : div(),

        // Phase 2: Cup Selection
        () => phase.val !== 'warmup' ? div(
          h3({ style: 'color:var(--primary-gold);' }, 'Phase 2: Pick A Cup'),
          p(() => statusMsg.val),

          div({ class: 'shells-row' },
            () => cups.val.map((c, idx) => div({
              class: `shell-cup ${c.eliminated ? 'eliminated' : ''}`,
              onclick: () => pickCup(idx)
            },
              span({ class: 'shell-label' }, c.eliminated ? '❌ BAD CUP' : `CUP ${idx + 1}`),
              c.revealed ? div({ class: 'shell-reveal-val' }, c.label) : div()
            ))
          )
        ) : div()
      )
    );

    function handleWarmup(chosenAns) {
      const correct = chosenAns === hostData.answer;
      phase.val = 'pick';

      if (correct) {
        // Strike the -5% cup
        cups.val = cups.val.map(c => c.val === -5 ? { ...c, eliminated: true } : c);
        statusMsg.val = 'CORRECT WARMUP! Bad cup (-5%) eliminated! Pick between remaining cups.';
      } else {
        statusMsg.val = 'WRONG WARMUP! All 3 cups remain active. Pick a cup carefully!';
      }
    }

    function pickCup(idx) {
      if (phase.val === 'done') return;
      const picked = cups.val[idx];
      if (picked.eliminated) return;

      phase.val = 'done';
      // Reveal all
      cups.val = cups.val.map(c => ({ ...c, revealed: true }));

      const potentialVal = Math.round(parseFloat(itemPrice || 100) * 0.10);
      const awardedVal = Math.round(parseFloat(itemPrice || 100) * (picked.val / 100));

      onComplete({
        potentialBonusDollars: potentialVal,
        bonusDollars: awardedVal,
        bonusPercent: picked.val,
        success: picked.val > 0,
        outcomeText: `Picked Cup #${idx + 1} revealing ${picked.label}!`
      });
    }
  }
};
