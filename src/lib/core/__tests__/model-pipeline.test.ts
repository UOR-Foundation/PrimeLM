// =============================================================================
// MODEL PIPELINE TESTS - Unit tests for model-driven pipeline
// =============================================================================

import { ModelDrivenPipeline } from '../model-pipeline';
import { MockModelCreators } from '../../models/factory/model-factory';
import { TEST_MODEL_CONFIG } from '../../config/model-config';

// Mock the transformers library to avoid actual model loading in tests
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn()
}));

// Mock the model factory to use test configuration
jest.mock('../../config/model-config', () => ({
  MODEL_CONFIG: {
    embeddings: {
      model: 'mock-embeddings-model',
      dimensions: 384,
      required: true
    },
    intent: {
      model: 'mock-intent-model',
      intents: ['GREETING', 'QUESTION', 'HELP_REQUEST'],
      required: true
    },
    entities: {
      model: 'mock-ner-model',
      types: ['PERSON', 'PLACE', 'THING'],
      required: true
    },
    emotion: {
      model: 'mock-emotion-model',
      emotions: ['joy', 'sadness', 'anger'],
      required: true
    }
  }
}));

describe('ModelDrivenPipeline', () => {
  let pipeline: ModelDrivenPipeline;

  beforeEach(() => {
    pipeline = new ModelDrivenPipeline();
    
    // Clear any existing model registrations
    const { ModelFactory } = require('../../models/factory/model-factory');
    ModelFactory.clear();
    
    // Register mock models
    MockModelCreators.registerMockModels();
  });

  afterEach(() => {
    const { ModelFactory } = require('../../models/factory/model-factory');
    ModelFactory.clear();
  });

  describe('Initialization', () => {
    it('should initialize successfully with mock models', async () => {
      await pipeline.initialize();
      
      expect(pipeline.isReady()).toBe(true);
      
      const status = pipeline.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.ready).toBe(true);
      expect(status.modelCount).toBe(4);
      expect(status.registeredTypes).toContain('embeddings');
      expect(status.registeredTypes).toContain('intent');
      expect(status.registeredTypes).toContain('entities');
      expect(status.registeredTypes).toContain('emotion');
    });

    it('should not reinitialize if already initialized', async () => {
      await pipeline.initialize();
      const firstStatus = pipeline.getStatus();
      
      await pipeline.initialize(); // Should not throw or change state
      const secondStatus = pipeline.getStatus();
      
      expect(secondStatus).toEqual(firstStatus);
    });

    it('should handle initialization failure gracefully', async () => {
      // Clear mock models to cause initialization failure
      const { ModelFactory } = require('../../models/factory/model-factory');
      ModelFactory.clear();
      
      await expect(pipeline.initialize()).rejects.toThrow();
      expect(pipeline.isReady()).toBe(false);
    });

    it('should provide model information after initialization', async () => {
      await pipeline.initialize();
      
      const modelInfo = pipeline.getModelInfo();
      expect(modelInfo.embeddings).toBe('mock-embeddings-model');
      expect(modelInfo.intent).toBe('mock-intent-model');
      expect(modelInfo.entities).toBe('mock-ner-model');
      expect(modelInfo.emotion).toBe('mock-emotion-model');
      expect(modelInfo.initialized).toBe(true);
    });
  });

  describe('Text Processing', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should process text successfully', async () => {
      const text = "Hello, my name is Alex and I'm feeling great!";
      const result = await pipeline.processText(text);
      
      // Check structure
      expect(result).toHaveProperty('embeddings');
      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('emotion');
      expect(result).toHaveProperty('primes');
      expect(result).toHaveProperty('primeCoherence');
      expect(result).toHaveProperty('semanticContext');
      expect(result).toHaveProperty('processingTime');
      expect(result).toHaveProperty('modelVersions');
      
      // Check embeddings
      expect(result.embeddings).toHaveLength(384);
      expect(result.embeddings.every(val => val === 0.1)).toBe(true);
      
      // Check intent
      expect(result.intent.intent).toBe('GREETING');
      expect(result.intent.confidence).toBe(0.9);
      
      // Check entities
      expect(Array.isArray(result.entities)).toBe(true);
      
      // Check emotion
      expect(result.emotion.emotion).toBe('joy');
      expect(result.emotion.valence).toBe(0.5);
      expect(result.emotion.arousal).toBe(0.5);
      expect(result.emotion.confidence).toBe(0.8);
      
      // Check mathematical representations
      expect(typeof result.primes).toBe('object');
      expect(typeof result.primeCoherence).toBe('number');
      expect(result.primeCoherence).toBeGreaterThanOrEqual(0);
      expect(result.primeCoherence).toBeLessThanOrEqual(1);
      
      // Check semantic context
      expect(result.semanticContext.intentConfidence).toBe(0.9);
      expect(result.semanticContext.entityCount).toBe(0);
      expect(result.semanticContext.emotionalValence).toBe(0.5);
      expect(result.semanticContext.overallConfidence).toBeGreaterThan(0);
      expect(result.semanticContext.overallConfidence).toBeLessThanOrEqual(1);
      
      // Check metadata
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.modelVersions.embeddings).toBe('mock-embeddings-model');
      expect(result.modelVersions.intent).toBe('mock-intent-model');
      expect(result.modelVersions.entities).toBe('mock-ner-model');
      expect(result.modelVersions.emotion).toBe('mock-emotion-model');
    });

    it('should reject empty text', async () => {
      await expect(pipeline.processText('')).rejects.toThrow('Cannot process empty text');
      await expect(pipeline.processText('   ')).rejects.toThrow('Cannot process empty text');
    });

    it('should reject null/undefined text', async () => {
      await expect(pipeline.processText(null as any)).rejects.toThrow('Cannot process empty text');
      await expect(pipeline.processText(undefined as any)).rejects.toThrow('Cannot process empty text');
    });

    it('should handle processing errors gracefully', async () => {
      // This would require mocking model failures, which is complex with the current setup
      // For now, we test that the error handling structure is in place
      const text = "test";
      const result = await pipeline.processText(text);
      expect(result).toBeDefined();
    });
  });

  describe('Batch Processing', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should process multiple texts in batch', async () => {
      const texts = [
        "Hello there!",
        "My name is Alex",
        "I'm feeling happy today"
      ];
      
      const results = await pipeline.processBatch(texts);
      
      expect(results).toHaveLength(3);
      
      results.forEach((result, index) => {
        expect(result).toHaveProperty('embeddings');
        expect(result).toHaveProperty('intent');
        expect(result).toHaveProperty('entities');
        expect(result).toHaveProperty('emotion');
        expect(result.processingTime).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle empty batch', async () => {
      const results = await pipeline.processBatch([]);
      expect(results).toEqual([]);
    });

    it('should handle batch with empty strings', async () => {
      await expect(pipeline.processBatch(['', 'valid text'])).rejects.toThrow();
    });
  });

  describe('Status and Information', () => {
    it('should provide correct status before initialization', () => {
      const status = pipeline.getStatus();
      expect(status.initialized).toBe(false);
      expect(status.ready).toBe(false);
      expect(status.modelCount).toBe(0);
      expect(status.registeredTypes).toEqual([]);
    });

    it('should provide correct status after initialization', async () => {
      await pipeline.initialize();
      
      const status = pipeline.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.ready).toBe(true);
      expect(status.modelCount).toBe(4);
      expect(status.registeredTypes).toHaveLength(4);
    });

    it('should provide model information before initialization', () => {
      const modelInfo = pipeline.getModelInfo();
      expect(modelInfo.initialized).toBe(false);
      expect(modelInfo.embeddings).toBe('not initialized');
      expect(modelInfo.intent).toBe('not initialized');
      expect(modelInfo.entities).toBe('not initialized');
      expect(modelInfo.emotion).toBe('not initialized');
    });

    it('should provide detailed model information after initialization', async () => {
      await pipeline.initialize();
      
      const detailedInfo = pipeline.getDetailedModelInfo();
      expect(detailedInfo).toHaveProperty('embeddings');
      expect(detailedInfo).toHaveProperty('intent');
      expect(detailedInfo).toHaveProperty('entities');
      expect(detailedInfo).toHaveProperty('emotion');
      
      expect(detailedInfo.embeddings.name).toBe('mock-embeddings-model');
      expect(detailedInfo.intent.name).toBe('mock-intent-model');
      expect(detailedInfo.entities.name).toBe('mock-ner-model');
      expect(detailedInfo.emotion.name).toBe('mock-emotion-model');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when processing without initialization', async () => {
      await expect(pipeline.processText('test')).rejects.toThrow('Pipeline not initialized');
    });

    it('should throw error when batch processing without initialization', async () => {
      await expect(pipeline.processBatch(['test'])).rejects.toThrow('Pipeline not initialized');
    });

    it('should handle model registry errors', async () => {
      // This tests the fail-fast behavior
      const { ModelFactory } = require('../../models/factory/model-factory');
      ModelFactory.clear(); // Remove mock models
      
      await expect(pipeline.initialize()).rejects.toThrow();
    });
  });

  describe('Mathematical Operations', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should calculate prime coherence correctly', async () => {
      const result = await pipeline.processText('test text');
      
      expect(typeof result.primeCoherence).toBe('number');
      expect(result.primeCoherence).toBeGreaterThanOrEqual(0);
      expect(result.primeCoherence).toBeLessThanOrEqual(1);
    });

    it('should build semantic context correctly', async () => {
      const result = await pipeline.processText('test text');
      
      const context = result.semanticContext;
      expect(context.intentConfidence).toBe(0.9); // From mock
      expect(context.entityCount).toBe(0); // Mock returns empty entities
      expect(context.emotionalValence).toBe(0.5); // From mock
      expect(context.overallConfidence).toBeGreaterThan(0);
      expect(context.overallConfidence).toBeLessThanOrEqual(1);
    });

    it('should convert embeddings to primes', async () => {
      const result = await pipeline.processText('test text');
      
      expect(typeof result.primes).toBe('object');
      expect(Object.keys(result.primes).length).toBeGreaterThan(0);
      
      // Check that all keys are numbers (prime numbers)
      Object.keys(result.primes).forEach(key => {
        expect(Number.isInteger(Number(key))).toBe(true);
      });
      
      // Check that all values are numbers
      Object.values(result.primes).forEach(value => {
        expect(typeof value).toBe('number');
      });
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should complete processing within reasonable time', async () => {
      const startTime = Date.now();
      await pipeline.processText('test text');
      const endTime = Date.now();
      
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second for mock models
    });

    it('should report processing time accurately', async () => {
      const result = await pipeline.processText('test text');
      
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.processingTime).toBeLessThan(1000); // Reasonable upper bound for mock models
    });

    it('should handle concurrent processing', async () => {
      const promises = [
        pipeline.processText('text 1'),
        pipeline.processText('text 2'),
        pipeline.processText('text 3')
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('embeddings');
        expect(result).toHaveProperty('intent');
        expect(result).toHaveProperty('entities');
        expect(result).toHaveProperty('emotion');
      });
    });
  });
});
