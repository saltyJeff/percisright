// Mini-Game 6: Ten Chances (Number Jumble) (ES Module)
import van from "vanjs-core";

export const tenChances = {
  id: 'ten-chances',
  name: 'Ten Chances (Number Jumble)',
  description: '5 jumbled digits hide a 3-digit price! Team gets 3 attempts (1st try = +15%, 2nd try = +10%, 3rd try = +5%).',

  renderHostConfig: function (containerEl, itemPrice) {
    const { div, label, input } = van.tags;
    const roundedPriceStr = Math.round(itemPrice).toString().padStart(3, '0');
    containerEl.innerHTML = '';
    van.add(containerEl,
      div({ class: 'form-group' },
        label('3-Digit Target Price for Ten Chances ($)'),
        input({ type: 'number', id: 'tc-target-price', class: 'form-control', value: roundedPriceStr.slice(-3), placeholder: 'e.g. 450' })
      )
    );
  },

  getHostData: function (containerEl) {
    const rawVal = containerEl.querySelector('#tc-target-price');
    const val = rawVal ? rawVal.value : '450';
    return {
      targetDigits: val.toString().padStart(3, '0').slice(-3)
    };
  },

  renderPublicPlay: function (containerEl, winnerTeam, hostData, itemPrice, onComplete) {
    const { div, p, span, strong, button } = van.tags;

    const secretTarget = hostData.targetDigits || '450';
    
    // Create 5 jumbled digits pool containing target digits
    let digitsPool = secretTarget.split('');
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
          '🏆 ', span('Winning Bidding Team: ', strong(winnerTeam.name))
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

                onComplete({
                  bonusPercent: bonus,
                  outcomeText: `SUCCESS! Guessed target ($${secretTarget}) on Try #${currentAttempt.val}! (+${bonus}% Bonus accuracy)`
                });
              } else {
                if (currentAttempt.val < 3) {
                  currentAttempt.val++;
                  currentInput.val = '';
                  alert(`Wrong guess! ${4 - currentAttempt.val} attempt(s) remaining.`);
                } else {
                  isFinished.val = true;
                  onComplete({
                    bonusPercent: 0,
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
