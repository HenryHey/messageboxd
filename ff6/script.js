let charWidths = {};
let letterTiles = {};
let backgroundImage = new Image();
let imagesLoaded = 0;
let totalImages = 2;

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const imageEl = new Image();
imageEl.src = "variable_width_font.png";
backgroundImage.src = "background.png";

const tile_size = 13;
const numberOfTiles = 96;
const line_spacing = 16;

function loadCharWidths() {
    fetch('widths.json')
        .then(response => response.json())
        .then(data => {
            charWidths = data;
            console.log('Character widths loaded successfully');
        })
        .catch(error => {
            console.error('Error loading character widths:', error);
        });
}

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        console.log('All images loaded successfully');
        updateText();
    }
}

imageEl.onload = function () {
    const tiles = [];

    for (let i = 0; i < numberOfTiles; i++) {
        const tileCanvas = document.createElement('canvas');
        tileCanvas.width = tile_size;
        tileCanvas.height = tile_size;
        const tileCtx = tileCanvas.getContext('2d', { willReadFrequently: true, alpha: true });

        tileCtx.clearRect(0, 0, tile_size, tile_size);

        tileCtx.drawImage(
            imageEl,
            i * tile_size, 0, tile_size, tile_size,
            0, 0, tile_size, tile_size
        );

        tiles.push(tileCanvas);
    }

    console.log(`Loaded ${tiles.length} tiles from tileset`);
    loadCharWidths();

    letterTiles = loadLetterTiles(tiles);
    imageLoaded();
};

backgroundImage.onload = imageLoaded;

function updateText() {
    const text = document.getElementById("textInput").value;
    const amountOfLines = text.split("\n").length;
    if (amountOfLines > 4) {
        const lines = text.split("\n");
        if (lines.length > 4) {
            document.getElementById("textInput").value = lines.slice(0, 4).join("\n");
            return;
        }
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground("background.png");
    drawText(text, 16, 8, letterTiles);
}

function drawTile(tile, x, y) {
    ctx.drawImage(tile, x, y, tile_size, tile_size);
}

function loadLetterTiles(tiles) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?/:\"'-.,_;#+()%~*@π,,,,,,,,,,,,, ";
    const letter_tiles = {};
    for (let i = 0; i < letters.length; i++) {
        letter_tiles[letters[i]] = tiles[i];
    }
    return letter_tiles;
}

function drawBackground(filename) {
    ctx.drawImage(backgroundImage, 0, 0, 240, 72);
}

function drawText(text, x, y, letter_tiles) {
    if (Object.keys(charWidths).length === 0) return;

    const lines = text.split("\n").slice(0, 4);

    let cursorPos = 0;
    for (let i = 0; i < lines.length; i++) {
        for (let j = 0; j < lines[i].length; j++) {
            if (cursorPos < 240 - 32) {
                drawTile(letter_tiles[lines[i][j]], x + cursorPos, y);
                cursorPos += charWidths[lines[i][j].charCodeAt(0)];
            }
        }
        cursorPos = 0;
        y += line_spacing;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("updateButton").addEventListener("click", updateText);
}); 