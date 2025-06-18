// script.js

// --- ตัวแปรและค่าคงที่เบื้องต้น ---
const TILE_COUNT = 5;
const ROW_COUNT = 6;

let currentRow = 0;
let currentCol = 0;

let currentGuess = [];
let wordOfTheDay = ""; // กำหนดให้ว่างไว้ก่อน เพราะจะโหลดจาก JSON
let wordList = {};    // Object สำหรับเก็บคำศัพท์จาก JSON

const gameBoard = document.getElementById('game-board');
const keyboardContainer = document.getElementById('keyboard-container');
const messageContainer = document.getElementById('message-container');

// --- NEW: ฟังก์ชันสำหรับโหลด Word List จากไฟล์ JSON ---
async function loadWordList() {
    try {
        const response = await fetch('static/wordlist.json'); // ใช้ fetch API เพื่อโหลดไฟล์
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        wordList = await response.json(); // แปลง response เป็น JSON object
        console.log("Word list loaded successfully:", wordList);

        // หลังจากโหลดเสร็จ ค่อยเรียก initializeGame
        initializeGame();
    } catch (error) {
        console.error("Error loading word list:", error);
        showMessage("เกิดข้อผิดพลาดในการโหลดคำศัพท์", false);
    }
}

// --- ฟังก์ชันเริ่มต้นเกม (มีการแก้ไข) ---
function initializeGame() {
    // กรองคำศัพท์ที่มีความยาวเท่ากับ TILE_COUNT (เช่น 5 ตัวอักษร)
    const fiveLetterWords = Object.keys(wordList).filter(word => word.length === TILE_COUNT);

    if (fiveLetterWords.length > 0) {
        // สุ่มเลือกคำจากลิสต์ที่กรองแล้ว
        const randomIndex = Math.floor(Math.random() * fiveLetterWords.length);
        wordOfTheDay = fiveLetterWords[randomIndex].toUpperCase();
        console.log("คำตอบวันนี้คือ:", wordOfTheDay);
    } else {
        console.warn("ไม่พบคำศัพท์ 5 ตัวอักษรใน wordlist.json!");
        wordOfTheDay = "APPLE"; // fallback word หากไม่มีคำในลิสต์
    }

    // รีเซ็ตสถานะเกมสำหรับเกมใหม่
    currentRow = 0;
    currentCol = 0;
    currentGuess = [];

    // ล้างกระดานและรีเซ็ตสีปุ่มคีย์บอร์ด
    resetGameBoard();
    resetKeyboardColors();
}

// --- NEW: ฟังก์ชันสำหรับล้างกระดาน (เมื่อเริ่มเกมใหม่) ---
function resetGameBoard() {
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
        tile.textContent = '';
        tile.classList.remove('filled', 'correct', 'present', 'absent');
    });
    messageContainer.textContent = ''; // ล้างข้อความแจ้งเตือน
}

// --- NEW: ฟังก์ชันสำหรับรีเซ็ตสีปุ่มคีย์บอร์ด (เมื่อเริ่มเกมใหม่) ---
function resetKeyboardColors() {
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.classList.remove('correct', 'present', 'absent');
    });
}

// --- ฟังก์ชันจัดการการพิมพ์ตัวอักษร (คงเดิม) ---
function addLetterToTile(letter) {
    if (currentCol < TILE_COUNT) {
        const tile = gameBoard.querySelector(`.row:nth-child(${currentRow + 1}) .tile:nth-child(${currentCol + 1})`);
        tile.textContent = letter.toUpperCase();
        tile.classList.add('filled');
        currentGuess.push(letter.toUpperCase());
        currentCol++;
    }
}

// --- ฟังก์ชันจัดการการลบตัวอักษร (Backspace) (คงเดิม) ---
function deleteLetter() {
    if (currentCol > 0) {
        currentCol--;
        const tile = gameBoard.querySelector(`.row:nth-child(${currentRow + 1}) .tile:nth-child(${currentCol + 1})`);
        tile.textContent = '';
        tile.classList.remove('filled');
        currentGuess.pop();
    }
}

// --- ฟังก์ชันแสดงข้อความแจ้งเตือน (คงเดิม) ---
function showMessage(message, isTemporary = false) {
    messageContainer.textContent = message;
    if (isTemporary) {
        setTimeout(() => {
            messageContainer.textContent = '';
        }, 2000);
    }
}

// --- ฟังก์ชันตรวจสอบคำทายและอัปเดตสีช่อง (Tile Colors) (คงเดิม) ---
function updateTileColors(guessWord) {
    const correctWord = wordOfTheDay.toUpperCase();
    const guessLetters = guessWord.toUpperCase().split('');
    const correctLetters = correctWord.toUpperCase().split('');

    const correctLetterCounts = {};
    for (const char of correctLetters) {
        correctLetterCounts[char] = (correctLetterCounts[char] || 0) + 1;
    }

    const usedLetters = {};

    // 1. ตรวจสอบหา 'correct' (สีเขียว) ก่อน
    for (let i = 0; i < TILE_COUNT; i++) {
        const tile = gameBoard.querySelector(`.row:nth-child(${currentRow + 1}) .tile:nth-child(${i + 1})`);
        const guessedChar = guessLetters[i];

        if (guessedChar === correctLetters[i]) {
            tile.classList.add('correct');
            const keyElement = keyboardContainer.querySelector(`.key[data-key="${guessedChar}"]`); // หาปุ่มด้วย data-key
            if (keyElement) {
                // ถ้ามีสีเขียวแล้ว ไม่ต้องเปลี่ยน
                if (!keyElement.classList.contains('correct')) {
                    keyElement.classList.add('correct');
                    keyElement.classList.remove('present', 'absent'); // ลบสีอื่นออก
                }
            }
            usedLetters[guessedChar] = (usedLetters[guessedChar] || 0) + 1;
        }
    }

    // 2. ตรวจสอบหา 'present' (สีเหลือง) และ 'absent' (สีเทา)
    for (let i = 0; i < TILE_COUNT; i++) {
        const tile = gameBoard.querySelector(`.row:nth-child(${currentRow + 1}) .tile:nth-child(${i + 1})`);
        const guessedChar = guessLetters[i];

        if (!tile.classList.contains('correct')) { // ถ้าช่องนี้ยังไม่มีสีเขียว
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


// --- ฟังก์ชันจัดการการกด Enter (ส่งคำทาย) (มีการแก้ไขเล็กน้อย) ---
function handleEnter() {
    if (currentCol !== TILE_COUNT) {
        showMessage("กรุณาพิมพ์ตัวอักษรให้ครบ 5 ตัว", true);
        return;
    }

    const guessWord = currentGuess.join('').toUpperCase();
    // *** NEW: ตรวจสอบว่าคำที่ทายเป็นคำที่ถูกต้องใน wordList หรือไม่ (ถ้าต้องการ) ***
    // (ตอนนี้แค่ตรวจสอบความยาว แต่คุณอาจจะเพิ่ม Object.keys(wordList).includes(guessWord) ได้)
    if (!Object.keys(wordList).includes(guessWord.toLowerCase())) {
        showMessage("ไม่พบคำนี้ในพจนานุกรมของเรา", true);
        return; // หยุดการทำงานถ้าคำทายไม่ถูกต้อง
    }


    updateTileColors(guessWord); // อัปเดตสีของช่องตัวอักษร

    if (guessWord === wordOfTheDay) {
        showMessage(`ยอดเยี่ยม! คุณทายถูกแล้ว!\nคำว่า "${wordOfTheDay}" หมายถึง : ${wordList[wordOfTheDay.toLowerCase()]}`);
        // อาจจะปิดการใช้งานคีย์บอร์ด หรือแสดงปุ่มเล่นใหม่
        // เพิ่มปุ่ม "เล่นใหม่"
        setTimeout(() => {
            if (!document.getElementById('restart-button')) { // ป้องกันสร้างซ้ำ
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
                messageContainer.after(restartButton); // แสดงปุ่มหลัง message container
            }
        }, 1000); // หน่วงเวลาเล็กน้อย
        return;
    }

    currentRow++;
    currentCol = 0;
    currentGuess = [];

    if (currentRow >= ROW_COUNT) {
        showMessage(`จบเกมแล้ว! คำตอบคือ "${wordOfTheDay}"\nคำว่า "${wordOfTheDay}" หมายถึง : ${wordList[wordOfTheDay.toLowerCase()]}`);
        // เพิ่มปุ่ม "เล่นใหม่"
        setTimeout(() => {
            if (!document.getElementById('restart-button')) {
                const restartButton = document.createElement('button');
                restartButton.textContent = 'Play again';
                restartButton.id = 'restart-button';
                restartButton.style.marginTop = '10px';
                restartButton.style.padding = '10px 20px';
                restartButton.style.fontSize = '1.5em';
                restartButton.style.backgroundColor = 'var(--color-background)'; // สีเทา
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

// --- Event Listener สำหรับปุ่มคีย์บอร์ด (คงเดิม) ---
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
     
// --- Event Listener สำหรับการพิมพ์จากคีย์บอร์ดจริง (คงเดิม) ---
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

// --- เรียกฟังก์ชันโหลดคำศัพท์เมื่อ DOM โหลดเสร็จแล้ว ---
document.addEventListener('DOMContentLoaded', loadWordList); // เปลี่ยนจาก initializeGame เป็น loadWordList