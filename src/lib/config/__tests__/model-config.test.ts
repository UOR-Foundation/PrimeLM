// =============================================================================
// MODEL CONFIGURATION TESTS - Unit tests for model configuration
// =============================================================================

import {
  ModelConfig,
  MODEL_CONFIG,
  TEST_MODEL_CONFIG,
  validateModelConfig,
  getValidatedModelConfig,
  createModelConfig
} from '../model-config';

describe('Model Configuration', () => {
  describe('Default Configuration', () => {
    it('should have valid default configuration', () => {
      expect(() => validateModelConfig(MODEL_CONFIG)).not.toThrow();
    });

    it('should have correct embeddings configuration', () => {
      expect(MODEL_CONFIG.embeddings).toEqual({
        model: 'Xenova/all-MiniLM-L6-v2',
        dimensions: 384,
        required: true
      });
    });

    it('should have correct intent configuration', () => {
      expect(MODEL_CONFIG.intent.model).toBe('semantic-intent-classifier');
      expect(MODEL_CONFIG.intent.intents).toContain('GREETING');
      expect(MODEL_CONFIG.intent.intents).toContain('QUESTION');
      expect(MODEL_CONFIG.intent.required).toBe(true);
    });

    it('should have correct entities configuration', () => {
      expect(MODEL_CONFIG.entities.model).toBe('semantic-ner-classifier');
      expect(MODEL_CONFIG.entities.types).toContain('PERSON');
      expect(MODEL_CONFIG.entities.types).toContain('PLACE');
      expect(MODEL_CONFIG.entities.required).toBe(true);
    });

    it('should have correct emotion configuration', () => {
      expect(MODEL_CONFIG.emotion.model).toBe('semantic-emotion-classifier');
      expect(MODEL_CONFIG.emotion.emotions).toContain('joy');
      expect(MODEL_CONFIG.emotion.emotions).toContain('sadness');
      expect(MODEL_CONFIG.emotion.emotions).toContain('neutral');
      expect(MODEL_CONFIG.emotion.required).toBe(true);
    });
  });

  describe('Test Configuration', () => {
    it('should have valid test configuration', () => {
      expect(() => validateModelConfig(TEST_MODEL_CONFIG)).not.toThrow();
    });

    it('should use mock models for testing', () => {
      expect(TEST_MODEL_CONFIG.embeddings.model).toBe('mock-embeddings-model');
      expect(TEST_MODEL_CONFIG.intent.model).toBe('mock-intent-model');
      expect(TEST_MODEL_CONFIG.entities.model).toBe('mock-ner-model');
      expect(TEST_MODEL_CONFIG.emotion.model).toBe('mock-emotion-model');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate complete configuration', () => {
      const validConfig: ModelConfig = {
        embeddings: {
          model: 'test-embeddings',
          dimensions: 512,
          required: true
        },
        intent: {
          model: 'test-intent',
          intents: ['TEST'],
          required: true
        },
        entities: {
          model: 'test-entities',
          types: ['TEST'],
          required: true
        },
        emotion: {
          model: 'test-emotion',
          emotions: ['test'],
          required: true
        }
      };

      expect(() => validateModelConfig(validConfig)).not.toThrow();
    });

    it('should reject missing embeddings configuration', () => {
      const invalidConfig = {
        intent: MODEL_CONFIG.intent,
        entities: MODEL_CONFIG.entities,
        emotion: MODEL_CONFIG.emotion
      } as ModelConfig;

      expect(() => validateModelConfig(invalidConfig)).toThrow('Embeddings configuration is required');
    });

    it('should reject missing embeddings model name', () => {
      const invalidConfig: ModelConfig = {
        ...MODEL_CONFIG,
        embeddings: {
          model: '',
          dimensions: 768,
          required: true
        }
      };

      expect(() => validateModelConfig(invalidConfig)).toThrow('Embeddings model name is required');
    });

    it('should reject invalid embeddings dimensions', () => {
      const invalidConfig: ModelConfig = {
        ...MODEL_CONFIG,
        embeddings: {
          model: 'test-model',
          dimensions: 0,
          required: true
        }
      };

      expect(() => validateModelConfig(invalidConfig)).toThrow('Embeddings dimensions must be a positive number');
    });

    it('should reject missing intent configuration', () => {
      const invalidConfig = {
        embeddings: MODEL_CONFIG.embeddings,
        entities: MODEL_CONFIG.entities,
        emotion: MODEL_CONFIG.emotion
      } as ModelConfig;

      expect(() => validateModelConfig(invalidConfig)).toThrow('Intent configuration is required');
    });

    it('should reject empty intent types', () => {
      const invalidConfig: ModelConfig = {
        ...MODEL_CONFIG,
        intent: {
          model: 'test-model',
          intents: [],
          required: true
        }
      };

      expect(() => validateModelConfig(invalidConfig)).toThrow('Intent types must be specified');
    });

    it('should reject missing entities configuration', () => {
      const invalidConfig = {
        embeddings: MODEL_CONFIG.embeddings,
        intent: MODEL_CONFIG.intent,
        emotion: MODEL_CONFIG.emotion
      } as ModelConfig;

      expect(() => validateModelConfig(invalidConfig)).toThrow('Entities configuration is required');
    });

    it('should reject empty entity types', () => {
      const invalidConfig: ModelConfig = {
        ...MODEL_CONFIG,
        entities: {
          model: 'test-model',
          types: [],
          required: true
        }
      };

      expect(() => validateModelConfig(invalidConfig)).toThrow('Entity types must be specified');
    });

    it('should reject missing emotion configuration', () => {
      const invalidConfig = {
        embeddings: MODEL_CONFIG.embeddings,
        intent: MODEL_CONFIG.intent,
        entities: MODEL_CONFIG.entities
      } as ModelConfig;

      expect(() => validateModelConfig(invalidConfig)).toThrow('Emotion configuration is required');
    });

    it('should reject empty emotion types', () => {
      const invalidConfig: ModelConfig = {
        ...MODEL_CONFIG,
        emotion: {
          model: 'test-model',
          emotions: [],
          required: true
        }
      };

      expect(() => validateModelConfig(invalidConfig)).toThrow('Emotion types must be specified');
    });

    it('should collect multiple validation errors', () => {
      const invalidConfig: ModelConfig = {
        embeddings: {
          model: '',
          dimensions: -1,
          required: true
        },
        intent: {
          model: '',
          intents: [],
          required: true
        },
        entities: {
          model: '',
          types: [],
          required: true
        },
        emotion: {
          model: '',
          emotions: [],
          required: true
        }
      };

      expect(() => validateModelConfig(invalidConfig)).toThrow(/validation failed/);
    });
  });

  describe('Configuration Utilities', () => {
    it('should return validated default configuration', () => {
      const config = getValidatedModelConfig();
      expect(config).toEqual(MODEL_CONFIG);
    });

    it('should create custom configuration with overrides', () => {
      const customConfig = createModelConfig({
        embeddings: {
          model: 'custom-embeddings',
          dimensions: 512,
          required: true
        }
      });

      expect(customConfig.embeddings.model).toBe('custom-embeddings');
      expect(customConfig.embeddings.dimensions).toBe(512);
      expect(customConfig.intent).toEqual(MODEL_CONFIG.intent);
      expect(customConfig.entities).toEqual(MODEL_CONFIG.entities);
      expect(customConfig.emotion).toEqual(MODEL_CONFIG.emotion);
    });

    it('should validate custom configuration', () => {
      expect(() => createModelConfig({
        embeddings: {
          model: '',
          dimensions: 0,
          required: true
        }
      })).toThrow();
    });

    it('should allow partial overrides', () => {
      const customConfig = createModelConfig({
        intent: {
          model: 'custom-intent',
          intents: ['CUSTOM'],
          required: false
        }
      });

      expect(customConfig.intent.model).toBe('custom-intent');
      expect(customConfig.intent.intents).toEqual(['CUSTOM']);
      expect(customConfig.intent.required).toBe(false);
      expect(customConfig.embeddings).toEqual(MODEL_CONFIG.embeddings);
    });
  });

  describe('Configuration Types', () => {
    it('should have correct TypeScript types', () => {
      // This test ensures TypeScript compilation succeeds with correct types
      const config: ModelConfig = MODEL_CONFIG;
      
      // Test that all required properties exist
      expect(typeof config.embeddings.model).toBe('string');
      expect(typeof config.embeddings.dimensions).toBe('number');
      expect(typeof config.embeddings.required).toBe('boolean');
      
      expect(typeof config.intent.model).toBe('string');
      expect(Array.isArray(config.intent.intents)).toBe(true);
      expect(typeof config.intent.required).toBe('boolean');
      
      expect(typeof config.entities.model).toBe('string');
      expect(Array.isArray(config.entities.types)).toBe(true);
      expect(typeof config.entities.required).toBe('boolean');
      
      expect(typeof config.emotion.model).toBe('string');
      expect(Array.isArray(config.emotion.emotions)).toBe(true);
      expect(typeof config.emotion.required).toBe('boolean');
    });

    it('should allow optional topic configuration', () => {
      const configWithTopic: ModelConfig = {
        ...MODEL_CONFIG,
        topic: {
          model: 'test-topic',
          topics: ['test'],
          required: false
        }
      };

      expect(() => validateModelConfig(configWithTopic)).not.toThrow();
    });
  });
});
