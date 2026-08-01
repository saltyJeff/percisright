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
      div({ class: 'form-group', style: 'margin-top:0.75rem;' },
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
      question: qEl?.value || 'Is the item price higher than $50?',
      answer: aEl?.value || 'YES'
    };
  },

  renderPublicPlay: function (containerEl, winnerTeam, hostData, itemPrice, onComplete) {
    const { div, h3, p, span, strong, button } = van.tags;

    // Create 3 cups state
    const cups = van.state([
      { id: 1, val: 10, label: '🏆 +10% Bonus' },
      { id: 2, val: 0, label: '⚪ 0% Bonus' },
      { id: 3, val: -5, label: '❌ -5% Penalty' }
    ].sort(() => Math.random() - 0.5));

    const phase = van.state('warmup'); // 'warmup' -> 'pick' -> 'done'
    const statusMsg = van.state('Answer the warmup question to eliminate the bad cup (-5%), or pick a cup directly!');
    const selectedCupId = van.state(null);
    const isRevealed = van.state(false);

    const handleWarmup = (chosenAns) => {
      const correct = chosenAns === (hostData?.answer || 'YES');
      phase.val = 'pick';

      if (correct) {
        cups.val = cups.val.filter(c => c.val !== -5);
        statusMsg.val = '✅ CORRECT WARMUP! The bad cup (-5%) has been removed! Only 2 cups remain. Pick one below:';
      } else {
        statusMsg.val = '❌ INCORRECT WARMUP! All 3 cups remain active. Pick a cup carefully:';
      }
    };

    const pickCup = (pickedCup) => {
      if (phase.val === 'done') return;

      selectedCupId.val = pickedCup.id;
      isRevealed.val = true;
      phase.val = 'done';

      const price = parseFloat(itemPrice || 100);
      const potentialVal = Math.round(price * 0.10);
      const awardedVal = Math.round(price * (pickedCup.val / 100));
      const signStr = awardedVal >= 0 ? `+$${awardedVal}` : `-$${Math.abs(awardedVal)}`;

      statusMsg.val = `🎉 REVEALED: You picked Cup #${pickedCup.id} (${pickedCup.label})! Result: ${signStr}`;

      if (typeof onComplete === 'function') {
        onComplete({
          potentialBonusDollars: potentialVal,
          bonusDollars: awardedVal,
          bonusPercent: pickedCup.val,
          success: pickedCup.val > 0,
          outcomeText: `Picked Cup #${pickedCup.id} (${pickedCup.label}) for ${signStr}`
        });
      }
    };

    containerEl.innerHTML = '';

    van.add(containerEl,
      div({ class: 'shell-game-box', style: 'text-align:center; padding:1rem;' },
        div({ class: 'winner-banner' },
          '🏆 ', span('Winning Bidding Team: ', strong(() => winnerTeam?.name || 'Team'))
        ),

        // Status Header
        p({ style: 'font-size:1.1rem; font-weight:700; color:var(--primary-gold); margin:1rem 0;' }, () => statusMsg.val),

        // Phase 1: Warmup Challenge Prompt
        () => phase.val === 'warmup' ? div({ style: 'margin:1rem 0; padding:1rem; background:rgba(255,255,255,0.05); border-radius:8px;' },
          h3({ style: 'color:var(--text-muted); margin-bottom:0.5rem;' }, 'Optional Warmup Challenge'),
          p({ style: 'font-size:1.2rem; font-weight:700;' }, `"${hostData?.question || 'Is the price higher than $50?'}"`),
          div({ style: 'display:flex; gap:1rem; justify-content:center; margin-top:1rem; flex-wrap:wrap;' },
            button({ class: 'btn btn-accent btn-lg', onclick: () => handleWarmup('YES') }, 'YES / HIGHER'),
            button({ class: 'btn btn-accent btn-lg', onclick: () => handleWarmup('NO') }, 'NO / LOWER'),
            button({ class: 'btn btn-secondary', onclick: () => { phase.val = 'pick'; statusMsg.val = 'Skipped warmup! Pick any cup below:'; } }, 'Skip Warmup ➔')
          )
        ) : '',

        // Phase 2: Cups Selection Grid
        () => div({ class: 'shells-row', style: 'display:flex; justify-content:center; gap:1.5rem; margin:1.5rem 0; flex-wrap:wrap;' },
          cups.val.map(c => div({
            class: `shell-cup ${selectedCupId.val === c.id ? 'selected' : ''}`,
            style: `width:130px; height:130px; border:3px solid var(--primary-gold); border-radius:12px; background:${isRevealed.val ? (c.val > 0 ? '#198754' : c.val === 0 ? '#6c757d' : '#dc3545') : 'var(--card-bg, #2b3035)'}; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:${phase.val === 'done' ? 'default' : 'pointer'}; transition:all 0.3s ease; transform:${selectedCupId.val === c.id ? 'scale(1.08)' : 'scale(1)'};`,
            onclick: () => pickCup(c)
          },
            span({ style: 'font-size:2.2rem; margin-bottom:0.3rem;' }, isRevealed.val ? (c.val > 0 ? '🏆' : c.val === 0 ? '⚪' : '❌') : '🥤'),
            span({ class: 'shell-label', style: 'font-weight:800;' }, `CUP #${c.id}`),
            isRevealed.val ? div({ class: 'shell-reveal-val', style: 'margin-top:0.4rem; font-weight:800; font-size:0.95rem; color:#fff;' }, c.label) : ''
          ))
        )
      )
    );
  }
};
