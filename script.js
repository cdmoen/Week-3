// --- Audio ----------------------------------------------------

const sounds = {
  success: new Audio("Sounds/Success.mp3"),
  incorrect: new Audio("Sounds/Incorrect.mp3"),
  winner: new Audio("Sounds/winner.mp3")
};

// --- Game State ----------------------------------------------

let firstCard = null;
let guesses = 0;
let solvedCounter = 0;

// --- Helpers --------------------------------------------------

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const updateGuessDisplay = () => {
  $(".guesses").innerHTML =
    `GUESSES:&nbsp;<span style="color:red; text-shadow:1px 1px 1px black">${guesses}</span>`;
};

const play = (audio, time = 0) => {
  audio.currentTime = time;
  audio.play();
};

// --- Card Creation --------------------------------------------

const createCard = (letter) => {
  const gameboard = $(".gameboard");

  const scene = document.createElement("div");
  const card = document.createElement("div");
  const front = document.createElement("div");
  const back = document.createElement("div");

  scene.classList.add("scene");
  card.classList.add("card", letter);
  front.classList.add("face", "front");
  back.classList.add("face", "back");
  back.textContent = letter;

  card.append(front, back);
  scene.append(card);
  gameboard.append(scene);

  card.addEventListener("click", () => handleCardClick(card));
};

// --- Card Click Logic -----------------------------------------

const handleCardClick = (card) => {
  if (card.classList.contains("solved")) return;
  if (card === firstCard) return;

  card.classList.add("flipping-to-back", "upturned");

  // First card selected
  if (!firstCard) {
    firstCard = card;
    return;
  }

  // Second card selected
  guesses++;
  updateGuessDisplay();

  const cardA = firstCard;
  const cardB = card;
  const match = cardA.classList[1] === cardB.classList[1];

  match ? handleMatch(cardA, cardB) : handleMismatch(cardA, cardB);

  firstCard = null;
};

// --- Match / Mismatch -----------------------------------------

const handleMatch = (cardA, cardB) => {
  solvedCounter++;

  setTimeout(() => {
    cardA.classList.remove("flipping-to-back");
    cardB.classList.remove("flipping-to-back");
  }, 600);

  setTimeout(() => {
    cardA.classList.add("solved");
    cardB.classList.add("solved");
    play(sounds.success, 0.2);

    if (solvedCounter === 8) handleWin();
  }, 600);
};

const handleMismatch = (cardA, cardB) => {
  setTimeout(() => {
    play(sounds.incorrect);

    cardA.classList.remove("flipping-to-back");
    cardB.classList.remove("flipping-to-back");

    cardA.classList.add("flipping-to-front");
    cardB.classList.add("flipping-to-front");

    cardA.classList.remove("upturned");
    cardB.classList.remove("upturned");

    setTimeout(() => {
      cardA.classList.remove("flipping-to-front");
      cardB.classList.remove("flipping-to-front");
    }, 600);
  }, 600);
};

// --- Win Condition --------------------------------------------

// Function to display end-game screen after winning
const showEndScreen = () => {
  const display = $(".guesses");

  display.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size: 1.4rem; margin-bottom: 10px;">
        Total Guesses: <span style="color:red; text-shadow:1px 1px 1px black">${guesses}</span>
      </div>
      <button class="restartBtn" style="
        padding: 8px 16px;
        font-size: 1rem;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        background: royalblue;
        color: white;
        box-shadow: 0 2px 4px black;
      ">
        Play Again
      </button>
    </div>
  `;

  $(".restartBtn").addEventListener("click", () => {
    location.reload();
  });
};

// function to handle victory animation and call end-screen function
const handleWin = () => {
  setTimeout(() => {
    const display = $(".guesses");
    display.textContent = "YOU WIN!";
    display.classList.add("winnerText");

    $$(".card").forEach(card => card.classList.add("winner"));
    play(sounds.winner);

    // After animations finish, show final score + restart button
    setTimeout(() => {
      showEndScreen();
    }, 1500); // adjust delay to match your animation timing

  }, 1200);
};


// --- Card Generation ------------------------------------------

const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
};

const generatePairs = () => {
  const letters = ["A","A","B","B","C","C","D","D","E","E","F","F","G","G","H","H"];
  shuffle(letters);
  return letters;
};

// --- Init ------------------------------------------------------

generatePairs().forEach(createCard);
updateGuessDisplay();





