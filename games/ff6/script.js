// Global state
const state = {
    charWidths: {},
    letterTiles: {},
    imagesLoaded: 0,
    totalImages: 2, // Font + background
    tileSize: 13,
    numberOfTiles: 96,
    lineSpacing: 16,
    maxTextWidth: 208, // 240 - 32
};

// DOM elements
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const textInput = document.getElementById("textInput");

// Assets
const fontImage = new Image();
const backgroundImage = new Image();
fontImage.src = "variable_width_font.png";
backgroundImage.src = "background.png";

// Initialize the application
async function init() {
    registerEventListeners();
    await loadCharacterWidths();
    await loadImages();
    console.log('Application initialized');
    updateText();
}

// Event listeners
function registerEventListeners() {
    // document.getElementById("updateButton").addEventListener("click", updateText);
    textInput.addEventListener("keyup", updateText);

    // Add event listeners for special character buttons
    const specialCharButtons = document.querySelectorAll('.special-char-btn');
    specialCharButtons.forEach(button => {
        button.addEventListener('click', function () {
            const char = this.getAttribute('data-char');
            insertSpecialCharAtCursor(char);
        });
    });
}

// Insert special character at cursor position
function insertSpecialCharAtCursor(char) {
    const startPos = textInput.selectionStart;
    const endPos = textInput.selectionEnd;
    const text = textInput.value;
    const specialChar = `<${char}>`;

    // Insert the special character at cursor position
    textInput.value = text.substring(0, startPos) + specialChar + text.substring(endPos);

    // Move cursor position after the inserted special character
    textInput.selectionStart = startPos + specialChar.length;
    textInput.selectionEnd = startPos + specialChar.length;

    // Focus back on textarea and update the text
    textInput.focus();
    updateText();
}

// Image loading
function loadImages() {
    return new Promise(resolve => {
        // Check if images are already loaded
        if (fontImage.complete && backgroundImage.complete) {
            state.letterTiles = createLetterTiles();
            resolve();
            return;
        }

        let imagesLoaded = 0;
        const onImageLoad = () => {
            imagesLoaded++;
            if (imagesLoaded === state.totalImages) {
                state.letterTiles = createLetterTiles();
                resolve();
            }
        };

        fontImage.onload = onImageLoad;
        backgroundImage.onload = onImageLoad;
    });
}

// Character width data loading
async function loadCharacterWidths() {
    try {
        const response = await fetch('widths.json');
        state.charWidths = await response.json();
        console.log('Character widths loaded successfully');
    } catch (error) {
        console.error('Error loading character widths:', error);
    }
}

// Create letter tile mappings from font image
function createLetterTiles() {
    const tiles = [];

    // Extract each tile from the tileset
    for (let i = 0; i < state.numberOfTiles; i++) {
        const tileCanvas = document.createElement('canvas');
        tileCanvas.width = state.tileSize;
        tileCanvas.height = state.tileSize;
        const tileCtx = tileCanvas.getContext('2d', { willReadFrequently: true, alpha: true });

        tileCtx.clearRect(0, 0, state.tileSize, state.tileSize);
        tileCtx.drawImage(
            fontImage,
            i * state.tileSize, 0, state.tileSize, state.tileSize,
            0, 0, state.tileSize, state.tileSize
        );

        tiles.push(tileCanvas);
    }

    console.log(`Loaded ${tiles.length} tiles from tileset`);
    return mapLettersToTiles(tiles);
}

function mapLettersToTiles(tiles) {
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?/:\"'-.…_;#+()%~*@π=\""
    letter_array = letters.split("")
    special_chars = ["block", "block", "light", "cross", "lightning", "air", "next", "gem", "fire", "water", "poison", " "]
    letter_array.push(...special_chars)
    const characters = letter_array;
    const letterTileMap = {};

    for (let i = 0; i < characters.length; i++) {

        if (letterTileMap[characters[i]]) {
            console.log(`Duplicate character found: ${characters[i]}`);
        }
        letterTileMap[characters[i]] = tiles[i];
    }

    return letterTileMap;
}

// Text rendering functions
function updateText() {
    const text = textInput.value;
    const lines = text.split("\n");

    // Limit to 4 lines
    if (lines.length > 4) {
        textInput.value = lines.slice(0, 4).join("\n");
        return;
    }

    // Render the text
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawText(textInput.value, 16, 8);
}

function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, 240, 72);
}

function drawText(text, x, y) {
    if (Object.keys(state.charWidths).length === 0) return;

    const lines = text.split("\n").slice(0, 4);

    lines.forEach((line, lineIndex) => {
        let cursorPos = 0;

        for (let i = 0; i < line.length; i++) {
            if (line[i] === "<") {
                let special_char = "";
                while (line[i] !== ">" && i < line.length) {
                    special_char += line[i];
                    i++;
                }
                // i++;
                special_char = special_char.replace("<", "").replace(">", "");
                drawTile(state.letterTiles[special_char], x + cursorPos, y);
                cursorPos += state.charWidths[special_char];
                continue;
            }
            const char = line[i];
            if (cursorPos < state.maxTextWidth) {
                drawTile(state.letterTiles[char], x + cursorPos, y);
                cursorPos += state.charWidths[char];
            }
        }

        y += state.lineSpacing;
    });
}

function drawTile(tile, x, y) {
    if (!tile) return;
    ctx.drawImage(tile, x, y, state.tileSize, state.tileSize);
}

// Initialize the application when the DOM is ready
document.addEventListener("DOMContentLoaded", init); 