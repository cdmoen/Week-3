document.addEventListener("DOMContentLoaded", () => {
	// ============================================================
	//  AUDIO
	// ============================================================

	const SOUNDS = {
		success: new Audio("Sounds/Success.mp3"),
		incorrect: new Audio("Sounds/Incorrect.mp3"),
		winner: new Audio("Sounds/winner.mp3"),
		flip: new Audio("Sounds/flip.mp3"),
	};

	// ============================================================
	//  HELPERS
	// ============================================================

	const $ = (sel) => document.querySelector(sel);
	const $$ = (sel) => document.querySelectorAll(sel);

	const play = (audio, time = 0) => {
		audio.currentTime = time;
		audio.play();
	};

	const updateGuessDisplay = () => {
		$(".guesses").innerHTML =
			`GUESSES:&nbsp;<span style="color:red; text-shadow:1px 1px 1px black">${guesses}</span>`;
	};

	// ============================================================
	//  CONSTANTS
	// ============================================================

	const FLIP_DURATION = 600;
	const WIN_DELAY = 1200;
	const END_SCREEN_DELAY = 1500;

	const DIFFICULTY = {
		easy: { size: 2, pairs: 2 },
		medium: { size: 4, pairs: 8 },
		hard: { size: 6, pairs: 18 },
	};

	// ============================================================
	//  GAME STATE
	// ============================================================

	let firstCard = null;
	let guesses = 0;
	let solvedCounter = 0;
	let targetPairs = 0;

	// ============================================================
	//  GRID SETUP
	// ============================================================

	const buildGrid = (size) => {
		const board = $(".gameboard");
		board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
		board.style.gridTemplateRows = `repeat(${size}, 1fr)`;
	};

	// ============================================================
	//  GAME START
	// ============================================================

	const startGame = (mode) => {
		$(".gameboard").innerHTML = "";

		const { size, pairs } = DIFFICULTY[mode];
		targetPairs = pairs;

		$(".startScreen").style.display = "none";
		$(".gameWindow").style.display = "flex";

		firstCard = null;
		guesses = 0;
		solvedCounter = 0;
		updateGuessDisplay();

		buildGrid(size);

		const letters = generatePairs(pairs);
		letters.forEach(createCard);
	};

	// Difficulty button listeners
	$$(".startScreen button").forEach((btn) => {
		btn.addEventListener("click", () => {
			startGame(btn.dataset.mode);
		});
	});

	// ============================================================
	//  CARD CREATION
	// ============================================================

	const createCard = (letter) => {
		const gameboard = $(".gameboard");

		const scene = document.createElement("div");
		const card = document.createElement("div");
		const front = document.createElement("div");
		const back = document.createElement("div");

		scene.classList.add("scene");
		card.classList.add("card", letter);
		front.classList.add("face", "front");

		const hammerImageFront = document.createElement("img");
		hammerImageFront.classList.add("hammerFront");
		hammerImageFront.src = "Images/Hammer.png";
		hammerImageFront.alt = "Hammer";
		front.append(hammerImageFront);

		const hammerImageBack = document.createElement("div");
		hammerImageBack.classList.add("hammerBack");
		// hammerImageBack.src = "Images/Hammer.png";
		// hammerImageBack.alt = "Hammer";
		back.append(hammerImageBack);

		back.classList.add("face", "back");
		const letterSpan = document.createElement("span");
		letterSpan.classList.add("letter");
		letterSpan.textContent = letter;
		back.append(letterSpan);

		card.append(front, back);
		scene.append(card);
		gameboard.append(scene);

		card.addEventListener("click", () => handleCardClick(card));
	};

	// ============================================================
	//  CARD CLICK LOGIC
	// ============================================================

	const handleCardClick = (card) => {
		if (card.classList.contains("solved")) return;
		if (card === firstCard) return;

		flipCard(card);

		if (!firstCard) {
			firstCard = card;
			return;
		}

		guesses++;
		updateGuessDisplay();

		const cardA = firstCard;
		const cardB = card;

		const isMatch = cardA.classList[1] === cardB.classList[1];

		isMatch ? handleMatch(cardA, cardB) : handleMismatch(cardA, cardB);

		firstCard = null;
	};

	const flipCard = (card) => {
		play(SOUNDS.flip, 0.69);
		card.classList.add("flipping-to-back", "upturned");
	};

	// ============================================================
	//  MATCH / MISMATCH
	// ============================================================

	const handleMatch = (cardA, cardB) => {
		solvedCounter++;

		setTimeout(() => {
			cardA.classList.remove("flipping-to-back");
			cardB.classList.remove("flipping-to-back");
		}, FLIP_DURATION);

		setTimeout(() => {
			cardA.classList.add("solved");
			cardB.classList.add("solved");
			play(SOUNDS.success, 0.2);

			if (solvedCounter === targetPairs) handleWin();
		}, FLIP_DURATION);
	};

	const handleMismatch = (cardA, cardB) => {
		setTimeout(() => {
			play(SOUNDS.incorrect);

			cardA.classList.remove("flipping-to-back");
			cardB.classList.remove("flipping-to-back");

			cardA.classList.add("flipping-to-front");
			cardB.classList.add("flipping-to-front");

			cardA.classList.remove("upturned");
			cardB.classList.remove("upturned");

			setTimeout(() => {
				cardA.classList.remove("flipping-to-front");
				cardB.classList.remove("flipping-to-front");
			}, FLIP_DURATION);
		}, FLIP_DURATION);
	};

	// ============================================================
	//  WIN CONDITION
	// ============================================================

	const handleWin = () => {
		setTimeout(() => {
			const display = $(".guesses");
			display.textContent = "YOU WIN!";
			display.classList.add("winnerText");

			$$(".card").forEach((card) => card.classList.add("winner"));
			play(SOUNDS.winner);

			setTimeout(showEndScreen, END_SCREEN_DELAY);
		}, WIN_DELAY);
	};

	const showEndScreen = () => {
		const display = $(".guesses");

		display.innerHTML = `
      <div class="endScreen">
        <div class="finalScore">Total Guesses: ${guesses}</div>
        <button class="restartBtn">Play Again</button>
      </div>
    `;

		$(".restartBtn").addEventListener("click", () => location.reload());
	};

	// ============================================================
	//  PAIR GENERATION
	// ============================================================

	const shuffle = (arr) => {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
	};

	const generatePairs = (pairCount) => {
		const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
		const chosen = alphabet.slice(0, pairCount);
		const letters = [...chosen, ...chosen];
		shuffle(letters);
		return letters;
	};
});
