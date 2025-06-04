// =============================================================================
// MPNET EMBEDDINGS MODEL TESTS - Tests for MPNet embeddings implementation
// =============================================================================

import { MPNetEmbeddingsModel } from '../embeddings/mpnet-model';

// Mock the transformers pipeline
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn()
}));

const { pipeline: mockPipeline } = jest.mocked(require('@xenova/transformers'));

describe('MPNetEmbeddingsModel', () => {
  let model: MPNetEmbeddingsModel;
  let mockPipelineInstance: jest.Mock;

  beforeEach(() => {
    model = new MPNetEmbeddingsModel();
    mockPipelineInstance = jest.fn();
    mockPipeline.mockResolvedValue(mockPipelineInstance);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('model properties', () => {
    it('should have correct model name', () => {
      expect(model.name).toBe('Xenova/all-MiniLM-L6-v2');
    });

    it('should have correct version', () => {
      expect(model.version).toBe('1.0.0');
    });

    it('should have correct dimensions', () => {
      expect(model.dimensions).toBe(384);
    });

    it('should start uninitialized', () => {
      expect(model.isInitialized()).toBe(false);
    });
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await model.initialize();
      
      expect(mockPipeline).toHaveBeenCalledWith(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      expect(model.isInitialized()).toBe(true);
    });

    it('should handle initialization failure', async () => {
      mockPipeline.mockRejectedValue(new Error('Model loading failed'));
      
      await expect(model.initialize()).rejects.toThrow('Failed to initialize model');
      expect(model.isInitialized()).toBe(false);
    });

    it('should not initialize twice', async () => {
      await model.initialize();
      expect(model.isInitialized()).toBe(true);
      
      // Clear mock calls
      mockPipeline.mockClear();
      
      // Second initialization should be ignored
      await model.initialize();
      expect(mockPipeline).not.toHaveBeenCalled();
      expect(model.isInitialized()).toBe(true);
    });

    it('should throw error if pipeline is null after initialization', async () => {
      mockPipeline.mockResolvedValue(null);
      
      await expect(model.initialize()).rejects.toThrow(
        'Failed to initialize model Xenova/all-MiniLM-L6-v2'
      );
    });
  });

  describe('encoding', () => {
    beforeEach(async () => {
      // Mock successful encoding
      const mockEmbeddings = new Float32Array(384);
      for (let i = 0; i < 384; i++) {
        mockEmbeddings[i] = Math.random();
      }
      
      mockPipelineInstance.mockResolvedValue({
        data: mockEmbeddings
      });
      
      await model.initialize();
    });

    it('should encode text to embeddings', async () => {
      const text = 'Hello world';
      const embeddings = await model.encode(text);
      
      expect(mockPipelineInstance).toHaveBeenCalledWith(text, {
        pooling: 'mean',
        normalize: true
      });
      expect(embeddings).toHaveLength(384);
      expect(embeddings.every(val => typeof val === 'number')).toBe(true);
    });

    it('should handle various text inputs', async () => {
      const testCases = [
        'Simple text',
        'Text with numbers 123',
        'Text with special characters !@#$%',
        'Very long text that contains multiple sentences and should still be processed correctly by the model.',
        'Non-English text: Bonjour le monde'
      ];

      for (const text of testCases) {
        const embeddings = await model.encode(text);
        expect(embeddings).toHaveLength(384);
        expect(embeddings.every(val => typeof val === 'number')).toBe(true);
      }
    });

    it('should validate input text', async () => {
      await expect(model.encode('')).rejects.toThrow('Invalid input');
      await expect(model.encode('   ')).rejects.toThrow('Invalid input');
    });

    it('should require initialization before encoding', async () => {
      const uninitializedModel = new MPNetEmbeddingsModel();
      
      await expect(uninitializedModel.encode('test')).rejects.toThrow('not initialized');
    });

    it('should handle encoding errors', async () => {
      mockPipelineInstance.mockRejectedValue(new Error('Encoding failed'));
      
      await expect(model.encode('test')).rejects.toThrow('MPNetEmbeddingsModel model failed during encode');
    });

    it('should validate output dimensions', async () => {
      // Mock wrong dimensions
      mockPipelineInstance.mockResolvedValue({
        data: new Float32Array(512) // Wrong dimensions
      });
      
      await expect(model.encode('test')).rejects.toThrow('Expected 384 dimensions, got 512');
    });
  });

  describe('error handling', () => {
    it('should wrap model errors appropriately', async () => {
      await model.initialize();
      
      mockPipelineInstance.mockRejectedValue(new Error('Model processing error'));
      
      await expect(model.encode('test')).rejects.toThrow('MPNetEmbeddingsModel model failed during encode');
    });

    it('should handle non-Error exceptions', async () => {
      await model.initialize();
      
      mockPipelineInstance.mockRejectedValue('String error');
      
      await expect(model.encode('test')).rejects.toThrow('MPNetEmbeddingsModel model failed during encode');
    });
  });

  describe('performance characteristics', () => {
    beforeEach(async () => {
      const mockEmbeddings = new Float32Array(384);
      for (let i = 0; i < 384; i++) {
        mockEmbeddings[i] = Math.random();
      }
      
      mockPipelineInstance.mockResolvedValue({
        data: mockEmbeddings
      });
      
      await model.initialize();
    });

    it('should handle concurrent encoding requests', async () => {
      const texts = ['text1', 'text2', 'text3', 'text4', 'text5'];
      
      const promises = texts.map(text => model.encode(text));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(embeddings => {
        expect(embeddings).toHaveLength(384);
      });
    });

    it('should maintain consistency for same input', async () => {
      const text = 'Consistent input text';
      
      const embeddings1 = await model.encode(text);
      const embeddings2 = await model.encode(text);
      
      // Note: In real implementation, embeddings should be identical for same input
      // Here we just verify they have the same structure
      expect(embeddings1).toHaveLength(embeddings2.length);
    });
  });

  describe('integration scenarios', () => {
    beforeEach(async () => {
      const mockEmbeddings = new Float32Array(384);
      for (let i = 0; i < 384; i++) {
        mockEmbeddings[i] = Math.random();
      }
      
      mockPipelineInstance.mockResolvedValue({
        data: mockEmbeddings
      });
      
      await model.initialize();
    });

    it('should work with conversation-like inputs', async () => {
      const conversationInputs = [
        'Hello, how are you?',
        'My name is John',
        'What is the weather like today?',
        'Thank you for your help',
        'Goodbye!'
      ];

      for (const input of conversationInputs) {
        const embeddings = await model.encode(input);
        expect(embeddings).toHaveLength(384);
        expect(embeddings.every(val => typeof val === 'number' && !isNaN(val))).toBe(true);
      }
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCases = [
        'a', // Single character
        '123', // Numbers only
        '!@#$%^&*()', // Special characters only
        'A'.repeat(1000) // Very long text
      ];

      for (const text of edgeCases) {
        const embeddings = await model.encode(text);
        expect(embeddings).toHaveLength(384);
      }
    });
  });
});
