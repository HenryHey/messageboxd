import json
from PIL import Image
import numpy as np

rom_file = "golden_sun.gba"

variable_width_tiles = 112
tile_bytes = 32

# Golden Sun specific text colors
palette_golden_sun = [
    (0, 0, 0, 0),  # 0: Transparent
    (255, 255, 255, 255),  # 1: White
    (12, 12, 12, 255),  # 2: Golden yellow
    (0, 0, 0, 255),  # 3: Black
    (20, 76, 219, 0),  # 4: Blue
    (0, 0, 0, 255),  # 5: Black
    (255, 0, 255, 255),  # 6: Fuchsia
    (255, 0, 255, 255),  # 7: Fuchsia
    (255, 0, 255, 255),  # 8: Fuchsia
    (255, 0, 255, 255),  # 9: Fuchsia
    (255, 0, 255, 255),  # 10: Fuchsia
    (255, 0, 255, 255),  # 11: Fuchsia
    (255, 0, 255, 255),  # 12: Fuchsia
    (255, 0, 255, 255),  # 13: Fuchsia
    (255, 0, 255, 255),  # 14: Fuchsia
    (255, 0, 255, 255),  # 15: Fuchsia
]

# Set the active palette - change this to select which palette to use
active_palette = palette_golden_sun


# def load_data(rom_file: str) -> tuple[bytes, list[int], bytes]:
def load_data(rom_file: str, offset: int = 0) -> bytes:
    with open(rom_file, "rb") as f:

        # Read character widths
        # f.seek(0x0032128C + offset)
        # widths = [x for x in f.read(256)]

        # Read character data
        f.seek(0x003213D0 + offset)
        variable_width_font_data = f.read(tile_bytes * variable_width_tiles)

    return variable_width_font_data


def convert_4bpp_to_rgba(data, tile_size=8):
    """Convert 4bpp (4 bits per pixel) data to RGBA format.
    4bpp format: Each byte contains 2 pixels, with reverse order within each byte.

    GBA Character tiles are typically 8x8 pixels, and each 4bpp tile is 32 bytes
    (8 rows x 8 pixels per row x 4 bits per pixel = 256 bits = 32 bytes)
    """
    # Create a new array for our RGBA image
    rgba = np.zeros((tile_size, tile_size, 4), dtype=np.uint8)

    # GBA tiles are stored in a specific format
    # In 4bpp, each byte contains 2 pixels
    # The tiles are stored in 8x8 pixel blocks

    # Process 32 bytes of data (one complete character tile)
    for byte_idx in range(min(len(data), 32)):
        byte = data[byte_idx]

        # Extract the two 4-bit values from the byte
        pixel1_idx = byte & 0x0F  # Low nibble (first pixel)
        pixel2_idx = (byte >> 4) & 0x0F  # High nibble (second pixel)

        # For 8x8 tiles, the rows are 4 bytes (8 pixels) wide
        # For 16x16 tiles, the rows are 8 bytes (16 pixels) wide
        pixels_per_row = tile_size
        bytes_per_row = pixels_per_row // 2

        # Calculate the position in the output image
        row = byte_idx // bytes_per_row
        col = (byte_idx % bytes_per_row) * 2

        # Only process pixels within the dimensions
        if row < tile_size and col < tile_size:
            rgba[row, col] = active_palette[pixel1_idx]
        if row < tile_size and col + 1 < tile_size:
            rgba[row, col + 1] = active_palette[pixel2_idx]

    return Image.fromarray(rgba)


def generate_variable_width_font(data: bytes, output_file: str = "variable_width_font.png") -> None:
    tile_size = 8
    grid_width = 112  # 16 columns
    grid_height = 1  # 8 rows

    # Create an image large enough to hold all tiles
    out = Image.new("RGBA", (grid_width * tile_size, grid_height * tile_size), (0, 0, 0, 0))

    for i in range(variable_width_tiles):
        # Extract the current character data
        char_data = data[i * tile_bytes : (i * tile_bytes + tile_bytes)]

        # Convert 4bpp data to RGBA
        glyph = convert_4bpp_to_rgba(char_data, tile_size)

        # Calculate position in the grid
        x = (i % grid_width) * tile_size
        y = (i // grid_width) * tile_size

        # Paste the glyph onto the output image
        out.paste(glyph, (x, y))

    # Save the output image
    out.save(output_file)


def generate_widths() -> None:
    letters = "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[¥]^_±abcdefghijklmnopqrstuvwxyz{|}~"
    letter_dict = {l: 8 for i, l in enumerate(letters)}
    special_chars = [
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
        " ",
    ]
    letter_dict.update({c: 8 for i, c in enumerate(special_chars)})

    print(letter_dict)
    with open("widths.json", "w") as f:
        json.dump(letter_dict, f)


# Load data from ROM file
i = 0
variable_width_font_data = load_data(rom_file, i)
print(f"Number of variable width font tiles: {len(variable_width_font_data) // tile_bytes }")

generate_variable_width_font(variable_width_font_data, output_file=f"variable_width_font_{i}.png")
generate_widths()
