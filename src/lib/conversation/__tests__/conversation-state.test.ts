import { ConversationStateManager, ConversationTurn, ConversationConfig } from '../conversation-state';

describe('ConversationStateManager', () => {
  let conversationManager: ConversationStateManager;

  beforeEach(() => {
    conversationManager = new ConversationStateManager();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const stats = conversationManager.getStats();
      expect(stats.conversation.totalTurns).toBe(0);
      expect(stats.conversation.coherenceScore).toBe(0);
      expect(stats.conversation.topicContinuity).toBe(0);
      expect(stats.conversation.engagementLevel).toBe(0);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<ConversationConfig> = {
        maxHistoryLength: 100,
        maxContextWindow: 20,
        coherenceThreshold: 0.2
      };
      
      const manager = new ConversationStateManager(customConfig);
      const stats = manager.getStats();
      expect(stats.config.maxHistoryLength).toBe(100);
      expect(stats.config.maxContextWindow).toBe(20);
      expect(stats.config.coherenceThreshold).toBe(0.2);
    });
  });

  describe('addTurn', () => {
    it('should add a conversation turn with required fields', () => {
      const turn = conversationManager.addTurn({
        speaker: 'human',
        text: 'Hello, my name is Alice',
        intent: 'IDENTITY_INTRODUCTION',
        entities: { entity_0: 'Alice' }
      });

      expect(turn.id).toBeDefined();
      expect(turn.timestamp).toBeDefined();
      expect(turn.speaker).toBe('human');
      expect(turn.text).toBe('Hello, my name is Alice');
      expect(turn.intent).toBe('IDENTITY_INTRODUCTION');
      expect(turn.entities).toEqual({ entity_0: 'Alice' });
    });

    it('should use default values for missing fields', () => {
      const turn = conversationManager.addTurn({
        text: 'Hello'
      });

      expect(turn.speaker).toBe('human');
      expect(turn.intent).toBe('GENERAL_CONVERSATION');
      expect(turn.entities).toEqual({});
      expect(turn.semanticContext).toEqual({});
      expect(turn.primeFactors).toEqual({});
      expect(turn.embeddings).toEqual([]);
      expect(turn.metadata).toEqual({});
    });

    it('should increment total turns metric', () => {
      conversationManager.addTurn({ text: 'First message' });
      conversationManager.addTurn({ text: 'Second message' });

      const stats = conversationManager.getStats();
      expect(stats.conversation.totalTurns).toBe(2);
    });

    it('should process entities from turn', () => {
      conversationManager.addTurn({
        speaker: 'human',
        text: 'My dog\'s name is Buddy',
        intent: 'ENTITY_INTRODUCTION',
        entities: { entity_0: 'dog', entity_1: 'Buddy' }
      });

      const entityName = conversationManager.getEntityName('dog');
      expect(entityName).toBe('Buddy');
    });
  });

  describe('entity processing', () => {
    it('should handle identity introduction', () => {
      conversationManager.addTurn({
        speaker: 'human',
        text: 'My name is Alice',
        intent: 'IDENTITY_INTRODUCTION',
        entities: { entity_0: 'Alice' }
      });

      const userName = conversationManager.getUserName();
      expect(userName).toBe('Alice');
    });

    it('should handle entity introduction with relationship', () => {
      conversationManager.addTurn({
        speaker: 'human',
        text: 'My cat\'s name is Whiskers',
        intent: 'ENTITY_INTRODUCTION',
        entities: { entity_0: 'cat', entity_1: 'Whiskers' }
      });

      const catName = conversationManager.getEntityName('cat');
      expect(catName).toBe('Whiskers');
    });

    it('should handle entity queries as references', () => {
      conversationManager.addTurn({
        speaker: 'human',
        text: 'What is my dog\'s name?',
        intent: 'ENTITY_QUERY',
        entities: { entity_0: 'dog' }
      });

      const entities = conversationManager.queryEntities({ type: 'reference' });
      expect(entities.length).toBeGreaterThan(0);
      expect(entities[0].value).toBe('dog');
    });

    it('should resolve pronoun references', () => {
      // First establish context with entity query
      conversationManager.addTurn({
        speaker: 'human',
        text: 'What is my wife\'s name?',
        intent: 'ENTITY_QUERY',
        entities: { entity_0: 'wife' }
      });

      // Then provide answer with pronoun
      conversationManager.addTurn({
        speaker: 'human',
        text: 'Her name is Sarah',
        intent: 'ENTITY_INTRODUCTION',
        entities: { entity_0: 'her', entity_1: 'name', entity_2: 'Sarah' }
      });

      const wifeName = conversationManager.getEntityName('wife');
      expect(wifeName).toBe('Sarah');
    });
  });

  describe('conversation state tracking', () => {
    it('should track active intents', () => {
      conversationManager.addTurn({
        text: 'Hello',
        intent: 'GREETING'
      });

      conversationManager.addTurn({
        text: 'My name is Bob',
        intent: 'IDENTITY_INTRODUCTION'
      });

      const context = conversationManager.getConversationContext();
      expect(context.activeIntents).toContain('IDENTITY_INTRODUCTION');
    });

    it('should update current topic', () => {
      conversationManager.addTurn({
        text: 'My dog is named Rex',
        intent: 'ENTITY_INTRODUCTION',
        entities: { entity_0: 'dog', entity_1: 'Rex' }
      });

      const context = conversationManager.getConversationContext();
      expect(context.currentTopic).toBe('dog_discussion');
    });

    it('should track conversation goals', () => {
      conversationManager.addTurn({
        text: 'Can you help me?',
        intent: 'HELP_REQUEST'
      });

      const context = conversationManager.getConversationContext();
      expect(context.conversationGoals).toContain('provide_assistance');
    });

    it('should calculate coherence between turns', () => {
      conversationManager.addTurn({
        text: 'My name is Alice',
        intent: 'IDENTITY_INTRODUCTION',
        entities: { entity_0: 'Alice' }
      });

      conversationManager.addTurn({
        text: 'Nice to meet you Alice',
        intent: 'GREETING',
        entities: { entity_0: 'Alice' }
      });

      const stats = conversationManager.getStats();
      expect(stats.conversation.coherenceScore).toBeGreaterThan(0);
    });
  });

  describe('conversation metrics', () => {
    it('should calculate topic continuity', () => {
      // Add multiple turns about the same topic
      conversationManager.addTurn({
        text: 'My dog is named Rex',
        intent: 'ENTITY_INTRODUCTION',
        entities: { entity_0: 'dog', entity_1: 'Rex' }
      });

      conversationManager.addTurn({
        text: 'Rex is a good dog',
        intent: 'ENTITY_QUERY',
        entities: { entity_0: 'Rex' }
      });

      conversationManager.addTurn({
        text: 'Tell me about Rex',
        intent: 'ENTITY_QUERY',
        entities: { entity_0: 'Rex' }
      });

      const stats = conversationManager.getStats();
      expect(stats.conversation.topicContinuity).toBeGreaterThan(0);
    });

    it('should calculate engagement level', () => {
      // Add turns with varying length and frequency
      conversationManager.addTurn({
        text: 'This is a longer message with more content to analyze'
      });

      conversationManager.addTurn({
        text: 'Another detailed message with substantial content'
      });

      const stats = conversationManager.getStats();
      expect(stats.conversation.engagementLevel).toBeGreaterThan(0);
    });
  });

  describe('history management', () => {
    it('should maintain history within limits', () => {
      const config: Partial<ConversationConfig> = { maxHistoryLength: 3 };
      const manager = new ConversationStateManager(config);

      // Add more turns than the limit
      for (let i = 0; i < 5; i++) {
        manager.addTurn({ text: `Message ${i}` });
      }

      const history = manager.getRecentHistory(10);
      expect(history.length).toBe(3);
      expect(history[0].text).toBe('Message 2'); // Oldest kept
      expect(history[2].text).toBe('Message 4'); // Most recent
    });

    it('should get recent history with specified count', () => {
      for (let i = 0; i < 10; i++) {
        conversationManager.addTurn({ text: `Message ${i}` });
      }

      const recentHistory = conversationManager.getRecentHistory(3);
      expect(recentHistory.length).toBe(3);
      expect(recentHistory[0].text).toBe('Message 7');
      expect(recentHistory[2].text).toBe('Message 9');
    });
  });

  describe('cleanup and maintenance', () => {
    it('should perform periodic cleanup', () => {
      const config: Partial<ConversationConfig> = {
        cleanupInterval: 100, // 100ms for testing
        memoryRetentionHours: 0.001 // Very short retention for testing
      };
      const manager = new ConversationStateManager(config);

      // Add a turn
      manager.addTurn({ text: 'Old message' });

      // Wait for cleanup interval
      return new Promise(resolve => {
        setTimeout(() => {
          // Add another turn to trigger cleanup check
          manager.addTurn({ text: 'New message' });
          
          const history = manager.getRecentHistory(10);
          // The old message should be cleaned up due to short retention
          expect(history.length).toBe(1);
          expect(history[0].text).toBe('New message');
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe('conversation context', () => {
    it('should provide comprehensive conversation context', () => {
      conversationManager.addTurn({
        text: 'My name is Alice',
        intent: 'IDENTITY_INTRODUCTION',
        entities: { entity_0: 'Alice' }
      });

      conversationManager.addTurn({
        text: 'My dog is named Buddy',
        intent: 'ENTITY_INTRODUCTION',
        entities: { entity_0: 'dog', entity_1: 'Buddy' }
      });

      const context = conversationManager.getConversationContext();

      expect(context.recentHistory).toBeDefined();
      expect(context.currentTopic).toBe('dog_discussion');
      expect(context.activeIntents).toContain('ENTITY_INTRODUCTION');
      expect(context.conversationGoals).toContain('learn_about_user');
      expect(context.entityMemory).toBeDefined();
      expect(context.metrics).toBeDefined();
    });
  });

  describe('entity queries', () => {
    beforeEach(() => {
      conversationManager.addTurn({
        text: 'My name is Alice',
        intent: 'IDENTITY_INTRODUCTION',
        entities: { entity_0: 'Alice' }
      });

      conversationManager.addTurn({
        text: 'My dog is named Buddy',
        intent: 'ENTITY_INTRODUCTION',
        entities: { entity_0: 'dog', entity_1: 'Buddy' }
      });
    });

    it('should query entities by criteria', () => {
      const identityEntities = conversationManager.queryEntities({ type: 'identity' });
      expect(identityEntities.length).toBeGreaterThan(0);
      expect(identityEntities[0].value).toBe('Alice');
    });

    it('should get user name', () => {
      const userName = conversationManager.getUserName();
      expect(userName).toBe('Alice');
    });

    it('should get entity name by type', () => {
      const dogName = conversationManager.getEntityName('dog');
      expect(dogName).toBe('Buddy');
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const newConfig: Partial<ConversationConfig> = {
        maxHistoryLength: 100,
        coherenceThreshold: 0.3
      };

      conversationManager.updateConfig(newConfig);
      const stats = conversationManager.getStats();

      expect(stats.config.maxHistoryLength).toBe(100);
      expect(stats.config.coherenceThreshold).toBe(0.3);
    });
  });

  describe('reset functionality', () => {
    it('should reset conversation state', () => {
      // Add some data
      conversationManager.addTurn({
        text: 'My name is Alice',
        intent: 'IDENTITY_INTRODUCTION',
        entities: { entity_0: 'Alice' }
      });

      // Reset
      conversationManager.reset();

      // Check that everything is cleared
      const stats = conversationManager.getStats();
      const context = conversationManager.getConversationContext();

      expect(stats.conversation.totalTurns).toBe(0);
      expect(context.recentHistory.length).toBe(0);
      expect(context.currentTopic).toBeNull();
      expect(context.activeIntents.length).toBe(0);
      expect(context.conversationGoals.length).toBe(0);
      expect(conversationManager.getUserName()).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle empty entities', () => {
      const turn = conversationManager.addTurn({
        text: 'Hello',
        entities: {}
      });

      expect(turn.entities).toEqual({});
    });

    it('should handle null/undefined entity values', () => {
      conversationManager.addTurn({
        text: 'Test',
        entities: { entity_0: null, entity_1: undefined, entity_2: '' }
      });

      const entities = conversationManager.queryEntities({});
      // Should not store null/undefined/empty entities
      expect(entities.length).toBe(0);
    });

    it('should handle very long text', () => {
      const longText = 'a'.repeat(1000);
      const turn = conversationManager.addTurn({
        text: longText
      });

      expect(turn.text).toBe(longText);
    });

    it('should handle special characters in entity values', () => {
      conversationManager.addTurn({
        text: 'My name is José-María',
        intent: 'IDENTITY_INTRODUCTION',
        entities: { entity_0: 'José-María' }
      });

      const userName = conversationManager.getUserName();
      expect(userName).toBe('José-María');
    });
  });

  describe('pronoun resolution edge cases', () => {
    it('should handle male pronoun entities', () => {
      conversationManager.addTurn({
