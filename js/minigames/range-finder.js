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

    const winningBid = Math.round(winnerTeam.bid || itemPrice);
    const roundedPrice = Math.round(itemPrice);
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
          '🏆 ', span('Winning Bidding Team: ', strong(winnerTeam.name), ` (Bid: $${winningBid})`)
        ),

        p('Choose your spread size around your bid of ', strong(`$${winningBid}`), ':'),

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
          p('Selected Range: ', strong({ style: 'font-size:1.3rem;' }, () => {
            const sp = spreads.find(s => s.key === selectedSpreadKey.val);
            const minB = Math.max(0, winningBid - sp.margin);
            const maxB = winningBid + sp.margin;
            return `$${minB} — $${maxB} (+${sp.bonus}% Bonus)`;
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

              const inside = roundedPrice >= minB && roundedPrice <= maxB;
              const actualBonus = inside ? sp.bonus : 0;

              const outcomeText = inside
                ? `SUCCESS! Secret price ($${roundedPrice}) fell inside $${minB}–$${maxB}! (+${actualBonus}% Bonus)`
                : `MISSED! Secret price ($${roundedPrice}) fell outside $${minB}–$${maxB}. (+0% Bonus)`;

              const potentialVal = Math.round(parseFloat(itemPrice || 100) * (sp.bonus / 100));
              const awardedVal = inside ? potentialVal : 0;

              onComplete({
                potentialBonusDollars: potentialVal,
                bonusDollars: awardedVal,
                bonusPercent: actualBonus,
                success: inside,
                outcomeText: outcomeText
              });
            }
          }, () => isSubmitted.val ? 'Target Locked' : 'Lock In Target Range')
        ) : div()
      )
    );
  }
};
