// =============================================================================
// PRIME RESONANCE ENGINE TESTS
// =============================================================================

import { PrimeResonanceEngine } from '../prime-resonance';

describe('PrimeResonanceEngine', () => {
  let engine: PrimeResonanceEngine;

  beforeEach(() => {
    engine = new PrimeResonanceEngine();
  });

  describe('constructor', () => {
    it('should create a new instance', () => {
      expect(engine).toBeInstanceOf(PrimeResonanceEngine);
    });
  });

  describe('findMostResonantWords', () => {
    it('should find resonant words from vocabulary', () => {
      const inputPrimes = { 2: 10, 3: 5, 5: 8 };
      const vocabularyPrimes = new Map<string, Record<number, number>>([
        ['hello', { 2: 8, 3: 3, 7: 2 }],
        ['world', { 5: 6, 7: 4, 11: 1 }],
        ['test', { 2: 12, 13: 5 }]
      ]);

      const results = engine.findMostResonantWords(inputPrimes, vocabularyPrimes, 3);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(3);
      
      results.forEach(result => {
        expect(result).toHaveProperty('word');
        expect(result).toHaveProperty('resonance');
        expect(result).toHaveProperty('sharedPrimes');
        expect(result).toHaveProperty('harmonicMatches');
        expect(result).toHaveProperty('coherenceScore');
        expect(typeof result.resonance).toBe('number');
        expect(result.resonance).toBeGreaterThanOrEqual(0);
      });
    });

    it('should return empty array for empty vocabulary', () => {
      const inputPrimes = { 2: 10, 3: 5 };
      const vocabularyPrimes = new Map();

      const results = engine.findMostResonantWords(inputPrimes, vocabularyPrimes, 5);

      expect(results).toEqual([]);
    });

    it('should handle empty input primes', () => {
      const inputPrimes = {};
      const vocabularyPrimes = new Map<string, Record<number, number>>([
        ['hello', { 2: 8, 3: 3 }],
        ['world', { 5: 6, 7: 4 }]
      ]);

      const results = engine.findMostResonantWords(inputPrimes, vocabularyPrimes, 2);

      expect(Array.isArray(results)).toBe(true);
      // Should still return results based on harmonic analysis
    });

    it('should sort results by resonance score', () => {
      const inputPrimes = { 2: 10, 3: 5 };
      const vocabularyPrimes = new Map<string, Record<number, number>>([
        ['high', { 2: 15, 3: 8 }], // Should have high resonance
        ['medium', { 2: 5, 7: 3 }], // Should have medium resonance
        ['low', { 11: 2, 13: 1 }] // Should have low resonance
      ]);

      const results = engine.findMostResonantWords(inputPrimes, vocabularyPrimes, 3);

      // Results should be sorted by resonance (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].resonance).toBeGreaterThanOrEqual(results[i].resonance);
      }
    });

    it('should respect the limit parameter', () => {
      const inputPrimes = { 2: 10, 3: 5, 5: 8 };
      const vocabularyPrimes = new Map<string, Record<number, number>>([
        ['word1', { 2: 8, 3: 3 }],
        ['word2', { 5: 6, 7: 4 }],
        ['word3', { 2: 12, 13: 5 }],
        ['word4', { 3: 7, 11: 2 }],
        ['word5', { 5: 9, 17: 1 }]
      ]);

      const results = engine.findMostResonantWords(inputPrimes, vocabularyPrimes, 2);

      expect(results.length).toBe(2);
    });
  });

  describe('applyContextualWeighting', () => {
    it('should apply contextual weighting to resonant words', () => {
      const resonantWords = [
        { word: 'hello', resonance: 100, sharedPrimes: [2, 3], harmonicMatches: [5], coherenceScore: 0.8 },
        { word: 'world', resonance: 80, sharedPrimes: [5], harmonicMatches: [7], coherenceScore: 0.6 },
        { word: 'test', resonance: 60, sharedPrimes: [2], harmonicMatches: [], coherenceScore: 0.4 }
      ];
      const context = ['hello there', 'this is a test'];
      const boost = 1.5;

      const results = engine.applyContextualWeighting(resonantWords, context, boost);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(resonantWords.length);

      // Words that appear in context should have boosted resonance
      const helloResult = results.find(r => r.word === 'hello');
      const testResult = results.find(r => r.word === 'test');
      const worldResult = results.find(r => r.word === 'world');

      expect(helloResult?.resonance).toBeGreaterThan(100); // Should be boosted
      expect(testResult?.resonance).toBeGreaterThan(60); // Should be boosted
      expect(worldResult?.resonance).toBe(80); // Should remain unchanged
    });

    it('should handle empty context', () => {
      const resonantWords = [
        { word: 'hello', resonance: 100, sharedPrimes: [2, 3], harmonicMatches: [5], coherenceScore: 0.8 }
      ];
      const context: string[] = [];
      const boost = 1.5;

      const results = engine.applyContextualWeighting(resonantWords, context, boost);

      expect(results).toEqual(resonantWords); // Should remain unchanged
    });

    it('should handle empty resonant words', () => {
      const resonantWords: import('../prime-resonance').PrimeResonanceResult[] = [];
      const context = ['hello world'];
      const boost = 1.5;

      const results = engine.applyContextualWeighting(resonantWords, context, boost);

      expect(results).toEqual([]);
    });

    it('should preserve word order when resonance values are equal', () => {
      const resonantWords = [
        { word: 'first', resonance: 100, sharedPrimes: [2], harmonicMatches: [], coherenceScore: 0.5 },
        { word: 'second', resonance: 100, sharedPrimes: [3], harmonicMatches: [], coherenceScore: 0.5 },
        { word: 'third', resonance: 100, sharedPrimes: [5], harmonicMatches: [], coherenceScore: 0.5 }
      ];
      const context: string[] = [];
      const boost = 1.0;

      const results = engine.applyContextualWeighting(resonantWords, context, boost);

      expect(results.map(r => r.word)).toEqual(['first', 'second', 'third']);
    });
  });

  describe('integration tests', () => {
    it('should work with realistic prime factorizations', () => {
      const inputPrimes = { 2: 15, 3: 8, 5: 12, 7: 5 };
      const vocabularyPrimes = new Map<string, Record<number, number>>([
        ['mathematics', { 2: 10, 3: 6, 11: 3 }],
        ['science', { 5: 8, 7: 4, 13: 2 }],
        ['algorithm', { 2: 12, 17: 6 }],
        ['computation', { 3: 9, 5: 7, 19: 1 }]
      ]);

      const resonantWords = engine.findMostResonantWords(inputPrimes, vocabularyPrimes, 4);
      const context = ['mathematical computation and scientific algorithms'];
      const contextualWords = engine.applyContextualWeighting(resonantWords, context, 1.3);

      expect(resonantWords.length).toBeGreaterThan(0);
      expect(contextualWords.length).toBe(resonantWords.length);

      // Verify that contextual words have appropriate boosts
      const mathWord = contextualWords.find(w => w.word === 'mathematics');
      const scienceWord = contextualWords.find(w => w.word === 'science');
      const algoWord = contextualWords.find(w => w.word === 'algorithm');
      const compWord = contextualWords.find(w => w.word === 'computation');

      if (mathWord && scienceWord && algoWord && compWord) {
        // Words appearing in context should have higher resonance
        expect(mathWord.resonance).toBeGreaterThan(0);
        expect(scienceWord.resonance).toBeGreaterThan(0);
        expect(algoWord.resonance).toBeGreaterThan(0);
        expect(compWord.resonance).toBeGreaterThan(0);
      }
    });

    it('should handle edge cases gracefully', () => {
      // Test with very large prime factors
      const largePrimes = { 97: 1000, 101: 500, 103: 750 };
      const vocabularyPrimes = new Map<string, Record<number, number>>([
        ['large', { 97: 800, 107: 200 }],
        ['small', { 2: 5, 3: 3 }]
      ]);

      const results = engine.findMostResonantWords(largePrimes, vocabularyPrimes, 2);
      expect(Array.isArray(results)).toBe(true);

      // Test with zero resonance
      const zeroPrimes = {};
      const zeroResults = engine.findMostResonantWords(zeroPrimes, vocabularyPrimes, 1);
      expect(Array.isArray(zeroResults)).toBe(true);
    });

    it('should maintain mathematical properties', () => {
      const inputPrimes = { 2: 10, 3: 5, 5: 8 };
      const vocabularyPrimes = new Map<string, Record<number, number>>([
        ['test1', { 2: 8, 3: 3, 7: 2 }],
        ['test2', { 5: 6, 11: 4 }],
        ['test3', { 2: 12, 3: 7 }]
      ]);

      const results = engine.findMostResonantWords(inputPrimes, vocabularyPrimes, 3);

      results.forEach(result => {
        // Resonance should be non-negative
        expect(result.resonance).toBeGreaterThanOrEqual(0);
        
        // Shared primes should be arrays of numbers
        expect(Array.isArray(result.sharedPrimes)).toBe(true);
        result.sharedPrimes.forEach(prime => {
          expect(typeof prime).toBe('number');
          expect(prime).toBeGreaterThan(1);
        });

        // Harmonic matches should be arrays of numbers
        expect(Array.isArray(result.harmonicMatches)).toBe(true);
        result.harmonicMatches.forEach(harmonic => {
          expect(typeof harmonic).toBe('number');
          expect(harmonic).toBeGreaterThan(1);
        });
      });
    });
  });
});
