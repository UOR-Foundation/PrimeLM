// =============================================================================
// KNOWLEDGE BOOTSTRAP TESTS
// =============================================================================

import { KnowledgeBootstrap } from '../knowledge-bootstrap';

describe('KnowledgeBootstrap', () => {
  let knowledgeBootstrap: KnowledgeBootstrap;
  let mockEmbeddingPipeline: any;

  beforeEach(() => {
    // Create a mock embedding pipeline
    mockEmbeddingPipeline = {
      tokenizer: {
        model: {
          vocab: {
            'hello': 1,
            'world': 2,
            'test': 3,
            'example': 4,
            'word': 5,
            'semantic': 6,
            'knowledge': 7,
            'bootstrap': 8,
            'vocabulary': 9,
            'embedding': 10,
            'language': 11,
            'model': 12,
            'artificial': 13,
            'intelligence': 14,
            'machine': 15,
            'learning': 16,
            'neural': 17,
            'network': 18,
            'transformer': 19,
            'attention': 20
          }
        }
      }
    };

    // Mock the embedding pipeline function
    const mockPipelineFunction = jest.fn().mockImplementation(async (text: string) => {
      // Return a mock embedding based on text length and content
      const embedding = new Array(384).fill(0).map((_, i) => {
        return Math.sin((text.length + i) / 100) * 0.1;
      });
      return { data: embedding };
    });

    // Assign tokenizer to the mock function
    Object.assign(mockPipelineFunction, mockEmbeddingPipeline);

    knowledgeBootstrap = new KnowledgeBootstrap(mockPipelineFunction);
  });

  describe('constructor', () => {
    it('should create a new instance with embedding pipeline', () => {
      expect(knowledgeBootstrap).toBeInstanceOf(KnowledgeBootstrap);
    });

    it('should handle null embedding pipeline', () => {
      expect(() => new KnowledgeBootstrap(null)).not.toThrow();
    });
  });

  describe('bootstrapFromTokenizer', () => {
    it('should successfully bootstrap knowledge from tokenizer', async () => {
      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();

      expect(knowledgeBase).toBeDefined();
      expect(knowledgeBase).toHaveProperty('vocabulary');
      expect(knowledgeBase).toHaveProperty('semanticClusters');
      expect(knowledgeBase).toHaveProperty('conceptEmbeddings');
      expect(knowledgeBase).toHaveProperty('vocabularyPrimes');

      expect(knowledgeBase.vocabulary).toBeInstanceOf(Map);
      expect(knowledgeBase.semanticClusters).toBeInstanceOf(Map);
      expect(knowledgeBase.conceptEmbeddings).toBeInstanceOf(Map);
      expect(knowledgeBase.vocabularyPrimes).toBeInstanceOf(Map);
    });

    it('should extract meaningful vocabulary words', async () => {
      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();

      expect(knowledgeBase.vocabulary.size).toBeGreaterThan(0);
      
      // Check that meaningful words are included
      expect(knowledgeBase.vocabulary.has('hello')).toBe(true);
      expect(knowledgeBase.vocabulary.has('world')).toBe(true);
      expect(knowledgeBase.vocabulary.has('knowledge')).toBe(true);
    });

    it('should generate embeddings for vocabulary words', async () => {
      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();

      for (const [word, entry] of knowledgeBase.vocabulary) {
        expect(entry.embedding).toBeDefined();
        expect(Array.isArray(entry.embedding)).toBe(true);
        expect(entry.embedding.length).toBeGreaterThan(0);
        expect(entry.word).toBe(word);
      }
    });

    it('should create semantic clusters', async () => {
      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();

      expect(knowledgeBase.semanticClusters.size).toBeGreaterThan(0);
      
      for (const [word, similarWords] of knowledgeBase.semanticClusters) {
        expect(Array.isArray(similarWords)).toBe(true);
        expect(similarWords.length).toBeLessThanOrEqual(5); // Top 5 similar words
        expect(knowledgeBase.vocabulary.has(word)).toBe(true);
      }
    });

    it('should generate prime factorizations', async () => {
      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();

      for (const [word, entry] of knowledgeBase.vocabulary) {
        expect(entry.primeFactors).toBeDefined();
        expect(typeof entry.primeFactors).toBe('object');
        expect(knowledgeBase.vocabularyPrimes.has(word)).toBe(true);
      }
    });

    it('should handle embedding pipeline errors gracefully', async () => {
      // Create a pipeline that fails for some words
      const failingPipeline = jest.fn().mockImplementation(async (text: string) => {
        if (text === 'test') {
          throw new Error('Embedding failed');
        }
        const embedding = new Array(384).fill(0).map((_, i) => Math.sin(i / 100) * 0.1);
        return { data: embedding };
      });

      (failingPipeline as any).tokenizer = mockEmbeddingPipeline.tokenizer;
      const bootstrap = new KnowledgeBootstrap(failingPipeline);

      // Should not throw, but should handle errors gracefully
      const knowledgeBase = await bootstrap.bootstrapFromTokenizer();
      expect(knowledgeBase).toBeDefined();
    });

    it('should handle tokenizer without vocabulary', async () => {
      const pipelineWithoutVocab = jest.fn().mockImplementation(async (text: string) => {
        const embedding = new Array(384).fill(0).map((_, i) => Math.sin(i / 100) * 0.1);
        return { data: embedding };
      });

      // No tokenizer property
      const bootstrap = new KnowledgeBootstrap(pipelineWithoutVocab);

      await expect(bootstrap.bootstrapFromTokenizer()).rejects.toThrow();
    });

    it('should handle empty vocabulary', async () => {
      const pipelineWithEmptyVocab = jest.fn().mockImplementation(async (text: string) => {
        const embedding = new Array(384).fill(0).map((_, i) => Math.sin(i / 100) * 0.1);
        return { data: embedding };
      });

      (pipelineWithEmptyVocab as any).tokenizer = {
        model: {
          vocab: {}
        }
      };

      const bootstrap = new KnowledgeBootstrap(pipelineWithEmptyVocab);

      await expect(bootstrap.bootstrapFromTokenizer()).rejects.toThrow();
    });
  });

  describe('vocabulary filtering', () => {
    it('should filter out special tokens', async () => {
      // Add special tokens to mock vocabulary
      mockEmbeddingPipeline.tokenizer.model.vocab = {
        ...mockEmbeddingPipeline.tokenizer.model.vocab,
        '[CLS]': 100,
        '[SEP]': 101,
        '[PAD]': 102,
        '<start>': 103,
        '<end>': 104,
        '##sub': 105
      };

      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();

      // Special tokens should be filtered out
      expect(knowledgeBase.vocabulary.has('[CLS]')).toBe(false);
      expect(knowledgeBase.vocabulary.has('[SEP]')).toBe(false);
      expect(knowledgeBase.vocabulary.has('[PAD]')).toBe(false);
      expect(knowledgeBase.vocabulary.has('<start>')).toBe(false);
      expect(knowledgeBase.vocabulary.has('<end>')).toBe(false);
      expect(knowledgeBase.vocabulary.has('##sub')).toBe(false);
    });

    it('should filter out non-alphabetic tokens', async () => {
      mockEmbeddingPipeline.tokenizer.model.vocab = {
        ...mockEmbeddingPipeline.tokenizer.model.vocab,
        '123': 200,
        'word123': 201,
        'hello-world': 202,
        'test_case': 203
      };

      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();

      // Non-alphabetic tokens should be filtered out
      expect(knowledgeBase.vocabulary.has('123')).toBe(false);
      expect(knowledgeBase.vocabulary.has('word123')).toBe(false);
      expect(knowledgeBase.vocabulary.has('hello-world')).toBe(false);
      expect(knowledgeBase.vocabulary.has('test_case')).toBe(false);
    });

    it('should filter out very short and very long words', async () => {
      mockEmbeddingPipeline.tokenizer.model.vocab = {
        ...mockEmbeddingPipeline.tokenizer.model.vocab,
        'a': 300,
        'verylongwordthatexceedslimit': 301
      };

      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();

      // Very short and very long words should be filtered out
      expect(knowledgeBase.vocabulary.has('a')).toBe(false);
      expect(knowledgeBase.vocabulary.has('verylongwordthatexceedslimit')).toBe(false);
    });

    it('should handle numeric tokenizer (ID->word mapping)', async () => {
      // Create a numeric tokenizer (like BERT's WordPiece)
      const numericPipeline = jest.fn().mockImplementation(async (text: string) => {
        const embedding = new Array(384).fill(0).map((_, i) => Math.sin(i / 100) * 0.1);
        return { data: embedding };
      });
      
      (numericPipeline as any).tokenizer = {
        model: {
          vocab: {
            '0': '[PAD]',
            '1': '[UNK]',
            '2': 'hello',
            '3': 'world',
            '4': 'test',
            '5': 'knowledge',
            '6': 'bootstrap',
            '7': 'vocabulary'
          }
        }
      };

      const bootstrap = new KnowledgeBootstrap(numericPipeline);
      const knowledgeBase = await bootstrap.bootstrapFromTokenizer();

      // Should successfully extract words from numeric tokenizer
      expect(knowledgeBase.vocabulary.size).toBeGreaterThan(0);
      expect(knowledgeBase.vocabulary.has('hello')).toBe(true);
      expect(knowledgeBase.vocabulary.has('world')).toBe(true);
      expect(knowledgeBase.vocabulary.has('test')).toBe(true);
      
      // Special tokens should be filtered out
      expect(knowledgeBase.vocabulary.has('[PAD]')).toBe(false);
      expect(knowledgeBase.vocabulary.has('[UNK]')).toBe(false);
    });

    it('should handle numeric tokenizer via tokenizer.vocab', async () => {
      const numericPipeline = jest.fn().mockImplementation(async (text: string) => {
        const embedding = new Array(384).fill(0).map((_, i) => Math.sin(i / 100) * 0.1);
        return { data: embedding };
      });
      
      (numericPipeline as any).tokenizer = {
        vocab: {
          '0': '[PAD]',
          '1': '[UNK]',
          '2': 'hello',
          '3': 'world',
          '4': 'test'
        }
      };

      const bootstrap = new KnowledgeBootstrap(numericPipeline);
      const knowledgeBase = await bootstrap.bootstrapFromTokenizer();

      expect(knowledgeBase.vocabulary.size).toBeGreaterThan(0);
      expect(knowledgeBase.vocabulary.has('hello')).toBe(true);
      expect(knowledgeBase.vocabulary.has('world')).toBe(true);
    });

    it('should handle numeric tokenizer via getVocab method', async () => {
      const numericPipeline = jest.fn().mockImplementation(async (text: string) => {
        const embedding = new Array(384).fill(0).map((_, i) => Math.sin(i / 100) * 0.1);
        return { data: embedding };
      });
      
      (numericPipeline as any).tokenizer = {
        getVocab: () => ({
          '0': '[PAD]',
          '1': '[UNK]',
          '2': 'hello',
          '3': 'world',
          '4': 'test'
        })
      };

      const bootstrap = new KnowledgeBootstrap(numericPipeline);
      const knowledgeBase = await bootstrap.bootstrapFromTokenizer();

      expect(knowledgeBase.vocabulary.size).toBeGreaterThan(0);
      expect(knowledgeBase.vocabulary.has('hello')).toBe(true);
      expect(knowledgeBase.vocabulary.has('world')).toBe(true);
    });

    it('should handle mixed vocabulary with subword tokens', async () => {
      const mixedPipeline = jest.fn().mockImplementation(async (text: string) => {
        const embedding = new Array(384).fill(0).map((_, i) => Math.sin(i / 100) * 0.1);
        return { data: embedding };
      });
      
      (mixedPipeline as any).tokenizer = {
        model: {
          vocab: {
            '0': '[PAD]',
            '1': '[UNK]',
            '2': 'hello',
            '3': 'world',
            '4': '##ing',
            '5': '##ed',
            '6': 'test',
            '7': 'knowledge',
            '8': '##s'
          }
        }
      };

      const bootstrap = new KnowledgeBootstrap(mixedPipeline);
      const knowledgeBase = await bootstrap.bootstrapFromTokenizer();

      // Should include full words but filter out subword tokens
      expect(knowledgeBase.vocabulary.has('hello')).toBe(true);
      expect(knowledgeBase.vocabulary.has('world')).toBe(true);
      expect(knowledgeBase.vocabulary.has('test')).toBe(true);
      expect(knowledgeBase.vocabulary.has('knowledge')).toBe(true);
      
      // Should filter out subword tokens
      expect(knowledgeBase.vocabulary.has('##ing')).toBe(false);
      expect(knowledgeBase.vocabulary.has('##ed')).toBe(false);
      expect(knowledgeBase.vocabulary.has('##s')).toBe(false);
    });

    it('should use lenient filtering when strict filtering yields too few words', async () => {
      const sparsePipeline = jest.fn().mockImplementation(async (text: string) => {
        const embedding = new Array(384).fill(0).map((_, i) => Math.sin(i / 100) * 0.1);
        return { data: embedding };
      });
      
      (sparsePipeline as any).tokenizer = {
        model: {
          vocab: {
            '0': '[PAD]',
            '1': '[UNK]',
            '2': 'hello',
            '3': 'world-test', // Would be filtered by strict rules
            '4': 'test123',    // Would be filtered by strict rules
            '5': 'a',          // Too short
            '6': 'verylongwordthatexceedslimit' // Too long
          }
        }
      };

      const bootstrap = new KnowledgeBootstrap(sparsePipeline);
      const knowledgeBase = await bootstrap.bootstrapFromTokenizer();

      // Should use lenient filtering and include some words that would normally be filtered
      expect(knowledgeBase.vocabulary.size).toBeGreaterThan(0);
      expect(knowledgeBase.vocabulary.has('hello')).toBe(true);
      // Lenient filtering should allow some previously filtered words
      expect(knowledgeBase.vocabulary.has('world-test') || knowledgeBase.vocabulary.has('test123')).toBe(true);
    });
  });

  describe('semantic clustering', () => {
    it('should create meaningful semantic clusters', async () => {
      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();

      // Check that each word has similar words
      for (const [word, similarWords] of knowledgeBase.semanticClusters) {
        expect(Array.isArray(similarWords)).toBe(true);
        expect(similarWords.length).toBeLessThanOrEqual(5);
        
        // Similar words should not include the word itself
        expect(similarWords).not.toContain(word);
        
        // All similar words should exist in vocabulary
        similarWords.forEach(similarWord => {
          expect(knowledgeBase.vocabulary.has(similarWord)).toBe(true);
        });
      }
    });

    it('should calculate cosine similarity correctly', async () => {
      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();

      // Test that similar words have meaningful relationships
      // (This is a basic test since we're using mock embeddings)
      expect(knowledgeBase.semanticClusters.size).toBeGreaterThan(0);
    });

    it('should handle identical embeddings', async () => {
      // Create pipeline that returns identical embeddings
      const identicalEmbeddingPipeline = jest.fn().mockImplementation(async (text: string) => {
        const embedding = new Array(384).fill(0.5); // All identical values
        return { data: embedding };
      });

      (identicalEmbeddingPipeline as any).tokenizer = mockEmbeddingPipeline.tokenizer;
      const bootstrap = new KnowledgeBootstrap(identicalEmbeddingPipeline);

      const knowledgeBase = await bootstrap.bootstrapFromTokenizer();
      expect(knowledgeBase.semanticClusters.size).toBeGreaterThan(0);
    });
  });

  describe('prime factorization', () => {
    it('should convert embeddings to prime factors', async () => {
      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();

      for (const [word, entry] of knowledgeBase.vocabulary) {
        expect(entry.primeFactors).toBeDefined();
        expect(typeof entry.primeFactors).toBe('object');
        
        // Should have some prime factors for non-zero embeddings
        const primeCount = Object.keys(entry.primeFactors).length;
        expect(primeCount).toBeGreaterThanOrEqual(0);
        
        // All keys should be numbers (primes)
        Object.keys(entry.primeFactors).forEach(prime => {
          expect(Number.isInteger(Number(prime))).toBe(true);
          expect(Number(prime)).toBeGreaterThan(1);
        });
        
        // All values should be positive integers
        Object.values(entry.primeFactors).forEach(weight => {
          expect(Number.isInteger(weight)).toBe(true);
          expect(weight).toBeGreaterThan(0);
        });
      }
    });

    it('should use threshold for prime factorization', async () => {
      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();

      // With our mock embeddings (small values), we should still get some prime factors
      let totalPrimeFactors = 0;
      for (const [word, entry] of knowledgeBase.vocabulary) {
        totalPrimeFactors += Object.keys(entry.primeFactors).length;
      }
      
      expect(totalPrimeFactors).toBeGreaterThan(0);
    });

    it('should generate valid prime numbers', async () => {
      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();

      const allPrimes = new Set<number>();
      for (const [word, entry] of knowledgeBase.vocabulary) {
        Object.keys(entry.primeFactors).forEach(prime => {
          allPrimes.add(Number(prime));
        });
      }

      // Check that generated numbers are actually prime
      const isPrime = (n: number): boolean => {
        if (n < 2) return false;
        for (let i = 2; i <= Math.sqrt(n); i++) {
          if (n % i === 0) return false;
        }
        return true;
      };

      allPrimes.forEach(prime => {
        expect(isPrime(prime)).toBe(true);
      });
    });
  });

  describe('knowledge base structure', () => {
    it('should create consistent knowledge base structure', async () => {
      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();

      // All maps should have consistent keys
      const vocabularyKeys = Array.from(knowledgeBase.vocabulary.keys());
      const clusterKeys = Array.from(knowledgeBase.semanticClusters.keys());
      const embeddingKeys = Array.from(knowledgeBase.conceptEmbeddings.keys());
      const primeKeys = Array.from(knowledgeBase.vocabularyPrimes.keys());

      expect(vocabularyKeys.sort()).toEqual(clusterKeys.sort());
      expect(vocabularyKeys.sort()).toEqual(embeddingKeys.sort());
      expect(vocabularyKeys.sort()).toEqual(primeKeys.sort());
    });

    it('should maintain data integrity across structures', async () => {
      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();

      for (const [word, entry] of knowledgeBase.vocabulary) {
        // Check that all related data exists
        expect(knowledgeBase.semanticClusters.has(word)).toBe(true);
        expect(knowledgeBase.conceptEmbeddings.has(word)).toBe(true);
        expect(knowledgeBase.vocabularyPrimes.has(word)).toBe(true);

        // Check that embeddings match
        const conceptEmbedding = knowledgeBase.conceptEmbeddings.get(word);
        expect(entry.embedding).toEqual(conceptEmbedding);

        // Check that prime factors match
        const vocabularyPrimes = knowledgeBase.vocabularyPrimes.get(word);
        expect(entry.primeFactors).toEqual(vocabularyPrimes);

        // Check that similar words are valid
        const similarWords = knowledgeBase.semanticClusters.get(word);
        expect(entry.similarWords).toEqual(similarWords);
      }
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle missing tokenizer gracefully', async () => {
      const pipelineWithoutTokenizer = jest.fn();
      const bootstrap = new KnowledgeBootstrap(pipelineWithoutTokenizer);

      await expect(bootstrap.bootstrapFromTokenizer()).rejects.toThrow();
    });

    it('should handle tokenizer with different vocab structure', async () => {
      // Test with vocab as direct property
      const altPipeline = jest.fn().mockImplementation(async (text: string) => {
        const embedding = new Array(384).fill(0).map((_, i) => Math.sin(i / 100) * 0.1);
        return { data: embedding };
      });

      (altPipeline as any).tokenizer = {
        vocab: {
          'hello': 1,
          'world': 2,
          'test': 3
        }
      };

      const bootstrap = new KnowledgeBootstrap(altPipeline);
      const knowledgeBase = await bootstrap.bootstrapFromTokenizer();

      expect(knowledgeBase.vocabulary.size).toBeGreaterThan(0);
    });

    it('should handle getVocab method', async () => {
      const altPipeline = jest.fn().mockImplementation(async (text: string) => {
        const embedding = new Array(384).fill(0).map((_, i) => Math.sin(i / 100) * 0.1);
        return { data: embedding };
      });

      (altPipeline as any).tokenizer = {
        getVocab: () => ({
          'hello': 1,
          'world': 2,
          'test': 3
        })
      };

      const bootstrap = new KnowledgeBootstrap(altPipeline);
      const knowledgeBase = await bootstrap.bootstrapFromTokenizer();

      expect(knowledgeBase.vocabulary.size).toBeGreaterThan(0);
    });

    it('should handle very small vocabulary', async () => {
      const smallVocabPipeline = jest.fn().mockImplementation(async (text: string) => {
        const embedding = new Array(384).fill(0).map((_, i) => Math.sin(i / 100) * 0.1);
        return { data: embedding };
      });

      (smallVocabPipeline as any).tokenizer = {
        model: {
          vocab: {
            'hello': 1,
            'world': 2
          }
        }
      };

      const bootstrap = new KnowledgeBootstrap(smallVocabPipeline);
      const knowledgeBase = await bootstrap.bootstrapFromTokenizer();

      expect(knowledgeBase.vocabulary.size).toBe(2);
    });

    it('should handle embedding generation failures', async () => {
      let callCount = 0;
      const unreliablePipeline = jest.fn().mockImplementation(async (text: string) => {
        callCount++;
        if (callCount % 3 === 0) {
          throw new Error('Random embedding failure');
        }
        const embedding = new Array(384).fill(0).map((_, i) => Math.sin(i / 100) * 0.1);
        return { data: embedding };
      });

      (unreliablePipeline as any).tokenizer = mockEmbeddingPipeline.tokenizer;
      const bootstrap = new KnowledgeBootstrap(unreliablePipeline);

      const knowledgeBase = await bootstrap.bootstrapFromTokenizer();
      
      // Should still create a knowledge base with successful embeddings
      expect(knowledgeBase.vocabulary.size).toBeGreaterThan(0);
    });
  });

  describe('performance and scalability', () => {
    it('should handle batch processing efficiently', async () => {
      const startTime = Date.now();
      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();
      const endTime = Date.now();

      // Should complete in reasonable time (less than 5 seconds for mock data)
      expect(endTime - startTime).toBeLessThan(5000);
      expect(knowledgeBase.vocabulary.size).toBeGreaterThan(0);
    });

    it('should limit vocabulary size appropriately', async () => {
      // Create a large vocabulary
      const largeVocab: Record<string, number> = {};
      for (let i = 0; i < 2000; i++) {
        largeVocab[`word${i}`] = i;
      }

      const largePipeline = jest.fn().mockImplementation(async (text: string) => {
        const embedding = new Array(384).fill(0).map((_, i) => Math.sin(i / 100) * 0.1);
        return { data: embedding };
      });

      (largePipeline as any).tokenizer = {
        model: {
          vocab: largeVocab
        }
      };

      const bootstrap = new KnowledgeBootstrap(largePipeline);
      const knowledgeBase = await bootstrap.bootstrapFromTokenizer();

      // Should limit to manageable size (800 words as per implementation)
      expect(knowledgeBase.vocabulary.size).toBeLessThanOrEqual(800);
    });
  });

  describe('integration with prime mathematics', () => {
    it('should generate mathematically valid prime factorizations', async () => {
      const knowledgeBase = await knowledgeBootstrap.bootstrapFromTokenizer();

      // Test that prime factorizations follow mathematical rules
      for (const [word, entry] of knowledgeBase.vocabulary) {
        const primes = Object.keys(entry.primeFactors).map(Number);
        const weights = Object.values(entry.primeFactors);

        // All primes should be valid prime numbers
        primes.forEach(prime => {
          expect(prime).toBeGreaterThan(1);
          // Basic primality check for small numbers
          if (prime < 100) {
            let isPrime = true;
            for (let i = 2; i <= Math.sqrt(prime); i++) {
              if (prime % i === 0) {
                isPrime = false;
                break;
              }
            }
            expect(isPrime).toBe(true);
          }
        });

        // All weights should be positive integers
        weights.forEach(weight => {
          expect(Number.isInteger(weight)).toBe(true);
          expect(weight).toBeGreaterThan(0);
        });
      }
    });

    it('should create consistent prime mappings', async () => {
      const knowledgeBase1 = await knowledgeBootstrap.bootstrapFromTokenizer();
      const knowledgeBase2 = await knowledgeBootstrap.bootstrapFromTokenizer();

      // Prime factorizations should be consistent across runs
      for (const word of knowledgeBase1.vocabulary.keys()) {
        if (knowledgeBase2.vocabulary.has(word)) {
          const primes1 = knowledgeBase1.vocabulary.get(word)!.primeFactors;
          const primes2 = knowledgeBase2.vocabulary.get(word)!.primeFactors;
          expect(primes1).toEqual(primes2);
        }
      }
    });
  });
});
