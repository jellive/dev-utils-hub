import type { Tool } from '../types';

export const TOOLS: Tool[] = [
  {
    id: 'json',
    name: 'JSON Formatter',
    icon: '📝',
    description: 'Format and validate JSON',
  },
  {
    id: 'jwt',
    name: 'JWT Decoder',
    icon: '🔐',
    description: 'Decode JWT tokens',
  },
  {
    id: 'base64',
    name: 'Base64',
    icon: '🔤',
    description: 'Encode/Decode Base64',
  },
  {
    id: 'url',
    name: 'URL Encoder',
    icon: '🔗',
    description: 'Encode/Decode URLs',
  },
  {
    id: 'regex',
    name: 'Regex Tester',
    icon: '🎯',
    description: 'Test regular expressions',
  },
  {
    id: 'diff',
    name: 'Text Diff',
    icon: '📊',
    description: 'Compare text differences',
  },
  {
    id: 'hash',
    name: 'Hash Generator',
    icon: '🔑',
    description: 'Generate MD5, SHA hashes',
  },
];
