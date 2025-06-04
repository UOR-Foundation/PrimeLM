// =============================================================================
// MPNET 768-DIMENSIONAL MODEL TESTS
// =============================================================================

import { MPNet768EmbeddingsModel } from '../embeddings/mpnet-768-model';

// Mock the transformers pipeline
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn()
}));

describe('MPNet768EmbeddingsModel', () => {
  let model: MPNet768EmbeddingsModel;
  let mockPipelineInstance: jest.Mock;

  beforeEach(() => {
    model = new MPNet768EmbeddingsModel();
    mockPipelineInstance = jest.fn();
    
    const { pipeline } = require('@xenova/transformers');
    pipeline.mockResolvedValue(mockPipelineInstance);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Model Properties', () => {
    it('should have correct model name', () => {
      expect(model.name).toBe('sentence-transformers/all-mpnet-base-v2');
    });

    it('should have 768 dimensions', () => {
      expect(model.dimensions).toBe(768);
    });

    it('should have correct version', () => {
      expect(model.version).toBe('1.0.0');
    });

    it('should not be initialized by default', () => {
      expect(model.isInitialized()).toBe(false);
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await model.initialize();
      
      expect(model.isInitialized()).toBe(true);
      
      const { pipeline } = require('@xenova/transformers');
      expect(pipeline).toHaveBeenCalledWith('feature-extraction', 'sentence-transformers/all-mpnet-base-v2');
    });

    it('should handle initialization failure', async () => {
      const { pipeline } = require('@xenova/transformers');
      pipeline.mockRejectedValue(new Error('Model loading failed'));

      await expect(model.initialize()).rejects.toThrow('Failed to initialize model sentence-transformers/all-mpnet-base-v2');
    });

    it('should not reinitialize if already initialized', async () => {
      await model.initialize();
      
      const { pipeline } = require('@xenova/transformers');
      pipeline.mockClear();
      
      await model.initialize();
      expect(pipeline).not.toHaveBeenCalled();
    });
  });

  describe('Encoding', () => {
    beforeEach(async () => {
      // Create mock embeddings with 768 dimensions
      const mockEmbeddings = new Array(768).fill(0).map((_, i) => Math.sin(i * 0.1));
      mockPipelineInstance.mockResolvedValue({
        data: mockEmbeddings
      });
      
      await model.initialize();
    });

    it('should encode text successfully', async () => {
      const text = 'Hello world';
      const embeddings = await model.encode(text);
      
      expect(embeddings).toHaveLength(768);
      expect(embeddings).toEqual(expect.arrayContaining([expect.any(Number)]));
      
      expect(mockPipelineInstance).toHaveBeenCalledWith(text, {
        pooling: 'mean',
        normalize: true
      });
    });

    it('should require initialization before encoding', async () => {
      const uninitializedModel = new MPNet768EmbeddingsModel();
      
      await expect(uninitializedModel.encode('test')).rejects.toThrow('MPNet768EmbeddingsModel model failed during processing');
    });

    it('should handle empty text', async () => {
      await expect(model.encode('')).rejects.toThrow('Invalid input for encoding: must be a non-empty string');
    });

    it('should handle whitespace-only text', async () => {
      await expect(model.encode('   ')).rejects.toThrow('Empty input for encoding');
    });

    it('should handle encoding failure', async () => {
      mockPipelineInstance.mockRejectedValue(new Error('Encoding failed'));
      
      await expect(model.encode('test')).rejects.toThrow('MPNet768EmbeddingsModel model failed during encode');
    });
  });

  describe('Batch Encoding', () => {
    beforeEach(async () => {
      // Create mock embeddings with 768 dimensions
      const mockEmbeddings = new Array(768).fill(0).map((_, i) => Math.sin(i * 0.1));
      mockPipelineInstance.mockResolvedValue({
        data: mockEmbeddings
      });
      
      await model.initialize();
    });

    it('should encode multiple texts', async () => {
      const texts = ['Hello', 'World', 'Test'];
      const embeddings = await model.encodeBatch(texts);
      
      expect(embeddings).toHaveLength(3);
      embeddings.forEach(embedding => {
        expect(embedding).toHaveLength(768);
      });
      
      expect(mockPipelineInstance).toHaveBeenCalledTimes(3);
    });

    it('should handle empty array', async () => {
      const embeddings = await model.encodeBatch([]);
      expect(embeddings).toEqual([]);
    });

    it('should validate all inputs', async () => {
      const texts = ['Hello', '', 'World'];
      
      await expect(model.encodeBatch(texts)).rejects.toThrow('Invalid input for batch encoding item 1: must be a non-empty string');
    });
  });

  describe('Similarity Calculation', () => {
    beforeEach(async () => {
      // Create deterministic mock embeddings
      let callCount = 0;
      mockPipelineInstance.mockImplementation(() => {
        callCount++;
        const embeddings = new Array(768).fill(0).map((_, i) => 
          callCount === 1 ? Math.sin(i * 0.1) : Math.cos(i * 0.1)
        );
        return Promise.resolve({ data: embeddings });
      });
      
      await model.initialize();
    });

    it('should calculate similarity between texts', async () => {
      const similarity = await model.calculateSimilarity('Hello', 'World');
      
      expect(similarity).toBeGreaterThanOrEqual(-1);
      expect(similarity).toBeLessThanOrEqual(1);
      expect(typeof similarity).toBe('number');
    });
  });

  describe('Model Info', () => {
    it('should return correct model info when not initialized', () => {
      const info = model.getModelInfo();
      
      expect(info).toEqual({
        name: 'sentence-transformers/all-mpnet-base-v2',
        version: '1.0.0',
        dimensions: 768,
        initialized: false,
        description: 'Enhanced 768-dimensional sentence transformer for rich semantic representations'
      });
    });

    it('should return correct model info when initialized', async () => {
      await model.initialize();
      const info = model.getModelInfo();
      
      expect(info).toEqual({
        name: 'sentence-transformers/all-mpnet-base-v2',
        version: '1.0.0',
        dimensions: 768,
        initialized: true,
        description: 'Enhanced 768-dimensional sentence transformer for rich semantic representations'
      });
    });
  });

  describe('Find Most Similar', () => {
    beforeEach(async () => {
      // Create mock embeddings that vary by index
      mockPipelineInstance.mockImplementation((text: string) => {
        const index = ['query', 'similar', 'different', 'another'].indexOf(text);
        const embeddings = new Array(768).fill(0).map((_, i) => 
          Math.sin(i * 0.1 + index * 0.5)
        );
        return Promise.resolve({ data: embeddings });
      });
      
      await model.initialize();
    });

    it('should find most similar texts', async () => {
      const candidates = ['similar', 'different', 'another'];
      const results = await model.findMostSimilar('query', candidates, 2);
      
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result).toHaveProperty('text');
        expect(result).toHaveProperty('similarity');
        expect(result).toHaveProperty('index');
        expect(result.similarity).toBeGreaterThanOrEqual(-1);
        expect(result.similarity).toBeLessThanOrEqual(1);
      });
      
      // Results should be sorted by similarity (descending)
      expect(results[0].similarity).toBeGreaterThanOrEqual(results[1].similarity);
    });

    it('should handle empty candidates', async () => {
      const results = await model.findMostSimilar('query', [], 5);
      expect(results).toEqual([]);
    });
  });
});
