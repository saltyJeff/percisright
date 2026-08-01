// Mini-Game 1: The Sliding Scale (ES Module)
import van from "vanjs-core";

export const slidingScale = {
  id: 'sliding-scale',
  name: 'The Sliding Scale',
  description: 'Winning team picks a dollar range. If actual price falls inside, they get +10% bonus accuracy!',

  renderHostConfig: function (containerEl, itemPrice) {
    const { div, label, input } = van.tags;
    const defaultMin = Math.max(0, Math.floor(itemPrice * 0.8));
    const defaultMax = Math.ceil(itemPrice * 1.2);

    containerEl.innerHTML = '';
    van.add(containerEl,
      div({ class: 'form-group' },
        label('Sliding Scale Target Dollar Range Preset'),
        div({ style: 'display:flex; gap:1rem;' },
          div(
            label({ style: 'font-size:0.8rem;' }, 'Min Target ($)'),
            input({ type: 'number', id: 'ss-host-min', class: 'form-control', value: defaultMin, step: '0.01' })
          ),
          div(
            label({ style: 'font-size:0.8rem;' }, 'Max Target ($)'),
            input({ type: 'number', id: 'ss-host-max', class: 'form-control', value: defaultMax, step: '0.01' })
          )
        )
      )
    );
  },

  getHostData: function (containerEl) {
    const minInput = containerEl.querySelector('#ss-host-min');
    const maxInput = containerEl.querySelector('#ss-host-max');
    return {
      minRange: parseFloat(minInput ? minInput.value : 0) || 0,
      maxRange: parseFloat(maxInput ? maxInput.value : 0) || 0
    };
  },

  renderPublicPlay: function (containerEl, winnerTeam, hostData, itemPrice, onComplete) {
    const { div, p, span, strong, input, button, label } = van.tags;

    const chosenMin = van.state(hostData.minRange || 0);
    const chosenMax = van.state(hostData.maxRange || 1000);
    const isSubmitted = van.state(false);

    containerEl.innerHTML = '';
    van.add(containerEl,
      div({ class: 'sliding-scale-wrapper' },
        div({ class: 'winner-banner' },
          '🏆 ', span('Winning Bidding Team: ', strong(winnerTeam.name))
        ),
        p('Set your target dollar range below. If the secret item price falls inside your range, earn ', strong('+10% Bonus'), '!'),
        
        div({ class: 'dual-slider-box' },
          div({ class: 'form-group' },
            label('Lower Range Bound ($)'),
            input({
              type: 'number',
              class: 'form-control',
              value: chosenMin.val,
              oninput: (e) => chosenMin.val = parseFloat(e.target.value) || 0
            })
          ),
          div({ class: 'form-group' },
            label('Upper Range Bound ($)'),
            input({
              type: 'number',
              class: 'form-control',
              value: chosenMax.val,
              oninput: (e) => chosenMax.val = parseFloat(e.target.value) || 0
            })
          )
        ),

        div({ class: 'range-display' },
          'Target: $', () => chosenMin.val, ' — $', () => chosenMax.val
        ),

        button({
          class: 'btn btn-primary btn-lg',
          disabled: () => isSubmitted.val,
          onclick: () => {
            isSubmitted.val = true;
            const minV = chosenMin.val;
            const maxV = chosenMax.val;
            const inside = itemPrice >= minV && itemPrice <= maxV;
            const bonus = inside ? 10 : 0;
            const outcomeText = inside 
              ? `SUCCESS! Secret price ($${itemPrice.toFixed(2)}) is inside $${minV}–$${maxV}. (+10% Bonus)`
              : `MISSED! Secret price ($${itemPrice.toFixed(2)}) was outside $${minV}–$${maxV}. (+0% Bonus)`;

            onComplete({
              bonusPercent: bonus,
              outcomeText: outcomeText
            });
          }
        }, () => isSubmitted.val ? 'Target Locked' : 'Lock In Target Range')
      )
    );
  }
};
