// Global state
const state = {
    canvasWidth: 160,
    canvasHeight: 56,
    charWidths: {},
    letterTiles: {},
    imagesLoaded: 0,
    totalImages: 2, // Font + background
    tileWidth: 16,
    tileHeight: 14,
    // numberOfTiles: 112,
    numberOfTiles: 224,
    lineSpacing: 14,
    maxTextWidth: 208, // 240 - 32
};

// DOM elements
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const textInput = document.getElementById("textInput");

// Assets
const fontImage = new Image();
const backgroundImage = new Image();
// fontImage.src = "variable_width_font_0.png";
fontImage.src = "italic_font.png";
backgroundImage.src = "background.png";

// Initialize the application
async function init() {
    registerEventListeners();
    await loadCharacterWidths("italic_widths.json");
    await loadImages();
    console.log('Application initialized');
    updateText();
}

// Event listeners
function registerEventListeners() {
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
async function loadCharacterWidths(widthsFile = "widths.json") {
    try {
        const response = await fetch(widthsFile);
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
        tileCanvas.width = state.tileWidth;
        tileCanvas.height = state.tileHeight;
        const tileCtx = tileCanvas.getContext('2d', { willReadFrequently: true, alpha: true });

        tileCtx.clearRect(0, 0, state.tileWidth, state.tileHeight);
        tileCtx.drawImage(
            fontImage,
            i * state.tileWidth, 0, state.tileWidth, state.tileHeight,
            0, 0, state.tileWidth, state.tileHeight
        );

        tiles.push(tileCanvas);
    }

    console.log(`Loaded ${tiles.length} tiles from tileset`);
    return mapItalicLettersToTiles(tiles);
}

function mapItalicLettersToTiles(tiles) {
    const special_chars = [
        "a_1",
        "a_2",
        "b_1",
        "b_2",
        "l_1",
        "l_2",
        "r_1",
        "r_2",
        "st_1",
        "st_2",
        "sel_1",
        "sel_2",
        " ",
        " ",
        "“",
        "—",
    ]
    let letter_array =
        " !”#$%&'()*+,-./0123456789:;<=>?"
        + "@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_"
        + "'abcdefghijklmnopqrstuvwxyz{|}~ "
        + Array(16).fill(" ").join("")
        + " ¡¢£ ¥ §¨©ª«¬ ®¯°±  ´µ¶·¸¹º»   ¿"
        + "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏ ÑÒÓÔÕÖ ØÙÚÛÜ  ß"
        + "àáâãäåæçèéêëìíîï ñòóôõö÷øùúûü  ÿ";

    letter_array = letter_array.split("");
    letter_array = [
        ...letter_array.slice(0, 32 * 3),
        ...special_chars,
        ...letter_array.slice(32 * 3 + special_chars.length, letter_array.length)
    ]



    const letterTileMap = {};
    const characters = letter_array;

    for (let i = 0; i < characters.length && i < tiles.length; i++) {
        if (letterTileMap[characters[i]]) {
            console.log(`Duplicate character found: ${characters[i]}`);
        }
        letterTileMap[characters[i]] = tiles[i];
    }

    letterTileMap[" "] = tiles[0];
    return letterTileMap;
}

function mapLettersToTiles(tiles) {
    const letters = "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[¥]^_±abcdefghijklmnopqrstuvwxyz{|}~";
    const letter_array = letters.split("");
    const special_chars = [
        "block",
        "a_button",
        " ",
        "b_button",
        " ",
        "l_button_1",
        "l_button_2",
        "r_button_1",
        "r_button_2",
        "start_button_1",
        "start_button_2",
        "select_button_1",
        "select_button_2",
        " "
    ];
    letter_array.push(...special_chars);
    const characters = letter_array;
    const letterTileMap = {};

    for (let i = 0; i < characters.length && i < tiles.length; i++) {
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
    drawText(textInput.value, 6, 8);
}

function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, state.canvasWidth, state.canvasHeight);
}

function drawText(text, x, y) {
    if (Object.keys(state.charWidths).length === 0) return;

    const lines = text.split("\n").slice(0, 4);

    lines.forEach((line, lineIndex) => {
        let cursorPos = 0;

        for (let i = 0; i < line.length; i++) {
            if (line[i] === "<") {
                let special_char = "";
                let j = i + 1;
                while (j < line.length && line[j] !== ">") {
                    special_char += line[j];
                    j++;
                }
                i = j;  // Skip to end of tag

                if (state.letterTiles[special_char]) {
                    drawTile(state.letterTiles[special_char], x + cursorPos, y);
                    cursorPos += state.charWidths[special_char] || 8;
                }
                continue;
            }

            const char = line[i];
            if (cursorPos < state.maxTextWidth && state.letterTiles[char]) {
                drawTile(state.letterTiles[char], x + cursorPos, y);
                cursorPos += state.charWidths[char] || 8;
            }
        }

        y += state.lineSpacing;
    });
}

function drawTile(tile, x, y) {
    if (!tile) return;
    ctx.drawImage(tile, x, y, state.tileWidth, state.tileHeight);
}

// Initialize the application when the DOM is ready
document.addEventListener("DOMContentLoaded", init); 