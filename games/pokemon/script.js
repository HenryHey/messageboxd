const state = {
    canvasWidth: 160,
    canvasHeight: 144,
    tileSize: 8,
    tilesPerRow: 16,
    numberOfTiles: 128,
    maxLines: 6,
    maxCharsPerLine: 17,
    lineSpacing: 16,
    textStartX: 14,
    textStartY: 32,
    letterTiles: {},
};

const visibleCharacters =
    "ABCDEFGHIJKLMNOP" +
    "QRSTUVWXYZ():;[]" +
    "abcdefghijklmnop" +
    "qrstuvwxyzé@@@@@" +
    "@@@@@@@@@@@@@@@@" +
    "@@@@@@@@@@@@@@@@" +
    "'@@-@@?!.@@@@@@@" +
    "@@./,@0123456789";

const supportedCharacters = new Set((visibleCharacters + " ").split(""));

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const textInput = document.getElementById("textInput");

const fontImage = new Image();
const backgroundImage = new Image();
fontImage.src = "font.png";
backgroundImage.src = "background.png";

async function init() {
    registerEventListeners();
    await loadImages();
    updateText();
}

function registerEventListeners() {
    textInput.addEventListener("input", updateText);
}

function loadImages() {
    return new Promise((resolve) => {
        let loaded = 0;
        const onLoad = () => {
            loaded += 1;
            if (loaded === 2) {
                state.letterTiles = createLetterTiles();
                resolve();
            }
        };

        if (fontImage.complete && backgroundImage.complete) {
            state.letterTiles = createLetterTiles();
            resolve();
            return;
        }

        fontImage.onload = onLoad;
        backgroundImage.onload = onLoad;
    });
}

function createLetterTiles() {
    const tiles = [];
    for (let i = 0; i < state.numberOfTiles; i += 1) {
        const tileCanvas = document.createElement("canvas");
        tileCanvas.width = state.tileSize;
        tileCanvas.height = state.tileSize;
        const tileCtx = tileCanvas.getContext("2d");
        tileCtx.drawImage(
            fontImage,
            (i % state.tilesPerRow) * state.tileSize,
            Math.floor(i / state.tilesPerRow) * state.tileSize,
            state.tileSize,
            state.tileSize,
            0,
            0,
            state.tileSize,
            state.tileSize
        );
        tiles.push(tileCanvas);
    }

    const map = {};
    for (let i = 0; i < visibleCharacters.length && i < tiles.length; i += 1) {
        map[visibleCharacters[i]] = tiles[i];
    }
    return map;
}

function updateText() {
    const rawLines = textInput.value.split("\n").slice(0, state.maxLines);
    const sanitizedLines = rawLines.map((line) => sanitizeLine(line).slice(0, state.maxCharsPerLine));

    if (rawLines.join("\n") !== sanitizedLines.join("\n")) {
        textInput.value = sanitizedLines.join("\n");
    }

    ctx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
    drawBackground();
    drawText(sanitizedLines, state.textStartX, state.textStartY);
}

function sanitizeLine(line) {
    return line
        .split("")
        .map((char) => (supportedCharacters.has(char) ? char : " "))
        .join("");
}

function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, state.canvasWidth, state.canvasHeight);
}

function drawText(lines, x, y) {
    lines.forEach((line, lineIndex) => {
        const lineY = y + lineIndex * state.lineSpacing;
        for (let i = 0; i < line.length; i += 1) {
            if (line[i] === " ") continue;
            drawTile(state.letterTiles[line[i]], x + i * state.tileSize, lineY);
        }
    });
}

function drawTile(tile, x, y) {
    if (!tile) return;
    ctx.drawImage(tile, x, y, state.tileSize, state.tileSize);
}

document.addEventListener("DOMContentLoaded", init);
