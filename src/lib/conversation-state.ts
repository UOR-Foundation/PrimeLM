// =============================================================================
// UNIFIED CONVERSATION STATE MANAGER
// =============================================================================

import { UnifiedEntityMemory, EntityInfo } from './entity-memory';

export interface ConversationTurn {
  id: string;
  timestamp: number;
  speaker: 'human' | 'chatbot';
  text: string;
  intent: string;
  entities: Record<string, any>;
  semanticContext: any;
  primeFactors: Record<number, number>;
  embeddings: number[];
  metadata: Record<string, any>;
}

export interface ConversationMetrics {
  totalTurns: number;
  averageResponseTime: number;
  coherenceScore: number;
  topicContinuity: number;
  engagementLevel: number;
}

export interface ConversationConfig {
  maxHistoryLength: number;
  maxContextWindow: number;
  coherenceThreshold: number;
  similarityThreshold: number;
  cleanupInterval: number;
  memoryRetentionHours: number;
}

export class ConversationStateManager {
  private entityMemory: UnifiedEntityMemory;
  private conversationHistory: ConversationTurn[] = [];
  private currentTopic: string | null = null;
  private activeIntents: string[] = [];
  private conversationGoals: string[] = [];
  private userPreferences: Record<string, any> = {};
  private config: ConversationConfig;
  private metrics: ConversationMetrics;
  private lastCleanup: number = Date.now();

  constructor(config: Partial<ConversationConfig> = {}) {
    this.config = {
      maxHistoryLength: 50,
      maxContextWindow: 10,
      coherenceThreshold: 0.1,
      similarityThreshold: 0.3,
      cleanupInterval: 30 * 60 * 1000, // 30 minutes
      memoryRetentionHours: 24,
      ...config
    };

    this.entityMemory = new UnifiedEntityMemory();
    this.metrics = {
      totalTurns: 0,
      averageResponseTime: 0,
      coherenceScore: 0,
      topicContinuity: 0,
      engagementLevel: 0
    };
  }

  /**
   * Add a new conversation turn
   */
  addTurn(turnData: Partial<ConversationTurn>): ConversationTurn {
    const turn: ConversationTurn = {
      id: `turn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      speaker: turnData.speaker || 'human',
      text: turnData.text || '',
      intent: turnData.intent || 'GENERAL_CONVERSATION',
      entities: turnData.entities || {},
      semanticContext: turnData.semanticContext || {},
      primeFactors: turnData.primeFactors || {},
      embeddings: turnData.embeddings || [],
      metadata: turnData.metadata || {}
    };

    this.conversationHistory.push(turn);
    this.metrics.totalTurns++;

    // Process entities from this turn
    this.processEntities(turn);

    // Update conversation state
    this.updateConversationState(turn);

    // Maintain history length
    this.maintainHistoryLength();

    // Periodic cleanup
    this.periodicCleanup();

    console.log(`📝 Added conversation turn: ${turn.speaker} - "${turn.text.substring(0, 50)}..."`);

    return turn;
  }

  /**
   * Process entities from conversation turn
   */
  private processEntities(turn: ConversationTurn): void {
    const { entities, intent, text, speaker } = turn;

    // Process each entity based on intent and context
    Object.entries(entities).forEach(([key, value]) => {
      if (!value || typeof value !== 'string') return;

      let entityInfo: Partial<EntityInfo> = {
        value,
        context: [text],
        metadata: { 
          turnId: turn.id, 
          speaker, 
          intent,
          originalKey: key 
        }
      };

      // Determine entity type and relationship based on intent and patterns
      switch (intent) {
        case 'IDENTITY_INTRODUCTION':
          if (key.includes('entity_0') || entities.length === 1) {
            entityInfo.type = 'identity';
            entityInfo.subject = 'user';
          }
          break;

        case 'ENTITY_INTRODUCTION':
          if (Object.keys(entities).length === 2) {
            const entityKeys = Object.keys(entities);
            const entityType = entities[entityKeys[0]];
            const entityName = entities[entityKeys[1]];
            
            if (entityType && entityName && entityName[0].toUpperCase() === entityName[0]) {
              entityInfo = {
                value: entityName,
                type: 'relationship',
                relationship: 'hasName',
                subject: entityType,
                entityType: this.inferEntityType(entityType),
                context: [text],
                metadata: { turnId: turn.id, speaker, intent }
              };
            }
          }
          break;

        case 'ENTITY_QUERY':
          // Don't store query entities, just mark them as references
          entityInfo.type = 'reference';
          entityInfo.confidence = 0.5;
          break;

        default:
          // Handle pronoun references and other patterns
          if (this.isPronounReference(text, value)) {
            const referencedEntity = this.resolvePronouns(text, turn);
            if (referencedEntity) {
              entityInfo.type = 'relationship';
              entityInfo.relationship = 'hasName';
              entityInfo.subject = referencedEntity;
            }
          }
      }

      // Store entity
      this.entityMemory.store(entityInfo);
    });
  }

  /**
   * Check if text contains pronoun references
   */
  private isPronounReference(text: string, value: string): boolean {
    const pronouns = ['her', 'his', 'their', 'its'];
    const lowerText = text.toLowerCase();
    return pronouns.some(pronoun => lowerText.includes(pronoun)) && 
           lowerText.includes('name');
  }

  /**
   * Resolve pronoun references to entities
   */
  private resolvePronouns(text: string, currentTurn: ConversationTurn): string | null {
    const lowerText = text.toLowerCase();
    
    // Look for recent entity queries that establish context
    const recentTurns = this.getRecentHistory(3);
    
    for (let i = recentTurns.length - 1; i >= 0; i--) {
      const turn = recentTurns[i];
      if (turn.intent === 'ENTITY_QUERY') {
        const entityKeys = Object.keys(turn.entities);
        for (const key of entityKeys) {
          const entityValue = turn.entities[key];
          if (typeof entityValue === 'string' && entityValue.length > 2) {
            // Check gender matching
            if (lowerText.includes('her') && this.isFemalePronounEntity(entityValue)) {
              return entityValue;
            } else if (lowerText.includes('his') && this.isMalePronounEntity(entityValue)) {
              return entityValue;
            } else if (entityValue !== 'is' && entityValue !== 'name') {
              return entityValue;
            }
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Check if entity type uses female pronouns
   */
  private isFemalePronounEntity(entityType: string): boolean {
    const femaleEntities = ['wife', 'mother', 'sister', 'daughter', 'girlfriend', 'aunt', 'grandmother'];
    return femaleEntities.includes(entityType.toLowerCase());
  }

  /**
   * Check if entity type uses male pronouns
   */
  private isMalePronounEntity(entityType: string): boolean {
    const maleEntities = ['husband', 'father', 'brother', 'son', 'boyfriend', 'uncle', 'grandfather'];
    return maleEntities.includes(entityType.toLowerCase());
  }

  /**
   * Infer entity type from string
   */
  private inferEntityType(entityType: string): string | undefined {
    const animalTypes = ['dog', 'cat', 'bird', 'fish', 'pet', 'animal'];
    const vehicleTypes = ['car', 'truck', 'bike', 'motorcycle', 'vehicle'];
    const personTypes = ['wife', 'husband', 'brother', 'sister', 'friend', 'mother', 'father'];
    
    const lowerType = entityType.toLowerCase();
    
    if (animalTypes.includes(lowerType)) return 'Animal';
    if (vehicleTypes.includes(lowerType)) return 'Vehicle';
    if (personTypes.includes(lowerType)) return 'Person';
    
    return undefined;
  }

  /**
   * Update conversation state based on new turn
   */
  private updateConversationState(turn: ConversationTurn): void {
    // Update active intents
    this.updateActiveIntents(turn.intent);
    
    // Update current topic
    this.updateCurrentTopic(turn);
    
    // Update conversation goals
    this.updateConversationGoals(turn);
    
    // Update metrics
    this.updateMetrics(turn);
  }

  /**
   * Update active intents with decay
   */
  private updateActiveIntents(newIntent: string): void {
    // Add new intent if not already active
    if (!this.activeIntents.includes(newIntent)) {
      this.activeIntents.unshift(newIntent);
    } else {
      // Move to front if already exists
      this.activeIntents = [newIntent, ...this.activeIntents.filter(i => i !== newIntent)];
    }
    
    // Keep only recent intents
    this.activeIntents = this.activeIntents.slice(0, 5);
  }

  /**
   * Update current topic based on turn
   */
  private updateCurrentTopic(turn: ConversationTurn): void {
    const { intent, entities, text } = turn;
    
    let newTopic: string | null = null;
    
    if (intent === 'ENTITY_INTRODUCTION' || intent === 'ENTITY_QUERY') {
      const entityValues = Object.values(entities);
      if (entityValues.length > 0) {
        newTopic = `${entityValues[0]}_discussion`;
      }
    } else if (intent === 'IDENTITY_INTRODUCTION' || intent === 'IDENTITY_QUERY') {
      newTopic = 'identity_discussion';
    } else if (intent === 'GREETING') {
      newTopic = 'greeting_exchange';
    } else if (intent === 'HELP_REQUEST') {
      newTopic = 'assistance_request';
    } else if (intent === 'INFORMATION_REQUEST') {
      const keywords = this.extractKeywords(text);
      if (keywords.length > 0) {
        newTopic = `${keywords[0]}_information`;
      }
    }
    
    if (newTopic && newTopic !== this.currentTopic) {
      this.currentTopic = newTopic;
    }
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word))
      .slice(0, 3);
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = ['what', 'when', 'where', 'how', 'why', 'who', 'this', 'that', 'with', 'from'];
    return stopWords.includes(word);
  }

  /**
   * Update conversation goals
   */
  private updateConversationGoals(turn: ConversationTurn): void {
    const { intent } = turn;
    
    switch (intent) {
      case 'HELP_REQUEST':
        if (!this.conversationGoals.includes('provide_assistance')) {
          this.conversationGoals.push('provide_assistance');
        }
        break;
      case 'INFORMATION_REQUEST':
        if (!this.conversationGoals.includes('provide_information')) {
          this.conversationGoals.push('provide_information');
        }
        break;
      case 'IDENTITY_INTRODUCTION':
        if (!this.conversationGoals.includes('build_rapport')) {
          this.conversationGoals.push('build_rapport');
        }
        break;
      case 'ENTITY_INTRODUCTION':
        if (!this.conversationGoals.includes('learn_about_user')) {
          this.conversationGoals.push('learn_about_user');
        }
        break;
    }
    
    // Keep goals manageable
    if (this.conversationGoals.length > 5) {
      this.conversationGoals = this.conversationGoals.slice(-5);
    }
  }

  /**
   * Update conversation metrics
   */
  private updateMetrics(turn: ConversationTurn): void {
    // Calculate coherence with previous turns
    if (this.conversationHistory.length > 1) {
      const previousTurn = this.conversationHistory[this.conversationHistory.length - 2];
      this.metrics.coherenceScore = this.calculateCoherence(turn, previousTurn);
    }
    
    // Calculate topic continuity
    this.metrics.topicContinuity = this.calculateTopicContinuity();
    
    // Update engagement level based on turn frequency and content
    this.metrics.engagementLevel = this.calculateEngagementLevel();
  }

  /**
   * Calculate coherence between turns
   */
  private calculateCoherence(turn1: ConversationTurn, turn2: ConversationTurn): number {
    // Simple coherence based on shared entities and intent similarity
    const sharedEntities = this.countSharedEntities(turn1.entities, turn2.entities);
    const intentSimilarity = turn1.intent === turn2.intent ? 1 : 0;
    
    return (sharedEntities * 0.7 + intentSimilarity * 0.3);
  }

  /**
   * Count shared entities between two entity sets
   */
  private countSharedEntities(entities1: Record<string, any>, entities2: Record<string, any>): number {
    const values1 = new Set(Object.values(entities1).map(v => String(v).toLowerCase()));
    const values2 = new Set(Object.values(entities2).map(v => String(v).toLowerCase()));
    
    let shared = 0;
    for (const value of values1) {
      if (values2.has(value)) shared++;
    }
    
    return Math.min(shared / Math.max(values1.size, values2.size, 1), 1);
  }

  /**
   * Calculate topic continuity
   */
  private calculateTopicContinuity(): number {
    if (this.conversationHistory.length < 3) return 1;
    
    const recentTurns = this.conversationHistory.slice(-5);
    const topics = recentTurns.map(turn => this.extractTopicFromTurn(turn));
    
    let continuity = 0;
    for (let i = 1; i < topics.length; i++) {
      if (topics[i] === topics[i-1]) continuity++;
    }
    
    return continuity / (topics.length - 1);
  }

  /**
   * Extract topic from turn
   */
  private extractTopicFromTurn(turn: ConversationTurn): string {
    if (turn.intent === 'ENTITY_INTRODUCTION' || turn.intent === 'ENTITY_QUERY') {
      const entityValues = Object.values(turn.entities);
      return entityValues.length > 0 ? String(entityValues[0]) : 'general';
    }
    return turn.intent;
  }

  /**
   * Calculate engagement level
   */
  private calculateEngagementLevel(): number {
    if (this.conversationHistory.length < 2) return 0.5;
    
    const recentTurns = this.conversationHistory.slice(-10);
    const avgTurnLength = recentTurns.reduce((sum, turn) => sum + turn.text.length, 0) / recentTurns.length;
    const turnFrequency = recentTurns.length / Math.max((Date.now() - recentTurns[0].timestamp) / 60000, 1); // turns per minute
    
    // Normalize and combine metrics
    const lengthScore = Math.min(avgTurnLength / 50, 1); // Normalize to 50 chars
    const frequencyScore = Math.min(turnFrequency / 2, 1); // Normalize to 2 turns per minute
    
    return (lengthScore * 0.6 + frequencyScore * 0.4);
  }

  /**
   * Maintain conversation history length
   */
  private maintainHistoryLength(): void {
    if (this.conversationHistory.length > this.config.maxHistoryLength) {
      const removed = this.conversationHistory.splice(0, this.conversationHistory.length - this.config.maxHistoryLength);
      console.log(`🗂️ Archived ${removed.length} conversation turns`);
    }
  }

  /**
   * Periodic cleanup of old data
   */
  private periodicCleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup > this.config.cleanupInterval) {
      this.performCleanup();
      this.lastCleanup = now;
    }
  }

  /**
   * Perform cleanup of old data
   */
  private performCleanup(): void {
    const cutoffTime = Date.now() - (this.config.memoryRetentionHours * 60 * 60 * 1000);
    
    // Clean old conversation turns
    const originalLength = this.conversationHistory.length;
    this.conversationHistory = this.conversationHistory.filter(turn => turn.timestamp > cutoffTime);
    
    if (this.conversationHistory.length < originalLength) {
      console.log(`🧹 Cleaned ${originalLength - this.conversationHistory.length} old conversation turns`);
    }
  }

  // =============================================================================
  // PUBLIC API METHODS
  // =============================================================================

  /**
   * Get recent conversation history
   */
  getRecentHistory(count: number = 5): ConversationTurn[] {
    return this.conversationHistory.slice(-count);
  }

  /**
   * Get conversation context for response generation
   */
  getConversationContext(): {
    recentHistory: ConversationTurn[];
    currentTopic: string | null;
    activeIntents: string[];
    conversationGoals: string[];
    entityMemory: UnifiedEntityMemory;
    metrics: ConversationMetrics;
  } {
    return {
      recentHistory: this.getRecentHistory(this.config.maxContextWindow),
      currentTopic: this.currentTopic,
      activeIntents: [...this.activeIntents],
      conversationGoals: [...this.conversationGoals],
      entityMemory: this.entityMemory,
      metrics: { ...this.metrics }
    };
  }

  /**
   * Query entity memory
   */
  queryEntities(criteria: any): EntityInfo[] {
    return this.entityMemory.query(criteria);
  }

  /**
   * Get user name
   */
  getUserName(): string | null {
    return this.entityMemory.getUserName();
  }

  /**
   * Get entity name by type
   */
  getEntityName(entityType: string): string | null {
    return this.entityMemory.getEntityName(entityType);
  }

  /**
   * Get conversation statistics
   */
  getStats(): {
    conversation: ConversationMetrics;
    entities: any;
    config: ConversationConfig;
  } {
    return {
      conversation: this.metrics,
      entities: this.entityMemory.getStats(),
      config: this.config
    };
  }

  /**
   * Reset conversation state
   */
  reset(): void {
    this.conversationHistory = [];
    this.currentTopic = null;
    this.activeIntents = [];
    this.conversationGoals = [];
    this.userPreferences = {};
    this.entityMemory.clear();
    this.metrics = {
      totalTurns: 0,
      averageResponseTime: 0,
      coherenceScore: 0,
      topicContinuity: 0,
      engagementLevel: 0
    };
    console.log('🔄 Conversation state reset');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ConversationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Conversation config updated');
  }
}
