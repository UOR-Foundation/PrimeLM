// =============================================================================
// SEMANTIC INTENT MODEL TESTS - Tests for semantic intent classification
// =============================================================================

import { SemanticIntentModel } from '../intent/semantic-intent-model';

describe('SemanticIntentModel', () => {
  let model: SemanticIntentModel;

  beforeEach(() => {
    model = new SemanticIntentModel();
  });

  describe('model properties', () => {
    it('should have correct model name', () => {
      expect(model.name).toBe('semantic-intent-classifier');
    });

    it('should have correct version', () => {
      expect(model.version).toBe('1.0.0');
    });

    it('should have defined intents', () => {
      expect(model.intents).toEqual([
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
    });

    it('should start uninitialized', () => {
      expect(model.isInitialized()).toBe(false);
    });
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await model.initialize();
      expect(model.isInitialized()).toBe(true);
    });

    it('should not initialize twice', async () => {
      await model.initialize();
      expect(model.isInitialized()).toBe(true);
      
      // Second initialization should be ignored
      await model.initialize();
      expect(model.isInitialized()).toBe(true);
    });
  });

  describe('intent classification', () => {
    beforeEach(async () => {
      await model.initialize();
    });

    it('should classify greeting intents', async () => {
      const greetingTexts = [
        'hello',
        'hi there',
        'good morning',
        'hey',
        'greetings'
      ];

      for (const text of greetingTexts) {
        const result = await model.classify(text);
        expect(result.intent).toBe('GREETING');
        expect(result.confidence).toBeGreaterThan(0.7);
      }
    });

    it('should classify identity introduction intents', async () => {
      const identityTexts = [
        'my name is John',
        'I am Sarah',
        "I'm called Mike",
        'call me Alex',
        'the name is Bond'
      ];

      for (const text of identityTexts) {
        const result = await model.classify(text);
        expect(result.intent).toBe('IDENTITY_INTRODUCTION');
        expect(result.confidence).toBeGreaterThan(0.6);
      }
    });

    it('should classify entity introduction intents', async () => {
      const entityTexts = [
        'my dog is named Max',
        'I have a cat called Whiskers',
        'my car is a Toyota',
        'this is my house',
        'meet my friend Bob'
      ];

      for (const text of entityTexts) {
        const result = await model.classify(text);
        expect(result.intent).toBe('ENTITY_INTRODUCTION');
        expect(result.confidence).toBeGreaterThan(0.7);
      }
    });

    it('should classify identity query intents', async () => {
      const queryTexts = [
        'what is my name',
        'who am I',
        'do you know my name',
        'can you tell me my name',
        'what do you call me'
      ];

      for (const text of queryTexts) {
        const result = await model.classify(text);
        expect(result.intent).toBe('IDENTITY_QUERY');
        expect(result.confidence).toBeGreaterThan(0.6);
      }
    });

    it('should classify entity query intents', async () => {
      const entityQueryTexts = [
        "what is my dog's name",
        'what color is my car',
        'where do I live',
        'what is my favorite food',
        'who is my wife'
      ];

      for (const text of entityQueryTexts) {
        const result = await model.classify(text);
        expect(result.intent).toBe('ENTITY_QUERY');
        expect(result.confidence).toBeGreaterThan(0.7);
      }
    });

    it('should classify help request intents', async () => {
      const helpTexts = [
        'help me',
        'can you assist me',
        'I need help',
        'please help',
        'can you support me'
      ];

      for (const text of helpTexts) {
        const result = await model.classify(text);
        expect(result.intent).toBe('HELP_REQUEST');
        expect(result.confidence).toBeGreaterThan(0.8);
      }
    });

    it('should classify gratitude intents', async () => {
      const gratitudeTexts = [
        'thank you',
        'thanks',
        'much appreciated',
        'grateful',
        'thanks a lot'
      ];

      for (const text of gratitudeTexts) {
        const result = await model.classify(text);
        expect(result.intent).toBe('GRATITUDE');
        expect(result.confidence).toBeGreaterThan(0.8);
      }
    });

    it('should classify question intents', async () => {
      const questionTexts = [
        'what is the weather',
        'how are you',
        'when is the meeting',
        'where is the store',
        'why did this happen'
      ];

      for (const text of questionTexts) {
        const result = await model.classify(text);
        expect(result.intent).toBe('QUESTION');
        expect(result.confidence).toBeGreaterThan(0.6);
      }
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCases = [
        'a', // Single character
        '123', // Numbers only
        '!@#$%^&*()' // Special characters only
      ];

      for (const text of edgeCases) {
        const result = await model.classify(text);
        expect(result.intent).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should require initialization before classification', async () => {
      const uninitializedModel = new SemanticIntentModel();
      
      await expect(uninitializedModel.classify('test')).rejects.toThrow('not initialized');
    });

    it('should validate input text', async () => {
      await expect(model.classify('')).rejects.toThrow('Invalid input');
      await expect(model.classify('   ')).rejects.toThrow('Empty input');
    });
  });

  describe('confidence scoring', () => {
    beforeEach(async () => {
      await model.initialize();
    });

    it('should return high confidence for clear patterns', async () => {
      const clearPatterns = [
        { text: 'hello there', expectedIntent: 'GREETING' },
        { text: 'my name is John', expectedIntent: 'IDENTITY_INTRODUCTION' },
        { text: 'what is my name', expectedIntent: 'IDENTITY_QUERY' },
        { text: 'thank you very much', expectedIntent: 'GRATITUDE' }
      ];

      for (const pattern of clearPatterns) {
        const result = await model.classify(pattern.text);
        expect(result.intent).toBe(pattern.expectedIntent);
        expect(result.confidence).toBeGreaterThan(0.8);
      }
    });

    it('should return lower confidence for ambiguous text', async () => {
      const ambiguousTexts = [
        'okay',
        'sure',
        'maybe',
        'I think so',
        'not sure'
      ];

      for (const text of ambiguousTexts) {
        const result = await model.classify(text);
        expect(result.confidence).toBeLessThan(0.8);
      }
    });

    it('should handle mixed case text', async () => {
      const mixedCaseTexts = [
        'HELLO THERE',
        'My Name Is John',
        'wHaT iS mY nAmE',
        'ThAnK yOu'
      ];

      for (const text of mixedCaseTexts) {
        const result = await model.classify(text);
        expect(result.confidence).toBeGreaterThan(0.5);
      }
    });
  });

  describe('pattern matching logic', () => {
    beforeEach(async () => {
      await model.initialize();
    });

    it('should handle variations in greeting patterns', async () => {
      const greetingVariations = [
        'hi',
        'hello',
        'hey there',
        'good morning',
        'good evening',
        'howdy',
        'greetings'
      ];

      for (const greeting of greetingVariations) {
        const result = await model.classify(greeting);
        expect(result.intent).toBe('GREETING');
      }
    });

    it('should handle variations in name introduction patterns', async () => {
      const nameVariations = [
        'my name is Alice',
        'I am Bob',
        "I'm called Charlie",
        'call me Dave',
        'they call me Eve',
        'the name is Frank'
      ];

      for (const name of nameVariations) {
        const result = await model.classify(name);
        expect(result.intent).toBe('IDENTITY_INTRODUCTION');
      }
    });

    it('should handle variations in query patterns', async () => {
      const queryVariations = [
        'what is my name',
        'do you know my name',
        'can you tell me my name',
        'what do you call me',
        'who am I'
      ];

      for (const query of queryVariations) {
        const result = await model.classify(query);
        expect(result.intent).toBe('IDENTITY_QUERY');
      }
    });
  });

  describe('performance characteristics', () => {
    beforeEach(async () => {
      await model.initialize();
    });

    it('should handle concurrent classification requests', async () => {
      const texts = [
        'hello',
        'my name is John',
        'what is my name',
        'thank you',
        'help me'
      ];
      
      const promises = texts.map(text => model.classify(text));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveProperty('intent');
        expect(result).toHaveProperty('confidence');
      });
    });

    it('should maintain consistency for same input', async () => {
      const text = 'hello there, how are you?';
      
      const result1 = await model.classify(text);
      const result2 = await model.classify(text);
      
      expect(result1).toEqual(result2);
    });

    it('should process quickly for typical inputs', async () => {
      const startTime = Date.now();
      
      await model.classify('hello world');
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should process in under 100ms for simple semantic classification
      expect(processingTime).toBeLessThan(100);
    });
  });

  describe('integration scenarios', () => {
    beforeEach(async () => {
      await model.initialize();
    });

    it('should work with conversation-like inputs', async () => {
      const conversationFlow = [
        { text: 'Hello there!', expectedIntent: 'GREETING' },
        { text: 'My name is Alice', expectedIntent: 'IDENTITY_INTRODUCTION' },
        { text: 'What is my name?', expectedIntent: 'IDENTITY_QUERY' },
        { text: 'Thank you for remembering', expectedIntent: 'GRATITUDE' },
        { text: 'Can you help me with something?', expectedIntent: 'HELP_REQUEST' }
      ];

      for (const turn of conversationFlow) {
        const result = await model.classify(turn.text);
        expect(result.intent).toBe(turn.expectedIntent);
        expect(result.confidence).toBeGreaterThan(0.5);
      }
    });

    it('should handle complex sentences', async () => {
      const complexSentences = [
        {
          text: 'Hello there, my name is John and I need some help',
          // Should prioritize the most prominent intent
          possibleIntents: ['GREETING', 'IDENTITY_INTRODUCTION', 'HELP_REQUEST']
        },
        {
          text: 'Thank you so much for helping me, what is my name again?',
          possibleIntents: ['GRATITUDE', 'IDENTITY_QUERY']
        }
      ];

      for (const sentence of complexSentences) {
        const result = await model.classify(sentence.text);
        expect(sentence.possibleIntents).toContain(result.intent);
      }
    });
  });
});
