// =============================================================================
// PRIME MATH TESTS
// =============================================================================

import { PrimeMath } from '../prime-math';

describe('PrimeMath', () => {
  describe('generatePrimes', () => {
    it('should generate the first n prime numbers', () => {
      const primes = PrimeMath.generatePrimes(5);
      expect(primes).toEqual([2, 3, 5, 7, 11]);
    });

    it('should generate first 10 primes correctly', () => {
      const primes = PrimeMath.generatePrimes(10);
      expect(primes).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
    });

    it('should handle edge case of 0 primes', () => {
      const primes = PrimeMath.generatePrimes(0);
      expect(primes).toEqual([]);
    });

    it('should handle edge case of 1 prime', () => {
      const primes = PrimeMath.generatePrimes(1);
      expect(primes).toEqual([2]);
    });
  });

  describe('prime generation validation', () => {
    it('should generate only prime numbers', () => {
      const primes = PrimeMath.generatePrimes(20);
      const knownPrimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];
      expect(primes).toEqual(knownPrimes);
    });

    it('should not include composite numbers', () => {
      const primes = PrimeMath.generatePrimes(10);
      const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18];
      
      composites.forEach(composite => {
        expect(primes).not.toContain(composite);
      });
    });

    it('should maintain prime sequence order', () => {
      const primes = PrimeMath.generatePrimes(15);
      
      for (let i = 1; i < primes.length; i++) {
        expect(primes[i]).toBeGreaterThan(primes[i - 1]);
      }
    });
  });

  describe('embeddingsToPrimes', () => {
    it('should convert embeddings to prime factorization', () => {
      const embeddings = [0.5, -0.3, 0.8, 0.1, -0.2];
      const primes = PrimeMath.embeddingsToPrimes(embeddings);
      
      expect(typeof primes).toBe('object');
      expect(Object.keys(primes).length).toBeGreaterThan(0);
      
      // Check that all keys are valid prime numbers from the generated sequence
      const generatedPrimes = PrimeMath.generatePrimes(100);
      Object.keys(primes).forEach(key => {
        const prime = parseInt(key);
        expect(generatedPrimes).toContain(prime);
      });
    });

    it('should handle zero embeddings', () => {
      const embeddings = [0, 0, 0, 0, 0];
      const primes = PrimeMath.embeddingsToPrimes(embeddings);
      
      expect(typeof primes).toBe('object');
      // Should have minimal or no prime factors for zero embeddings
    });

    it('should handle negative embeddings', () => {
      const embeddings = [-0.5, -0.3, -0.8, -0.1, -0.2];
      const primes = PrimeMath.embeddingsToPrimes(embeddings);
      
      expect(typeof primes).toBe('object');
      expect(Object.keys(primes).length).toBeGreaterThan(0);
    });

    it('should be deterministic for same input', () => {
      const embeddings = [0.5, -0.3, 0.8, 0.1, -0.2];
      const primes1 = PrimeMath.embeddingsToPrimes(embeddings);
      const primes2 = PrimeMath.embeddingsToPrimes(embeddings);
      
      expect(primes1).toEqual(primes2);
    });
  });

  describe('calculateMagnitude', () => {
    it('should calculate magnitude of prime factors', () => {
      const primes = { 2: 5, 3: 3, 5: 2 };
      const magnitude = PrimeMath.calculateMagnitude(primes);
      
      expect(magnitude).toBeGreaterThan(0);
      expect(typeof magnitude).toBe('number');
    });

    it('should return 0 for empty prime factors', () => {
      const primes = {};
      const magnitude = PrimeMath.calculateMagnitude(primes);
      
      expect(magnitude).toBe(0);
    });

    it('should handle single prime factor', () => {
      const primes = { 2: 5 };
      const magnitude = PrimeMath.calculateMagnitude(primes);
      
      expect(magnitude).toBe(5);
    });

    it('should calculate correctly for known values', () => {
      const primes = { 2: 3, 3: 4 }; // sqrt(3^2 + 4^2) = sqrt(9 + 16) = sqrt(25) = 5
      const magnitude = PrimeMath.calculateMagnitude(primes);
      
      expect(magnitude).toBe(5);
    });
  });

  describe('calculateCoherence', () => {
    it('should calculate coherence between two prime factorizations', () => {
      const primes1 = { 2: 5, 3: 3, 5: 2 };
      const primes2 = { 2: 3, 3: 4, 7: 1 };
      const coherence = PrimeMath.calculateCoherence(primes1, primes2);
      
      expect(coherence).toBeGreaterThanOrEqual(0);
      expect(coherence).toBeLessThanOrEqual(1);
      expect(typeof coherence).toBe('number');
    });

    it('should return 0 for completely different prime sets', () => {
      const primes1 = { 2: 5, 3: 3 };
      const primes2 = { 7: 2, 11: 4 };
      const coherence = PrimeMath.calculateCoherence(primes1, primes2);
      
      expect(coherence).toBe(0);
    });

    it('should return high coherence for identical prime sets', () => {
      const primes1 = { 2: 5, 3: 3, 5: 2 };
      const primes2 = { 2: 5, 3: 3, 5: 2 };
      const coherence = PrimeMath.calculateCoherence(primes1, primes2);
      
      expect(coherence).toBe(1);
    });

    it('should handle empty prime factorizations', () => {
      const primes1 = {};
      const primes2 = { 2: 5, 3: 3 };
      const coherence = PrimeMath.calculateCoherence(primes1, primes2);
      
      expect(coherence).toBe(0);
    });

    it('should be symmetric', () => {
      const primes1 = { 2: 5, 3: 3, 5: 2 };
      const primes2 = { 2: 3, 3: 4, 7: 1 };
      const coherence1 = PrimeMath.calculateCoherence(primes1, primes2);
      const coherence2 = PrimeMath.calculateCoherence(primes2, primes1);
      
      expect(coherence1).toBe(coherence2);
    });
  });

  describe('combineFactors', () => {
    it('should combine prime factors with given weight', () => {
      const primes1 = { 2: 5, 3: 3 };
      const primes2 = { 2: 2, 5: 4 };
      const combined = PrimeMath.combineFactors(primes1, primes2, 0.7);
      
      expect(combined).toHaveProperty('2');
      expect(combined).toHaveProperty('3');
      expect(combined).toHaveProperty('5');
      
      // Check that prime 2 is combined correctly (using Math.floor)
      expect(combined[2]).toBe(Math.floor(5 * 0.7) + Math.floor(2 * 0.3));
    });

    it('should handle non-overlapping primes', () => {
      const primes1 = { 2: 5, 3: 3 };
      const primes2 = { 7: 2, 11: 4 };
      const combined = PrimeMath.combineFactors(primes1, primes2, 0.6);
      
      expect(combined).toHaveProperty('2');
      expect(combined).toHaveProperty('3');
      expect(combined).toHaveProperty('7');
      expect(combined).toHaveProperty('11');
      
      expect(combined[2]).toBe(Math.floor(5 * 0.6));
      expect(combined[7]).toBe(Math.floor(2 * 0.4));
    });

    it('should handle empty factor sets', () => {
      const primes1 = {};
      const primes2 = { 2: 5, 3: 3 };
      const combined = PrimeMath.combineFactors(primes1, primes2, 0.5);
      
      expect(combined).toHaveProperty('2');
      expect(combined).toHaveProperty('3');
      expect(combined[2]).toBe(Math.floor(5 * 0.5));
    });

    it('should respect weight boundaries', () => {
      const primes1 = { 2: 10 };
      const primes2 = { 2: 5 };
      
      // Test with weight 0 (should be all primes2)
      const combined0 = PrimeMath.combineFactors(primes1, primes2, 0);
      expect(combined0[2]).toBe(5);
      
      // Test with weight 1 (should be all primes1)
      const combined1 = PrimeMath.combineFactors(primes1, primes2, 1);
      expect(combined1[2]).toBe(10);
    });
  });

  describe('integration tests', () => {
    it('should work with realistic embedding data', () => {
      // Simulate realistic embedding vector
      const embeddings = Array.from({ length: 384 }, (_, i) => 
        Math.sin(i / 10) * 0.1 + Math.random() * 0.02 - 0.01
      );
      
      const primes = PrimeMath.embeddingsToPrimes(embeddings);
      const magnitude = PrimeMath.calculateMagnitude(primes);
      
      expect(Object.keys(primes).length).toBeGreaterThan(0);
      expect(magnitude).toBeGreaterThan(0);
      
      // Test coherence with itself should be 1
      const coherence = PrimeMath.calculateCoherence(primes, primes);
      expect(coherence).toBe(1);
    });

    it('should maintain mathematical properties', () => {
      const embeddings1 = [0.5, 0.3, 0.8];
      const embeddings2 = [0.2, 0.7, 0.4];
      
      const primes1 = PrimeMath.embeddingsToPrimes(embeddings1);
      const primes2 = PrimeMath.embeddingsToPrimes(embeddings2);
      
      const magnitude1 = PrimeMath.calculateMagnitude(primes1);
      const magnitude2 = PrimeMath.calculateMagnitude(primes2);
      const coherence = PrimeMath.calculateCoherence(primes1, primes2);
      
      // Basic mathematical properties
      expect(magnitude1).toBeGreaterThanOrEqual(0);
      expect(magnitude2).toBeGreaterThanOrEqual(0);
      expect(coherence).toBeGreaterThanOrEqual(0);
      expect(coherence).toBeLessThanOrEqual(1);
    });
  });
});
