// Generates icon-192.png and icon-512.png using only Node built-ins (raw PNG)
import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/public');

function makePNG(size) {
  const bg = [15, 23, 42];        // #0f172a
  const accent = [99, 102, 241];  // #6366f1
  const white = [255, 255, 255];

  const pixels = new Uint8Array(size * size * 4);

  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.42;
  const innerR = size * 0.28;
  const ringW = size * 0.07;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded rect background
      const rx = size * 0.22;
      const inRoundRect = roundRect(x, y, 0, 0, size, size, rx);

      if (!inRoundRect) {
        pixels[i] = 0; pixels[i+1] = 0; pixels[i+2] = 0; pixels[i+3] = 0;
        continue;
      }

      // Default background
      let [r, g, b, a] = [...bg, 255];

      // Outer ring (accent)
      if (dist >= outerR - ringW && dist <= outerR) {
        // Only top-right arc (activity ring style) — full circle for icon
        [r, g, b] = accent;
      }

      // Inner dot (white circle)
      if (dist <= innerR * 0.4) {
        [r, g, b] = white;
      }

      // Heart shape in center
      const hx = (x - cx) / (size * 0.12);
      const hy = (y - (cy + size * 0.02)) / (size * 0.12);
      if (isHeart(hx, hy)) {
        [r, g, b] = accent;
      }

      pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = a;
    }
  }
  return encodePNG(pixels, size, size);
}

function isHeart(x, y) {
  // Heart curve: (x²+y²-1)³ - x²y³ < 0
  const v = Math.pow(x*x + y*y - 1, 3) - x*x * Math.pow(y, 3);
  return v < 0;
}

function roundRect(px, py, x, y, w, h, r) {
  if (px < x + r && py < y + r) return dist2(px, py, x+r, y+r) <= r*r;
  if (px > x+w-r && py < y+r)   return dist2(px, py, x+w-r, y+r) <= r*r;
  if (px < x+r && py > y+h-r)   return dist2(px, py, x+r, y+h-r) <= r*r;
  if (px > x+w-r && py > y+h-r) return dist2(px, py, x+w-r, y+h-r) <= r*r;
  return px >= x && px <= x+w && py >= y && py <= y+h;
}

function dist2(ax, ay, bx, by) {
  return (ax-bx)**2 + (ay-by)**2;
}

function encodePNG(pixels, w, h) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = chunk('IHDR', Buffer.from([
    (w>>24)&0xff,(w>>16)&0xff,(w>>8)&0xff,w&0xff,
    (h>>24)&0xff,(h>>16)&0xff,(h>>8)&0xff,h&0xff,
    8, 6, 0, 0, 0
  ]));

  // Build raw scanlines
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filter type None
    for (let x = 0; x < w; x++) {
      const src = (y * w + x) * 4;
      const dst = y * (1 + w * 4) + 1 + x * 4;
      raw[dst] = pixels[src];
      raw[dst+1] = pixels[src+1];
      raw[dst+2] = pixels[src+2];
      raw[dst+3] = pixels[src+3];
    }
  }

  const compressed = deflateSync(raw);
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type);
  const crc = crc32(Buffer.concat([typeB, data]));
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc >>> 0);
  return Buffer.concat([len, typeB, data, crcB]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = makeCrcTable();
  for (const b of buf) crc = (crc >>> 8) ^ table[(crc ^ b) & 0xFF];
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

let _crcTable;
function makeCrcTable() {
  if (_crcTable) return _crcTable;
  _crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    _crcTable[n] = c;
  }
  return _crcTable;
}

writeFileSync(`${OUT}/icon-192.png`, makePNG(192));
writeFileSync(`${OUT}/icon-512.png`, makePNG(512));
console.log('Icons generated: icon-192.png, icon-512.png');
