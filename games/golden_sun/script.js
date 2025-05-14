// Global state
const state = {
    canvasWidth: 160,
    canvasHeight: 56,
    charWidths: {},
    letterTiles: {},
    imagesLoaded: 0,
    totalImages: 3, // Font italic + variable width + background
    tileWidth: 16, // Will be updated from config
    tileHeight: 14, // Will be updated from config
    numberOfTiles: 224, // Will be updated from config
    lineSpacing: 14,
    maxTextWidth: 208, // 240 - 32
    currentFont: 'variable_width', // Default font
    fontConfig: {}, // Store the full font config
    specialChars: {} // Will be populated from config
};

// DOM elements
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const textInput = document.getElementById("textInput");
const toggleFontBtn = document.getElementById("toggleFont");

// Assets
const italicFontImage = new Image();
const variableWidthFontImage = new Image();
const backgroundImage = new Image();
italicFontImage.src = "italic_font.png";
variableWidthFontImage.src = "variable_width_font_0.png";
backgroundImage.src = "background.png";

// Initialize the application
async function init() {
    registerEventListeners();

    // Load default font config first (italic)
    await loadFontConfig();

    // Then load the other font config to have both fonts' special characters available
    const currentFont = state.currentFont;
    state.currentFont = currentFont === 'italic' ? 'variable_width' : 'italic';
    await loadFontConfig();
    state.currentFont = currentFont; // Switch back to original font

    // Generate buttons after both configs are loaded
    generateSpecialCharButtons();

    await loadImages();
    console.log('Application initialized');
    toggleFont();
    updateText();
}

function registerEventListeners() {
    textInput.addEventListener("keyup", updateText);
    toggleFontBtn.addEventListener("click", toggleFont);
}

// Toggle between fonts
function toggleFont() {
    state.currentFont = state.currentFont === 'italic' ? 'variable_width' : 'italic';

    // Update button text
    toggleFontBtn.textContent = state.currentFont === 'italic'
        ? 'Switch to Variable Width Font'
        : 'Switch to Italic Font';

    // Reload the font config and regenerate special character buttons
    loadFontConfig()
        .then(() => {
            state.letterTiles = createLetterTiles();
            generateSpecialCharButtons();
            updateText();
        });
}

// Get correct config file based on current font
function getConfigFile() {
    return state.currentFont === 'italic' ? "config_italic.json" : "config.json";
}

// Generate special character buttons dynamically
function generateSpecialCharButtons() {
    const specialCharsContainer = document.querySelector('.special-chars-container');
    specialCharsContainer.innerHTML = ''; // Clear existing buttons

    // Make sure specialChars are loaded for current font
    if (!state.specialChars[state.currentFont]) {
        console.warn(`Special characters not loaded for ${state.currentFont}`);
        return;
    }

    // Display name mapping
    const displayNames = {
        // Italic font buttons
        "a_1": "A Left",
        "a_2": "A Right",
        "b_1": "B Left",
        "b_2": "B Right",
        "l_1": "L Left",
        "l_2": "L Right",
        "r_1": "R Left",
        "r_2": "R Right",
        "st_1": "Start Left",
        "st_2": "Start Right",
        "sel_1": "Select Left",
        "sel_2": "Select Right",
        // Variable width font buttons
        "block": "Block",
        "a_button": "A Button",
        "b_button": "B Button",
        "l_button_1": "L Button 1",
        "l_button_2": "L Button 2",
        "r_button_1": "R Button 1",
        "r_button_2": "R Button 2",
        "start_button_1": "Start 1",
        "start_button_2": "Start 2",
        "select_button_1": "Select 1",
        "select_button_2": "Select 2"
    };

    // Get the correct special characters for the current font
    const currentSpecialChars = state.specialChars[state.currentFont];

    currentSpecialChars.forEach(char => {
        if (char === " ") return; // Skip empty space placeholders

        const button = document.createElement('button');
        button.className = 'special-char-btn';
        button.setAttribute('data-char', char);

        // Use display name mapping or generate from character code
        button.textContent = displayNames[char] || char.replace('_', ' ').replace(/^\w|\s\w/g, c => c.toUpperCase());

        button.addEventListener('click', function () {
            insertSpecialCharAtCursor(char);
        });

        specialCharsContainer.appendChild(button);
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
        const fontImage = state.currentFont === 'italic' ? italicFontImage : variableWidthFontImage;

        // Check if images are already loaded
        if (fontImage.complete && backgroundImage.complete) {
            state.letterTiles = createLetterTiles();
            resolve();
            return;
        }

        let imagesLoaded = 0;
        const imagesToLoad = 2; // Current font + background

        const onImageLoad = () => {
            imagesLoaded++;
            if (imagesLoaded === imagesToLoad) {
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

// Load font configuration
async function loadFontConfig() {
    try {
        const configFile = getConfigFile();
        const response = await fetch(configFile);
        state.fontConfig = await response.json();

        // Update tile dimensions from config
        state.tileWidth = state.fontConfig.tile_width;
        state.tileHeight = state.fontConfig.tile_height;
        state.numberOfTiles = state.fontConfig.number_of_tiles;
        state.charWidths = state.fontConfig.widths;

        // Load special characters from config
        if (state.fontConfig.special_chars) {
            // Initialize the specialChars object if it doesn't exist
            if (!state.specialChars[state.currentFont]) {
                state.specialChars[state.currentFont] = [];
            }

            // Update the special characters for the current font
            state.specialChars[state.currentFont] = state.fontConfig.special_chars;
        }

        console.log(`Font config loaded: ${state.tileWidth}x${state.tileHeight}, ${state.numberOfTiles} tiles`);
    } catch (error) {
        console.error('Error loading font config:', error);
        // Fallback to separate widths file
        await loadCharacterWidths(getWidthsFile());
    }
}

// Create letter tile mappings from font image
function createLetterTiles() {
    const tiles = [];
    const fontImage = state.currentFont === 'italic' ? italicFontImage : variableWidthFontImage;

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
    return state.currentFont === 'italic' ? mapItalicLettersToTiles(tiles) : mapLettersToTiles(tiles);
}

function mapItalicLettersToTiles(tiles) {
    // Make sure special characters are loaded
    if (!state.specialChars.italic) {
        console.error("Special characters for italic font not loaded");
        return {};
    }

    const special_chars = state.specialChars.italic.concat([
        " ",
        " ",
        "\u201D", // Double quote
        "\u2014"  // Em dash
    ]);
    let letter_array =
        " !\"#$%&'()*+,-./0123456789:;<=>?" +
        "@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_" +
        "'abcdefghijklmnopqrstuvwxyz{|}~ " +
        Array(16).fill(" ").join("") +
        " ¡¢£ ¥ §¨©ª«¬ ®¯°±  ´µ¶·¸¹º»   ¿" +
        "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏ ÑÒÓÔÕÖ ØÙÚÛÜ  ß" +
        "àáâãäåæçèéêëìíîï ñòóôõö÷øùúûü  ÿ";

    letter_array = letter_array.split("");
    letter_array = [
        ...letter_array.slice(0, 32 * 3),
        ...special_chars,
        ...letter_array.slice(32 * 3 + special_chars.length, letter_array.length)
    ];

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
    // Make sure special characters are loaded
    if (!state.specialChars.variable_width) {
        console.error("Special characters for variable width font not loaded");
        return {};
    }

    const letters = "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[¥]^_±abcdefghijklmnopqrstuvwxyz{|}~";
    const letter_array = letters.split("");
    letter_array.push(...state.specialChars.variable_width);
    const characters = letter_array;
    const letterTileMap = {};

    for (let i = 0; i < characters.length && i < tiles.length; i++) {
        if (letterTileMap[characters[i]]) {
            console.log(`Duplicate character found: ${characters[i]}`);
        }
        letterTileMap[characters[i]] = tiles[i];
    }

    letterTileMap[" "] = letterTileMap[" "] || tiles[0]; // Fallback for space
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