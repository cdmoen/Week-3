document.addEventListener("DOMContentLoaded", () => {
	// Audio configuration
	const SOUNDS = {
		success: new Audio("Sounds/Success.mp3"),
		incorrect: new Audio("Sounds/Incorrect.mp3"),
		winner: new Audio("Sounds/winner.mp3"),
		flip: new Audio("Sounds/flip.mp3"),
	};

	// Helper functions for DOM selection and state management
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

	const saveState = () => {
		sessionStorage.setItem("memoryGameState", JSON.stringify(gameState));
	};

	const loadState = () => {
		const raw = sessionStorage.getItem("memoryGameState");
		return raw ? JSON.parse(raw) : null;
	};

	const loadTotalMoves = () => {
		return Number(localStorage.getItem("totalMoves") || 0);
	};

	const saveTotalMoves = (value) => {
		localStorage.setItem("totalMoves", value);
	};

	const formatTime = (secs) => {
		const m = String(Math.floor(secs / 60)).padStart(2, "0");
		const s = String(secs % 60).padStart(2, "0");
		return `${m}:${s}`;
	};

	let totalMoves = 0;

	// Game constants
	const FLIP_DURATION = 600;
	const WIN_DELAY = 1200;
	const END_SCREEN_DELAY = 1500;

	const DIFFICULTY = {
		easy: { size: 2, pairs: 2 },
		medium: { size: 4, pairs: 8 },
		hard: { size: 6, pairs: 18 },
	};

	// Global game state variables
	let firstCard = null;
	let guesses = 0;
	let solvedCounter = 0;
	let targetPairs = 0;
	let timerInterval = null;
	let elapsedSeconds = 0;

	let gameState = {
		mode: null,
		letters: [],
		cards: [],
		guesses: 0,
		solvedCounter: 0,
		targetPairs: 0,

		// Timer tracking
		startTime: null,
		elapsedBeforeRefresh: 0,
	};

	// Set up the CSS grid based on difficulty size
	const buildGrid = (size) => {
		const board = $(".gameboard");
		board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
		board.style.gridTemplateRows = `repeat(${size}, 1fr)`;
	};

	// Initialize a new game
	const startGame = (mode) => {
		// Clear any saved state to ensure a fresh start
		sessionStorage.removeItem("memoryGameState");

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

		gameState = {
			mode,
			letters,
			cards: letters.map((l) => ({ letter: l, flipped: false, solved: false })),
			guesses: 0,
			solvedCounter: 0,
			targetPairs: pairs,

			// Initialize timer fields
			startTime: Date.now(),
			elapsedBeforeRefresh: 0,
		};

		letters.forEach(createCard);

		saveState();
		startTimer();
	};

	// Attach event listeners to difficulty buttons
	$$(".startScreen button").forEach((btn) => {
		btn.addEventListener("click", () => {
			startGame(btn.dataset.mode);
		});
	});

	const restoreGame = (state) => {
		gameState = state;

		const {
			mode,
			letters,
			cards,
			guesses: g,
			solvedCounter: s,
			targetPairs: t,
		} = state;

		guesses = state.guesses;
		gameState.guesses = state.guesses;
		updateGuessDisplay();

		solvedCounter = s;
		targetPairs = t;

		$(".startScreen").style.display = "none";
		$(".gameWindow").style.display = "flex";

		const { size } = DIFFICULTY[mode];
		buildGrid(size);

		$(".gameboard").innerHTML = "";

		letters.forEach((letter, i) => {
			createCard(letter);
		});

		// Restore visual state for flipped and solved cards
		const cardEls = $$(".card");

		cards.forEach((c, i) => {
			const el = cardEls[i];

			if (c.flipped) {
				el.classList.add("flipping-to-back", "upturned");
			}

			if (c.solved) {
				el.classList.add("solved");
			}
		});

		updateGuessDisplay();
		startTimer();
	};

	const startTimer = () => {
		// Set start time if this is a new game
		if (!gameState.startTime) {
			gameState.startTime = Date.now();
			gameState.elapsedBeforeRefresh = 0;
			saveState();
		}

		// Calculate how much time has passed
		elapsedSeconds = Math.floor(
			(Date.now() - gameState.startTime) / 1000 +
				gameState.elapsedBeforeRefresh,
		);

		$(".timer").textContent = formatTime(elapsedSeconds);

		timerInterval = setInterval(() => {
			elapsedSeconds++;
			$(".timer").textContent = formatTime(elapsedSeconds);
		}, 1000);
	};

	// Create the DOM structure for a single card
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

	// Handle user interaction with a card
	const handleCardClick = (card) => {
		if (card.classList.contains("solved")) return;
		if (card === firstCard) return;

		flipCard(card);

		if (!firstCard) {
			firstCard = card;
			return;
		}

		guesses++;
		gameState.guesses = guesses;
		saveState();
		updateGuessDisplay();

		totalMoves++;
		saveTotalMoves(totalMoves);
		$("#totalMoves").textContent = totalMoves;

		const cardA = firstCard;
		const cardB = card;

		const isMatch = cardA.classList[1] === cardB.classList[1];

		isMatch ? handleMatch(cardA, cardB) : handleMismatch(cardA, cardB);

		firstCard = null;
	};

	const flipCard = (card) => {
		play(SOUNDS.flip, 0.69);
		card.classList.add("flipping-to-back", "upturned");

		const index = [...$$(".card")].indexOf(card);
		gameState.cards[index].flipped = true;

		saveState();
	};

	// Logic for when two cards match
	const handleMatch = (cardA, cardB) => {
		solvedCounter++;
		gameState.solvedCounter = solvedCounter;

		const cards = [...$$(".card")];
		gameState.cards[cards.indexOf(cardA)].solved = true;
		gameState.cards[cards.indexOf(cardB)].solved = true;

		// Update visuals after a short delay
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

		saveState();
	};

	// Logic for when two cards do not match
	const handleMismatch = (cardA, cardB) => {
		const cards = [...$$(".card")];
		const iA = cards.indexOf(cardA);
		const iB = cards.indexOf(cardB);

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

			gameState.cards[iA].flipped = false;
			gameState.cards[iB].flipped = false;
			saveState();
		}, FLIP_DURATION);
	};

	// Handle game win state
	const handleWin = () => {
		stopTimer();

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

		$(".restartBtn").addEventListener("click", () => {
			sessionStorage.removeItem("memoryGameState");
			location.reload();
		});
	};

	const stopTimer = () => {
		clearInterval(timerInterval);

		gameState.elapsedBeforeRefresh = elapsedSeconds;
		saveState();
	};

	// Utilities for generating and shuffling card pairs
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

	totalMoves = Number(localStorage.getItem("totalMoves") || 0);
	$("#totalMoves").textContent = totalMoves;

	window.addEventListener("storage", (e) => {
		if (e.key === "totalMoves") {
			totalMoves = Number(e.newValue);
			$("#totalMoves").textContent = totalMoves;
		}
	});

	const saved = loadState();
	if (saved) {
		restoreGame(saved);
	}
});
