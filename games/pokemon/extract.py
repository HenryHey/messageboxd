from pathlib import Path

from PIL import Image


ROM_PATH = Path(__file__).with_name("Pokemon - Blue.gb")
OUTPUT_PATH = Path(__file__).with_name("font_11A80_11E7F.png")

START_ADDR = 0x11A80
END_ADDR = 0x11E7F
# This slice is a packed 1bpp font table in ROM (not 2bpp VRAM layout).
TILE_SIZE_BYTES = 8
TILE_WIDTH = 8
TILE_HEIGHT = 8
TILES_PER_ROW = 16


def decode_1bpp_tile(tile_data: bytes) -> list[int]:
    pixels: list[int] = []
    for row in range(TILE_HEIGHT):
        # One byte per row; bit 7 is leftmost pixel, bit 0 is rightmost.
        byte = tile_data[row]
        for bit in range(7, -1, -1):
            pixels.append((byte >> bit) & 1)
    return pixels


def main() -> None:
    rom = ROM_PATH.read_bytes()
    block = rom[START_ADDR : END_ADDR + 1]

    if len(block) % TILE_SIZE_BYTES != 0:
        raise ValueError("Selected range is not aligned to 8-byte 1bpp tiles.")

    tile_count = len(block) // TILE_SIZE_BYTES
    rows = (tile_count + TILES_PER_ROW - 1) // TILES_PER_ROW

    # White background + black glyph pixels for easy readability.
    palette = [
        (255, 255, 255, 255),
        (0, 0, 0, 255),
    ]

    out = Image.new("RGBA", (TILES_PER_ROW * TILE_WIDTH, rows * TILE_HEIGHT), palette[0])

    for i in range(tile_count):
        # Read one 8x8 tile and place it in a 16-column sheet.
        tile_data = block[i * TILE_SIZE_BYTES : (i + 1) * TILE_SIZE_BYTES]
        pixel_indices = decode_1bpp_tile(tile_data)
        tile_img = Image.new("RGBA", (TILE_WIDTH, TILE_HEIGHT))
        tile_img.putdata([palette[p] for p in pixel_indices])

        x = (i % TILES_PER_ROW) * TILE_WIDTH
        y = (i // TILES_PER_ROW) * TILE_HEIGHT
        out.paste(tile_img, (x, y))

    out.save(OUTPUT_PATH)
    print(f"Extracted {tile_count} tiles from {START_ADDR:05X}-{END_ADDR:05X} to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
