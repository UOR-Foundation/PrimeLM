// =============================================================================
// HUGGINGFACE INTENT MODEL TESTS - Unit tests for HuggingFace intent model
// =============================================================================

import { HuggingFaceIntentModel } from '../intent/huggingface-intent-model';

// Mock the transformers library to avoid actual model loading in tests
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn()
}));

describe('HuggingFaceIntentModel', () => {
  let model: HuggingFaceIntentModel;
  let mockPipeline: jest.Mock;

  beforeEach(() => {
    model = new HuggingFaceIntentModel('microsoft/DialoGPT-medium');
    
    // Setup mock pipeline
    mockPipeline = jest.fn();
    const { pipeline } = require('@xenova/transformers');
    (pipeline as jest.Mock).mockResolvedValue(mockPipeline);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await model.initialize();
      
      expect(model.isInitialized()).toBe(true);
      expect(model.name).toBe('microsoft/DialoGPT-medium');
      expect(model.version).toBe('1.0.0');
    });

    it('should not reinitialize if already initialized', async () => {
      await model.initialize();
      const { pipeline } = require('@xenova/transformers');
      (pipeline as jest.Mock).mockClear();
      
      await model.initialize(); // Should not call pipeline again
      
      expect(pipeline).not.toHaveBeenCalled();
    });

    it('should handle initialization failure', async () => {
      const { pipeline } = require('@xenova/transformers');
      (pipeline as jest.Mock).mockRejectedValue(new Error('Model loading failed'));
      
      await expect(model.initialize()).rejects.toThrow('Failed to initialize model microsoft/DialoGPT-medium');
      expect(model.isInitialized()).toBe(false);
    });
  });

  describe('Intent Classification', () => {
    beforeEach(async () => {
      mockPipeline.mockResolvedValue([
        { label: 'POSITIVE', score: 0.8 }
      ]);
      await model.initialize();
    });

    it('should classify greetings correctly', async () => {
      const result = await model.classify('Hello there!');
      
      expect(result.intent).toBe('GREETING');
      expect(result.confidence).toBe(0.9);
    });

    it('should classify identity introductions correctly', async () => {
      const result = await model.classify('My name is Alex');
      
      expect(result.intent).toBe('IDENTITY_INTRODUCTION');
      expect(result.confidence).toBe(0.9);
    });

    it('should classify identity queries correctly', async () => {
      const result = await model.classify('What is my name?');
      
      expect(result.intent).toBe('IDENTITY_QUERY');
      expect(result.confidence).toBe(0.9);
    });

    it('should classify entity introductions correctly', async () => {
      const result = await model.classify('My dog is named Max');
      
      expect(result.intent).toBe('ENTITY_INTRODUCTION');
      expect(result.confidence).toBe(0.85);
    });

    it('should classify entity queries correctly', async () => {
      const result = await model.classify('What is my dog called?');
      
      expect(result.intent).toBe('ENTITY_QUERY');
      expect(result.confidence).toBe(0.85);
    });

    it('should classify help requests correctly', async () => {
      const result = await model.classify('Can you help me?');
      
      expect(result.intent).toBe('HELP_REQUEST');
      expect(result.confidence).toBe(0.8);
    });

    it('should classify gratitude correctly', async () => {
      const result = await model.classify('Thank you so much!');
      
      expect(result.intent).toBe('GRATITUDE');
      expect(result.confidence).toBe(0.8);
    });

    it('should classify positive feedback correctly', async () => {
      const result = await model.classify('That was awesome!');
      
      expect(result.intent).toBe('POSITIVE_FEEDBACK');
      expect(result.confidence).toBe(0.8);
    });

    it('should classify questions correctly', async () => {
      const result = await model.classify('How does this work?');
      
      expect(result.intent).toBe('QUESTION');
      expect(result.confidence).toBe(0.7);
    });

    it('should default to information request for unclear text', async () => {
      const result = await model.classify('Some random text here');
      
      expect(result.intent).toBe('INFORMATION_REQUEST');
      expect(result.confidence).toBe(0.5);
    });

    it('should handle empty text', async () => {
      await expect(model.classify('')).rejects.toThrow('Invalid input');
    });

    it('should handle whitespace-only text', async () => {
      await expect(model.classify('   ')).rejects.toThrow('Empty input');
    });
  });

  describe('Detailed Classification', () => {
    beforeEach(async () => {
      mockPipeline.mockResolvedValue([
        { label: 'POSITIVE', score: 0.8 }
      ]);
      await model.initialize();
    });

    it('should provide detailed classification results', async () => {
      const result = await model.classifyWithDetails('Hello there!');
      
      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('modelOutput');
      expect(result).toHaveProperty('reasoning');
      expect(Array.isArray(result.reasoning)).toBe(true);
    });
  });

  describe('Model Information', () => {
    it('should provide correct model information', () => {
      const info = model.getModelInfo();
      
      expect(info.name).toBe('microsoft/DialoGPT-medium');
      expect(info.version).toBe('1.0.0');
      expect(info.intents).toEqual([
        'GREETING',
        'IDENTITY_INTRODUCTION', 
        'ENTITY_INTRODUCTION',
        'IDENTITY_QUERY',
        'ENTITY_QUERY', 
        'HELP_REQUEST',
        'GRATITUDE',
        'POSITIVE_FEEDBACK',
        'INFORMATION_REQUEST',
        'KNOWLEDGE_REQUEST',
        'QUESTION'
      ]);
      expect(info.initialized).toBe(false);
      expect(info.description).toContain('HuggingFace transformer-based');
    });

    it('should show initialized status after initialization', async () => {
      await model.initialize();
      const info = model.getModelInfo();
      
      expect(info.initialized).toBe(true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await model.initialize();
    });

    it('should handle pipeline errors gracefully', async () => {
      mockPipeline.mockRejectedValue(new Error('Pipeline processing failed'));
      
      await expect(model.classify('test')).rejects.toThrow('Intent classification failed');
    });

    it('should throw error when not initialized', async () => {
      const uninitializedModel = new HuggingFaceIntentModel();
      
      await expect(uninitializedModel.classify('test')).rejects.toThrow('not initialized');
    });
  });

  describe('Custom Model Names', () => {
    it('should accept custom model names', () => {
      const customModel = new HuggingFaceIntentModel('custom/intent-model');
      
      expect(customModel.name).toBe('custom/intent-model');
    });

    it('should use default model name when none provided', () => {
      const defaultModel = new HuggingFaceIntentModel();
      
      expect(defaultModel.name).toBe('microsoft/DialoGPT-medium');
    });
  });
});
