// =============================================================================
// SEMANTIC LAYER - Natural Language to Prime Resonance Bridge
// =============================================================================

import { SchemaVocabulary } from './schema-vocabulary';

export interface SemanticPattern {
  pattern: RegExp;
  intent: string;
  semanticBoosts: string[];
  responseTemplate?: string;
}

export interface ConceptNetRelation {
  concept: string;
  relation: string;
  relatedConcepts: string[];
  weight: number;
}

export interface SemanticContext {
  intent: string;
  entities: string[];
  semanticBoosts: string[];
  confidence: number;
}

export class SemanticLayer {
  private patterns: SemanticPattern[] = [];
  private conceptNetCache: Map<string, ConceptNetRelation[]> = new Map();
  private schemaVocabulary: SchemaVocabulary;

  constructor() {
    this.schemaVocabulary = new SchemaVocabulary();
    this.initializePatterns();
  }

  /**
   * Initialize common conversational patterns for natural language understanding
   */
  private initializePatterns(): void {
    this.patterns = [
      // Identity/Name patterns
      {
        pattern: /my name is (\w+)/i,
        intent: 'IDENTITY_INTRODUCTION',
        semanticBoosts: ['name', 'identity', 'person', 'individual', 'called', 'known'],
        responseTemplate: 'Nice to meet you, {name}! I\'m PrimeBot.'
      },
      {
        pattern: /i am (\w+)/i,
        intent: 'IDENTITY_INTRODUCTION',
        semanticBoosts: ['name', 'identity', 'person', 'individual'],
        responseTemplate: 'Nice to meet you, {name}! I\'m PrimeBot.'
      },
      {
        pattern: /my (\w+)'?s? name is (\w+)/i,
        intent: 'ENTITY_INTRODUCTION',
        semanticBoosts: ['name', 'identity', 'called', 'known', 'entity'],
        responseTemplate: 'Nice to know that your {entity} is named {name}!'
      },
      {
        pattern: /her name is (\w+)/i,
        intent: 'ENTITY_INTRODUCTION',
        semanticBoosts: ['name', 'identity', 'called', 'known', 'entity'],
        responseTemplate: 'Nice to know that her name is {name}!'
      },
      {
        pattern: /his name is (\w+)/i,
        intent: 'ENTITY_INTRODUCTION',
        semanticBoosts: ['name', 'identity', 'called', 'known', 'entity'],
        responseTemplate: 'Nice to know that his name is {name}!'
      },
      {
        pattern: /what is my name/i,
        intent: 'IDENTITY_QUERY',
        semanticBoosts: ['name', 'identity', 'remember', 'recall', 'called', 'known'],
        responseTemplate: 'Based on our conversation, your name is {name}.'
      },
      {
        pattern: /what is my (\w+)'?s? name/i,
        intent: 'ENTITY_QUERY',
        semanticBoosts: ['name', 'identity', 'remember', 'recall', 'called', 'known'],
        responseTemplate: 'Based on our conversation, your {entity} is named {name}.'
      },
      {
        pattern: /what is my (\w+)'s name/i,
        intent: 'ENTITY_QUERY',
        semanticBoosts: ['name', 'identity', 'remember', 'recall', 'called', 'known'],
        responseTemplate: 'Based on our conversation, your {entity} is named {name}.'
      },
      {
        pattern: /who am i/i,
        intent: 'IDENTITY_QUERY',
        semanticBoosts: ['identity', 'person', 'individual', 'self', 'me'],
      },

      // Bot identity patterns
      {
        pattern: /who are you/i,
        intent: 'BOT_IDENTITY_QUERY',
        semanticBoosts: ['identity', 'bot', 'assistant', 'who', 'you'],
        responseTemplate: 'I\'m PrimeBot, an AI assistant powered by mathematical prime factorization.'
      },
      {
        pattern: /what is your name/i,
        intent: 'BOT_IDENTITY_QUERY',
        semanticBoosts: ['name', 'identity', 'bot', 'assistant'],
        responseTemplate: 'My name is PrimeBot.'
      },

      // Greeting patterns
      {
        pattern: /^(hello|hi|hey|greetings)/i,
        intent: 'GREETING',
        semanticBoosts: ['hello', 'greeting', 'welcome', 'salutation', 'social', 'friendly'],
        responseTemplate: 'Hello! I\'m PrimeBot. How can I help you today?'
      },
      {
        pattern: /good (morning|afternoon|evening)/i,
        intent: 'GREETING',
        semanticBoosts: ['greeting', 'time', 'polite', 'social', 'welcome'],
      },

      // Question patterns
      {
        pattern: /^what (is|are|was|were)/i,
        intent: 'INFORMATION_REQUEST',
        semanticBoosts: ['question', 'information', 'explain', 'definition', 'knowledge'],
      },
      {
        pattern: /^(how|why|when|where)/i,
        intent: 'INFORMATION_REQUEST',
        semanticBoosts: ['question', 'inquiry', 'explanation', 'information', 'help'],
      },
      {
        pattern: /\?$/,
        intent: 'QUESTION',
        semanticBoosts: ['question', 'inquiry', 'ask', 'information', 'help'],
      },

      // Help patterns
      {
        pattern: /(help|assist|support)/i,
        intent: 'HELP_REQUEST',
        semanticBoosts: ['help', 'assist', 'support', 'aid', 'guidance', 'service'],
        responseTemplate: 'I\'m here to help! What would you like to know or discuss?'
      },

      // Gratitude patterns
      {
        pattern: /(thank|thanks|grateful)/i,
        intent: 'GRATITUDE',
        semanticBoosts: ['thanks', 'gratitude', 'appreciation', 'polite', 'positive'],
        responseTemplate: 'You\'re welcome! I\'m glad I could help.'
      },

      // Positive feedback
      {
        pattern: /(good|great|excellent|awesome|wonderful)/i,
        intent: 'POSITIVE_FEEDBACK',
        semanticBoosts: ['good', 'positive', 'approval', 'satisfaction', 'pleased'],
        responseTemplate: 'That\'s wonderful! Is there anything else I can help you with?'
      },

      // Understanding/Knowledge
      {
        pattern: /(understand|know|learn|explain)/i,
        intent: 'KNOWLEDGE_REQUEST',
        semanticBoosts: ['understand', 'knowledge', 'learn', 'explain', 'information', 'teach'],
      },
    ];
  }

  /**
   * Analyze input text for semantic patterns and intent
   */
  analyzeSemanticContext(input: string): SemanticContext {
    console.log('🧠 Analyzing semantic context for:', input);

    let bestMatch: SemanticPattern | null = null;
    let confidence = 0;
    let entities: string[] = [];

    // Find best matching pattern
    for (const pattern of this.patterns) {
      const match = input.match(pattern.pattern);
      if (match) {
        bestMatch = pattern;
        confidence = 0.8; // High confidence for pattern matches
        
        // Extract entities (like names)
        if (match.length > 1) {
          entities = match.slice(1);
        }
        break;
      }
    }

    // If no pattern match, try to extract semantic meaning from keywords
    if (!bestMatch) {
      const keywords = this.extractKeywords(input);
      const semanticBoosts = this.getSemanticBoostsFromKeywords(keywords);
      
      return {
        intent: 'GENERAL_CONVERSATION',
        entities: keywords,
        semanticBoosts,
        confidence: 0.3
      };
    }

    console.log('🎯 Detected intent:', bestMatch.intent);
    console.log('🔗 Semantic boosts:', bestMatch.semanticBoosts);
    console.log('📝 Entities:', entities);

    return {
      intent: bestMatch.intent,
      entities,
      semanticBoosts: bestMatch.semanticBoosts,
      confidence
    };
  }

  /**
   * Extract keywords from input text
   */
  private extractKeywords(input: string): string[] {
    return input
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can'];
    return stopWords.includes(word);
  }

  /**
   * Get semantic boosts from keywords using simple semantic associations
   */
  private getSemanticBoostsFromKeywords(keywords: string[]): string[] {
    const semanticMap: Record<string, string[]> = {
      'name': ['identity', 'person', 'individual', 'called', 'known'],
      'hello': ['greeting', 'welcome', 'social', 'friendly'],
      'help': ['assist', 'support', 'aid', 'guidance'],
      'what': ['question', 'information', 'inquiry'],
      'how': ['method', 'process', 'way', 'explanation'],
      'why': ['reason', 'cause', 'explanation', 'purpose'],
      'when': ['time', 'schedule', 'timing'],
      'where': ['location', 'place', 'position'],
      'who': ['person', 'identity', 'individual'],
      'good': ['positive', 'quality', 'approval'],
      'bad': ['negative', 'problem', 'issue'],
      'like': ['preference', 'enjoy', 'positive'],
      'love': ['strong_positive', 'emotion', 'preference'],
      'hate': ['strong_negative', 'dislike', 'emotion'],
      'want': ['desire', 'need', 'request'],
      'need': ['requirement', 'necessity', 'important'],
      'think': ['opinion', 'belief', 'cognitive'],
      'feel': ['emotion', 'sensation', 'experience'],
      'know': ['knowledge', 'information', 'understanding'],
      'understand': ['comprehension', 'knowledge', 'clarity'],
      'learn': ['education', 'knowledge', 'growth'],
      'teach': ['education', 'instruction', 'knowledge'],
      'work': ['job', 'employment', 'activity', 'function'],
      'play': ['recreation', 'fun', 'game', 'entertainment'],
      'time': ['temporal', 'schedule', 'duration'],
      'place': ['location', 'position', 'area'],
      'thing': ['object', 'item', 'entity'],
      'person': ['individual', 'human', 'people'],
      'people': ['group', 'humans', 'social'],
      'family': ['relatives', 'relationship', 'personal'],
      'friend': ['social', 'relationship', 'personal'],
      'home': ['residence', 'place', 'personal'],
      'school': ['education', 'learning', 'institution'],
      'book': ['reading', 'knowledge', 'information'],
      'computer': ['technology', 'digital', 'tool'],
      'phone': ['communication', 'technology', 'contact'],
      'car': ['transportation', 'vehicle', 'travel'],
      'food': ['nutrition', 'eating', 'sustenance'],
      'water': ['drink', 'liquid', 'essential'],
      'money': ['finance', 'currency', 'value'],
      'job': ['work', 'employment', 'career']
    };

    const boosts: string[] = [];
    for (const keyword of keywords) {
      if (semanticMap[keyword]) {
        boosts.push(...semanticMap[keyword]);
      }
      boosts.push(keyword); // Include the keyword itself
    }

    return [...new Set(boosts)]; // Remove duplicates
  }

  /**
   * Generate contextual response based on semantic analysis using Schema.org vocabulary
   */
  generateContextualResponse(
    semanticContext: SemanticContext,
    conversationHistory: string[],
    resonantWords: string[]
  ): string | null {
    console.log('🎭 Generating knowledge-driven response for intent:', semanticContext.intent);

    // Use Schema.org vocabulary to understand semantic relationships
    const lastInput = conversationHistory[conversationHistory.length - 1] || '';
    const semanticRelationship = this.schemaVocabulary.parseSemanticRelationships(lastInput);
    const semanticQuery = this.schemaVocabulary.generateSemanticQuery(lastInput);
    
    console.log('🔍 Semantic relationship:', semanticRelationship);
    console.log('🔍 Semantic query:', semanticQuery);

    // Handle semantic queries (retrieve information)
    if (semanticQuery?.queryType === 'retrieve') {
      return this.handleSemanticRetrieval(semanticQuery, conversationHistory, semanticContext);
    }
    
    // Handle semantic relationships (store information)
    if (semanticRelationship && semanticRelationship.confidence > 0.8) {
      return this.handleSemanticRelationship(semanticRelationship, semanticContext);
    }

    // Handle intent-based responses using semantic understanding
    return this.generateIntentBasedResponse(semanticContext, conversationHistory, resonantWords);
  }

  /**
   * Handle semantic information retrieval
   */
  private handleSemanticRetrieval(
    query: any,
    conversationHistory: string[],
    semanticContext: SemanticContext
  ): string {
    const context = conversationHistory.join(' ').toLowerCase();
    
    if (query.predicate === 'hasName') {
      if (query.subject === 'user') {
        // Query for user's name
        const nameMatch = context.match(/my name is (\w+)/i);
        if (nameMatch) {
          return `Your name is ${nameMatch[1]}.`;
        }
        return "I don't recall you mentioning your name. What is your name?";
      } else {
        // Query for entity's name
        const entityType = query.subject;
        const entityPattern = new RegExp(`my ${entityType}'?s? name is (\\w+)`, 'i');
        const entityMatch = context.match(entityPattern);
        
        if (entityMatch) {
          const entityName = entityMatch[1];
          const schemaType = this.schemaVocabulary.inferEntityType(entityType);
          return `Your ${entityType} is named ${entityName}.` + 
                 (schemaType ? ` That's a lovely name for ${schemaType === 'Animal' ? 'an animal' : 'a ' + schemaType.toLowerCase()}.` : '');
        }
        return `I don't recall you mentioning your ${entityType}'s name. What is your ${entityType}'s name?`;
      }
    }
    
    return "I'm processing that semantic query. Could you provide more details?";
  }

  /**
   * Handle semantic relationship storage
   */
  private handleSemanticRelationship(
    relationship: any,
    semanticContext: SemanticContext
  ): string {
    const { subject, predicate, object } = relationship;
    
    if (predicate === 'hasName') {
      if (subject.text === 'I') {
        // User introducing themselves
        return `Nice to meet you, ${object.text}! I'm PrimeBot. How can I assist you today?`;
      } else {
        // User introducing an entity
        const entityType = this.schemaVocabulary.inferEntityType(subject.text);
        const entityInfo = entityType ? this.schemaVocabulary.getEntityInfo(entityType) : null;
        
        let response = `Nice to know that your ${subject.text} is named ${object.text}!`;
        
        if (entityInfo && entityType) {
          // Add Schema.org-informed context
          const validProperties = this.schemaVocabulary.getValidProperties(entityType);
          const validRelationships = this.schemaVocabulary.getValidRelationships(entityType);
          
          if (entityType === 'Animal') {
            response += ` Tell me more about ${object.text} - what kind of ${subject.text} is ${object.text}?`;
          } else if (entityType === 'Vehicle') {
            response += ` What kind of ${subject.text} is ${object.text}?`;
          } else {
            response += ` Tell me more about ${object.text}.`;
          }
        }
        
        return response;
      }
    }
    
    if (predicate === 'owns') {
      const entityType = this.schemaVocabulary.inferEntityType(object.text);
      if (entityType) {
        return `That's wonderful that you have ${object.text === 'a' ? 'a' : ''} ${object.text}! What's special about your ${object.text}?`;
      }
      return `Interesting that you have ${object.text}. Tell me more about it!`;
    }
    
    return "That's interesting! I'm learning about the relationships you're describing.";
  }

  /**
   * Generate intent-based responses using semantic understanding
   */
  private generateIntentBasedResponse(
    semanticContext: SemanticContext,
    conversationHistory: string[],
    resonantWords: string[]
  ): string | null {
    switch (semanticContext.intent) {
      case 'GREETING':
        return "Hello! I'm PrimeBot, powered by mathematical prime factorization and semantic understanding. How can I help you today?";
        
      case 'HELP_REQUEST':
        return "I'm here to help! I can understand relationships between people, animals, places, and things. What would you like to know or discuss?";
        
      case 'GRATITUDE':
        return "You're welcome! I'm glad I could help with my semantic understanding.";
        
      case 'POSITIVE_FEEDBACK':
        return "That's wonderful! Is there anything else I can help you understand or explore?";
        
      case 'INFORMATION_REQUEST':
      case 'QUESTION':
        if (resonantWords.length > 0) {
          const entityType = this.schemaVocabulary.inferEntityType(resonantWords[0]);
          if (entityType) {
            const entityInfo = this.schemaVocabulary.getEntityInfo(entityType);
            return `I'm analyzing "${resonantWords[0]}" as ${entityType === 'Animal' ? 'an' : 'a'} ${entityType}. ` +
                   `What specifically would you like to know about ${resonantWords[0]}?`;
          }
          return `I'm processing information about "${resonantWords[0]}" through my semantic understanding. What specifically would you like to know?`;
        }
        return "That's a great question! I'm analyzing the semantic relationships to provide you with an answer.";
        
      case 'KNOWLEDGE_REQUEST':
        return "I process information through mathematical analysis and semantic understanding using Schema.org vocabulary. What would you like me to understand?";
        
      case 'GENERAL_CONVERSATION':
        if (resonantWords.length > 0) {
          const entityType = this.schemaVocabulary.inferEntityType(resonantWords[0]);
          if (entityType) {
            return `I notice you mentioned "${resonantWords[0]}" - I understand that as ${entityType === 'Animal' ? 'an' : 'a'} ${entityType}. Tell me more about it!`;
          }
          return `I notice you mentioned "${resonantWords[0]}". That's interesting! Tell me more about it.`;
        }
        return "I'm listening and ready to understand the semantic relationships in what you're telling me. What would you like to discuss?";

      default:
        return null; // Let the prime resonance system handle it
    }
  }

  /**
   * Enhance prime resonance with semantic awareness
   */
  enhanceResonanceWithSemantics(
    resonantWords: Array<{word: string, resonance: number}>,
    semanticContext: SemanticContext
  ): Array<{word: string, resonance: number}> {
    console.log('🔮 Enhancing resonance with semantic awareness...');

    return resonantWords.map(item => {
      let enhancedResonance = item.resonance;
      
      // Boost resonance for semantically relevant words
      if (semanticContext.semanticBoosts.includes(item.word)) {
        enhancedResonance *= 2.0; // Strong semantic boost
        console.log(`🎯 Semantic boost for "${item.word}": ${item.resonance.toFixed(1)} → ${enhancedResonance.toFixed(1)}`);
      }
      
      // Additional boost for high-confidence intent matches
      if (semanticContext.confidence > 0.7) {
        enhancedResonance *= 1.3;
      }
      
      return {
        word: item.word,
        resonance: enhancedResonance
      };
    });
  }

  /**
   * Extract semantic entities from conversation context
   */
  extractEntitiesFromContext(conversationHistory: string[]): Map<string, string> {
    const entities = new Map<string, string>();
    
    const fullContext = conversationHistory.join(' ');
    
    // Extract names
    const nameMatch = fullContext.match(/my name is (\w+)/i);
    if (nameMatch) {
      entities.set('user_name', nameMatch[1]);
    }
    
    // Extract other entities as needed
    // Could be extended with more sophisticated NER
    
    return entities;
  }
}
