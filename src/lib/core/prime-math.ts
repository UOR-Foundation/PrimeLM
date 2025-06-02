// =============================================================================
// PRIME MATHEMATICS UTILITIES
// =============================================================================

export class PrimeMath {
  private static primes: number[] = [];

  static generatePrimes(n: number): number[] {
    if (this.primes.length >= n) return this.primes.slice(0, n);
    
    const primes = [2];
    let num = 3;
    while (primes.length < n) {
      let isPrime = true;
      for (let i = 0; i < primes.length && primes[i] * primes[i] <= num; i++) {
        if (num % primes[i] === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) primes.push(num);
      num += 2;
    }
    
    this.primes = primes;
    return primes;
  }

  static embeddingsToPrimes(embeddings: number[], threshold: number = 0.02): Record<number, number> {
    const primes = this.generatePrimes(embeddings.length);
    const primeFactors: Record<number, number> = {};
    
    embeddings.forEach((value, index) => {
      if (Math.abs(value) > threshold) {
        const prime = primes[index % primes.length];
        const weight = Math.floor(Math.abs(value) * 1000) + 1;
        primeFactors[prime] = (primeFactors[prime] || 0) + weight;
      }
    });
    
    return primeFactors;
  }

  static calculateCoherence(primes1: Record<number, number>, primes2: Record<number, number>): number {
    const sharedFactors: Record<number, number> = {};
    Object.keys(primes1).forEach(primeStr => {
      const prime = parseInt(primeStr);
      if (primes2[prime]) {
        sharedFactors[prime] = Math.sqrt(primes1[prime] * primes2[prime]);
      }
    });
    
    const sharedMagnitude = this.calculateMagnitude(sharedFactors);
    const totalMagnitude = Math.sqrt(
      this.calculateMagnitude(primes1) * this.calculateMagnitude(primes2)
    );
    
    return totalMagnitude > 0 ? sharedMagnitude / totalMagnitude : 0;
  }

  static calculateMagnitude(primes: Record<number, number>): number {
    return Math.sqrt(
      Object.values(primes).reduce((sum, weight) => sum + weight * weight, 0)
    );
  }

  static combineFactors(primes1: Record<number, number>, primes2: Record<number, number>, ratio: number = 0.5): Record<number, number> {
    const combined: Record<number, number> = {};
    
    // Combine from first set
    Object.entries(primes1).forEach(([primeStr, weight]) => {
      const prime = parseInt(primeStr);
      combined[prime] = Math.floor(weight * ratio);
    });
    
    // Combine from second set
    Object.entries(primes2).forEach(([primeStr, weight]) => {
      const prime = parseInt(primeStr);
      combined[prime] = (combined[prime] || 0) + Math.floor(weight * (1 - ratio));
    });
    
    return combined;
  }
}
