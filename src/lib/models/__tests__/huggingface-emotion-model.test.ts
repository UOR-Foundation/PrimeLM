// =============================================================================
// HUGGINGFACE EMOTION MODEL TESTS - Tests for emotion detection implementation
// =============================================================================

import { HuggingFaceEmotionModel } from '../emotion/huggingface-emotion-model';

// Mock the transformers pipeline
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn()
}));

const { pipeline: mockPipeline } = jest.mocked(require('@xenova/transformers'));

describe('HuggingFaceEmotionModel', () => {
  let model: HuggingFaceEmotionModel;
  let mockPipelineInstance: jest.Mock;

  beforeEach(() => {
    model = new HuggingFaceEmotionModel();
    mockPipelineInstance = jest.fn();
    mockPipeline.mockResolvedValue(mockPipelineInstance);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('model properties', () => {
    it('should have correct default model name', () => {
      expect(model.name).toBe('j-hartmann/emotion-english-distilroberta-base');
    });

    it('should accept custom model name', () => {
      const customModel = new HuggingFaceEmotionModel('custom-emotion-model');
      expect(customModel.name).toBe('custom-emotion-model');
    });

    it('should have correct version', () => {
      expect(model.version).toBe('1.0.0');
    });

    it('should have defined emotions', () => {
      expect(model.emotions).toEqual(['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust']);
    });

    it('should start uninitialized', () => {
      expect(model.isInitialized()).toBe(false);
    });
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await model.initialize();
      
      expect(mockPipeline).toHaveBeenCalledWith(
        'text-classification',
        'j-hartmann/emotion-english-distilroberta-base'
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
        'Failed to initialize model j-hartmann/emotion-english-distilroberta-base'
      );
    });
  });

  describe('emotion analysis', () => {
    beforeEach(async () => {
      // Mock successful emotion analysis
      mockPipelineInstance.mockResolvedValue([
        { label: 'joy', score: 0.8 }
      ]);
      
      await model.initialize();
    });

    it('should analyze emotion in text', async () => {
      const text = 'I am so happy today!';
      const result = await model.analyze(text);
      
      expect(mockPipelineInstance).toHaveBeenCalledWith(text);
      expect(result).toEqual({
        emotion: 'joy',
        valence: 0.8,
        arousal: 0.8,
        confidence: 0.8
      });
    });

    it('should handle different emotions correctly', async () => {
      const emotionTests = [
        { 
          emotion: 'sadness', 
          expected: { emotion: 'sadness', valence: -0.7, arousal: 0.3, confidence: 0.9 }
        },
        { 
          emotion: 'anger', 
          expected: { emotion: 'anger', valence: -0.8, arousal: 0.9, confidence: 0.85 }
        },
        { 
          emotion: 'fear', 
          expected: { emotion: 'fear', valence: -0.6, arousal: 0.8, confidence: 0.75 }
        },
        { 
          emotion: 'surprise', 
          expected: { emotion: 'surprise', valence: 0.3, arousal: 0.9, confidence: 0.7 }
        },
        { 
          emotion: 'disgust', 
          expected: { emotion: 'disgust', valence: -0.5, arousal: 0.5, confidence: 0.8 }
        }
      ];

      for (const test of emotionTests) {
        mockPipelineInstance.mockResolvedValue([
          { label: test.emotion, score: test.expected.confidence }
        ]);

        const result = await model.analyze(`Text expressing ${test.emotion}`);
        expect(result).toEqual(test.expected);
      }
    });

    it('should handle empty text gracefully', async () => {
      await expect(model.analyze('')).rejects.toThrow('Invalid input');
    });

    it('should handle whitespace-only text', async () => {
      await expect(model.analyze('   ')).rejects.toThrow('Empty input');
    });

    it('should require initialization before analysis', async () => {
      const uninitializedModel = new HuggingFaceEmotionModel();
      
      await expect(uninitializedModel.analyze('test')).rejects.toThrow('not initialized');
    });

    it('should handle analysis errors', async () => {
      mockPipelineInstance.mockRejectedValue(new Error('Analysis failed'));
      
      await expect(model.analyze('test')).rejects.toThrow('Emotion analysis failed');
    });
  });

  describe('valence and arousal calculation', () => {
    beforeEach(async () => {
      await model.initialize();
    });

    it('should calculate correct valence values', async () => {
      const valenceTests = [
        { emotion: 'joy', expectedValence: 0.8 },
        { emotion: 'surprise', expectedValence: 0.3 },
        { emotion: 'sadness', expectedValence: -0.7 },
        { emotion: 'anger', expectedValence: -0.8 },
        { emotion: 'fear', expectedValence: -0.6 },
        { emotion: 'disgust', expectedValence: -0.5 }
      ];

      for (const test of valenceTests) {
        mockPipelineInstance.mockResolvedValue([
          { label: test.emotion, score: 0.8 }
        ]);

        const result = await model.analyze('test text');
        expect(result.valence).toBe(test.expectedValence);
      }
    });

    it('should calculate correct arousal values', async () => {
      const arousalTests = [
        { emotion: 'joy', expectedArousal: 0.8 },
        { emotion: 'surprise', expectedArousal: 0.9 },
        { emotion: 'anger', expectedArousal: 0.9 },
        { emotion: 'fear', expectedArousal: 0.8 },
        { emotion: 'sadness', expectedArousal: 0.3 },
        { emotion: 'disgust', expectedArousal: 0.5 }
      ];

      for (const test of arousalTests) {
        mockPipelineInstance.mockResolvedValue([
          { label: test.emotion, score: 0.8 }
        ]);

        const result = await model.analyze('test text');
        expect(result.arousal).toBe(test.expectedArousal);
      }
    });

    it('should handle unknown emotions with default values', async () => {
      mockPipelineInstance.mockResolvedValue([
        { label: 'unknown_emotion', score: 0.8 }
      ]);

      await expect(model.analyze('test text')).rejects.toThrow('Invalid emotion');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await model.initialize();
    });

    it('should wrap model errors appropriately', async () => {
      mockPipelineInstance.mockRejectedValue(new Error('Model processing error'));
      
      await expect(model.analyze('test')).rejects.toThrow('Emotion analysis failed');
    });

    it('should handle non-Error exceptions', async () => {
      mockPipelineInstance.mockRejectedValue('String error');
      
      await expect(model.analyze('test')).rejects.toThrow('Emotion analysis failed');
    });

    it('should handle malformed model output', async () => {
      mockPipelineInstance.mockResolvedValue(null);
      
      await expect(model.analyze('test')).rejects.toThrow('Emotion analysis failed');
    });

    it('should handle empty model output', async () => {
      mockPipelineInstance.mockResolvedValue([]);
      
      await expect(model.analyze('test')).rejects.toThrow('Emotion analysis failed');
    });
  });

  describe('performance characteristics', () => {
    beforeEach(async () => {
      mockPipelineInstance.mockResolvedValue([
        { label: 'joy', score: 0.8 }
      ]);
      
      await model.initialize();
    });

    it('should handle concurrent analysis requests', async () => {
      const texts = [
        'I am happy',
        'I am sad',
        'I am angry',
        'I am surprised',
        'I am afraid'
      ];
      
      const promises = texts.map(text => model.analyze(text));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveProperty('emotion');
        expect(result).toHaveProperty('valence');
        expect(result).toHaveProperty('arousal');
        expect(result).toHaveProperty('confidence');
      });
    });

    it('should maintain consistency for same input', async () => {
      const text = 'I am feeling great today!';
      
      const result1 = await model.analyze(text);
      const result2 = await model.analyze(text);
      
      expect(result1).toEqual(result2);
    });
  });

  describe('integration scenarios', () => {
    beforeEach(async () => {
      await model.initialize();
    });

    it('should work with conversation-like inputs', async () => {
      const conversationInputs = [
        { text: 'Hello, how are you?', emotion: 'joy' },
        { text: 'I am feeling terrible today', emotion: 'sadness' },
        { text: 'This is absolutely outrageous!', emotion: 'anger' },
        { text: 'Oh wow, I did not expect that!', emotion: 'surprise' },
        { text: 'I am really worried about this', emotion: 'fear' }
      ];

      for (const input of conversationInputs) {
        mockPipelineInstance.mockResolvedValue([
          { label: input.emotion, score: 0.8 }
        ]);

        const result = await model.analyze(input.text);
        expect(result.emotion).toBe(input.emotion);
        expect(result.confidence).toBe(0.8);
        expect(typeof result.valence).toBe('number');
        expect(typeof result.arousal).toBe('number');
      }
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCases = [
        'a', // Single character
        '123', // Numbers only
        '!@#$%^&*()', // Special characters only
        'A'.repeat(1000) // Very long text
      ];

      mockPipelineInstance.mockResolvedValue([
        { label: 'joy', score: 0.5 }
      ]);

      for (const text of edgeCases) {
        const result = await model.analyze(text);
        expect(result.emotion).toBe('joy');
        expect(result.confidence).toBe(0.5);
      }
    });
  });
});
