import json
from PIL import Image

# LoROM offset - many SNES ROMs have a 512-byte header
offset = 0  # Set to 512 if ROM has header
rom_file = "Final Fantasy III (U) (V1.0) [!].smc"

variable_width_tiles = 96
fixed_width_tiles = 256

palette_2bpp = [
    (0, 0, 0, 0),
    (127, 127, 127, 255),
    (0, 0, 0, 255),
    (255, 255, 255, 255),
]


def load_data(rom_file: str) -> tuple[bytes, list[int], bytes]:
    with open(rom_file, "rb") as f:
        # Fixed width font
        f.seek(0x0487C0 + offset)
        fixed_width_font_data = f.read(8 * fixed_width_tiles)

        # Read character widths
        f.seek(0x048FC0 + offset)
        widths = [x for x in f.read(256)]

        # Read character data
        f.seek(0x0490C0 + offset)
        variable_width_font_data = f.read(22 * variable_width_tiles)

    return fixed_width_font_data, widths, variable_width_font_data


def generate_variable_width_font(data: bytes) -> None:
    out = Image.new("RGBA", (variable_width_tiles * 13, 12), (0, 0, 0, 0))
    for i in range(variable_width_tiles):
        # Extract the current character data
        char_data = data[i * 22 : (i * 22 + 22)]
        processed_data = bytes(char_data[j + 1 - 2 * (j & 1)] for j in range(len(char_data)))

        # Create the bitmap image from the processed bytes
        glyph = Image.frombytes("1", (16, 11), processed_data)

        # Crop off the padding to get just the character
        glyph = glyph.crop((4, 0, 16, 11))

        # Position in output (13 pixels per character)
        x = i * 13

        # Create the shadow (black) with 1px offset
        out.paste((0, 0, 0, 255), (x + 1, 1), glyph)

        # Create the main character (white)
        out.paste((255, 255, 255, 255), (x, 0), glyph)

    # Save the output image
    out.save("variable_width_font.png")


def generate_fixed_width_font(data: bytes, palette: list[tuple[int, int, int, int]] = palette_2bpp) -> None:
    tile_width = 8
    tile_height = 8
    out = Image.new("RGBA", (tile_width * fixed_width_tiles // 2, tile_height), palette_2bpp[0])
    for i in range(fixed_width_tiles):
        char_data = data[2 * i * tile_width : 2 * i * tile_width + 2 * tile_width]
        processed_data = bytes(char_data[j + 1 - 2 * (j & 1)] for j in range(len(char_data)))

        # Create a colored version of the glyph based on the 2bpp palette
        colored_glyph = Image.new("RGBA", (tile_width, tile_height))
        colored_pixels = []
        for j in range(0, len(processed_data), 2):
            high_byte = processed_data[j]
            low_byte = processed_data[j + 1]
            for bit_pos in range(7, -1, -1):
                high_bit = (low_byte >> bit_pos) & 1
                low_bit = (high_byte >> bit_pos) & 1
                pixel_value = (high_bit << 1) | low_bit
                colored_pixels.append(palette[pixel_value])
        colored_glyph.putdata(colored_pixels)
        out.paste(colored_glyph, (i * tile_width, 0), colored_glyph)
    out.save("fixed_width_font.png")


def generate_widths(widths: list[int]) -> None:
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?/:\"'-.,_;#+()%~*@π............. "
    letters_dict = {str(ord(letters[i])): widths[0x20 + i] for i in range(len(letters))}

    for k, v in letters_dict.items():
        print(chr(int(k)), k, v)

    # print(letters_dict)
    with open("widths.json", "w") as f:
        json.dump(letters_dict, f)


# Load data from ROM file
fixed_width_font_data, widths, variable_width_font_data = load_data(rom_file)
print(f"Number of fixed width font tiles: {len(fixed_width_font_data) // 8}")
print(f"Number of variable width font tiles: {len(variable_width_font_data) // 22}")

generate_fixed_width_font(fixed_width_font_data)
generate_variable_width_font(variable_width_font_data)
generate_widths(widths)
