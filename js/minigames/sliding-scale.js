// Mini-Game 1: The Sliding Scale (ES Module)
import van from "vanjs-core";

export const slidingScale = {
  id: 'sliding-scale',
  name: 'The Sliding Scale',
  description: 'Host sets a fixed dollar margin (e.g. ±$5 or ±$25). Team picks the center of the range. Win +10% bonus if actual price falls inside!',

  renderHostConfig: function (containerEl, itemPrice) {
    const { div, label, input, small } = van.tags;
    const defaultTarget = Math.round(itemPrice || 100);
    const defaultMargin = Math.max(5, Math.round(defaultTarget * 0.10));

    containerEl.innerHTML = '';
    van.add(containerEl,
      div({ class: 'form-group' },
        label('Sliding Scale Item Target Price ($)'),
        input({
          type: 'number',
          id: 'ss-host-target-price',
          class: 'form-control',
          value: defaultTarget,
          step: '1',
          min: '1'
        }),
        small({ class: 'text-muted' }, 'Secret price of the prize item for Sliding Scale.')
      ),
      div({ class: 'form-group', style: 'margin-top:0.75rem;' },
        label('Fixed Dollar Spread Margin (±$)'),
        input({
          type: 'number',
          id: 'ss-host-margin',
          class: 'form-control',
          value: defaultMargin,
          step: '1',
          min: '1'
        }),
        small({ class: 'text-muted' }, `Player's range width will be ±$${defaultMargin} (Total range span = $${defaultMargin * 2}) around their chosen center.`)
      )
    );

    const marginInp = containerEl.querySelector('#ss-host-margin');
    if (marginInp) {
      marginInp.oninput = (e) => {
        const val = Math.round(parseFloat(e.target.value) || 1);
        const smallEl = marginInp.parentElement.querySelector('small');
        if (smallEl) smallEl.textContent = `Player's range width will be ±$${val} (Total range span = $${val * 2}) around their chosen center.`;
      };
    }
  },

  getHostData: function (containerEl) {
    const targetInput = containerEl.querySelector('#ss-host-target-price');
    const marginInput = containerEl.querySelector('#ss-host-margin');

    const targetPrice = parseFloat(targetInput ? targetInput.value : NaN);
    const margin = Math.round(parseFloat(marginInput ? marginInput.value : 5));

    return {
      targetPrice: (!isNaN(targetPrice) && targetPrice > 0) ? targetPrice : null,
      margin: (!isNaN(margin) && margin > 0) ? margin : 5
    };
  },

  renderPublicPlay: function (containerEl, winnerTeam, hostData, itemPrice, onComplete) {
    const { div, p, span, strong, input, button, label } = van.tags;

    const margin = Math.round(hostData.margin || 5);
    const targetPrice = (hostData && hostData.targetPrice) ? hostData.targetPrice : itemPrice;
    const bonusAward = Math.round(targetPrice * 0.10);

    const defaultCenter = Math.round(winnerTeam.bid && winnerTeam.bid > 0 ? winnerTeam.bid : targetPrice);
    const centerVal = van.state(defaultCenter);
    const isSubmitted = van.state(false);

    containerEl.innerHTML = '';
    van.add(containerEl,
      div({ class: 'sliding-scale-wrapper' },
        div({ class: 'winner-banner' },
          '🏆 ', span('Winning Bidding Team: ', strong(winnerTeam.name))
        ),
        p('Set your ', strong('Center Target Price'), ' below. Your range width is ', strong(`±$${margin}`), '. If the secret price falls inside your range, earn ', strong(`+$${bonusAward} Bonus (+10%)`), '!'),

        div({ class: 'dual-slider-box' },
          div({ class: 'form-group' },
            label('Center Target Price ($)'),
            input({
              type: 'number',
              class: 'form-control',
              value: centerVal.val,
              step: '1',
              oninput: (e) => centerVal.val = Math.round(parseFloat(e.target.value) || 0)
            })
          )
        ),

        div({ class: 'range-display', style: 'padding:0.75rem; background:rgba(0,0,0,0.03); border:1px solid #dee2e6; border-radius:6px; margin:0.75rem 0;' },
          div({ style: 'font-size:0.85rem; color:var(--text-muted);' }, `Active Target Range (Center ± $${margin}):`),
          div({ style: 'font-size:1.4rem; font-weight:800; color:var(--primary-color); margin-top:0.2rem;' },
            () => {
              const c = Math.round(centerVal.val);
              const low = Math.max(0, c - margin);
              const high = c + margin;
              return `$${low} — $${high}`;
            }
          )
        ),

        button({
          class: 'btn btn-primary btn-lg',
          disabled: () => isSubmitted.val,
          onclick: () => {
            isSubmitted.val = true;
            const c = Math.round(centerVal.val);
            const roundedPrice = Math.round(targetPrice);
            const low = Math.max(0, c - margin);
            const high = c + margin;
            const inside = roundedPrice >= low && roundedPrice <= high;
            const awardedDollars = inside ? bonusAward : 0;
            const outcomeText = inside
              ? `SUCCESS! Secret price ($${roundedPrice}) is inside target range $${low}–$${high}! (+$${awardedDollars} Bonus)`
              : `MISSED! Secret price ($${roundedPrice}) was outside target range $${low}–$${high}. (+$0 Bonus)`;

            onComplete({
              potentialBonusDollars: bonusAward,
              bonusDollars: awardedDollars,
              bonusPercent: inside ? 10 : 0,
              success: inside,
              outcomeText: outcomeText
            });
          }
        }, () => isSubmitted.val ? 'Target Locked' : 'Lock In Target Range')
      )
    );
  }
};
