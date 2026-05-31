/**
 * MD5 hash using native implementation
 * Note: MD5 is not cryptographically secure - use SHA-256 or SHA-512 for security purposes
 */
export async function md5(text: string): Promise<string> {
  // Simple MD5 implementation based on RFC 1321
  function rotateLeft(n: number, s: number): number {
    return (n << s) | (n >>> (32 - s));
  }

  function addUnsigned(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  function f(x: number, y: number, z: number): number {
    return (x & y) | (~x & z);
  }

  function g(x: number, y: number, z: number): number {
    return (x & z) | (y & ~z);
  }

  function h(x: number, y: number, z: number): number {
    return x ^ y ^ z;
  }

  function i(x: number, y: number, z: number): number {
    return y ^ (x | ~z);
  }

  function ff(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    ac: number
  ): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function gg(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    ac: number
  ): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function hh(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    ac: number
  ): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function ii(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    ac: number
  ): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string): number[] {
    const wordArray: number[] = [];
    const messageLength = str.length;
    const numberOfWords = ((messageLength + 8 - ((messageLength + 8) % 64)) / 64 + 1) * 16;

    for (let i = 0; i < numberOfWords; i++) {
      wordArray[i] = 0;
    }

    for (let i = 0; i < messageLength; i++) {
      wordArray[i >> 2] = wordArray[i >> 2]! | ((str.charCodeAt(i) & 0xff) << ((i % 4) * 8));
    }

    wordArray[messageLength >> 2] =
      wordArray[messageLength >> 2]! | (0x80 << ((messageLength % 4) * 8));
    wordArray[numberOfWords - 2] = messageLength << 3;
    wordArray[numberOfWords - 1] = messageLength >>> 29;

    return wordArray;
  }

  function wordToHex(value: number): string {
    let hex = '';
    for (let i = 0; i <= 3; i++) {
      const byte = (value >>> (i * 8)) & 0xff;
      hex += byte.toString(16).padStart(2, '0');
    }
    return hex;
  }

  const x = convertToWordArray(text);
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const S11 = 7,
    S12 = 12,
    S13 = 17,
    S14 = 22;
  const S21 = 5,
    S22 = 9,
    S23 = 14,
    S24 = 20;
  const S31 = 4,
    S32 = 11,
    S33 = 16,
    S34 = 23;
  const S41 = 6,
    S42 = 10,
    S43 = 15,
    S44 = 21;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a,
      BB = b,
      CC = c,
      DD = d;

    a = ff(a, b, c, d, x[k + 0]!, S11, 0xd76aa478);
    d = ff(d, a, b, c, x[k + 1]!, S12, 0xe8c7b756);
    c = ff(c, d, a, b, x[k + 2]!, S13, 0x242070db);
    b = ff(b, c, d, a, x[k + 3]!, S14, 0xc1bdceee);
    a = ff(a, b, c, d, x[k + 4]!, S11, 0xf57c0faf);
    d = ff(d, a, b, c, x[k + 5]!, S12, 0x4787c62a);
    c = ff(c, d, a, b, x[k + 6]!, S13, 0xa8304613);
    b = ff(b, c, d, a, x[k + 7]!, S14, 0xfd469501);
    a = ff(a, b, c, d, x[k + 8]!, S11, 0x698098d8);
    d = ff(d, a, b, c, x[k + 9]!, S12, 0x8b44f7af);
    c = ff(c, d, a, b, x[k + 10]!, S13, 0xffff5bb1);
    b = ff(b, c, d, a, x[k + 11]!, S14, 0x895cd7be);
    a = ff(a, b, c, d, x[k + 12]!, S11, 0x6b901122);
    d = ff(d, a, b, c, x[k + 13]!, S12, 0xfd987193);
    c = ff(c, d, a, b, x[k + 14]!, S13, 0xa679438e);
    b = ff(b, c, d, a, x[k + 15]!, S14, 0x49b40821);

    a = gg(a, b, c, d, x[k + 1]!, S21, 0xf61e2562);
    d = gg(d, a, b, c, x[k + 6]!, S22, 0xc040b340);
    c = gg(c, d, a, b, x[k + 11]!, S23, 0x265e5a51);
    b = gg(b, c, d, a, x[k + 0]!, S24, 0xe9b6c7aa);
    a = gg(a, b, c, d, x[k + 5]!, S21, 0xd62f105d);
    d = gg(d, a, b, c, x[k + 10]!, S22, 0x2441453);
    c = gg(c, d, a, b, x[k + 15]!, S23, 0xd8a1e681);
    b = gg(b, c, d, a, x[k + 4]!, S24, 0xe7d3fbc8);
    a = gg(a, b, c, d, x[k + 9]!, S21, 0x21e1cde6);
    d = gg(d, a, b, c, x[k + 14]!, S22, 0xc33707d6);
    c = gg(c, d, a, b, x[k + 3]!, S23, 0xf4d50d87);
    b = gg(b, c, d, a, x[k + 8]!, S24, 0x455a14ed);
    a = gg(a, b, c, d, x[k + 13]!, S21, 0xa9e3e905);
    d = gg(d, a, b, c, x[k + 2]!, S22, 0xfcefa3f8);
    c = gg(c, d, a, b, x[k + 7]!, S23, 0x676f02d9);
    b = gg(b, c, d, a, x[k + 12]!, S24, 0x8d2a4c8a);

    a = hh(a, b, c, d, x[k + 5]!, S31, 0xfffa3942);
    d = hh(d, a, b, c, x[k + 8]!, S32, 0x8771f681);
    c = hh(c, d, a, b, x[k + 11]!, S33, 0x6d9d6122);
    b = hh(b, c, d, a, x[k + 14]!, S34, 0xfde5380c);
    a = hh(a, b, c, d, x[k + 1]!, S31, 0xa4beea44);
    d = hh(d, a, b, c, x[k + 4]!, S32, 0x4bdecfa9);
    c = hh(c, d, a, b, x[k + 7]!, S33, 0xf6bb4b60);
    b = hh(b, c, d, a, x[k + 10]!, S34, 0xbebfbc70);
    a = hh(a, b, c, d, x[k + 13]!, S31, 0x289b7ec6);
    d = hh(d, a, b, c, x[k + 0]!, S32, 0xeaa127fa);
    c = hh(c, d, a, b, x[k + 3]!, S33, 0xd4ef3085);
    b = hh(b, c, d, a, x[k + 6]!, S34, 0x4881d05);
    a = hh(a, b, c, d, x[k + 9]!, S31, 0xd9d4d039);
    d = hh(d, a, b, c, x[k + 12]!, S32, 0xe6db99e5);
    c = hh(c, d, a, b, x[k + 15]!, S33, 0x1fa27cf8);
    b = hh(b, c, d, a, x[k + 2]!, S34, 0xc4ac5665);

    a = ii(a, b, c, d, x[k + 0]!, S41, 0xf4292244);
    d = ii(d, a, b, c, x[k + 7]!, S42, 0x432aff97);
    c = ii(c, d, a, b, x[k + 14]!, S43, 0xab9423a7);
    b = ii(b, c, d, a, x[k + 5]!, S44, 0xfc93a039);
    a = ii(a, b, c, d, x[k + 12]!, S41, 0x655b59c3);
    d = ii(d, a, b, c, x[k + 3]!, S42, 0x8f0ccc92);
    c = ii(c, d, a, b, x[k + 10]!, S43, 0xffeff47d);
    b = ii(b, c, d, a, x[k + 1]!, S44, 0x85845dd1);
    a = ii(a, b, c, d, x[k + 8]!, S41, 0x6fa87e4f);
    d = ii(d, a, b, c, x[k + 15]!, S42, 0xfe2ce6e0);
    c = ii(c, d, a, b, x[k + 6]!, S43, 0xa3014314);
    b = ii(b, c, d, a, x[k + 13]!, S44, 0x4e0811a1);
    a = ii(a, b, c, d, x[k + 4]!, S41, 0xf7537e82);
    d = ii(d, a, b, c, x[k + 11]!, S42, 0xbd3af235);
    c = ii(c, d, a, b, x[k + 2]!, S43, 0x2ad7d2bb);
    b = ii(b, c, d, a, x[k + 9]!, S44, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
}

/**
 * SHA-256 hash using Web Crypto API
 */
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * SHA-512 hash using Web Crypto API
 */
export async function sha512(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

/**
 * MD5 digest of raw bytes → raw bytes.
 * The custom md5() masks each char to a byte (charCodeAt & 0xff), so a
 * Latin-1 binary string round-trip is lossless (unlike UTF-8 TextEncoder).
 */
async function md5Digest(bytes: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const hex = await md5(bin);
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

/**
 * Generate a standards-correct HMAC (RFC 2104).
 *
 * SHA-256/512 use Web Crypto's native HMAC (correct block sizes + raw-byte
 * handling guaranteed). MD5 (unsupported by Web Crypto) uses a manual HMAC
 * over RAW digest bytes with the correct 64-byte block.
 *
 * Replaces a broken implementation that UTF-8-corrupted bytes >= 0x80,
 * hashed the inner digest's hex string instead of its bytes, and used a
 * 128-byte block for SHA-256 (should be 64).
 */
export async function generateHMAC(
  text: string,
  key: string,
  algorithm: 'md5' | 'sha256' | 'sha512'
): Promise<string> {
  const enc = new TextEncoder();

  if (algorithm === 'sha256' || algorithm === 'sha512') {
    const hash = algorithm === 'sha256' ? 'SHA-256' : 'SHA-512';
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(key),
      { name: 'HMAC', hash },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(text));
    return toHex(new Uint8Array(sig));
  }

  // HMAC-MD5 — manual RFC 2104 over raw digest bytes. MD5 block size = 64.
  const blockSize = 64;
  let keyBytes = enc.encode(key);
  if (keyBytes.length > blockSize) keyBytes = await md5Digest(keyBytes);

  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(keyBytes);
  const innerKey = new Uint8Array(blockSize);
  const outerKey = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    innerKey[i] = paddedKey[i]! ^ 0x36;
    outerKey[i] = paddedKey[i]! ^ 0x5c;
  }

  const textBytes = enc.encode(text);
  const innerMsg = new Uint8Array(blockSize + textBytes.length);
  innerMsg.set(innerKey, 0);
  innerMsg.set(textBytes, blockSize);
  const innerDigest = await md5Digest(innerMsg);

  const outerMsg = new Uint8Array(blockSize + innerDigest.length);
  outerMsg.set(outerKey, 0);
  outerMsg.set(innerDigest, blockSize);
  return toHex(await md5Digest(outerMsg));
}

/**
 * Generate hash using specified algorithm
 */
export async function generateHash(
  text: string,
  algorithm: 'md5' | 'sha256' | 'sha512'
): Promise<string> {
  switch (algorithm) {
    case 'md5':
      return md5(text);
    case 'sha256':
      return sha256(text);
    case 'sha512':
      return sha512(text);
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
}
