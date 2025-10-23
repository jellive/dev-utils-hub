import { describe, it, expect } from 'vitest';
import { md5, sha256, sha512, generateHash } from '../hashUtils';

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
  });
});
