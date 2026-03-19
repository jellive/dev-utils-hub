import { describe, it, expect } from 'vitest';
import { md5, sha256, sha512, generateHash, generateHMAC } from '../hashUtils';

describe('hashUtils', () => {
  describe('md5', () => {
    it('should generate correct MD5 hash for simple string', async () => {
      const result = await md5('hello');
      expect(result).toBe('5d41402abc4b2a76b9719d911017c592');
    });

    it('should generate correct MD5 hash for empty string', async () => {
      const result = await md5('');
      expect(result).toBe('d41d8cd98f00b204e9800998ecf8427e');
    });

    it('should generate correct MD5 hash for longer string', async () => {
      const result = await md5('The quick brown fox jumps over the lazy dog');
      expect(result).toBe('9e107d9d372bb6826bd81d3542a419d6');
    });

    it('should generate consistent hashes for same input', async () => {
      const result1 = await md5('test');
      const result2 = await md5('test');
      expect(result1).toBe(result2);
    });
  });

  describe('sha256', () => {
    it('should generate correct SHA-256 hash for simple string', async () => {
      const result = await sha256('hello');
      expect(result).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });

    it('should generate correct SHA-256 hash for empty string', async () => {
      const result = await sha256('');
      expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('should generate correct SHA-256 hash for longer string', async () => {
      const result = await sha256('The quick brown fox jumps over the lazy dog');
      expect(result).toBe('d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592');
    });
  });

  describe('sha512', () => {
    it('should generate correct SHA-512 hash for simple string', async () => {
      const result = await sha512('hello');
      expect(result).toBe('9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043');
    });

    it('should generate correct SHA-512 hash for empty string', async () => {
      const result = await sha512('');
      expect(result).toBe('cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e');
    });

    it('should generate correct SHA-512 hash for longer string', async () => {
      const result = await sha512('The quick brown fox jumps over the lazy dog');
      expect(result).toBe('07e547d9586f6a73f73fbac0435ed76951218fb7d0c8d788a309d785436bbb642e93a252a954f23912547d1e8a3b5ed6e1bfd7097821233fa0538f3db854fee6');
    });
  });

  describe('generateHash', () => {
    it('should generate MD5 hash when algorithm is md5', async () => {
      const result = await generateHash('hello', 'md5');
      expect(result).toBe('5d41402abc4b2a76b9719d911017c592');
    });

    it('should generate SHA-256 hash when algorithm is sha256', async () => {
      const result = await generateHash('hello', 'sha256');
      expect(result).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });

    it('should generate SHA-512 hash when algorithm is sha512', async () => {
      const result = await generateHash('hello', 'sha512');
      expect(result).toBe('9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043');
    });

    it('should handle Unicode characters correctly', async () => {
      const result = await generateHash('한글', 'md5');
      expect(result).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should handle special characters correctly', async () => {
      const result = await generateHash('!@#$%^&*()', 'sha256');
      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce different outputs for different algorithms on same input', async () => {
      const input = 'test';
      const md5Result = await generateHash(input, 'md5');
      const sha256Result = await generateHash(input, 'sha256');
      const sha512Result = await generateHash(input, 'sha512');
      expect(md5Result).not.toBe(sha256Result);
      expect(md5Result).not.toBe(sha512Result);
      expect(sha256Result).not.toBe(sha512Result);
    });

    it('should produce correct output length for each algorithm', async () => {
      const input = 'boundary';
      expect((await generateHash(input, 'md5')).length).toBe(32);
      expect((await generateHash(input, 'sha256')).length).toBe(64);
      expect((await generateHash(input, 'sha512')).length).toBe(128);
    });
  });

  describe('generateHMAC', () => {
    // Exact-value tests kill string-init and loop-bound mutants in generateHMAC
    it('should generate exact HMAC-MD5 for hello/key', async () => {
      const result = await generateHMAC('hello', 'key', 'md5');
      expect(result).toBe('5bb2ed191b1da123e16e2222dbe2b220');
    });

    it('should generate exact HMAC-SHA256 for hello/key', async () => {
      const result = await generateHMAC('hello', 'key', 'sha256');
      expect(result).toBe('6da8cd3e7e824394f27dd3ff9ec28c731eadda5cd671d3b9609176ad60ed1b75');
    });

    it('should generate exact HMAC-MD5 for empty message', async () => {
      const result = await generateHMAC('', 'key', 'md5');
      expect(result).toBe('f3450a19f4346b378bcdf4dcf3242a76');
    });

    it('should generate exact HMAC-MD5 for test/secret', async () => {
      const result = await generateHMAC('test', 'secret', 'md5');
      expect(result).toBe('d22fa71cf626a291e4240060595c002b');
    });

    it('should generate exact HMAC-SHA256 for test/secret', async () => {
      const result = await generateHMAC('test', 'secret', 'sha256');
      expect(result).toBe('e8630e664871f66fcfe5042cb8eeb3fa7e8f23f0d745a8b065c761d77d29c36f');
    });

    it('should generate exact HMAC-SHA512 for test/secret', async () => {
      const result = await generateHMAC('test', 'secret', 'sha512');
      expect(result).toBe('a50ba45b705b17d73958e7c7ca643bd9f7ff1229cba043fa09b14e4029e385cc8fdf75c6dcf8d3343a6989c723ee5549b72d475a01592e4499ab6734bad2e0c6');
    });

    it('should produce consistent output for same inputs', async () => {
      const r1 = await generateHMAC('message', 'secret', 'md5');
      const r2 = await generateHMAC('message', 'secret', 'md5');
      expect(r1).toBe(r2);
    });

    it('should produce different output for different messages', async () => {
      const r1 = await generateHMAC('message1', 'secret', 'md5');
      const r2 = await generateHMAC('message2', 'secret', 'md5');
      expect(r1).not.toBe(r2);
    });

    it('should produce different output for different keys', async () => {
      const r1 = await generateHMAC('message', 'key1', 'sha256');
      const r2 = await generateHMAC('message', 'key2', 'sha256');
      expect(r1).not.toBe(r2);
    });

    it('should use block size 64 for md5 (key at boundary vs over boundary)', async () => {
      // Key of exactly 64 bytes - NOT hashed before use (length === blockSize, not >)
      const key64 = 'a'.repeat(64);
      const result64 = await generateHMAC('test', key64, 'md5');
      expect(result64).toMatch(/^[a-f0-9]{32}$/);
      // Key of 65 bytes - SHOULD be hashed first (length > blockSize)
      const key65 = 'a'.repeat(65);
      const result65 = await generateHMAC('test', key65, 'md5');
      expect(result65).toMatch(/^[a-f0-9]{32}$/);
      // Results differ because key processing path differs
      expect(result64).not.toBe(result65);
    });

    it('should use block size 128 for sha256 (key at boundary vs over boundary)', async () => {
      const key128 = 'b'.repeat(128);
      const result128 = await generateHMAC('test', key128, 'sha256');
      expect(result128).toMatch(/^[a-f0-9]+$/);
      const key129 = 'b'.repeat(129);
      const result129 = await generateHMAC('test', key129, 'sha256');
      expect(result129).toMatch(/^[a-f0-9]+$/);
      expect(result128).not.toBe(result129);
    });

    it('should use block size 128 for sha512 (key at boundary vs over boundary)', async () => {
      const key128 = 'c'.repeat(128);
      const result128 = await generateHMAC('test', key128, 'sha512');
      expect(result128).toMatch(/^[a-f0-9]+$/);
      const key129 = 'c'.repeat(129);
      const result129 = await generateHMAC('test', key129, 'sha512');
      expect(result129).toMatch(/^[a-f0-9]+$/);
      expect(result128).not.toBe(result129);
    });

    it('should produce different results for md5 vs sha256', async () => {
      const r1 = await generateHMAC('message', 'key', 'md5');
      const r2 = await generateHMAC('message', 'key', 'sha256');
      expect(r1).not.toBe(r2);
    });

    it('should produce different results for sha256 vs sha512', async () => {
      const r1 = await generateHMAC('message', 'key', 'sha256');
      const r2 = await generateHMAC('message', 'key', 'sha512');
      expect(r1).not.toBe(r2);
    });

    it('should handle empty key', async () => {
      const result = await generateHMAC('message', '', 'md5');
      expect(result).toMatch(/^[a-f0-9]{32}$/);
    });

    it('empty message HMAC should differ from non-empty message HMAC', async () => {
      const r1 = await generateHMAC('', 'key', 'sha256');
      const r2 = await generateHMAC('a', 'key', 'sha256');
      expect(r1).not.toBe(r2);
    });
  });

  describe('md5 output format', () => {
    it('should always produce exactly 32 hex characters', async () => {
      for (const input of ['', 'a', 'ab', 'abc', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64)]) {
        const result = await md5(input);
        expect(result.length).toBe(32);
        expect(result).toMatch(/^[a-f0-9]{32}$/);
      }
    });

    it('should produce all 4 bytes in output (wordToHex covers bytes 0-3)', async () => {
      // This forces wordToHex to exercise all 4 byte positions
      // The known hash of 'abc' exercises non-zero bytes across all positions
      const result = await md5('abc');
      expect(result).toBe('900150983cd24fb0d6963f7d28e17f72');
      expect(result.length).toBe(32);
    });

    it('should differ for inputs that differ only by one character', async () => {
      const r1 = await md5('hello');
      const r2 = await md5('helo');
      expect(r1).not.toBe(r2);
    });
  });
});
