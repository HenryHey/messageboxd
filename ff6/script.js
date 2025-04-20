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
    await Promise.all([
        loadImages(),
        loadCharacterWidths()
    ]);
    console.log('Application initialized');
    updateText();
}

// Event listeners
function registerEventListeners() {
    document.getElementById("updateButton").addEventListener("click", updateText);
    textInput.addEventListener("keyup", updateText);
}

// Image loading
function loadImages() {
    return new Promise(resolve => {
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
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?/:\"'-.,_;#+()%~*@π,,,,,,,,,,,,, ";
    const letterTileMap = {};

    for (let i = 0; i < characters.length; i++) {
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
            const char = line[i];
            if (cursorPos < state.maxTextWidth) {
                drawTile(state.letterTiles[char], x + cursorPos, y);
                cursorPos += state.charWidths[char.charCodeAt(0)];
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