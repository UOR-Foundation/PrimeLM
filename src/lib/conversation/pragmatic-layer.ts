// =============================================================================
// PRAGMATIC LAYER - Conversation Context and Intent Management
// =============================================================================

export interface ConversationTurn {
  id: string;
  timestamp: number;
  speaker: 'human' | 'chatbot';
  text: string;
  intent: string;
  entities: Record<string, any>;
  context: Record<string, any>;
}

export interface ConversationContext {
  currentTopic: string | null;
  activeIntents: string[];
  entityMemory: Map<string, any>;
  conversationGoals: string[];
  userPreferences: Record<string, any>;
  conversationHistory: ConversationTurn[];
}

export interface IntentState {
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
  isActive: boolean;
  turnsSinceActivation: number;
}

export class PragmaticLayer {
  private context: ConversationContext;
  private activeIntents: Map<string, IntentState> = new Map();
  private maxHistoryLength: number = 20;

  constructor() {
    this.context = {
      currentTopic: null,
      activeIntents: [],
      entityMemory: new Map(),
      conversationGoals: [],
      userPreferences: {},
      conversationHistory: []
    };
  }

  /**
   * Process a new conversation turn and update context
   */
  processTurn(
    speaker: 'human' | 'chatbot',
    text: string,
    intent: string,
    entities: Record<string, any>,
    semanticContext: Record<string, any>
  ): ConversationContext {
    console.log('🎯 Pragmatic Layer processing turn...');
    console.log('Speaker:', speaker, 'Intent:', intent);
    console.log('Entities:', entities);

    // Create conversation turn
    const turn: ConversationTurn = {
      id: `turn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      speaker,
      text,
      intent,
      entities,
      context: semanticContext
    };

    // Add to conversation history
    this.context.conversationHistory.push(turn);
    this.maintainHistoryLength();

    // Update entity memory
    this.updateEntityMemory(entities);

    // Update intent tracking
    this.updateIntentTracking(intent, entities);

    // Update conversation topic
    this.updateCurrentTopic(intent, entities, text);

    // Update conversation goals
    this.updateConversationGoals(intent, entities);

    console.log('🎯 Updated context - Topic:', this.context.currentTopic);
    console.log('🎯 Active intents:', this.context.activeIntents);
    console.log('🎯 Entity memory size:', this.context.entityMemory.size);

    return { ...this.context };
  }

  /**
   * Update entity memory with new information
   */
  private updateEntityMemory(entities: Record<string, any>): void {
    Object.entries(entities).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.length > 0) {
        // Check if entity already exists
        const existingEntity = this.context.entityMemory.get(key);
        
        if (existingEntity) {
          // Update existing entity (increment mention count, update timestamp)
          const entityInfo = {
            ...existingEntity,
            lastMentioned: Date.now(),
            mentionCount: existingEntity.mentionCount + 1
          };
          
          this.context.entityMemory.set(key, entityInfo);
          console.log(`🔄 Updated entity: ${key} = ${existingEntity.value} (mentions: ${entityInfo.mentionCount})`);
        } else {
          // Store new entity with metadata
          const entityInfo = {
            value,
            lastMentioned: Date.now(),
            mentionCount: 1,
            context: this.context.currentTopic
          };
          
          this.context.entityMemory.set(key, entityInfo);
          console.log(`💾 Stored entity: ${key} = ${value}`);
        }
      }
    });

    // Handle special entity patterns
    this.handleSpecialEntityPatterns(entities);
  }

  /**
   * Handle special entity relationship patterns using model-extracted entities
   */
  private handleSpecialEntityPatterns(entities: Record<string, any>): void {
    console.log('🔍 Processing model-extracted entities:', entities);
    
    // Convert model entities to text values for pattern analysis
    const entityTexts: string[] = [];
    const entityObjects: any[] = [];
    
    Object.values(entities).forEach(entity => {
      if (entity && typeof entity === 'object' && entity.text) {
        entityTexts.push(entity.text);
        entityObjects.push(entity);
      } else if (typeof entity === 'string') {
        entityTexts.push(entity);
        entityObjects.push({ text: entity, type: 'UNKNOWN' });
      }
    });
    
    console.log('📝 Extracted entity texts:', entityTexts);
    
    // Handle "My name is X" patterns (2 entities: "name", "Alex")
    if (entityTexts.length === 2) {
      const [firstEntity, secondEntity] = entityTexts;
      
      // Get recent context to understand the relationship
      const recentContext = this.context.conversationHistory.slice(-1).map(turn => turn.text).join(' ').toLowerCase();
      
      // Check for direct user name introduction: "My name is X"
      if (firstEntity.toLowerCase() === 'my' && recentContext.includes('my name is')) {
        const name = secondEntity;
        if (name && name.length > 0 && name[0] && name[0].toUpperCase() === name[0]) {
          this.context.entityMemory.set('user_name', {
            value: name,
            relationship: 'identity',
            lastMentioned: Date.now(),
            mentionCount: (this.context.entityMemory.get('user_name')?.mentionCount || 0) + 1
          });
          console.log(`👤 Stored user name: ${name}`);
          return;
        }
      }
      
      // Check for relationship patterns: "My wife's name is X", "My dog's name is X"
      if (firstEntity.toLowerCase() === 'my' && recentContext.includes("'s name is")) {
        // Extract the relationship type from the context
        // Use model-extracted entities to find relationship type - NO REGEX
        // Look for relationship words in the recent context
        const relationshipWords = ['wife', 'husband', 'dog', 'cat', 'car', 'mother', 'father', 'sister', 'brother'];
        const foundRelationship = relationshipWords.find(word => recentContext.includes(word));
        if (foundRelationship) {
          const relationshipType = foundRelationship;
          const name = secondEntity;
          if (name && name.length > 0 && name[0] && name[0].toUpperCase() === name[0]) {
            const relationshipKey = `${relationshipType}_name`;
            this.context.entityMemory.set(relationshipKey, {
              value: name,
              entityType: relationshipType,
              relationship: 'hasName',
              lastMentioned: Date.now(),
              mentionCount: 1
            });
            console.log(`🔗 Stored relationship: ${relationshipType} hasName ${name}`);
            return;
          }
        }
      }
    }
    
    // Handle direct entity type and name patterns from model analysis
    entityObjects.forEach(entity => {
      if (entity.type === 'PERSON' && entity.text) {
        // Check if this person entity is in a name context
        const recentContext = this.context.conversationHistory.slice(-1).map(turn => turn.text).join(' ').toLowerCase();
        if (recentContext.includes('name is') || recentContext.includes('am ') || recentContext.includes('called')) {
          this.context.entityMemory.set('user_name', {
            value: entity.text,
            relationship: 'identity',
            lastMentioned: Date.now(),
            mentionCount: (this.context.entityMemory.get('user_name')?.mentionCount || 0) + 1
          });
          console.log(`👤 Stored PERSON entity as user name: ${entity.text}`);
        }
      }
    });
    // Handle "X's name is Y" patterns
    if (entities.entityType && entities.entityName) {
      const relationshipKey = `${entities.entityType}_name`;
      const relationshipInfo = {
        value: entities.entityName,
        entityType: entities.entityType,
        relationship: 'hasName',
        lastMentioned: Date.now(),
        mentionCount: 1
      };
      
      this.context.entityMemory.set(relationshipKey, relationshipInfo);
      console.log(`� Stored relationship: ${entities.entityType} hasName ${entities.entityName}`);
    }

    // Handle user identity
    if (entities.userName) {
      this.context.entityMemory.set('user_name', {
        value: entities.userName,
        relationship: 'identity',
        lastMentioned: Date.now(),
        mentionCount: (this.context.entityMemory.get('user_name')?.mentionCount || 0) + 1
      });
    }
    
    // Handle "My name is X" patterns
    const entityValues = Object.values(entities);
    if (entityValues.length === 1 && typeof entityValues[0] === 'string') {
      // Single entity that could be a name
      const entityValue = entityValues[0] as string;
      if (entityValue && entityValue.length > 1 && entityValue[0] && entityValue[0].toUpperCase() === entityValue[0]) {
        // Looks like a proper name (capitalized)
        this.context.entityMemory.set('user_name', {
          value: entityValue,
          relationship: 'identity',
          lastMentioned: Date.now(),
          mentionCount: (this.context.entityMemory.get('user_name')?.mentionCount || 0) + 1
        });
        console.log(`👤 Stored user name: ${entityValue}`);
      }
    }
    
    // Handle "My X's name is Y" patterns
    if (entityValues.length === 2) {
      const [entityType, entityName] = entityValues as [string, string];
      if (entityType && entityName && entityName.length > 0 && entityName[0] && entityName[0].toUpperCase() === entityName[0]) {
        const relationshipKey = `${entityType}_name`;
        const relationshipInfo = {
          value: entityName,
          entityType: entityType,
          relationship: 'hasName',
          lastMentioned: Date.now(),
          mentionCount: 1
        };
        
        this.context.entityMemory.set(relationshipKey, relationshipInfo);
        console.log(`🔗 Stored relationship: ${entityType} hasName ${entityName}`);
      }
    }
    
    // Handle pronoun references like "Her name is X"
    if (entityValues.length === 3) {
      const [pronoun, nameWord, name] = entityValues as [string, string, string];
      if ((pronoun === 'her' || pronoun === 'his') && nameWord === 'name' && name && name.length > 0 && name[0] && name[0].toUpperCase() === name[0]) {
        // Look for the most recent entity that could be referenced by this pronoun
        const recentEntityType = this.findRecentEntityForPronoun(pronoun);
        if (recentEntityType) {
          const relationshipKey = `${recentEntityType}_name`;
          const relationshipInfo = {
            value: name,
            entityType: recentEntityType,
            relationship: 'hasName',
            lastMentioned: Date.now(),
            mentionCount: 1
          };
          
          this.context.entityMemory.set(relationshipKey, relationshipInfo);
          console.log(`🔗 Stored pronoun relationship: ${recentEntityType} hasName ${name} (via ${pronoun})`);
        }
      }
    }
  }

  /**
   * Update intent tracking and persistence
   */
  private updateIntentTracking(intent: string, entities: Record<string, any>): void {
    // Update existing intent or create new one
    if (this.activeIntents.has(intent)) {
      const intentState = this.activeIntents.get(intent)!;
      intentState.confidence = Math.min(intentState.confidence + 0.1, 1.0);
      intentState.turnsSinceActivation = 0;
      intentState.parameters = { ...intentState.parameters, ...entities };
    } else {
      this.activeIntents.set(intent, {
        intent,
        confidence: 0.8,
        parameters: entities,
        isActive: true,
        turnsSinceActivation: 0
      });
    }

    // Age existing intents
    for (const [intentName, intentState] of this.activeIntents) {
      if (intentName !== intent) {
        intentState.turnsSinceActivation++;
        intentState.confidence = Math.max(intentState.confidence - 0.05, 0);
        
        // Deactivate old intents
        if (intentState.turnsSinceActivation > 5 || intentState.confidence < 0.2) {
          intentState.isActive = false;
        }
      }
    }

    // Update active intents list
    this.context.activeIntents = Array.from(this.activeIntents.values())
      .filter(state => state.isActive)
      .map(state => state.intent);
  }

  /**
   * Update current conversation topic
   */
  private updateCurrentTopic(intent: string, entities: Record<string, any>, text: string): void {
    // Topic inference based on intent and entities
    let newTopic: string | null = null;

    if (intent === 'ENTITY_INTRODUCTION' || intent === 'ENTITY_QUERY') {
      if (entities.entityType) {
        newTopic = `${entities.entityType}_discussion`;
      }
    } else if (intent === 'IDENTITY_INTRODUCTION' || intent === 'IDENTITY_QUERY') {
      newTopic = 'identity_discussion';
    } else if (intent === 'GREETING') {
      newTopic = 'greeting_exchange';
    } else if (intent === 'HELP_REQUEST') {
      newTopic = 'assistance_request';
    } else if (intent === 'INFORMATION_REQUEST') {
      // Infer topic from entities or keywords
      const keywords = this.extractKeywords(text);
      if (keywords.length > 0) {
        newTopic = `${keywords[0]}_information`;
      }
    }

    // Update topic if we have a clear new topic
    if (newTopic && newTopic !== this.context.currentTopic) {
      this.context.currentTopic = newTopic;
    }
  }

  /**
   * Update conversation goals based on intent
   */
  private updateConversationGoals(intent: string, entities: Record<string, any>): void {
    const goals = this.context.conversationGoals;

    switch (intent) {
      case 'HELP_REQUEST':
        if (!goals.includes('provide_assistance')) {
          goals.push('provide_assistance');
        }
        break;
      
      case 'INFORMATION_REQUEST':
        if (!goals.includes('provide_information')) {
          goals.push('provide_information');
        }
        break;
      
      case 'IDENTITY_INTRODUCTION':
        if (!goals.includes('build_rapport')) {
          goals.push('build_rapport');
        }
        break;
      
      case 'ENTITY_INTRODUCTION':
        if (!goals.includes('learn_about_user')) {
          goals.push('learn_about_user');
        }
        break;
    }

    // Keep goals list manageable
    if (goals.length > 5) {
      this.context.conversationGoals = goals.slice(-5);
    }
  }

  /**
   * Extract keywords from text for topic inference
   */
  private extractKeywords(text: string): string[] {
    const words = text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));
    
    // Filter out action words and prepositions
    const actionWords = ['tell', 'show', 'give', 'help', 'explain', 'describe'];
    const prepositions = ['about', 'with', 'from', 'into', 'onto', 'upon', 'over', 'under'];
    const filterWords = [...actionWords, ...prepositions];
    
    const contentWords = words.filter(word => !filterWords.includes(word));
    const prioritizedWords = contentWords.length > 0 ? contentWords : words;
    
    return prioritizedWords.slice(0, 3);
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = ['what', 'when', 'where', 'how', 'why', 'who', 'this', 'that', 'with', 'from', 'they', 'them', 'their', 'there', 'then', 'than', 'these', 'those'];
    return stopWords.includes(word);
  }

  /**
   * Maintain conversation history length
   */
  private maintainHistoryLength(): void {
    if (this.context.conversationHistory.length > this.maxHistoryLength) {
      this.context.conversationHistory = this.context.conversationHistory.slice(-this.maxHistoryLength);
    }
  }

  /**
   * Query entity memory for specific information
   */
  queryEntityMemory(entityKey: string): any | null {
    const entity = this.context.entityMemory.get(entityKey);
    if (entity) {
      console.log(`🔍 Retrieved entity: ${entityKey} = ${entity.value}`);
      return entity;
    }
    return null;
  }

  /**
   * Query for entity relationships (e.g., "dog_name")
   */
  queryEntityRelationship(entityType: string, relationship: string): any | null {
    const relationshipKey = `${entityType}_${relationship}`;
    return this.queryEntityMemory(relationshipKey);
  }

  /**
   * Get conversation context for response generation
   */
  getContextForResponse(): {
    recentHistory: ConversationTurn[];
    currentTopic: string | null;
    activeIntents: string[];
    relevantEntities: Record<string, any>;
    conversationGoals: string[];
  } {
    const recentHistory = this.context.conversationHistory.slice(-5);
    
    // Get relevant entities based on current topic and recent mentions
    const relevantEntities: Record<string, any> = {};
    const recentThreshold = Date.now() - (5 * 60 * 1000); // 5 minutes
    
    for (const [key, entity] of this.context.entityMemory) {
      if (entity.lastMentioned > recentThreshold || 
          (this.context.currentTopic && entity.context === this.context.currentTopic)) {
        relevantEntities[key] = entity;
      }
    }

    return {
      recentHistory,
      currentTopic: this.context.currentTopic,
      activeIntents: this.context.activeIntents,
      relevantEntities,
      conversationGoals: this.context.conversationGoals
    };
  }

  /**
   * Check if we should continue current conversation thread
   */
  shouldContinueThread(newIntent: string): boolean {
    const activeIntentStates = Array.from(this.activeIntents.values())
      .filter(state => state.isActive);
    
    // Continue thread if we have related active intents
    const relatedIntents = this.getRelatedIntents(newIntent);
    return activeIntentStates.some(state => 
      relatedIntents.includes(state.intent) && state.confidence > 0.5
    );
  }

  /**
   * Get intents related to the given intent
   */
  private getRelatedIntents(intent: string): string[] {
    const intentRelations: Record<string, string[]> = {
      'IDENTITY_QUERY': ['IDENTITY_INTRODUCTION', 'ENTITY_QUERY'],
      'ENTITY_QUERY': ['ENTITY_INTRODUCTION', 'IDENTITY_QUERY'],
      'INFORMATION_REQUEST': ['HELP_REQUEST', 'KNOWLEDGE_REQUEST'],
      'HELP_REQUEST': ['INFORMATION_REQUEST', 'KNOWLEDGE_REQUEST']
    };
    
    return intentRelations[intent] || [];
  }

  /**
   * Reset conversation context (for new conversations)
   */
  resetContext(): void {
    this.context = {
      currentTopic: null,
      activeIntents: [],
      entityMemory: new Map(),
      conversationGoals: [],
      userPreferences: {},
      conversationHistory: []
    };
    this.activeIntents.clear();
    console.log('🔄 Pragmatic context reset');
  }

  /**
   * Find the most recent entity that could be referenced by a pronoun
   */
  private findRecentEntityForPronoun(pronoun: string): string | null {
    // Look through recent conversation history for entity queries
    const recentTurns = this.context.conversationHistory.slice(-3);
    
    for (let i = recentTurns.length - 1; i >= 0; i--) {
      const turn = recentTurns[i];
      
      // Look for entity queries that would establish context
      if (turn.intent === 'ENTITY_QUERY') {
        const entityKeys = Object.keys(turn.entities);
        for (const key of entityKeys) {
          const entityValue = turn.entities[key];
          if (typeof entityValue === 'string' && entityValue.length > 2) {
            // Check if this entity type makes sense for the pronoun
            if (pronoun === 'her' && this.isFemalePronounEntity(entityValue)) {
              return entityValue;
            } else if (pronoun === 'his' && this.isMalePronounEntity(entityValue)) {
              return entityValue;
            } else if (entityValue !== 'is' && entityValue !== 'name') {
              // Default to the entity if no gender-specific match
              return entityValue;
            }
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Check if entity type typically uses female pronouns
   */
  private isFemalePronounEntity(entityType: string): boolean {
    const femaleEntities = ['wife', 'mother', 'sister', 'daughter', 'girlfriend', 'aunt', 'grandmother'];
    return femaleEntities.includes(entityType.toLowerCase());
  }
  
  /**
   * Check if entity type typically uses male pronouns
   */
  private isMalePronounEntity(entityType: string): boolean {
    const maleEntities = ['husband', 'father', 'brother', 'son', 'boyfriend', 'uncle', 'grandfather'];
    return maleEntities.includes(entityType.toLowerCase());
  }

  /**
   * Get debug information about current context
   */
  getDebugInfo(): any {
    return {
      currentTopic: this.context.currentTopic,
      activeIntents: this.context.activeIntents,
      entityMemorySize: this.context.entityMemory.size,
      entityMemory: Object.fromEntries(this.context.entityMemory),
      conversationGoals: this.context.conversationGoals,
      historyLength: this.context.conversationHistory.length,
      activeIntentStates: Object.fromEntries(this.activeIntents)
    };
  }
}
