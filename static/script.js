// script.js

// --- Initial Variables and Constants ---
const TILE_COUNT = 5;
const ROW_COUNT = 6;

let currentRow = 0;
let currentCol = 0;

let currentGuess = [];
let wordOfTheDay = ""; // Will be loaded from JSON
let wordList = {};    // Object to store words from JSON

const gameBoard = document.getElementById('game-board');
const keyboardContainer = document.getElementById('keyboard-container');
const messageContainer = document.getElementById('message-container');

// --- NEW: Function to load Word List from JSON file ---
async function loadWordList() {
    try {
        const response = await fetch('static/wordlist.json'); // Use fetch API to load the file
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        wordList = await response.json(); // Convert response to JSON object
        console.log("Word list loaded successfully:", wordList);

        // After loading, call initializeGame
        initializeGame();
    } catch (error) {
        console.error("Error loading word list:", error);
        showMessage("Error loading word list", false);
    }
}

// --- Game Initialization Function (modified) ---
function initializeGame() {
    // Filter words with length equal to TILE_COUNT (e.g., 5 characters)
    const fiveLetterWords = Object.keys(wordList).filter(word => word.length === TILE_COUNT);

    if (fiveLetterWords.length > 0) {
        // Randomly select a word from the filtered list
        const randomIndex = Math.floor(Math.random() * fiveLetterWords.length);
        wordOfTheDay = fiveLetterWords[randomIndex].toUpperCase();
        console.log("Today's word is:", wordOfTheDay);
    } else {
        console.warn("No 5-letter words found in wordlist.json!");
        wordOfTheDay = "APPLE"; // fallback word if no words in list
    }

    // Reset game state for a new game
    currentRow = 0;
    currentCol = 0;
    currentGuess = [];

    // Clear the board and reset keyboard button colors
    resetGameBoard();
    resetKeyboardColors();
}

// --- NEW: Function to clear the game board (for a new game) ---
function resetGameBoard() {
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
        tile.textContent = '';
        tile.classList.remove('filled', 'correct', 'present', 'absent');
    });
    messageContainer.textContent = ''; // Clear notification messages
}

// --- NEW: Function to reset keyboard button colors (for a new game) ---
function resetKeyboardColors() {
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.classList.remove('correct', 'present', 'absent');
    });
}

// --- Function to handle letter input (unchanged) ---
function addLetterToTile(letter) {
    if (currentCol < TILE_COUNT) {
        const tile = gameBoard.querySelector(`.row:nth-child(${currentRow + 1}) .tile:nth-child(${currentCol + 1})`);
        tile.textContent = letter.toUpperCase();
        tile.classList.add('filled');
        currentGuess.push(letter.toUpperCase());
        currentCol++;
    }
}

// --- Function to handle backspace (unchanged) ---
function deleteLetter() {
    if (currentCol > 0) {
        currentCol--;
        const tile = gameBoard.querySelector(`.row:nth-child(${currentRow + 1}) .tile:nth-child(${currentCol + 1})`);
        tile.textContent = '';
        tile.classList.remove('filled');
        currentGuess.pop();
    }
}

// --- Function to display messages (unchanged) ---
function showMessage(message, isTemporary = false) {
    messageContainer.textContent = message;
    if (isTemporary) {
        setTimeout(() => {
            messageContainer.textContent = '';
        }, 2000);
    }
}

// --- Function to check guess and update tile colors (unchanged) ---
function updateTileColors(guessWord) {
    const correctWord = wordOfTheDay.toUpperCase();
    const guessLetters = guessWord.toUpperCase().split('');
    const correctLetters = correctWord.toUpperCase().split('');

    const correctLetterCounts = {};
    for (const char of correctLetters) {
        correctLetterCounts[char] = (correctLetterCounts[char] || 0) + 1;
    }

    const usedLetters = {};

    // 1. Check for 'correct' (green) first
    for (let i = 0; i < TILE_COUNT; i++) {
        const tile = gameBoard.querySelector(`.row:nth-child(${currentRow + 1}) .tile:nth-child(${i + 1})`);
        const guessedChar = guessLetters[i];

        if (guessedChar === correctLetters[i]) {
            tile.classList.add('correct');
            const keyElement = keyboardContainer.querySelector(`.key[data-key="${guessedChar}"]`); // Find key by data-key
            if (keyElement) {
                // If already green, no need to change
                if (!keyElement.classList.contains('correct')) {
                    keyElement.classList.add('correct');
                    keyElement.classList.remove('present', 'absent'); // Remove other colors
                }
            }
            usedLetters[guessedChar] = (usedLetters[guessedChar] || 0) + 1;
        }
    }

    // 2. Check for 'present' (yellow) and 'absent' (gray)
    for (let i = 0; i < TILE_COUNT; i++) {
        const tile = gameBoard.querySelector(`.row:nth-child(${currentRow + 1}) .tile:nth-child(${i + 1})`);
        const guessedChar = guessLetters[i];

        if (!tile.classList.contains('correct')) { // If this tile is not already green
            if (correctLetters.includes(guessedChar) && (usedLetters[guessedChar] || 0) < (correctLetterCounts[guessedChar] || 0)) {
                tile.classList.add('present');
                const keyElement = keyboardContainer.querySelector(`.key[data-key="${guessedChar}"]`);
                if (keyElement) {
                    if (!keyElement.classList.contains('correct') && !keyElement.classList.contains('present')) {
                        keyElement.classList.add('present');
                        keyElement.classList.remove('absent');
                    }
                }
                usedLetters[guessedChar] = (usedLetters[guessedChar] || 0) + 1;
            } else {
                tile.classList.add('absent');
                const keyElement = keyboardContainer.querySelector(`.key[data-key="${guessedChar}"]`);
                if (keyElement) {
                    if (!keyElement.classList.contains('correct') && !keyElement.classList.contains('present')) {
                        keyElement.classList.add('absent');
                    }
                }
            }
        }
    }
}


// --- Function to handle Enter key (submit guess) (slightly modified) ---
function handleEnter() {
    if (currentCol !== TILE_COUNT) {
        showMessage("Please enter 5 letters", true);
        return;
    }

    const guessWord = currentGuess.join('').toUpperCase();
    // *** NEW: Check if the guessed word is a valid word in wordList (if desired) ***
    // (Currently only checks length, but you can add Object.keys(wordList).includes(guessWord) for validity)
    if (!Object.keys(wordList).includes(guessWord.toLowerCase())) {
        showMessage("Word not found in our dictionary", true);
        return; // Stop execution if the guess is not valid
    }


    updateTileColors(guessWord); // Update tile colors

    if (guessWord === wordOfTheDay) {
        showMessage(`Excellent! You guessed it!\nThe word "${wordOfTheDay}" means: ${wordList[wordOfTheDay.toLowerCase()]}`);
        // Potentially disable keyboard or show play again button
        // Add "Play again" button
        setTimeout(() => {
            if (!document.getElementById('restart-button')) { // Prevent creating duplicates
                const restartButton = document.createElement('button');
                restartButton.textContent = 'Play again';
                restartButton.id = 'restart-button';
                restartButton.style.marginTop = '10px';
                restartButton.style.padding = '10px 20px';
                restartButton.style.fontSize = '1.5em';
                restartButton.style.backgroundColor = 'var(--color-background)';
                restartButton.style.color = 'white';
                restartButton.style.border = 'none';
                restartButton.style.borderRadius = '20px';
                restartButton.style.cursor = 'pointer';
                restartButton.addEventListener('click', initializeGame);
                messageContainer.after(restartButton); // Show button after message container
            }
        }, 1000); // Small delay
        return;
    }

    currentRow++;
    currentCol = 0;
    currentGuess = [];

    if (currentRow >= ROW_COUNT) {
        showMessage(`Game over! The word was "${wordOfTheDay}"\nThe word "${wordOfTheDay}" means: ${wordList[wordOfTheDay.toLowerCase()]}`);
        // Add "Play again" button
        setTimeout(() => {
            if (!document.getElementById('restart-button')) {
                const restartButton = document.createElement('button');
                restartButton.textContent = 'Play again';
                restartButton.id = 'restart-button';
                restartButton.style.marginTop = '10px';
                restartButton.style.padding = '10px 20px';
                restartButton.style.fontSize = '1.5em';
                restartButton.style.backgroundColor = 'var(--color-background)'; // Gray color
                restartButton.style.color = 'white';
                restartButton.style.border = 'none';
                restartButton.style.borderRadius = '20px';
                restartButton.style.cursor = 'pointer';
                restartButton.addEventListener('click', initializeGame);
                messageContainer.after(restartButton);
            }
        }, 1000);
    }
}

// --- Event Listener for keyboard buttons (unchanged) ---
const keys = document.querySelectorAll('.key');

keys.forEach(key => {
    const keyText = key.textContent.trim();
    if (keyText.length === 1 && /^[a-zA-Z]+$/.test(keyText)) {
        key.setAttribute('data-key', keyText.toUpperCase());
    } else if (keyText === "SUBMIT") {
        key.setAttribute('data-key', 'SUBMIT');
    } else if (keyText === "<") {
        key.setAttribute('data-key', '');
    }

    key.addEventListener('click', () => {
        const clickedKey = key.textContent.trim();

        if (clickedKey === "SUBMIT") {
            handleEnter();
        } else if (clickedKey === "<") {
            deleteLetter();
        } else if (clickedKey.length === 1 && /^[a-zA-Z]+$/.test(clickedKey)) {
            addLetterToTile(clickedKey.toUpperCase());
        }
    });
});
      
// --- Event Listener for real keyboard input (unchanged) ---
document.addEventListener('keydown', (event) => {
    const key = event.key;

    if (key === "Enter") {
        handleEnter();
    } else if (key === "Backspace") {
        deleteLetter();
    } else if (key.length === 1 && /^[a-zA-Z]+$/.test(key)) {
        addLetterToTile(key.toUpperCase());
    }
});

// --- Call the word list loading function when DOM is fully loaded ---
document.addEventListener('DOMContentLoaded', loadWordList); // Changed from initializeGame to loadWordList