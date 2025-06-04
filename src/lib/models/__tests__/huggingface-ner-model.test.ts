// =============================================================================
// HUGGINGFACE NER MODEL TESTS - Tests for named entity recognition implementation
// =============================================================================

import { HuggingFaceNERModel } from '../entities/huggingface-ner-model';

// Mock the transformers pipeline
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn()
}));

const { pipeline: mockPipeline } = jest.mocked(require('@xenova/transformers'));

describe('HuggingFaceNERModel', () => {
  let model: HuggingFaceNERModel;
  let mockPipelineInstance: jest.Mock;

  beforeEach(() => {
    model = new HuggingFaceNERModel();
    mockPipelineInstance = jest.fn();
    mockPipeline.mockResolvedValue(mockPipelineInstance);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('model properties', () => {
    it('should have correct default model name', () => {
      expect(model.name).toBe('Xenova/bert-base-NER');
    });

    it('should accept custom model name', () => {
      const customModel = new HuggingFaceNERModel('custom-ner-model');
      expect(customModel.name).toBe('custom-ner-model');
    });

    it('should have correct version', () => {
      expect(model.version).toBe('1.0.0');
    });

    it('should have defined entity types', () => {
      expect(model.entityTypes).toEqual(['PERSON', 'ANIMAL', 'VEHICLE', 'PLACE', 'ORGANIZATION', 'PRODUCT']);
    });

    it('should start uninitialized', () => {
      expect(model.isInitialized()).toBe(false);
    });
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await model.initialize();
      
      expect(mockPipeline).toHaveBeenCalledWith(
        'ner',
        'Xenova/bert-base-NER'
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
        'Failed to initialize model Xenova/bert-base-NER'
      );
    });
  });

  describe('entity extraction', () => {
    beforeEach(async () => {
      // Mock successful entity extraction
      mockPipelineInstance.mockResolvedValue([
        {
          word: 'John',
          entity: 'B-PER',
          score: 0.9,
          start: 0,
          end: 4
        },
        {
          word: 'Paris',
          entity: 'B-LOC',
          score: 0.85,
          start: 13,
          end: 18
        }
      ]);
      
      await model.initialize();
    });

    it('should extract entities from text', async () => {
      const text = 'John went to Paris';
      const result = await model.extract(text);
      
      expect(mockPipelineInstance).toHaveBeenCalledWith(text);
      expect(result.entities).toHaveLength(2);
      
      expect(result.entities[0]).toEqual({
        text: 'John',
        type: 'Person',
        confidence: 0.9,
        startIndex: 0,
        endIndex: 4
      });
      
      expect(result.entities[1]).toEqual({
        text: 'Paris',
        type: 'Place',
        confidence: 0.85,
        startIndex: 13,
        endIndex: 18
      });
    });

    it('should handle different entity types correctly', async () => {
      const entityTests = [
        { entity: 'B-PER', expectedType: 'Person' },
        { entity: 'I-PER', expectedType: 'Person' },
        { entity: 'B-ORG', expectedType: 'Organization' },
        { entity: 'I-ORG', expectedType: 'Organization' },
        { entity: 'B-LOC', expectedType: 'Place' },
        { entity: 'I-LOC', expectedType: 'Place' },
        { entity: 'B-MISC', expectedType: 'Thing' },
        { entity: 'I-MISC', expectedType: 'Thing' }
      ];

      for (const test of entityTests) {
        mockPipelineInstance.mockResolvedValue([
          {
            word: 'TestEntity',
            entity: test.entity,
            score: 0.8,
            start: 0,
            end: 10
          }
        ]);

        const result = await model.extract('TestEntity text');
        expect(result.entities[0].type).toBe(test.expectedType);
      }
    });

    it('should handle unknown entity types', async () => {
      mockPipelineInstance.mockResolvedValue([
        {
          word: 'Unknown',
          entity: 'B-UNKNOWN',
          score: 0.8,
          start: 0,
          end: 7
        }
      ]);

      const result = await model.extract('Unknown entity');
      expect(result.entities[0].type).toBe('Thing'); // Default mapping
    });

    it('should handle empty text gracefully', async () => {
      await expect(model.extract('')).rejects.toThrow('Invalid input');
    });

    it('should handle whitespace-only text', async () => {
      await expect(model.extract('   ')).rejects.toThrow('Empty input');
    });

    it('should require initialization before extraction', async () => {
      const uninitializedModel = new HuggingFaceNERModel();
      
      await expect(uninitializedModel.extract('test')).rejects.toThrow('not initialized');
    });

    it('should handle extraction errors', async () => {
      mockPipelineInstance.mockRejectedValue(new Error('Extraction failed'));
      
      await expect(model.extract('test')).rejects.toThrow('Entity extraction failed');
    });

    it('should handle no entities found', async () => {
      mockPipelineInstance.mockResolvedValue([]);
      
      const result = await model.extract('No entities here');
      expect(result.entities).toEqual([]);
    });
  });

  describe('schema mapping', () => {
    beforeEach(async () => {
      await model.initialize();
    });

    it('should map NER labels to Schema.org types correctly', async () => {
      const mappingTests = [
        { nerLabel: 'PER', expectedSchema: 'Person' },
        { nerLabel: 'PERSON', expectedSchema: 'Person' },
        { nerLabel: 'ORG', expectedSchema: 'Organization' },
        { nerLabel: 'LOC', expectedSchema: 'Place' },
        { nerLabel: 'MISC', expectedSchema: 'Thing' }
      ];

      for (const test of mappingTests) {
        mockPipelineInstance.mockResolvedValue([
          {
            word: 'TestEntity',
            entity: test.nerLabel,
            score: 0.8,
            start: 0,
            end: 10
          }
        ]);

        const result = await model.extract('TestEntity');
        expect(result.entities[0].type).toBe(test.expectedSchema);
      }
    });

    it('should handle B- and I- prefixes correctly', async () => {
      mockPipelineInstance.mockResolvedValue([
        {
          word: 'John',
          entity: 'B-PER',
          score: 0.9,
          start: 0,
          end: 4
        },
        {
          word: 'Smith',
          entity: 'I-PER',
          score: 0.85,
          start: 5,
          end: 10
        }
      ]);

      const result = await model.extract('John Smith');
      expect(result.entities).toHaveLength(2);
      expect(result.entities[0].type).toBe('Person');
      expect(result.entities[1].type).toBe('Person');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await model.initialize();
    });

    it('should wrap model errors appropriately', async () => {
      mockPipelineInstance.mockRejectedValue(new Error('Model processing error'));
      
      await expect(model.extract('test')).rejects.toThrow('Entity extraction failed');
    });

    it('should handle non-Error exceptions', async () => {
      mockPipelineInstance.mockRejectedValue('String error');
      
      await expect(model.extract('test')).rejects.toThrow('Entity extraction failed');
    });

    it('should handle malformed model output', async () => {
      mockPipelineInstance.mockResolvedValue(null);
      
      await expect(model.extract('test')).rejects.toThrow('Entity extraction failed');
    });

    it('should handle entities with invalid properties', async () => {
      mockPipelineInstance.mockResolvedValue([
        {
          word: 'Test',
          entity: 'B-PER',
          score: 0.8,
          // Missing start/end properties
        }
      ]);

      const result = await model.extract('Test entity');
      // Should handle gracefully and still return the entity
      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].text).toBe('Test');
    });
  });

  describe('performance characteristics', () => {
    beforeEach(async () => {
      mockPipelineInstance.mockResolvedValue([
        {
          word: 'Entity',
          entity: 'B-PER',
          score: 0.8,
          start: 0,
          end: 6
        }
      ]);
      
      await model.initialize();
    });

    it('should handle concurrent extraction requests', async () => {
      const texts = [
        'John works at Google',
        'Mary lives in London',
        'Apple is a company',
        'Paris is beautiful',
        'Microsoft develops software'
      ];
      
      const promises = texts.map(text => model.extract(text));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveProperty('entities');
        expect(Array.isArray(result.entities)).toBe(true);
      });
    });

    it('should maintain consistency for same input', async () => {
      const text = 'John Smith works at Microsoft in Seattle';
      
      const result1 = await model.extract(text);
      const result2 = await model.extract(text);
      
      expect(result1).toEqual(result2);
    });
  });

  describe('integration scenarios', () => {
    beforeEach(async () => {
      await model.initialize();
    });

    it('should work with conversation-like inputs', async () => {
      const conversationInputs = [
        {
          text: 'Hi, my name is John and I work at Google',
          expectedEntities: ['John', 'Google']
        },
        {
          text: 'I live in New York and love visiting Paris',
          expectedEntities: ['New York', 'Paris']
        },
        {
          text: 'My dog Max is a Golden Retriever',
          expectedEntities: ['Max']
        }
      ];

      for (const input of conversationInputs) {
        // Mock entities for each input
        const mockEntities = input.expectedEntities.map((entity, index) => ({
          word: entity,
          entity: 'B-PER',
          score: 0.8,
          start: index * 10,
          end: (index * 10) + entity.length
        }));

        mockPipelineInstance.mockResolvedValue(mockEntities);

        const result = await model.extract(input.text);
        expect(result.entities).toHaveLength(input.expectedEntities.length);
        
        result.entities.forEach((entity, index) => {
          expect(entity.text).toBe(input.expectedEntities[index]);
        });
      }
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCases = [
        'a', // Single character
        '123', // Numbers only
        '!@#$%^&*()', // Special characters only
        'A'.repeat(1000) // Very long text
      ];

      mockPipelineInstance.mockResolvedValue([]);

      for (const text of edgeCases) {
        const result = await model.extract(text);
        expect(result.entities).toEqual([]);
      }
    });

    it('should handle multiple entities of same type', async () => {
      mockPipelineInstance.mockResolvedValue([
        {
          word: 'John',
          entity: 'B-PER',
          score: 0.9,
          start: 0,
          end: 4
        },
        {
          word: 'Mary',
          entity: 'B-PER',
          score: 0.85,
          start: 9,
          end: 13
        },
        {
          word: 'Bob',
          entity: 'B-PER',
          score: 0.8,
          start: 18,
          end: 21
        }
      ]);

      const result = await model.extract('John and Mary and Bob');
      expect(result.entities).toHaveLength(3);
      
      result.entities.forEach(entity => {
        expect(entity.type).toBe('Person');
        expect(entity.confidence).toBeGreaterThan(0.7);
      });
    });
  });
});
