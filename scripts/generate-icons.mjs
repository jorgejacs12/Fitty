import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';

// ── CRC32 ──────────────────────────────────────────────────────────────────
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[i] = c;
}
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const combined = Buffer.concat([t, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(combined));
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  return Buffer.concat([len, t, data, crcVal]);
}

// ── PNG builder ────────────────────────────────────────────────────────────
// Draws: solid bg + centered rounded square + two-letter "FT" text pixels
function createIcon(size) {
  const P   = [79,  55,  139]; // #4F378B — brand purple (bg)
  const PC  = [234, 221, 255]; // #EADDFF — lavender (inner square)
  const ONP = [33,  0,   93];  // #21005D — dark purple (letter pixels)

  const pixels = new Uint8Array(size * size * 3);

  const pad  = Math.round(size * 0.14);
  const r    = Math.round(size * 0.18); // corner radius of inner square

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 3;

      // Inner rounded square
      const inSquare =
        x >= pad && x < size - pad && y >= pad && y < size - pad &&
        !(x < pad + r && y < pad + r && (x - pad - r) ** 2 + (y - pad - r) ** 2 > r * r) &&
        !(x > size - pad - r - 1 && y < pad + r && (x - (size - pad - r - 1)) ** 2 + (y - pad - r) ** 2 > r * r) &&
        !(x < pad + r && y > size - pad - r - 1 && (x - pad - r) ** 2 + (y - (size - pad - r - 1)) ** 2 > r * r) &&
        !(x > size - pad - r - 1 && y > size - pad - r - 1 && (x - (size - pad - r - 1)) ** 2 + (y - (size - pad - r - 1)) ** 2 > r * r);

      const col = inSquare ? PC : P;
      pixels[idx] = col[0]; pixels[idx+1] = col[1]; pixels[idx+2] = col[2];
    }
  }

  // Draw stylised "F" glyph in the centre using scaled pixel art
  // 5×7 pixel art for "F" at 1/6 of icon size per cell
  const cell  = Math.max(1, Math.floor(size / 11));
  const glyph = [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
  ];
  const gw = glyph[0].length * cell;
  const gh = glyph.length * cell;
  const ox = Math.floor((size - gw) / 2);
  const oy = Math.floor((size - gh) / 2);

  for (let row = 0; row < glyph.length; row++) {
    for (let col = 0; col < glyph[0].length; col++) {
      if (!glyph[row][col]) continue;
      for (let dy = 0; dy < cell; dy++) {
        for (let dx = 0; dx < cell; dx++) {
          const px = ox + col * cell + dx;
          const py = oy + row * cell + dy;
          if (px < 0 || px >= size || py < 0 || py >= size) continue;
          const idx = (py * size + px) * 3;
          pixels[idx] = ONP[0]; pixels[idx+1] = ONP[1]; pixels[idx+2] = ONP[2];
        }
      }
    }
  }

  // Pack into PNG scanlines (filter byte 0 = None per row)
  const rowLen = 1 + size * 3;
  const raw = Buffer.alloc(size * rowLen);
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 3;
      const dst = y * rowLen + 1 + x * 3;
      raw[dst]   = pixels[src];
      raw[dst+1] = pixels[src+1];
      raw[dst+2] = pixels[src+2];
    }
  }

  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8]=8; ihdr[9]=2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public', { recursive: true });
writeFileSync('public/icon-192.png', createIcon(192));
writeFileSync('public/icon-512.png', createIcon(512));
console.log('✓ public/icon-192.png');
console.log('✓ public/icon-512.png');
