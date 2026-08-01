// Mini-Game 6: Ten Chances (Number Jumble) (ES Module)
import van from "vanjs-core";

export const tenChances = {
  id: 'ten-chances',
  name: 'Ten Chances (Number Jumble)',
  description: '5 jumbled digits hide a 3-digit price! Team gets 3 attempts (1st try = +15%, 2nd try = +10%, 3rd try = +5%).',

  renderHostConfig: function (containerEl) {
    const { p } = van.tags;
    containerEl.innerHTML = '';
    van.add(containerEl,
      p({ class: 'text-muted', style: 'font-size:0.9rem;' }, 'Target digits are automatically derived from the last 3 digits of the actual item price.')
    );
  },

  getHostData: function () {
    return {};
  },

  renderPublicPlay: function (containerEl, winnerTeam, hostData, itemPrice, onComplete) {
    const { div, p, span, strong, button } = van.tags;

    const roundedVal = Math.round(parseFloat(itemPrice) || 0);
    const secretTarget = roundedVal.toString().padStart(3, '0').slice(-3);
    
    // Create 5 jumbled digits pool containing target digits
    const digitsPool = secretTarget.split('');
    const randomDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    while (digitsPool.length < 5) {
      const randD = randomDigits[Math.floor(Math.random() * randomDigits.length)];
      digitsPool.push(randD);
    }
    digitsPool.sort(() => Math.random() - 0.5);

    const currentAttempt = van.state(1); // 1, 2, 3
    const currentInput = van.state('');
    const isFinished = van.state(false);

    containerEl.innerHTML = '';
    van.add(containerEl,
      div({ class: 'ten-chances-box' },
        div({ class: 'winner-banner' },
          '🏆 ', span('Winning Bidding Team: ', strong(() => winnerTeam?.name || 'Team'))
        ),

        div({ class: 'attempt-badges' },
          div({ class: () => `attempt-badge ${currentAttempt.val === 1 ? 'active' : ''}` }, 'Try #1 (+15%)'),
          div({ class: () => `attempt-badge ${currentAttempt.val === 2 ? 'active' : ''}` }, 'Try #2 (+10%)'),
          div({ class: () => `attempt-badge ${currentAttempt.val === 3 ? 'active' : ''}` }, 'Try #3 (+5%)')
        ),

        p({ class: 'text-muted' }, 'Use the 5 jumbled digits below to form the secret 3-digit price:'),

        div({ class: 'guess-display' }, () => currentInput.val.padEnd(3, '_')),

        div({ class: 'keypad-grid' },
          digitsPool.map(d => button({
            class: 'digit-btn',
            disabled: () => isFinished.val,
            onclick: () => {
              if (currentInput.val.length < 3) {
                currentInput.val += d;
              }
            }
          }, d))
        ),

        div({ style: 'display:flex; gap:1rem; justify-content:center; margin-top:1rem;' },
          button({
            class: 'btn btn-secondary',
            disabled: () => isFinished.val,
            onclick: () => currentInput.val = ''
          }, '⌫ Clear'),
          button({
            class: 'btn btn-primary btn-lg',
            disabled: () => isFinished.val,
            onclick: () => {
              if (currentInput.val.length !== 3) {
                alert('Please enter a full 3-digit guess!');
                return;
              }

              if (currentInput.val === secretTarget) {
                isFinished.val = true;
                const bonusTable = { 1: 15, 2: 10, 3: 5 };
                const bonus = bonusTable[currentAttempt.val];

                const maxPotential = Math.round(parseFloat(itemPrice || 100) * 0.15);
                const awardedVal = Math.round(parseFloat(itemPrice || 100) * (bonus / 100));

                onComplete({
                  potentialBonusDollars: maxPotential,
                  bonusDollars: awardedVal,
                  bonusPercent: bonus,
                  success: true,
                  outcomeText: `SUCCESS! Guessed target ($${secretTarget}) on Try #${currentAttempt.val}! (+${bonus}% Bonus accuracy)`
                });
              } else {
                if (currentAttempt.val < 3) {
                  currentAttempt.val++;
                  currentInput.val = '';
                  alert(`Wrong guess! ${4 - currentAttempt.val} attempt(s) remaining.`);
                } else {
                  isFinished.val = true;
                  const maxPotential = Math.round(parseFloat(itemPrice || 100) * 0.15);

                  onComplete({
                    potentialBonusDollars: maxPotential,
                    bonusDollars: 0,
                    bonusPercent: 0,
                    success: false,
                    outcomeText: `MISSED! Used all 3 attempts. Target was $${secretTarget}. (+0% Bonus)`
                  });
                }
              }
            }
          }, 'Submit Guess')
        )
      )
    );
  }
};
