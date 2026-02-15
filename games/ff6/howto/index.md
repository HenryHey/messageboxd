---
layout: howto
---

I wanted the web textbox to feel like a real FF6 dialogue window, not just "similar pixels in a custom font."  
The pipeline ended up being:

```text
SNES ROM (.smc)
   |
   |  Python (`extract.py`)
   |  - read known offsets
   |  - decode/interleave bits
   |  - export PNG + JSON
   v
`variable_width_font.png` + `widths.json`
   |
   |  Browser (`script.js`)
   |  - slice glyph tiles
   |  - map chars -> tiles
   |  - apply per-char widths
   v
Canvas textbox preview
```

## 1) Pulling font data out of the ROM

The first step is in `games/ff6/extract.py`.  
I read three chunks directly from the ROM:

- Fixed-width font tile data at `0x0487C0`
- Character widths at `0x048FC0`
- Variable-width font glyph data at `0x0490C0`

So extraction is deterministic: point at ROM, seek to offsets, read byte ranges.

## 2) Decoding the variable-width glyphs

`generate_variable_width_font()` handles the dialogue font used by the site.

Each glyph is read in 22-byte blocks and reordered:

```python
processed_data = bytes(char_data[j + 1 - 2 * (j & 1)] for j in range(len(char_data)))
```

Then I build a 1-bit image, crop away left padding, and compose the final sheet with:

- White foreground glyph
- 1px black drop shadow
- 13px slot per character in the final texture atlas

That produces `variable_width_font.png`, the same file loaded by the webpage.

![Extracted FF6 variable-width font atlas](../variable_width_font.png)

## 3) Exporting real character widths (WIP)

A big part of the "FF6 look" is spacing.  
`generate_widths()` converts ROM width bytes into `widths.json`, keyed by characters/symbol names:

- Letters and punctuation (A-Z, a-z, numbers, symbols)
- Special tokens like `light`, `fire`, `water`, etc.

Example output values in `widths.json`:

- `"I": 5`
- `"W": 12`
- `" ": 5`
- `"fire": 12`

These values are used directly in rendering, so narrow and wide glyphs align like the original game.

## 4) Loading assets in the browser

In `games/ff6/script.js`, the page loads:

- `variable_width_font.png`
- `background.png`
- `widths.json`

After both images and the width map are ready, `createLetterTiles()` slices the atlas into 96 tile canvases (13x13 each), and `mapLettersToTiles()` assigns each tile to a character key.

That gives a quick lookup table:

```text
"A" -> tile canvas
"b" -> tile canvas
"fire" -> tile canvas
...
```

## 5) Rendering text with FF6 spacing

`drawText()` walks through input text and draws each glyph onto the main canvas at `(x + cursorPos, y)`.

The key is this rule:

- Draw glyph tile
- Advance `cursorPos` by `state.charWidths[char]`

So the visual glyph size is fixed to a 13px tile, but horizontal movement is variable-width, matching ROM spacing.

There is also lightweight inline token parsing:

- Typing `<fire>` uses the `fire` icon tile
- Typing `<water>` uses the `water` icon tile

Combined with the FF6 background image and 4-line textbox limit, this recreates the in-game dialogue feel in a browser canvas.

## 6) Reproducing the full flow

From the FF6 folder:

```bash
python extract.py
```

This regenerates:

- `variable_width_font.png`
- `fixed_width_font.png`
- `widths.json`

Then open the webpage (`games/ff6/index.html` via your local site setup) and type into the textarea to see live rendering.
