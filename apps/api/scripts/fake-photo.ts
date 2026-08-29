/**
 * Generates placeholder portrait images as PNG buffers, with no dependencies.
 *
 * Test profiles need photo *bytes*, not a link: the point is to exercise the
 * real storage path (MediaFile -> GET /media/file/:id) and to see the grid,
 * the main-photo badge and the card layout with something in them. Pulling
 * stock portraits would mean an external fetch on every seed and pictures of
 * real people on fake profiles, so these are deliberately abstract — a soft
 * two-tone gradient with a lighter disc where a head would be.
 */
import { deflateSync } from 'zlib';

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = -1;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/** length + type + data + CRC(type+data), the PNG chunk layout. */
function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

/**
 * A deterministic portrait for `seed` — the same seed always yields the same
 * image, so re-running the seeder does not churn the photos.
 */
export function makePortraitPng(seed: number, width = 600, height = 800): Buffer {
  const hue = (seed * 47) % 360;
  const [r1, g1, b1] = hslToRgb(hue, 0.55, 0.62);
  const [r2, g2, b2] = hslToRgb((hue + 40) % 360, 0.5, 0.34);

  // Head-and-shoulders silhouette, so the crop reads as a portrait.
  const headX = width / 2;
  const headY = height * 0.36;
  const headR = width * 0.19;
  const bodyY = height * 0.92;
  const bodyR = width * 0.42;

  const raw = Buffer.alloc((width * 3 + 1) * height);
  let p = 0;
  for (let y = 0; y < height; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const t = y / height;
      let r = Math.round(r1 + (r2 - r1) * t);
      let g = Math.round(g1 + (g2 - g1) * t);
      let b = Math.round(b1 + (b2 - b1) * t);

      const inHead = (x - headX) ** 2 + (y - headY) ** 2 < headR ** 2;
      const inBody = (x - headX) ** 2 / bodyR ** 2 + (y - bodyY) ** 2 / (height * 0.5) ** 2 < 1;
      if (inHead || inBody) {
        // Lift the silhouette out of the background rather than recolouring it.
        r = Math.min(255, r + 46);
        g = Math.min(255, g + 42);
        b = Math.min(255, b + 38);
      }

      raw[p++] = r;
      raw[p++] = g;
      raw[p++] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  // 10-12 stay zero: deflate, adaptive filtering, no interlace.

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
