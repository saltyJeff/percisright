// Mini-Game 4: Range Finder (Risk/Reward) (ES Module)
import van from "vanjs-core";

export const rangeFinder = {
  id: 'range-finder',
  name: 'Range Finder (Risk/Reward)',
  description: 'Select a spread size around your team bid. Narrower spread = Higher risk & higher bonus!',

  renderHostConfig: function (containerEl) {
    const { p } = van.tags;
    containerEl.innerHTML = '';
    van.add(containerEl, p({ class: 'text-muted', style: 'font-size:0.9rem;' }, 'No secret host config required for Range Finder. Spread parameters are auto-calculated relative to winning bid.'));
  },

  getHostData: function () {
    return {};
  },

  renderPublicPlay: function (containerEl, winnerTeam, hostData, itemPrice, onComplete) {
    const { div, p, span, strong, button } = van.tags;

    const winningBid = winnerTeam.bid || itemPrice;
    const selectedSpreadKey = van.state('');
    const isSubmitted = van.state(false);

    const spreads = [
      { key: 'narrow', title: 'Narrow Spread', detail: '±$25 ($50 total range)', margin: 25, bonus: 15 },
      { key: 'medium', title: 'Medium Spread', detail: '±$50 ($100 total range)', margin: 50, bonus: 10 },
      { key: 'wide', title: 'Wide Spread', detail: '±$100 ($200 total range)', margin: 100, bonus: 5 }
    ];

    containerEl.innerHTML = '';
    van.add(containerEl,
      div({ class: 'range-finder-box' },
        div({ class: 'winner-banner' },
          '🏆 ', span('Winning Bidding Team: ', strong(winnerTeam.name), ` (Bid: $${winningBid.toFixed(2)})`)
        ),

        p('Choose your spread size around your bid of ', strong(`$${winningBid.toFixed(2)}`), ':'),

        div({ class: 'spread-choices' },
          spreads.map(sp => div({
            class: () => `spread-card ${selectedSpreadKey.val === sp.key ? 'selected' : ''}`,
            onclick: () => selectedSpreadKey.val = sp.key
          },
            div({ class: 'spread-title' }, sp.title),
            div({ class: 'spread-detail' }, sp.detail),
            div({ class: 'bonus-tag' }, `+${sp.bonus}% Bonus`)
          ))
        ),

        () => selectedSpreadKey.val !== '' ? div({ id: 'rf-confirm-wrap', style: 'margin-top:1.5rem;' },
          p('Selected Range: ', strong({ style: 'color:var(--accent-cyan); font-size:1.3rem;' }, () => {
            const sp = spreads.find(s => s.key === selectedSpreadKey.val);
            const minB = Math.max(0, winningBid - sp.margin);
            const maxB = winningBid + sp.margin;
            return `$${minB.toFixed(2)} — $${maxB.toFixed(2)} (+${sp.bonus}% Bonus)`;
          })),
          button({
            class: 'btn btn-primary btn-lg',
            style: 'margin-top:1rem;',
            disabled: () => isSubmitted.val,
            onclick: () => {
              isSubmitted.val = true;
              const sp = spreads.find(s => s.key === selectedSpreadKey.val);
              const minB = Math.max(0, winningBid - sp.margin);
              const maxB = winningBid + sp.margin;

              const inside = itemPrice >= minB && itemPrice <= maxB;
              const actualBonus = inside ? sp.bonus : 0;

              const outcomeText = inside
                ? `SUCCESS! Secret price ($${itemPrice.toFixed(2)}) fell inside $${minB.toFixed(2)}–$${maxB.toFixed(2)}! (+${actualBonus}% Bonus)`
                : `MISSED! Secret price ($${itemPrice.toFixed(2)}) fell outside $${minB.toFixed(2)}–$${maxB.toFixed(2)}. (+0% Bonus)`;

              onComplete({
                bonusPercent: actualBonus,
                outcomeText: outcomeText
              });
            }
          }, () => isSubmitted.val ? 'Target Locked' : 'Lock In Target Range')
        ) : div()
      )
    );
  }
};
