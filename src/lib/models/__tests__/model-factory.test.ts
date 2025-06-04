// =============================================================================
// MODEL FACTORY TESTS - Tests for model factory and creation patterns
// =============================================================================

import { ModelFactory, ProductionModelCreators, MockModelCreators } from '../factory/model-factory';
import { ModelConfig } from '../../config/model-config';

// Mock the transformers pipeline for HuggingFace models
const mockPipeline = jest.fn();
jest.mock('@xenova/transformers', () => ({
  pipeline: mockPipeline
}));

describe('ModelFactory', () => {
  beforeEach(() => {
    ModelFactory.clear();
    mockPipeline.mockResolvedValue(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
    ModelFactory.clear();
  });

  describe('model registration', () => {
    it('should register embeddings models', () => {
      const mockCreator = () => ({
        name: 'test-embeddings',
        version: '1.0.0',
        dimensions: 384,
        async initialize() {},
        isInitialized: () => true,
        async encode() { return []; }
      });

      ModelFactory.registerEmbeddingsModel('test-embeddings', mockCreator);
      
      expect(ModelFactory.isModelRegistered('embeddings', 'test-embeddings')).toBe(true);
    });

    it('should register intent models', () => {
      const mockCreator = () => ({
        name: 'test-intent',
        version: '1.0.0',
        intents: ['TEST'],
        async initialize() {},
        isInitialized: () => true,
        async classify() { return { intent: 'TEST', confidence: 1.0 }; }
      });

      ModelFactory.registerIntentModel('test-intent', mockCreator);
      
      expect(ModelFactory.isModelRegistered('intent', 'test-intent')).toBe(true);
    });

    it('should register entity models', () => {
      const mockCreator = () => ({
        name: 'test-entity',
        version: '1.0.0',
        entityTypes: ['TEST'],
        async initialize() {},
        isInitialized: () => true,
        async extract() { return { entities: [] }; }
      });

      ModelFactory.registerEntityModel('test-entity', mockCreator);
      
      expect(ModelFactory.isModelRegistered('entities', 'test-entity')).toBe(true);
    });

    it('should register emotion models', () => {
      const mockCreator = () => ({
        name: 'test-emotion',
        version: '1.0.0',
        emotions: ['joy'],
        async initialize() {},
        isInitialized: () => true,
        async analyze() { return { emotion: 'joy', valence: 0.5, arousal: 0.5, confidence: 0.8 }; }
      });

      ModelFactory.registerEmotionModel('test-emotion', mockCreator);
      
      expect(ModelFactory.isModelRegistered('emotion', 'test-emotion')).toBe(true);
    });
  });

  describe('model creation', () => {
    beforeEach(() => {
      // Register test models
      ModelFactory.registerEmbeddingsModel('test-embeddings', () => ({
        name: 'test-embeddings',
        version: '1.0.0',
        dimensions: 384,
        async initialize() {},
        isInitialized: () => true,
        async encode() { return new Array(384).fill(0.1); }
      }));

      ModelFactory.registerIntentModel('test-intent', () => ({
        name: 'test-intent',
        version: '1.0.0',
        intents: ['GREETING'],
        async initialize() {},
        isInitialized: () => true,
        async classify() { return { intent: 'GREETING', confidence: 0.9 }; }
      }));

      ModelFactory.registerEntityModel('test-entity', () => ({
        name: 'test-entity',
        version: '1.0.0',
        entityTypes: ['PERSON'],
        async initialize() {},
        isInitialized: () => true,
        async extract() { return { entities: [] }; }
      }));

      ModelFactory.registerEmotionModel('test-emotion', () => ({
        name: 'test-emotion',
        version: '1.0.0',
        emotions: ['joy'],
        async initialize() {},
        isInitialized: () => true,
        async analyze() { return { emotion: 'joy', valence: 0.5, arousal: 0.5, confidence: 0.8 }; }
      }));
    });

    it('should create embeddings model from config', () => {
      const config: ModelConfig = {
        embeddings: { model: 'test-embeddings', dimensions: 384, required: true },
        intent: { model: 'test-intent', intents: ['GREETING'], required: true },
        entities: { model: 'test-entity', types: ['PERSON'], required: true },
        emotion: { model: 'test-emotion', emotions: ['joy'], required: true }
      };

      const model = ModelFactory.createEmbeddingsModel(config);
      
      expect(model).toBeDefined();
      expect(model.name).toBe('test-embeddings');
      expect(model.dimensions).toBe(384);
    });

    it('should create intent model from config', () => {
      const config: ModelConfig = {
        embeddings: { model: 'test-embeddings', dimensions: 384, required: true },
        intent: { model: 'test-intent', intents: ['GREETING'], required: true },
        entities: { model: 'test-entity', types: ['PERSON'], required: true },
        emotion: { model: 'test-emotion', emotions: ['joy'], required: true }
      };

      const model = ModelFactory.createIntentModel(config);
      
      expect(model).toBeDefined();
      expect(model.name).toBe('test-intent');
      expect(model.intents).toEqual(['GREETING']);
    });

    it('should create entity model from config', () => {
      const config: ModelConfig = {
        embeddings: { model: 'test-embeddings', dimensions: 384, required: true },
        intent: { model: 'test-intent', intents: ['GREETING'], required: true },
        entities: { model: 'test-entity', types: ['PERSON'], required: true },
        emotion: { model: 'test-emotion', emotions: ['joy'], required: true }
      };

      const model = ModelFactory.createEntityModel(config);
      
      expect(model).toBeDefined();
      expect(model.name).toBe('test-entity');
      expect(model.entityTypes).toEqual(['PERSON']);
    });

    it('should create emotion model from config', () => {
      const config: ModelConfig = {
        embeddings: { model: 'test-embeddings', dimensions: 384, required: true },
        intent: { model: 'test-intent', intents: ['GREETING'], required: true },
        entities: { model: 'test-entity', types: ['PERSON'], required: true },
        emotion: { model: 'test-emotion', emotions: ['joy'], required: true }
      };

      const model = ModelFactory.createEmotionModel(config);
      
      expect(model).toBeDefined();
      expect(model.name).toBe('test-emotion');
      expect(model.emotions).toEqual(['joy']);
    });

    it('should create all models from config', () => {
      const config: ModelConfig = {
        embeddings: { model: 'test-embeddings', dimensions: 384, required: true },
        intent: { model: 'test-intent', intents: ['GREETING'], required: true },
        entities: { model: 'test-entity', types: ['PERSON'], required: true },
        emotion: { model: 'test-emotion', emotions: ['joy'], required: true }
      };

      const models = ModelFactory.createAllModels(config);
      
      expect(models.embeddings).toBeDefined();
      expect(models.intent).toBeDefined();
      expect(models.entities).toBeDefined();
      expect(models.emotion).toBeDefined();
      
      expect(models.embeddings.name).toBe('test-embeddings');
      expect(models.intent.name).toBe('test-intent');
      expect(models.entities.name).toBe('test-entity');
      expect(models.emotion.name).toBe('test-emotion');
    });
  });

  describe('error handling', () => {
    it('should throw error for unregistered embeddings model', () => {
      const config: ModelConfig = {
        embeddings: { model: 'unknown-embeddings', dimensions: 384, required: true },
        intent: { model: 'test-intent', intents: ['GREETING'], required: true },
        entities: { model: 'test-entity', types: ['PERSON'], required: true },
        emotion: { model: 'test-emotion', emotions: ['joy'], required: true }
      };

      expect(() => {
        ModelFactory.createEmbeddingsModel(config);
      }).toThrow('No creator registered for embeddings model: unknown-embeddings');
    });

    it('should throw error for unregistered intent model', () => {
      const config: ModelConfig = {
        embeddings: { model: 'test-embeddings', dimensions: 384, required: true },
        intent: { model: 'unknown-intent', intents: ['GREETING'], required: true },
        entities: { model: 'test-entity', types: ['PERSON'], required: true },
        emotion: { model: 'test-emotion', emotions: ['joy'], required: true }
      };

      expect(() => {
        ModelFactory.createIntentModel(config);
      }).toThrow('No creator registered for intent model: unknown-intent');
    });

    it('should throw error for unregistered entity model', () => {
      const config: ModelConfig = {
        embeddings: { model: 'test-embeddings', dimensions: 384, required: true },
        intent: { model: 'test-intent', intents: ['GREETING'], required: true },
        entities: { model: 'unknown-entity', types: ['PERSON'], required: true },
        emotion: { model: 'test-emotion', emotions: ['joy'], required: true }
      };

      expect(() => {
        ModelFactory.createEntityModel(config);
      }).toThrow('No creator registered for entity model: unknown-entity');
    });

    it('should throw error for unregistered emotion model', () => {
      const config: ModelConfig = {
        embeddings: { model: 'test-embeddings', dimensions: 384, required: true },
        intent: { model: 'test-intent', intents: ['GREETING'], required: true },
        entities: { model: 'test-entity', types: ['PERSON'], required: true },
        emotion: { model: 'unknown-emotion', emotions: ['joy'], required: true }
      };

      expect(() => {
        ModelFactory.createEmotionModel(config);
      }).toThrow('No creator registered for emotion model: unknown-emotion');
    });
  });

  describe('model validation', () => {
    beforeEach(() => {
      // Register test models
      ModelFactory.registerEmbeddingsModel('valid-embeddings', () => ({
        name: 'valid-embeddings',
        version: '1.0.0',
        dimensions: 384,
        async initialize() {},
        isInitialized: () => true,
        async encode() { return []; }
      }));

      ModelFactory.registerIntentModel('valid-intent', () => ({
        name: 'valid-intent',
        version: '1.0.0',
        intents: ['GREETING'],
        async initialize() {},
        isInitialized: () => true,
        async classify() { return { intent: 'GREETING', confidence: 0.9 }; }
      }));

      ModelFactory.registerEntityModel('valid-entity', () => ({
        name: 'valid-entity',
        version: '1.0.0',
        entityTypes: ['PERSON'],
        async initialize() {},
        isInitialized: () => true,
        async extract() { return { entities: [] }; }
      }));

      ModelFactory.registerEmotionModel('valid-emotion', () => ({
        name: 'valid-emotion',
        version: '1.0.0',
        emotions: ['joy'],
        async initialize() {},
        isInitialized: () => true,
        async analyze() { return { emotion: 'joy', valence: 0.5, arousal: 0.5, confidence: 0.8 }; }
      }));
    });

    it('should validate valid config', () => {
      const config: ModelConfig = {
        embeddings: { model: 'valid-embeddings', dimensions: 384, required: true },
        intent: { model: 'valid-intent', intents: ['GREETING'], required: true },
        entities: { model: 'valid-entity', types: ['PERSON'], required: true },
        emotion: { model: 'valid-emotion', emotions: ['joy'], required: true }
      };

      expect(() => {
        ModelFactory.validateConfig(config);
      }).not.toThrow();
    });

    it('should throw error for invalid config', () => {
      const config: ModelConfig = {
        embeddings: { model: 'invalid-embeddings', dimensions: 384, required: true },
        intent: { model: 'invalid-intent', intents: ['GREETING'], required: true },
        entities: { model: 'invalid-entity', types: ['PERSON'], required: true },
        emotion: { model: 'invalid-emotion', emotions: ['joy'], required: true }
      };

      expect(() => {
        ModelFactory.validateConfig(config);
      }).toThrow('Model factory validation failed');
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      ModelFactory.registerEmbeddingsModel('test-embeddings', () => ({
        name: 'test-embeddings',
        version: '1.0.0',
        dimensions: 384,
        async initialize() {},
        isInitialized: () => true,
        async encode() { return []; }
      }));

      ModelFactory.registerIntentModel('test-intent', () => ({
        name: 'test-intent',
        version: '1.0.0',
        intents: ['GREETING'],
        async initialize() {},
        isInitialized: () => true,
        async classify() { return { intent: 'GREETING', confidence: 0.9 }; }
      }));
    });

    it('should get registered models', () => {
      const registered = ModelFactory.getRegisteredModels();
      
      expect(registered.embeddings).toContain('test-embeddings');
      expect(registered.intent).toContain('test-intent');
    });

    it('should check if model is registered', () => {
      expect(ModelFactory.isModelRegistered('embeddings', 'test-embeddings')).toBe(true);
      expect(ModelFactory.isModelRegistered('intent', 'test-intent')).toBe(true);
      expect(ModelFactory.isModelRegistered('embeddings', 'unknown')).toBe(false);
      expect(ModelFactory.isModelRegistered('intent', 'unknown')).toBe(false);
    });

    it('should clear all models', () => {
      expect(ModelFactory.isModelRegistered('embeddings', 'test-embeddings')).toBe(true);
      
      ModelFactory.clear();
      
      expect(ModelFactory.isModelRegistered('embeddings', 'test-embeddings')).toBe(false);
      expect(ModelFactory.isModelRegistered('intent', 'test-intent')).toBe(false);
    });
  });

  describe('production model creators', () => {
    it('should have registerProductionModels method', () => {
      expect(ProductionModelCreators.registerProductionModels).toBeDefined();
      expect(typeof ProductionModelCreators.registerProductionModels).toBe('function');
    });

    it('should register production models without errors', () => {
      expect(() => {
        ProductionModelCreators.registerProductionModels();
      }).not.toThrow();
    });
  });

  describe('mock model creators', () => {
    it('should have registerMockModels method', () => {
      expect(MockModelCreators.registerMockModels).toBeDefined();
      expect(typeof MockModelCreators.registerMockModels).toBe('function');
    });

    it('should register mock models without errors', () => {
      expect(() => {
        MockModelCreators.registerMockModels();
      }).not.toThrow();
    });

    it('should create functional mock models', () => {
      MockModelCreators.registerMockModels();
      
      const config: ModelConfig = {
        embeddings: { model: 'mock-embeddings-model', dimensions: 384, required: true },
        intent: { model: 'mock-intent-model', intents: ['GREETING'], required: true },
        entities: { model: 'mock-ner-model', types: ['PERSON'], required: true },
        emotion: { model: 'mock-emotion-model', emotions: ['joy'], required: true }
      };

      const models = ModelFactory.createAllModels(config);
      
      expect(models.embeddings.name).toBe('mock-embeddings-model');
      expect(models.intent.name).toBe('mock-intent-model');
      expect(models.entities.name).toBe('mock-ner-model');
      expect(models.emotion.name).toBe('mock-emotion-model');
    });
  });
});
