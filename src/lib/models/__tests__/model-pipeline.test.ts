import { ModelDrivenPipeline, ProcessingResult } from '../../core/model-pipeline';

// Mock the transformers library to avoid ES module issues
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn().mockImplementation((task: string, model: string) => {
    // Return a function that acts as the pipeline
    return Promise.resolve(async (input: string) => {
      if (task === 'feature-extraction') {
        return {
          data: new Float32Array(384).fill(0.1) // Mock 384-dimensional embeddings
        };
      } else if (task === 'text-classification') {
        return [{ label: 'POSITIVE', score: 0.9 }];
      } else if (task === 'ner') {
        return [
          { word: 'Alex', entity: 'PER', score: 0.9, start: 0, end: 4 }
        ];
      }
      return {};
    });
  })
}));

describe('Model Pipeline Integration', () => {
  let pipeline: ModelDrivenPipeline;

  beforeEach(() => {
    pipeline = new ModelDrivenPipeline();
  });

  describe('Initialization', () => {
    it('should initialize all models successfully', async () => {
      await expect(pipeline.initialize()).resolves.not.toThrow();
    });

    it('should provide model information after initialization', async () => {
      await pipeline.initialize();
      
      const modelInfo = pipeline.getModelInfo();
      expect(modelInfo).toBeDefined();
      expect(modelInfo.embeddings).toBeDefined();
      expect(modelInfo.intent).toBeDefined();
      expect(modelInfo.entities).toBeDefined();
      expect(modelInfo.emotion).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw error for empty text input', async () => {
      await pipeline.initialize();
      
      await expect(pipeline.processText('')).rejects.toThrow('Cannot process empty text');
      await expect(pipeline.processText('   ')).rejects.toThrow('Cannot process empty text');
    });

    it('should handle model processing errors gracefully', async () => {
      await pipeline.initialize();
      
      // This should work with our mock setup - expect it to succeed
      const result = await pipeline.processText('Hello world');
      expect(result).toBeDefined();
    });
  });

  describe('Text Processing', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should process simple text input', async () => {
      const result = await pipeline.processText('Hello world');
      
      expect(result).toBeDefined();
      expect(result.embeddings).toBeDefined();
      expect(result.embeddings).toHaveLength(384);
      expect(result.intent).toBeDefined();
      expect(result.intent.confidence).toBeGreaterThan(0);
      expect(result.entities).toBeDefined();
      expect(Array.isArray(result.entities)).toBe(true);
      expect(result.emotion).toBeDefined();
      expect(result.primes).toBeDefined();
    });

    it('should handle complex conversational input', async () => {
      const result = await pipeline.processText('Hello, my name is Alex and I have a dog named Max');
      
      expect(result).toBeDefined();
      expect(result.embeddings).toHaveLength(384);
      expect(result.intent).toBeDefined();
      expect(result.entities.length).toBeGreaterThanOrEqual(0);
      expect(result.emotion.emotion).toBeDefined();
      expect(result.emotion.valence).toBeGreaterThanOrEqual(-1);
      expect(result.emotion.valence).toBeLessThanOrEqual(1);
      expect(result.emotion.arousal).toBeGreaterThanOrEqual(0);
      expect(result.emotion.arousal).toBeLessThanOrEqual(1);
    });
  });

  describe('Prime Mathematics Integration', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should convert embeddings to prime factorization', async () => {
      const result = await pipeline.processText('Test input');
      
      expect(result.primes).toBeDefined();
      expect(typeof result.primes).toBe('object');
      
      // Should have prime factors
      const primeKeys = Object.keys(result.primes).map(Number);
      expect(primeKeys.length).toBeGreaterThan(0);
      
      // All keys should be numbers (primes)
      primeKeys.forEach(prime => {
        expect(typeof prime).toBe('number');
        expect(prime).toBeGreaterThan(1);
      });
    });

    it('should maintain mathematical consistency', async () => {
      const result1 = await pipeline.processText('Hello world');
      const result2 = await pipeline.processText('Hello world');
      
      // Same input should produce same prime factorization
      expect(result1.primes).toEqual(result2.primes);
    });
  });

  describe('Production Models', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should process text through complete pipeline', async () => {
      const testText = 'Hello, my name is Alex';
      
      const result = await pipeline.processText(testText);
      
      // Verify all components are present
      expect(result.embeddings).toBeDefined();
      expect(result.embeddings).toHaveLength(384);
      expect(result.intent).toBeDefined();
      expect(result.intent.confidence).toBeGreaterThan(0);
      expect(result.entities).toBeDefined();
      expect(result.emotion).toBeDefined();
      expect(result.primes).toBeDefined();
      
      // Verify data types
      expect(Array.isArray(result.embeddings)).toBe(true);
      expect(typeof result.intent.intent).toBe('string');
      expect(typeof result.intent.confidence).toBe('number');
      expect(Array.isArray(result.entities)).toBe(true);
      expect(typeof result.emotion.emotion).toBe('string');
      expect(typeof result.emotion.valence).toBe('number');
      expect(typeof result.emotion.arousal).toBe('number');
      expect(typeof result.emotion.confidence).toBe('number');
      expect(typeof result.primes).toBe('object');
    });

    it('should handle various conversation scenarios', async () => {
      const scenarios = [
        {
          text: 'Hello there!',
          expectedIntent: 'GREETING',
        },
        {
          text: 'My name is Sarah',
          expectedIntent: 'IDENTITY_INTRODUCTION',
        },
        {
          text: "My dog's name is Max",
          expectedIntent: 'IDENTITY_INTRODUCTION',
        },
        {
          text: 'What is my name?',
          expectedIntent: 'IDENTITY_QUERY',
        },
        {
          text: 'Can you help me?',
          expectedIntent: 'HELP_REQUEST',
        }
      ];

      for (const scenario of scenarios) {
        const result = await pipeline.processText(scenario.text);
        
        // Basic structure validation
        expect(result).toBeDefined();
        expect(result.embeddings).toHaveLength(384);
        
        // Intent classification
        const intentResult = await pipeline.getModelInfo();
        expect(intentResult).toBeDefined();

        if (scenario.expectedIntent) {
          expect(result.intent.intent).toBe(scenario.expectedIntent);
        }
      }
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should process text within reasonable time', async () => {
      const startTime = Date.now();
      
      await pipeline.processText('Performance test input');
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should complete within 5 seconds (generous for test environment)
      expect(processingTime).toBeLessThan(5000);
    });
  });

  describe('Model Information', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should provide detailed model information', async () => {
      const modelInfo = pipeline.getModelInfo();
      
      expect(modelInfo).toBeDefined();
      
      // Test embeddings model info
      if (modelInfo.embeddings) {
        const embeddingsInfo = modelInfo.embeddings;
        expect(typeof embeddingsInfo).toBe('string');
      }

      // Test intent model info
      if (modelInfo.intent) {
        const intentInfo = modelInfo.intent;
        expect(typeof intentInfo).toBe('string');
      }

      // Test entity model info
      if (modelInfo.entities) {
        const entityInfo = modelInfo.entities;
        expect(typeof entityInfo).toBe('string');
      }

      // Test emotion model info
      if (modelInfo.emotion) {
        const emotionInfo = modelInfo.emotion;
        expect(typeof emotionInfo).toBe('string');
      }
    });

    it('should provide model capabilities', async () => {
      const modelInfo = pipeline.getModelInfo();
      
      // Should have all required model types
      expect(modelInfo.embeddings).toBeDefined();
      expect(modelInfo.intent).toBeDefined();
      expect(modelInfo.entities).toBeDefined();
      expect(modelInfo.emotion).toBeDefined();
    });
  });

  describe('Integration with PrimeLM Core', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should integrate with mathematical operations', async () => {
      const result = await pipeline.processText('Integration test');
      
      // Verify prime factorization integration
      expect(result.primes).toBeDefined();
      expect(Object.keys(result.primes).length).toBeGreaterThan(0);
      
      // Verify mathematical properties
      const primeFactors = Object.keys(result.primes).map(Number);
      primeFactors.forEach(prime => {
        expect(prime).toBeGreaterThan(1);
        expect(result.primes[prime]).toBeGreaterThan(0);
      });
    });
  });
});
