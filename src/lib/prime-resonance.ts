// =============================================================================
// PRIME RESONANCE ENGINE
// =============================================================================

export interface PrimeResonanceResult {
  word: string;
  resonance: number;
  sharedPrimes: number[];
  harmonicMatches: number[];
  coherenceScore: number;
}

export class PrimeResonanceEngine {
  
  /**
   * Find words with highest mathematical resonance to input prime factors
   * This replaces embedding-based similarity with direct prime-to-prime comparison
   */
  findMostResonantWords(
    inputPrimes: Record<number, number>,
    vocabularyPrimes: Map<string, Record<number, number>>,
    count: number = 3
  ): PrimeResonanceResult[] {
    console.log('🔢 Finding resonant words using direct prime comparison...');
    console.log('Input primes:', this.formatPrimes(inputPrimes));
    
    const resonanceResults: PrimeResonanceResult[] = [];
    
    for (const [word, wordPrimes] of vocabularyPrimes) {
      const resonance = this.calculatePrimeResonance(inputPrimes, wordPrimes);
      const sharedPrimes = this.findSharedPrimes(inputPrimes, wordPrimes);
      const harmonicMatches = this.findHarmonicMatches(inputPrimes, wordPrimes);
      const coherenceScore = this.calculateCoherenceScore(inputPrimes, wordPrimes);
      
      resonanceResults.push({
        word,
        resonance,
        sharedPrimes,
        harmonicMatches,
        coherenceScore
      });
    }
    
    // Sort by resonance score (highest first)
    const sorted = resonanceResults
      .sort((a, b) => b.resonance - a.resonance)
      .slice(0, count * 2) // Get more candidates for filtering
      .filter(result => result.resonance > 0); // Only meaningful resonance
    
    console.log('Top resonance results:', sorted.slice(0, 5).map(r => 
      `${r.word}: ${r.resonance.toFixed(1)} (shared: ${r.sharedPrimes.length}, harmonic: ${r.harmonicMatches.length})`
    ));
    
    return sorted.slice(0, count);
  }
  
  /**
   * Calculate mathematical resonance between two prime factorizations
   * Uses shared prime factors and their weight relationships
   */
  private calculatePrimeResonance(
    primes1: Record<number, number>,
    primes2: Record<number, number>
  ): number {
    let resonance = 0;
    
    // Direct shared prime resonance (strongest signal)
    for (const [prime, weight1] of Object.entries(primes1)) {
      const primeNum = parseInt(prime);
      const weight2 = primes2[primeNum];
      
      if (weight2) {
        // Geometric mean of weights for shared primes
        resonance += Math.sqrt(weight1 * weight2);
      }
    }
    
    // Harmonic resonance (weaker but meaningful)
    const harmonicResonance = this.calculateHarmonicResonance(primes1, primes2);
    resonance += harmonicResonance * 0.3; // Weight harmonic matches less
    
    return resonance;
  }
  
  /**
   * Find prime numbers that appear in both factorizations
   */
  private findSharedPrimes(
    primes1: Record<number, number>,
    primes2: Record<number, number>
  ): number[] {
    const shared: number[] = [];
    
    for (const prime of Object.keys(primes1)) {
      const primeNum = parseInt(prime);
      if (primes2[primeNum]) {
        shared.push(primeNum);
      }
    }
    
    return shared.sort((a, b) => a - b);
  }
  
  /**
   * Find harmonic relationships between prime factorizations
   * Looks for mathematical relationships like 2x, 3x, x+2, x-2
   */
  private findHarmonicMatches(
    primes1: Record<number, number>,
    primes2: Record<number, number>
  ): number[] {
    const harmonics: number[] = [];
    
    for (const [prime1Str] of Object.entries(primes1)) {
      const prime1 = parseInt(prime1Str);
      
      // Check for harmonic relationships
      const harmonicCandidates = [
        prime1 * 2,    // Double
        prime1 * 3,    // Triple
        prime1 + 2,    // Next prime gap
        prime1 - 2,    // Previous prime gap
        Math.floor(prime1 / 2), // Half (if even)
        Math.floor(prime1 / 3)  // Third (if divisible)
      ].filter(p => p > 1 && Number.isInteger(p));
      
      for (const harmonic of harmonicCandidates) {
        if (primes2[harmonic]) {
          harmonics.push(harmonic);
        }
      }
    }
    
    return [...new Set(harmonics)].sort((a, b) => a - b);
  }
  
  /**
   * Calculate harmonic resonance between prime factorizations
   */
  private calculateHarmonicResonance(
    primes1: Record<number, number>,
    primes2: Record<number, number>
  ): number {
    let harmonicResonance = 0;
    
    for (const [prime1Str, weight1] of Object.entries(primes1)) {
      const prime1 = parseInt(prime1Str);
      
      // Check harmonic relationships
      const harmonics = [prime1 * 2, prime1 + 2, prime1 - 2];
      
      for (const harmonic of harmonics) {
        const weight2 = primes2[harmonic];
        if (weight2) {
          // Weaker resonance for harmonic matches
          harmonicResonance += Math.sqrt(weight1 * weight2) * 0.5;
        }
      }
    }
    
    return harmonicResonance;
  }
  
  /**
   * Calculate mathematical coherence score between prime factorizations
   * Similar to the existing coherence calculation but optimized for resonance
   */
  private calculateCoherenceScore(
    primes1: Record<number, number>,
    primes2: Record<number, number>
  ): number {
    const sharedFactors: Record<number, number> = {};
    
    // Find shared prime factors
    for (const [primeStr, weight1] of Object.entries(primes1)) {
      const prime = parseInt(primeStr);
      const weight2 = primes2[prime];
      
      if (weight2) {
        sharedFactors[prime] = Math.sqrt(weight1 * weight2);
      }
    }
    
    // Calculate coherence as ratio of shared to total magnitude
    const sharedMagnitude = this.calculateMagnitude(sharedFactors);
    const totalMagnitude = Math.sqrt(
      this.calculateMagnitude(primes1) * this.calculateMagnitude(primes2)
    );
    
    return totalMagnitude > 0 ? sharedMagnitude / totalMagnitude : 0;
  }
  
  /**
   * Calculate magnitude of prime factorization
   */
  private calculateMagnitude(primes: Record<number, number>): number {
    return Math.sqrt(
      Object.values(primes).reduce((sum, weight) => sum + weight * weight, 0)
    );
  }
  
  /**
   * Format prime factorization for logging
   */
  private formatPrimes(primes: Record<number, number>): string {
    const entries = Object.entries(primes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([prime, weight]) => `${prime}:${Math.floor(weight)}`);
    
    return `{${entries.join(', ')}}`;
  }
  
  /**
   * Get contextual weighting based on conversation history
   * Boosts resonance for words that appear in recent context
   */
  applyContextualWeighting(
    results: PrimeResonanceResult[],
    conversationContext: string[],
    contextWeight: number = 1.5
  ): PrimeResonanceResult[] {
    const contextWords = conversationContext
      .join(' ')
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2);
    
    return results.map(result => {
      let boostedResonance = result.resonance;
      
      // Boost resonance if word appears in conversation context
      if (contextWords.includes(result.word.toLowerCase())) {
        boostedResonance *= contextWeight;
        console.log(`🎯 Context boost for "${result.word}": ${result.resonance.toFixed(1)} → ${boostedResonance.toFixed(1)}`);
      }
      
      return {
        ...result,
        resonance: boostedResonance
      };
    });
  }
}
