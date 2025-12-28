// Image Encryption Library - Ported from Python
// Uses chaotic keystream, permutation, and CBC-like diffusion

// Key Derivation Function using SHA-256
async function kdf(key: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

function u32(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | 
          (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

// Chaotic keystream generator using logistic map
async function chaoticKeystream(length: number, key: string): Promise<Uint8Array> {
  const h = await kdf("ks:" + key);
  
  // x0: high resolution value between 0 and 1
  let x = (u32(h, 0) + 1) / (Math.pow(2, 32) + 2);
  // r: in chaotic region, slightly modified by key
  const r = 3.99 - ((u32(h, 4) % 1000) / 1000000.0);
  
  const stream = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    x = r * x * (1.0 - x);
    stream[i] = Math.floor(x * 256.0) & 0xFF;
  }
  return stream;
}

// Seeded random number generator (Mulberry32)
function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Generate permutation indices
async function permutationIndices(n: number, key: string): Promise<Uint32Array> {
  const h = await kdf("perm:" + key);
  const seed = u32(h, 0) ^ u32(h, 4) ^ u32(h, 8) ^ u32(h, 12);
  const rng = mulberry32(seed);
  
  const idx = new Uint32Array(n);
  for (let i = 0; i < n; i++) idx[i] = i;
  
  // Fisher-Yates shuffle
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

// Inverse permutation
function inversePermutation(idx: Uint32Array): Uint32Array {
  const inv = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i++) {
    inv[idx[i]] = i;
  }
  return inv;
}

// CBC-like diffusion encryption
async function diffuseEncrypt(data: Uint8Array, key: string): Promise<Uint8Array> {
  const h = await kdf("diff:" + key);
  const iv = h[0];
  const ks = await chaoticKeystream(data.length, key);
  
  const out = new Uint8Array(data.length);
  let prev = iv;
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] ^ ks[i] ^ prev;
    prev = out[i];
  }
  return out;
}

// CBC-like diffusion decryption
async function diffuseDecrypt(data: Uint8Array, key: string): Promise<Uint8Array> {
  const h = await kdf("diff:" + key);
  const iv = h[0];
  const ks = await chaoticKeystream(data.length, key);
  
  const out = new Uint8Array(data.length);
  let prev = iv;
  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    out[i] = c ^ ks[i] ^ prev;
    prev = c;
  }
  return out;
}

export interface ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

// Get image data from canvas
export function getImageData(image: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return {
    data: imageData.data,
    width: canvas.width,
    height: canvas.height
  };
}


// Encrypt image
export async function encryptImage(
  imageData: ImageData, 
  key: string,
  onProgress?: (progress: number) => void
): Promise<ImageData> {
  const { data, width, height } = imageData;
  
  // Extract only RGB values (skip alpha)
  const rgbLength = width * height * 3;
  const rgbData = new Uint8Array(rgbLength);
  const alphaData = new Uint8Array(width * height);
  
  let rgbIdx = 0;
  let alphaIdx = 0;
  for (let i = 0; i < data.length; i += 4) {
    rgbData[rgbIdx++] = data[i];     // R
    rgbData[rgbIdx++] = data[i + 1]; // G
    rgbData[rgbIdx++] = data[i + 2]; // B
    alphaData[alphaIdx++] = data[i + 3]; // A
  }
  
  onProgress?.(10);
  
  // Step 1: Permutation
  const idx = await permutationIndices(rgbLength, key);
  onProgress?.(30);
  
  const permuted = new Uint8Array(rgbLength);
  for (let i = 0; i < rgbLength; i++) {
    permuted[i] = rgbData[idx[i]];
  }
  onProgress?.(50);
  
  // Step 2: Diffusion
  const cipherFlat = await diffuseEncrypt(permuted, key);
  onProgress?.(80);
  
  // Reconstruct with alpha
  const result = new Uint8ClampedArray(data.length);
  rgbIdx = 0;
  alphaIdx = 0;
  for (let i = 0; i < result.length; i += 4) {
    result[i] = cipherFlat[rgbIdx++];
    result[i + 1] = cipherFlat[rgbIdx++];
    result[i + 2] = cipherFlat[rgbIdx++];
    result[i + 3] = alphaData[alphaIdx++];
  }
  
  onProgress?.(100);
  
  return { data: result, width, height };
}

// Create image from data
export function createImageFromData(data: Uint8ClampedArray, width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const clampedArray = new Uint8ClampedArray(data.length);
  clampedArray.set(data);
  const imageData = new ImageData(clampedArray, width, height);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

// Decrypt image
export async function decryptImage(
  imageData: ImageData, 
  key: string,
  onProgress?: (progress: number) => void
): Promise<ImageData> {
  const { data, width, height } = imageData;
  
  // Extract only RGB values (skip alpha)
  const rgbLength = width * height * 3;
  const rgbData = new Uint8Array(rgbLength);
  const alphaData = new Uint8Array(width * height);
  
  let rgbIdx = 0;
  let alphaIdx = 0;
  for (let i = 0; i < data.length; i += 4) {
    rgbData[rgbIdx++] = data[i];
    rgbData[rgbIdx++] = data[i + 1];
    rgbData[rgbIdx++] = data[i + 2];
    alphaData[alphaIdx++] = data[i + 3];
  }
  
  onProgress?.(10);
  
  // Step 1: Inverse diffusion
  const permuted = await diffuseDecrypt(rgbData, key);
  onProgress?.(40);
  
  // Step 2: Inverse permutation
  const idx = await permutationIndices(rgbLength, key);
  onProgress?.(60);
  
  const inv = inversePermutation(idx);
  onProgress?.(70);
  
  const plainFlat = new Uint8Array(rgbLength);
  for (let i = 0; i < rgbLength; i++) {
    plainFlat[i] = permuted[inv[i]];
  }
  onProgress?.(90);
  
  // Reconstruct with alpha
  const result = new Uint8ClampedArray(data.length);
  rgbIdx = 0;
  alphaIdx = 0;
  for (let i = 0; i < result.length; i += 4) {
    result[i] = plainFlat[rgbIdx++];
    result[i + 1] = plainFlat[rgbIdx++];
    result[i + 2] = plainFlat[rgbIdx++];
    result[i + 3] = alphaData[alphaIdx++];
  }
  
  onProgress?.(100);
  
  return { data: result, width, height };
}
