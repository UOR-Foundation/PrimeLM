import { PragmaticLayer, ConversationContext, IntentState } from '../pragmatic-layer';

describe('PragmaticLayer', () => {
  let pragmaticLayer: PragmaticLayer;

  beforeEach(() => {
    pragmaticLayer = new PragmaticLayer();
  });

  describe('constructor', () => {
    it('should initialize with empty context', () => {
      const context = pragmaticLayer.getContextForResponse();
      
      expect(context.recentHistory).toEqual([]);
      expect(context.currentTopic).toBeNull();
      expect(context.activeIntents).toEqual([]);
      expect(context.relevantEntities).toEqual({});
      expect(context.conversationGoals).toEqual([]);
    });
  });

  describe('processTurn', () => {
    it('should process a basic conversation turn', () => {
      const context = pragmaticLayer.processTurn(
        'human',
        'Hello there!',
        'GREETING',
        {},
        { semanticBoosts: ['greeting'] }
      );

      expect(context.conversationHistory).toHaveLength(1);
      expect(context.conversationHistory[0].speaker).toBe('human');
      expect(context.conversationHistory[0].text).toBe('Hello there!');
      expect(context.conversationHistory[0].intent).toBe('GREETING');
      expect(context.activeIntents).toContain('GREETING');
    });

    it('should generate unique turn IDs', () => {
      const context1 = pragmaticLayer.processTurn('human', 'First message', 'GREETING', {}, {});
      const context2 = pragmaticLayer.processTurn('human', 'Second message', 'GREETING', {}, {});

      expect(context1.conversationHistory[0].id).not.toBe(context2.conversationHistory[1].id);
    });

    it('should maintain conversation history', () => {
      pragmaticLayer.processTurn('human', 'First message', 'GREETING', {}, {});
      pragmaticLayer.processTurn('chatbot', 'Hello!', 'GREETING', {}, {});
      const context = pragmaticLayer.processTurn('human', 'How are you?', 'QUESTION', {}, {});

      expect(context.conversationHistory).toHaveLength(3);
      expect(context.conversationHistory[0].text).toBe('First message');
      expect(context.conversationHistory[1].text).toBe('Hello!');
      expect(context.conversationHistory[2].text).toBe('How are you?');
    });
  });

  describe('entity memory management', () => {
    it('should store simple entities', () => {
      pragmaticLayer.processTurn(
        'human',
        'My name is Alice',
        'IDENTITY_INTRODUCTION',
        { entity_0: 'Alice' },
        {}
      );

      const entity = pragmaticLayer.queryEntityMemory('entity_0');
      expect(entity).toBeDefined();
      expect(entity.value).toBe('Alice');
      expect(entity.mentionCount).toBe(1);
    });

    it('should handle entity relationships', () => {
      pragmaticLayer.processTurn(
        'human',
        'My dog\'s name is Buddy',
        'ENTITY_INTRODUCTION',
        { entityType: 'dog', entityName: 'Buddy' },
        {}
      );

      const relationship = pragmaticLayer.queryEntityMemory('dog_name');
      expect(relationship).toBeDefined();
      expect(relationship.value).toBe('Buddy');
      expect(relationship.entityType).toBe('dog');
      expect(relationship.relationship).toBe('hasName');
    });

    it('should handle user identity', () => {
      pragmaticLayer.processTurn(
        'human',
        'My name is John',
        'IDENTITY_INTRODUCTION',
        { entity_0: 'John' },
        {}
      );

      const userEntity = pragmaticLayer.queryEntityMemory('user_name');
      expect(userEntity).toBeDefined();
      expect(userEntity.value).toBe('John');
      expect(userEntity.relationship).toBe('identity');
    });

    it('should handle two-entity patterns', () => {
      pragmaticLayer.processTurn(
        'human',
        'My cat\'s name is Whiskers',
        'ENTITY_INTRODUCTION',
        { entity_0: 'cat', entity_1: 'Whiskers' },
        {}
      );

      const catName = pragmaticLayer.queryEntityMemory('cat_name');
      expect(catName).toBeDefined();
      expect(catName.value).toBe('Whiskers');
      expect(catName.entityType).toBe('cat');
      expect(catName.relationship).toBe('hasName');
    });

    it('should handle pronoun references', () => {
      // First establish context
      pragmaticLayer.processTurn(
        'human',
        'What is my wife\'s name?',
        'ENTITY_QUERY',
        { entity_0: 'wife' },
        {}
      );

      // Then provide pronoun reference
      pragmaticLayer.processTurn(
        'human',
        'Her name is Sarah',
        'ENTITY_INTRODUCTION',
        { entity_0: 'her', entity_1: 'name', entity_2: 'Sarah' },
        {}
      );

      const wifeName = pragmaticLayer.queryEntityMemory('wife_name');
      expect(wifeName).toBeDefined();
      expect(wifeName.value).toBe('Sarah');
    });

    it('should update mention counts', () => {
      pragmaticLayer.processTurn('human', 'Alice is here', 'GENERAL', { entity_0: 'Alice' }, {});
      pragmaticLayer.processTurn('human', 'Alice said hello', 'GENERAL', { entity_0: 'Alice' }, {});

      const entity = pragmaticLayer.queryEntityMemory('entity_0');
      expect(entity.mentionCount).toBe(2);
    });

    it('should ignore null/undefined entities', () => {
      pragmaticLayer.processTurn(
        'human',
        'Test message',
        'GENERAL',
        { entity_0: null, entity_1: undefined, entity_2: '' },
        {}
      );

      expect(pragmaticLayer.queryEntityMemory('entity_0')).toBeNull();
      expect(pragmaticLayer.queryEntityMemory('entity_1')).toBeNull();
      expect(pragmaticLayer.queryEntityMemory('entity_2')).toBeNull();
    });
  });

  describe('intent tracking', () => {
    it('should track active intents', () => {
      pragmaticLayer.processTurn('human', 'Hello', 'GREETING', {}, {});
      pragmaticLayer.processTurn('human', 'My name is Bob', 'IDENTITY_INTRODUCTION', {}, {});

      const context = pragmaticLayer.getContextForResponse();
      expect(context.activeIntents).toContain('GREETING');
      expect(context.activeIntents).toContain('IDENTITY_INTRODUCTION');
    });

    it('should age intents over time', () => {
      pragmaticLayer.processTurn('human', 'Hello', 'GREETING', {}, {});
      
      // Add several turns with different intents
      for (let i = 0; i < 6; i++) {
        pragmaticLayer.processTurn('human', `Message ${i}`, 'GENERAL_CONVERSATION', {}, {});
      }

      const context = pragmaticLayer.getContextForResponse();
      // GREETING should be aged out after 5+ turns
      expect(context.activeIntents).not.toContain('GREETING');
      expect(context.activeIntents).toContain('GENERAL_CONVERSATION');
    });

    it('should boost intent confidence on repetition', () => {
      pragmaticLayer.processTurn('human', 'Hello', 'GREETING', {}, {});
      pragmaticLayer.processTurn('human', 'Hi there', 'GREETING', {}, {});

      const debugInfo = pragmaticLayer.getDebugInfo();
      const greetingIntent = debugInfo.activeIntentStates['GREETING'];
      expect(greetingIntent).toBeDefined();
      expect(greetingIntent.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('topic management', () => {
    it('should update topic for entity discussions', () => {
      pragmaticLayer.processTurn(
        'human',
        'My dog is named Rex',
        'ENTITY_INTRODUCTION',
        { entityType: 'dog' },
        {}
      );

      const context = pragmaticLayer.getContextForResponse();
      expect(context.currentTopic).toBe('dog_discussion');
    });

    it('should update topic for identity discussions', () => {
      pragmaticLayer.processTurn(
        'human',
        'My name is Alice',
        'IDENTITY_INTRODUCTION',
        { entity_0: 'Alice' },
        {}
      );

      const context = pragmaticLayer.getContextForResponse();
      expect(context.currentTopic).toBe('identity_discussion');
    });

    it('should update topic for greetings', () => {
      pragmaticLayer.processTurn('human', 'Hello!', 'GREETING', {}, {});

      const context = pragmaticLayer.getContextForResponse();
      expect(context.currentTopic).toBe('greeting_exchange');
    });

    it('should update topic for help requests', () => {
      pragmaticLayer.processTurn('human', 'Can you help me?', 'HELP_REQUEST', {}, {});

      const context = pragmaticLayer.getContextForResponse();
      expect(context.currentTopic).toBe('assistance_request');
    });

    it('should extract keywords for information requests', () => {
      pragmaticLayer.processTurn(
        'human',
        'Tell me about machine learning algorithms',
        'INFORMATION_REQUEST',
        {},
        {}
      );

      const context = pragmaticLayer.getContextForResponse();
      expect(context.currentTopic).toBe('machine_information');
    });
  });

  describe('conversation goals', () => {
    it('should set assistance goal for help requests', () => {
      pragmaticLayer.processTurn('human', 'Can you help me?', 'HELP_REQUEST', {}, {});

      const context = pragmaticLayer.getContextForResponse();
      expect(context.conversationGoals).toContain('provide_assistance');
    });

    it('should set information goal for information requests', () => {
      pragmaticLayer.processTurn('human', 'What is AI?', 'INFORMATION_REQUEST', {}, {});

      const context = pragmaticLayer.getContextForResponse();
      expect(context.conversationGoals).toContain('provide_information');
    });

    it('should set rapport goal for identity introductions', () => {
      pragmaticLayer.processTurn('human', 'My name is Alice', 'IDENTITY_INTRODUCTION', {}, {});

      const context = pragmaticLayer.getContextForResponse();
      expect(context.conversationGoals).toContain('build_rapport');
    });

    it('should set learning goal for entity introductions', () => {
      pragmaticLayer.processTurn('human', 'My dog is Rex', 'ENTITY_INTRODUCTION', {}, {});

      const context = pragmaticLayer.getContextForResponse();
      expect(context.conversationGoals).toContain('learn_about_user');
    });

    it('should limit goals to manageable number', () => {
      // Add many different goal-triggering intents
      const intents = ['HELP_REQUEST', 'INFORMATION_REQUEST', 'IDENTITY_INTRODUCTION', 
                      'ENTITY_INTRODUCTION', 'HELP_REQUEST', 'INFORMATION_REQUEST'];
      
      intents.forEach((intent, i) => {
        pragmaticLayer.processTurn('human', `Message ${i}`, intent, {}, {});
      });

      const context = pragmaticLayer.getContextForResponse();
      expect(context.conversationGoals.length).toBeLessThanOrEqual(5);
    });
  });

  describe('history management', () => {
    it('should maintain history within limits', () => {
      // Add more turns than the default limit (20)
      for (let i = 0; i < 25; i++) {
        pragmaticLayer.processTurn('human', `Message ${i}`, 'GENERAL_CONVERSATION', {}, {});
      }

      const context = pragmaticLayer.getContextForResponse();
      expect(context.recentHistory.length).toBeLessThanOrEqual(20);
      // Should keep the most recent messages
      expect(context.recentHistory[context.recentHistory.length - 1].text).toBe('Message 24');
    });

    it('should provide recent history for response context', () => {
      for (let i = 0; i < 10; i++) {
        pragmaticLayer.processTurn('human', `Message ${i}`, 'GENERAL_CONVERSATION', {}, {});
      }

      const context = pragmaticLayer.getContextForResponse();
      expect(context.recentHistory.length).toBe(5); // Default recent history limit
      expect(context.recentHistory[0].text).toBe('Message 5');
      expect(context.recentHistory[4].text).toBe('Message 9');
    });
  });

  describe('entity queries', () => {
    beforeEach(() => {
      pragmaticLayer.processTurn('human', 'My name is Alice', 'IDENTITY_INTRODUCTION', { entity_0: 'Alice' }, {});
      pragmaticLayer.processTurn('human', 'My dog is Rex', 'ENTITY_INTRODUCTION', { entity_0: 'dog', entity_1: 'Rex' }, {});
    });

    it('should query entity memory by key', () => {
      const entity = pragmaticLayer.queryEntityMemory('entity_0');
      expect(entity).toBeDefined();
      expect(entity.value).toBe('Alice');
    });

    it('should query entity relationships', () => {
      const relationship = pragmaticLayer.queryEntityRelationship('dog', 'name');
      expect(relationship).toBeDefined();
      expect(relationship.value).toBe('Rex');
    });

    it('should return null for non-existent entities', () => {
      const entity = pragmaticLayer.queryEntityMemory('non_existent');
      expect(entity).toBeNull();
    });
  });

  describe('conversation threading', () => {
    it('should continue thread for related intents', () => {
      pragmaticLayer.processTurn('human', 'My name is Alice', 'IDENTITY_INTRODUCTION', {}, {});
      
      const shouldContinue = pragmaticLayer.shouldContinueThread('IDENTITY_QUERY');
      expect(shouldContinue).toBe(true);
    });

    it('should not continue thread for unrelated intents', () => {
      pragmaticLayer.processTurn('human', 'Hello', 'GREETING', {}, {});
      
      const shouldContinue = pragmaticLayer.shouldContinueThread('TECHNICAL_QUESTION');
      expect(shouldContinue).toBe(false);
    });

    it('should consider intent confidence in threading decisions', () => {
      pragmaticLayer.processTurn('human', 'Hello', 'GREETING', {}, {});
      
      // Age the intent by adding many other turns
      for (let i = 0; i < 10; i++) {
        pragmaticLayer.processTurn('human', `Message ${i}`, 'GENERAL_CONVERSATION', {}, {});
      }
      
      const shouldContinue = pragmaticLayer.shouldContinueThread('GREETING');
      expect(shouldContinue).toBe(false);
    });
  });

  describe('pronoun resolution', () => {
    it('should resolve female pronouns', () => {
      pragmaticLayer.processTurn('human', 'What is my wife\'s name?', 'ENTITY_QUERY', { entity_0: 'wife' }, {});
      pragmaticLayer.processTurn('human', 'Her name is Sarah', 'ENTITY_INTRODUCTION', { entity_0: 'her', entity_1: 'name', entity_2: 'Sarah' }, {});

      const wifeName = pragmaticLayer.queryEntityMemory('wife_name');
      expect(wifeName).toBeDefined();
      expect(wifeName.value).toBe('Sarah');
    });

    it('should resolve male pronouns', () => {
      pragmaticLayer.processTurn('human', 'What is my husband\'s name?', 'ENTITY_QUERY', { entity_0: 'husband' }, {});
      pragmaticLayer.processTurn('human', 'His name is John', 'ENTITY_INTRODUCTION', { entity_0: 'his', entity_1: 'name', entity_2: 'John' }, {});

      const husbandName = pragmaticLayer.queryEntityMemory('husband_name');
      expect(husbandName).toBeDefined();
      expect(husbandName.value).toBe('John');
    });

    it('should handle pronouns without clear context', () => {
      pragmaticLayer.processTurn('human', 'Her name is Sarah', 'ENTITY_INTRODUCTION', { entity_0: 'her', entity_1: 'name', entity_2: 'Sarah' }, {});

      // Should not crash, entity should still be stored
      const entities = pragmaticLayer.getContextForResponse().relevantEntities;
      const sarahEntity = Object.values(entities).find((e: any) => e.value === 'Sarah');
      expect(sarahEntity).toBeDefined();
    });
  });

  describe('context for response generation', () => {
    beforeEach(() => {
      pragmaticLayer.processTurn('human', 'My name is Alice', 'IDENTITY_INTRODUCTION', { entity_0: 'Alice' }, {});
      pragmaticLayer.processTurn('human', 'My dog is Rex', 'ENTITY_INTRODUCTION', { entity_0: 'dog', entity_1: 'Rex' }, {});
      pragmaticLayer.processTurn('human', 'Can you help me?', 'HELP_REQUEST', {}, {});
    });

    it('should provide comprehensive context', () => {
      const context = pragmaticLayer.getContextForResponse();

      expect(context.recentHistory).toBeDefined();
      expect(context.currentTopic).toBe('assistance_request');
      expect(context.activeIntents).toContain('HELP_REQUEST');
      expect(context.relevantEntities).toBeDefined();
      expect(context.conversationGoals).toContain('provide_assistance');
    });

    it('should filter relevant entities by recency', () => {
      // Add an old entity
      pragmaticLayer.processTurn('human', 'Old entity', 'GENERAL', { entity_0: 'old' }, {});
      
      // Wait and add recent entity
      setTimeout(() => {
        pragmaticLayer.processTurn('human', 'Recent entity', 'GENERAL', { entity_0: 'recent' }, {});
        
        const context = pragmaticLayer.getContextForResponse();
        const entityValues = Object.values(context.relevantEntities).map((e: any) => e.value);
        expect(entityValues).toContain('recent');
      }, 10);
    });

    it('should include entities related to current topic', () => {
      const context = pragmaticLayer.getContextForResponse();
      
      // Should include entities that are contextually relevant
      expect(Object.keys(context.relevantEntities).length).toBeGreaterThan(0);
    });
  });

  describe('reset functionality', () => {
    it('should reset all context', () => {
      // Add some data
      pragmaticLayer.processTurn('human', 'My name is Alice', 'IDENTITY_INTRODUCTION', { entity_0: 'Alice' }, {});
      pragmaticLayer.processTurn('human', 'Can you help?', 'HELP_REQUEST', {}, {});

      // Reset
      pragmaticLayer.resetContext();

      // Check everything is cleared
      const context = pragmaticLayer.getContextForResponse();
      expect(context.recentHistory).toEqual([]);
      expect(context.currentTopic).toBeNull();
      expect(context.activeIntents).toEqual([]);
      expect(context.relevantEntities).toEqual({});
      expect(context.conversationGoals).toEqual([]);
    });
  });

  describe('debug information', () => {
    it('should provide comprehensive debug info', () => {
      pragmaticLayer.processTurn('human', 'My name is Alice', 'IDENTITY_INTRODUCTION', { entity_0: 'Alice' }, {});
      
      const debugInfo = pragmaticLayer.getDebugInfo();
      
      expect(debugInfo.currentTopic).toBe('identity_discussion');
      expect(debugInfo.activeIntents).toContain('IDENTITY_INTRODUCTION');
      expect(debugInfo.entityMemorySize).toBeGreaterThan(0);
      expect(debugInfo.entityMemory).toBeDefined();
      expect(debugInfo.conversationGoals).toContain('build_rapport');
      expect(debugInfo.historyLength).toBe(1);
      expect(debugInfo.activeIntentStates).toBeDefined();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty text', () => {
      expect(() => {
        pragmaticLayer.processTurn('human', '', 'GENERAL_CONVERSATION', {}, {});
      }).not.toThrow();
    });

    it('should handle very long text', () => {
      const longText = 'a'.repeat(10000);
      expect(() => {
        pragmaticLayer.processTurn('human', longText, 'GENERAL_CONVERSATION', {}, {});
      }).not.toThrow();
    });

    it('should handle malformed entities', () => {
      expect(() => {
        pragmaticLayer.processTurn('human', 'Test', 'GENERAL', { entity_0: { nested: 'object' } } as any, {});
      }).not.toThrow();
    });

    it('should handle special characters in entities', () => {
      pragmaticLayer.processTurn('human', 'Special chars', 'GENERAL', { entity_0: 'José-María@#$%' }, {});
      
      const entity = pragmaticLayer.queryEntityMemory('entity_0');
      expect(entity.value).toBe('José-María@#$%');
    });

    it('should handle concurrent processing', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          Promise.resolve().then(() => 
            pragmaticLayer.processTurn('human', `Message ${i}`, 'GENERAL_CONVERSATION', {}, {})
          )
        );
      }
      
      await Promise.all(promises);
      
      const context = pragmaticLayer.getContextForResponse();
      expect(context.recentHistory.length).toBe(5); // Should have recent history
    });
  });

  describe('keyword extraction', () => {
    it('should extract meaningful keywords', () => {
      pragmaticLayer.processTurn(
        'human',
        'Tell me about artificial intelligence and machine learning',
        'INFORMATION_REQUEST',
        {},
        {}
      );

      const context = pragmaticLayer.getContextForResponse();
      expect(context.currentTopic).toBe('artificial_information');
    });

    it('should filter stop words', () => {
      pragmaticLayer.processTurn(
        'human',
        'What is the best way to learn programming',
        'INFORMATION_REQUEST',
        {},
        {}
      );

      const context = pragmaticLayer.getContextForResponse();
      expect(context.currentTopic).toBe('best_information');
    });

    it('should handle short words', () => {
      pragmaticLayer.processTurn(
        'human',
        'How to do AI ML',
        'INFORMATION_REQUEST',
        {},
        {}
      );

      const context = pragmaticLayer.getContextForResponse();
      // Should not extract very short words
      expect(context.currentTopic).toBeNull();
    });
  });
});
