I am building a single-page, offline web app (host helper dashboard) to run a custom "Price Is Right" party game with my friends. It must run locally in a browser without internet.

Please write the full, self-contained single-file HTML/CSS/JS code (or React/Tailwind template) based on the game rules and host workflow below.

---

### GAME OVERVIEW & RULES

* **Objective:** Teams compete to get the highest total score (Higher = Better).
* **Bidding Phase Scoring (Accuracy %):**
  $$\text{Accuracy \%} = 100 - \left( \frac{|\text{Actual Price} - \text{Bid}|}{\text{Actual Price}} \times 100 \right)$$
  *(Floor score at 0%. Always round Accuracy % to 1 decimal place).*
* **Closest Without Going Over Bonus:** The team closest to the actual price without exceeding it automatically earns a **+5% Accuracy Bonus** added to that round.
* **Winner's Mini-Game:** The team with the highest Accuracy Score in the Bidding Phase earns the right to play the selected mini-game for extra bonus accuracy points.

---

### UI & HOST WORKFLOW (STEP-BY-STEP)

#### Step 1: Game Setup (Start Screen)
- Input field to set the number of teams and customize team names.
- A "Start Game" button to initialize the scoreboard.

#### Step 2: Secret Host Prep Phase (HOST ONLY — Hide Secret Info)
- **Host Form:**
  1. Input the **Actual Price** of the main item.
  2. Select 1 **Mini-Game** from a dropdown list for this round.
  3. Configure mini-game parameters if applicable (e.g., set the target range, difficulty, or timer length).
- **Security Check:** Keep this info hidden or blurred. 
- A prominent **"Begin Public Round"** button locks in the secret data and transitions to the Public Screen.

#### Step 3: Public Bidding & Mini-Game Phase (PUBLIC DISPLAY)
- **Rule:** DO NOT display the Actual Price or Mini-Game correct answers here!
- **Interactive Bidding:**
  - Display input boxes for each team to enter their **Bid**.
  - A button to lock in all bids.
- **Interactive Mini-Game Tooling:**
  - Display the selected Mini-Game UI for the players to interact with (e.g., interactive 30s timer, digital 1–20 dice spinner, cup pickers, range selector).

#### Step 4: The Reveal Phase
- A **"Reveal Round Results"** button triggers the reveal screen:
  - Show the actual item price.
  - Show each team's Bid, calculated Accuracy %, and who got the **+5% Closest Without Going Over** bonus.
  - Show the outcome/bonus from the Mini-Game.
  - Automatically add all round points to the **Master Leaderboard**.
  - A "Next Round" button to return to Step 2.

---

### LIST OF MINI-GAMES TO INCLUDE IN THE APP

1. **The Sliding Scale**
   - *Setup:* Host inputs a target dollar range (e.g., $400–$500).
   - *Public Play:* Winning team picks their target range on screen. Correct = +10% bonus. Wrong = penalty awarded to other teams.

2. **High/Low Wheel Spin**
   - *Public Play:* Interactive digital 1–20 die/spinner. Team presses "Spin", then clicks "HIGHER" or "LOWER". Host confirms if correct for a +10% bonus.

3. **Shell Game (3-Cup Shuffle)**
   - *Public Play:* 3 clickable cups hiding +10%, 0%, or -5%. Team answers a Higher/Lower question to remove 1 bad cup, then clicks a cup to reveal their bonus.

4. **Range Finder (Risk/Reward)**
   - *Public Play:* Team selects a spread size (Narrow = $50 spread for +15% bonus; Medium = $100 for +10%; Wide = $200 for +5%). If actual price falls within, they win the bonus. If they miss, the spread value is deducted.

5. **Clock Game (30-Second Rapid Fire)**
   - *Public Play:* Built-in interactive 30-second timer with Start/Pause/Reset. Buttons for "Higher" and "Lower" audio/visual cues. Extra +1% bonus for every 3 seconds left on the clock.

6. **Ten Chances (Number Jumble)**
   - *Public Play:* Screen displays 5 jumbled digits. Team gets 3 interactive attempts to guess the 3-digit price. (1st try = +15%, 2nd try = +10%, 3rd try = +5%).

---

### TECHNICAL REQUIREMENTS
- Use VanJS / VanJS X (`van.min.js` and `van-x.min.js`)
- Divide each game/minigame into its own JS file and CSS file.
- Remember, each item will have different scaled prices.
- Clean, modern UI suitable for viewing on a laptop.
- Persistent score tracking across rounds.