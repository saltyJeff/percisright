// Mini-Game 2: High/Low Wheel Spin (ES Module)
import van from "vanjs-core";

export const highLowWheel = {
  id: 'high-low-wheel',
  name: 'High/Low Wheel Spin',
  description: 'Spin the 1–20 digital die, predict HIGHER or LOWER for the next spin! Correct prediction = +10% bonus.',

  renderHostConfig: function (containerEl) {
    const { p } = van.tags;
    containerEl.innerHTML = '';
    van.add(containerEl, p({ class: 'text-muted', style: 'font-size:0.9rem;' }, 'No secret host config required for High/Low Wheel Spin.'));
  },

  getHostData: function () {
    return {};
  },

  renderPublicPlay: function (containerEl, winnerTeam, hostData, itemPrice, onComplete) {
    const { div, p, span, strong, button } = van.tags;

    const step = van.state(1); // 1: Spin 1, 2: Predict, 3: Spin 2
    const dieVal = van.state('?');
    const firstRoll = van.state(0);
    const prediction = van.state('');
    const isSpinning = van.state(false);

    function animateDie(targetVal, cb) {
      isSpinning.val = true;

      let interval = setInterval(() => {
        dieVal.val = Math.floor(Math.random() * 20) + 1;
      }, 50);

      setTimeout(() => {
        clearInterval(interval);
        isSpinning.val = false;
        dieVal.val = targetVal;
        if (cb) cb();
      }, 1000);
    }

    containerEl.innerHTML = '';
    van.add(containerEl,
      div({ class: 'wheel-spinner-box' },
        div({ class: 'winner-banner' },
          '🏆 ', span('Winning Bidding Team: ', strong(winnerTeam.name))
        ),

        div({
          class: () => `die-display pulse-glow ${isSpinning.val ? 'die-spin-anim' : ''}`
        }, () => dieVal.val),

        // Step 1 Controls
        () => step.val === 1 ? div(
          button({
            class: 'btn btn-primary btn-lg',
            disabled: () => isSpinning.val,
            onclick: () => {
              const rolled = Math.floor(Math.random() * 20) + 1;
              firstRoll.val = rolled;
              animateDie(rolled, () => step.val = 2);
            }
          }, '🎲 Spin 1-20 Die')
        ) : div(),

        // Step 2 Controls
        () => step.val === 2 ? div(
          p('You rolled ', strong({ style: 'font-size:1.4rem; color:var(--primary-gold);' }, firstRoll.val), '!'),
          p('Will the next spin be ', strong('HIGHER'), ' or ', strong('LOWER'), '?'),
          div({ style: 'display:flex; gap:1rem; margin-top:1rem; justify-content:center;' },
            button({
              class: 'btn btn-accent btn-lg',
              onclick: () => {
                prediction.val = 'HIGHER';
                step.val = 3;
              }
            }, '⬆ HIGHER'),
            button({
              class: 'btn btn-accent btn-lg',
              onclick: () => {
                prediction.val = 'LOWER';
                step.val = 3;
              }
            }, '⬇ LOWER')
          )
        ) : div(),

        // Step 3 Controls
        () => step.val === 3 ? div(
          p('Prediction: ', strong({ style: 'color:var(--accent-cyan);' }, prediction.val)),
          button({
            class: 'btn btn-primary btn-lg',
            disabled: () => isSpinning.val,
            onclick: () => {
              let secondRoll = Math.floor(Math.random() * 20) + 1;
              while (secondRoll === firstRoll.val) {
                secondRoll = Math.floor(Math.random() * 20) + 1;
              }

              animateDie(secondRoll, () => {
                step.val = 4;
                const isHigher = secondRoll > firstRoll.val;
                const correct = (prediction.val === 'HIGHER' && isHigher) || (prediction.val === 'LOWER' && !isHigher);
                const bonus = correct ? 10 : 0;

                const outcomeText = correct
                  ? `WIN! Roll 1 (${firstRoll.val}) ➔ Roll 2 (${secondRoll}) matched prediction '${prediction.val}'. (+10% Bonus)`
                  : `LOST! Roll 1 (${firstRoll.val}) ➔ Roll 2 (${secondRoll}) did not match '${prediction.val}'. (+0% Bonus)`;

                onComplete({
                  bonusPercent: bonus,
                  outcomeText: outcomeText
                });
              });
            }
          }, '🎲 Spin Second Roll')
        ) : div()
      )
    );
  }
};
