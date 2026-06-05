import { ExcerptPipe } from './excerpt.pipe';

describe('ExcerptPipe', () => {
  let pipe: ExcerptPipe;

  beforeEach(() => {
    pipe = new ExcerptPipe();
  });

  it('truncates text with more than 28 words to 28 words and appends ellipsis', () => {
    const words = Array.from({ length: 35 }, (_, i) => `word${i + 1}`);
    const input = words.join(' ');
    const result = pipe.transform(input);
    const resultWords = result.replace('…', '').trim().split(' ');
    expect(resultWords.length).toBe(28);
    expect(result.endsWith('…')).toBe(true);
  });

  it('returns text unchanged when it has fewer than 28 words', () => {
    const input = 'This is a short sentence with fewer than twenty eight words.';
    const result = pipe.transform(input);
    expect(result).toBe(input);
    expect(result.endsWith('…')).toBe(false);
  });
});
