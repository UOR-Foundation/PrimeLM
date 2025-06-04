// =============================================================================
// EMBEDDINGS MODEL TESTS - Unit tests for MPNet embeddings model
// =============================================================================

import { MPNetEmbeddingsModel } from '../embeddings/mpnet-model';

// Mock the transformers library to avoid actual model loading in tests
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn()
}));

describe('MPNetEmbeddingsModel', () => {
  let model: MPNetEmbeddingsModel;
  let mockPipeline: jest.Mock;

  beforeEach(() => {
    model = new MPNetEmbeddingsModel();
    mockPipeline = jest.fn();
    
    // Mock the pipeline function
    const { pipeline } = require('@xenova/transformers');
    pipeline.mockResolvedValue(mockPipeline);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Model Properties', () => {
    it('should have correct model properties', () => {
      expect(model.name).toBe('Xenova/all-MiniLM-L6-v2');
      expect(model.version).toBe('1.0.0');
      expect(model.dimensions).toBe(384);
    });

    it('should not be initialized initially', () => {
      expect(model.isInitialized()).toBe(false);
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await model.initialize();
      
      expect(model.isInitialized()).toBe(true);
    });

    it('should handle initialization failure', async () => {
      const { pipeline } = require('@xenova/transformers');
      pipeline.mockRejectedValue(new Error('Model loading failed'));
      
      await expect(model.initialize()).rejects.toThrow('Model loading failed');
      expect(model.isInitialized()).toBe(false);
    });

    it('should not reinitialize if already initialized', async () => {
      await model.initialize();
      const { pipeline } = require('@xenova/transformers');
      const callCount = pipeline.mock.calls.length;
      
      await model.initialize();
      
      expect(pipeline.mock.calls.length).toBe(callCount);
    });
  });

  describe('Text Encoding', () => {
    beforeEach(async () => {
      // Mock successful pipeline result
      mockPipeline.mockResolvedValue({
        data: new Array(384).fill(0).map((_, i) => i / 384)
      });
      
      await model.initialize();
    });

    it('should encode text successfully', async () => {
      const text = "Hello world";
      const result = await model.encode(text);
      
      expect(result).toHaveLength(384);
      expect(result.every(val => typeof val === 'number')).toBe(true);
      expect(mockPipeline).toHaveBeenCalledWith(text, {
        pooling: 'mean',
        normalize: true
      });
    });

    it('should reject empty text', async () => {
      await expect(model.encode('')).rejects.toThrow('Invalid input');
      await expect(model.encode('   ')).rejects.toThrow('Empty input');
    });

    it('should reject non-string input', async () => {
      await expect(model.encode(null as any)).rejects.toThrow('Invalid input for encoding');
      await expect(model.encode(undefined as any)).rejects.toThrow('Invalid input for encoding');
    });

    it('should handle encoding errors', async () => {
      mockPipeline.mockRejectedValue(new Error('Encoding failed'));
      
      await expect(model.encode('test')).rejects.toThrow('Encoding failed');
    });

    it('should validate output dimensions', async () => {
      mockPipeline.mockResolvedValue({
        data: new Array(512).fill(0.1) // Wrong dimensions
      });
      
      await expect(model.encode('test')).rejects.toThrow('Expected 384 dimensions, got 512');
    });
  });

  describe('Batch Encoding', () => {
    beforeEach(async () => {
      mockPipeline.mockImplementation(() => Promise.resolve({
        data: new Array(384).fill(0.1)
      }));
      
      await model.initialize();
    });

    it('should encode multiple texts', async () => {
      const texts = ['Hello', 'World', 'Test'];
      const results = await model.encodeBatch(texts);
      
      expect(results).toHaveLength(3);
      expect(results.every(result => result.length === 384)).toBe(true);
    });

    it('should handle empty batch', async () => {
      const results = await model.encodeBatch([]);
      expect(results).toEqual([]);
    });

    it('should process in batches for large inputs', async () => {
      const texts = new Array(25).fill('test'); // More than batch size of 10
      const results = await model.encodeBatch(texts);
      
      expect(results).toHaveLength(25);
      expect(mockPipeline.mock.calls.length).toBe(25); // Each text processed individually
    });
  });

  describe('Similarity Calculations', () => {
    beforeEach(async () => {
      // Mock different embeddings for different texts
      mockPipeline.mockImplementation((text: string) => {
        if (text === 'hello') {
          return Promise.resolve({ data: [1, 0, 0, ...new Array(381).fill(0)] });
        } else if (text === 'hi') {
          return Promise.resolve({ data: [0.8, 0.6, 0, ...new Array(381).fill(0)] });
        } else {
          return Promise.resolve({ data: [0, 1, 0, ...new Array(381).fill(0)] });
        }
      });
      
      await model.initialize();
    });

    it('should calculate similarity between texts', async () => {
      const similarity = await model.calculateSimilarity('hello', 'hi');
      
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should find most similar texts', async () => {
      const candidates = ['hi', 'goodbye', 'farewell'];
      const results = await model.findMostSimilar('hello', candidates, 2);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('text');
      expect(results[0]).toHaveProperty('similarity');
      expect(results[0]).toHaveProperty('index');
      
      // Results should be sorted by similarity (descending)
      expect(results[0].similarity).toBeGreaterThanOrEqual(results[1].similarity);
    });
  });

  describe('Model Information', () => {
    it('should provide model information', () => {
      const info = model.getModelInfo();
      
      expect(info).toEqual({
        name: 'Xenova/all-MiniLM-L6-v2',
        version: '1.0.0',
        dimensions: 384,
        initialized: false,
        description: 'Efficient 384-dimensional sentence transformer for semantic representations'
      });
    });

    it('should update initialization status in info', async () => {
      await model.initialize();
      const info = model.getModelInfo();
      
      expect(info.initialized).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when encoding without initialization', async () => {
      await expect(model.encode('test')).rejects.toThrow('not initialized');
    });

    it('should throw error when batch encoding without initialization', async () => {
      await expect(model.encodeBatch(['test'])).rejects.toThrow('not initialized');
    });

    it('should throw error when calculating similarity without initialization', async () => {
      await expect(model.calculateSimilarity('a', 'b')).rejects.toThrow('not initialized');
    });
  });
});
