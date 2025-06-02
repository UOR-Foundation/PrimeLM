// =============================================================================
// DISCOURSE LAYER - Conversation Flow and Topic Management
// =============================================================================

import { SchemaVocabulary } from '../semantic/schema-vocabulary';
import { ConversationContext } from './pragmatic-layer';

export interface TopicState {
  currentTopic: string;
  topicHistory: string[];
  topicTransitions: Map<string, string[]>;
  topicDepth: number;
  topicCoherence: number;
}

export interface ConversationFlow {
  currentPhase: 'opening' | 'exploration' | 'deepening' | 'transition' | 'closing';
  turnsSincePhaseChange: number;
  expectedNextMoves: string[];
  conversationMomentum: number;
}

export interface ReferenceResolution {
  pronouns: Map<string, string>;
  entityReferences: Map<string, any>;
  contextualReferences: Map<string, any>;
}

export class DiscourseLayer {
  private schemaVocabulary: SchemaVocabulary;
  private topicState: TopicState;
  private conversationFlow: ConversationFlow;
  private referenceResolution: ReferenceResolution;

  constructor(schemaVocabulary: SchemaVocabulary) {
    this.schemaVocabulary = schemaVocabulary;
    
    this.topicState = {
      currentTopic: '',
      topicHistory: [],
      topicTransitions: new Map(),
      topicDepth: 0,
      topicCoherence: 0
    };

    this.conversationFlow = {
      currentPhase: 'opening',
      turnsSincePhaseChange: 0,
      expectedNextMoves: ['greeting', 'introduction', 'question'],
      conversationMomentum: 0
    };

    this.referenceResolution = {
      pronouns: new Map(),
      entityReferences: new Map(),
      contextualReferences: new Map()
    };
  }

  /**
   * Analyze conversation flow and determine discourse context
   */
  analyzeDiscourseContext(
    input: string,
    semanticContext: any,
    pragmaticContext: ConversationContext
  ): {
    topicContinuity: number;
    conversationPhase: string;
    expectedResponseType: string;
    discourseMarkers: string[];
    referenceResolutions: Map<string, any>;
  } {
    console.log('💬 Analyzing discourse context...');

    // Update topic tracking
    this.updateTopicState(input, semanticContext, pragmaticContext);
    
    // Update conversation flow
    this.updateConversationFlow(input, semanticContext, pragmaticContext);
    
    // Resolve references
    this.updateReferenceResolution(input, pragmaticContext);

    // Calculate topic continuity
    const topicContinuity = this.calculateTopicContinuity(input, semanticContext);
    
    // Detect discourse markers
    const discourseMarkers = this.detectDiscourseMarkers(input);
    
    // Determine expected response type
    const expectedResponseType = this.determineExpectedResponseType(
      semanticContext, 
      this.conversationFlow.currentPhase
    );

    console.log('💬 Discourse analysis:', {
      currentTopic: this.topicState.currentTopic,
      conversationPhase: this.conversationFlow.currentPhase,
      topicContinuity,
      expectedResponseType
    });

    return {
      topicContinuity,
      conversationPhase: this.conversationFlow.currentPhase,
      expectedResponseType,
      discourseMarkers,
      referenceResolutions: this.referenceResolution.entityReferences
    };
  }

  /**
   * Update topic state based on current input
   */
  private updateTopicState(
    input: string,
    semanticContext: any,
    pragmaticContext: ConversationContext
  ): void {
    // Extract potential topics from input
    const inputTopics = this.extractTopicsFromInput(input, semanticContext);
    
    if (inputTopics.length > 0) {
      const newTopic = inputTopics[0];
      
      // Check if this is a topic transition
      if (this.topicState.currentTopic && this.topicState.currentTopic !== newTopic) {
        // Record topic transition
        if (!this.topicState.topicTransitions.has(this.topicState.currentTopic)) {
          this.topicState.topicTransitions.set(this.topicState.currentTopic, []);
        }
        this.topicState.topicTransitions.get(this.topicState.currentTopic)!.push(newTopic);
        
        // Add current topic to history
        this.topicState.topicHistory.push(this.topicState.currentTopic);
        this.topicState.topicDepth = 0; // Reset depth for new topic
      } else if (this.topicState.currentTopic === newTopic) {
        // Continuing same topic - increase depth
        this.topicState.topicDepth++;
      }
      
      this.topicState.currentTopic = newTopic;
    }

    // Calculate topic coherence
    this.topicState.topicCoherence = this.calculateTopicCoherence(pragmaticContext);
  }

  /**
   * Extract topics from input using semantic analysis
   */
  private extractTopicsFromInput(input: string, semanticContext: any): string[] {
    const topics: string[] = [];
    
    // Use semantic entities as topic indicators
    if (semanticContext.entities && semanticContext.entities.length > 0) {
      semanticContext.entities.forEach((entity: string) => {
        const entityType = this.schemaVocabulary.inferEntityType(entity);
        if (entityType) {
          topics.push(`${entityType.toLowerCase()}_discussion`);
        } else {
          topics.push(`${entity}_topic`);
        }
      });
    }

    // Use intent as topic indicator
    if (semanticContext.intent) {
      switch (semanticContext.intent) {
        case 'IDENTITY_INTRODUCTION':
        case 'IDENTITY_QUERY':
          topics.push('identity_discussion');
          break;
        case 'HELP_REQUEST':
          topics.push('assistance_request');
          break;
        case 'INFORMATION_REQUEST':
          topics.push('information_seeking');
          break;
        case 'GREETING':
          topics.push('social_interaction');
          break;
      }
    }

    return topics;
  }

  /**
   * Update conversation flow state
   */
  private updateConversationFlow(
    input: string,
    semanticContext: any,
    pragmaticContext: ConversationContext
  ): void {
    this.conversationFlow.turnsSincePhaseChange++;
    
    const currentPhase = this.conversationFlow.currentPhase;
    let newPhase = currentPhase;

    // Determine conversation phase transitions
    switch (currentPhase) {
      case 'opening':
        if (semanticContext.intent === 'IDENTITY_INTRODUCTION' || 
            semanticContext.intent === 'ENTITY_INTRODUCTION') {
          newPhase = 'exploration';
        } else if (this.conversationFlow.turnsSincePhaseChange > 3) {
          newPhase = 'exploration';
        }
        break;
        
      case 'exploration':
        if (this.topicState.topicDepth > 2) {
          newPhase = 'deepening';
        } else if (this.hasTopicTransition()) {
          newPhase = 'transition';
        }
        break;
        
      case 'deepening':
        if (this.hasTopicTransition()) {
          newPhase = 'transition';
        } else if (this.conversationFlow.turnsSincePhaseChange > 8) {
          newPhase = 'transition';
        }
        break;
        
      case 'transition':
        if (this.topicState.topicDepth > 0) {
          newPhase = 'exploration';
        } else if (this.conversationFlow.turnsSincePhaseChange > 2) {
          newPhase = 'exploration';
        }
        break;
    }

    if (newPhase !== currentPhase) {
      this.conversationFlow.currentPhase = newPhase;
      this.conversationFlow.turnsSincePhaseChange = 0;
      this.updateExpectedNextMoves(newPhase);
    }

    // Update conversation momentum
    this.updateConversationMomentum(semanticContext, pragmaticContext);
  }

  /**
   * Check if there's been a topic transition
   */
  private hasTopicTransition(): boolean {
    return this.topicState.topicHistory.length > 0 && 
           this.topicState.topicDepth === 0;
  }

  /**
   * Update expected next moves based on conversation phase
   */
  private updateExpectedNextMoves(phase: string): void {
    switch (phase) {
      case 'opening':
        this.conversationFlow.expectedNextMoves = ['greeting', 'introduction', 'question'];
        break;
      case 'exploration':
        this.conversationFlow.expectedNextMoves = ['information_sharing', 'question', 'elaboration'];
        break;
      case 'deepening':
        this.conversationFlow.expectedNextMoves = ['detailed_explanation', 'follow_up', 'clarification'];
        break;
      case 'transition':
        this.conversationFlow.expectedNextMoves = ['topic_change', 'summary', 'new_question'];
        break;
      case 'closing':
        this.conversationFlow.expectedNextMoves = ['farewell', 'summary', 'future_reference'];
        break;
    }
  }

  /**
   * Update conversation momentum
   */
  private updateConversationMomentum(semanticContext: any, pragmaticContext: ConversationContext): void {
    let momentum = this.conversationFlow.conversationMomentum;
    
    // Increase momentum for active engagement
    if (semanticContext.intent === 'QUESTION' || 
        semanticContext.intent === 'INFORMATION_REQUEST') {
      momentum += 0.2;
    }
    
    // Increase momentum for entity introductions
    if (semanticContext.intent === 'ENTITY_INTRODUCTION' || 
        semanticContext.intent === 'IDENTITY_INTRODUCTION') {
      momentum += 0.3;
    }
    
    // Decrease momentum for generic responses
    if (semanticContext.intent === 'GENERAL_CONVERSATION' && 
        semanticContext.entities.length === 0) {
      momentum -= 0.1;
    }
    
    // Momentum decay over time
    momentum *= 0.95;
    
    this.conversationFlow.conversationMomentum = Math.max(0, Math.min(1, momentum));
  }

  /**
   * Update reference resolution
   */
  private updateReferenceResolution(input: string, pragmaticContext: ConversationContext): void {
    // Resolve pronouns to entities
    this.resolvePronounReferences(input, pragmaticContext);
    
    // Update entity references
    this.updateEntityReferences(input, pragmaticContext);
    
    // Update contextual references
    this.updateContextualReferences(input, pragmaticContext);
  }

  /**
   * Resolve pronoun references
   */
  private resolvePronounReferences(input: string, pragmaticContext: ConversationContext): void {
    const pronouns = ['it', 'he', 'she', 'they', 'that', 'this'];
    
    pronouns.forEach(pronoun => {
      if (input.toLowerCase().includes(pronoun)) {
        // Find most recent relevant entity
        const recentEntity = this.findMostRecentEntity(pragmaticContext, pronoun);
        if (recentEntity) {
          this.referenceResolution.pronouns.set(pronoun, recentEntity);
        }
      }
    });
  }

  /**
   * Find most recent relevant entity for pronoun resolution
   */
  private findMostRecentEntity(pragmaticContext: ConversationContext, pronoun: string): string | null {
    // Look through recent conversation history for entities
    const recentTurns = pragmaticContext.conversationHistory.slice(-5);
    
    for (let i = recentTurns.length - 1; i >= 0; i--) {
      const turn = recentTurns[i];
      if (Object.keys(turn.entities).length > 0) {
        // Return the first entity found (most recent)
        return Object.values(turn.entities)[0] as string;
      }
    }
    
    return null;
  }

  /**
   * Update entity references
   */
  private updateEntityReferences(input: string, pragmaticContext: ConversationContext): void {
    // Track entity mentions and their contexts
    for (const [key, entity] of pragmaticContext.entityMemory) {
      if (input.toLowerCase().includes(entity.value.toLowerCase())) {
        this.referenceResolution.entityReferences.set(entity.value, {
          type: entity.entityType || 'unknown',
          lastMentioned: Date.now(),
          context: input
        });
      }
    }
  }

  /**
   * Update contextual references
   */
  private updateContextualReferences(input: string, pragmaticContext: ConversationContext): void {
    // Track references to previous topics or concepts
    this.topicState.topicHistory.forEach(topic => {
      if (input.toLowerCase().includes(topic.toLowerCase())) {
        this.referenceResolution.contextualReferences.set(topic, {
          referenceType: 'topic_callback',
          originalContext: topic,
          currentMention: input
        });
      }
    });
  }

  /**
   * Calculate topic continuity score
   */
  private calculateTopicContinuity(input: string, semanticContext: any): number {
    if (!this.topicState.currentTopic) return 0;
    
    let continuity = 0;
    
    // Check for topic-related keywords
    const topicKeywords = this.getTopicKeywords(this.topicState.currentTopic);
    const inputWords = input.toLowerCase().split(/\W+/);
    
    const matchingKeywords = inputWords.filter(word => 
      topicKeywords.includes(word)
    ).length;
    
    continuity = matchingKeywords / Math.max(topicKeywords.length, 1);
    
    // Boost continuity for entity references
    if (semanticContext.entities && semanticContext.entities.length > 0) {
      continuity += 0.3;
    }
    
    return Math.min(1, continuity);
  }

  /**
   * Get keywords associated with a topic
   */
  private getTopicKeywords(topic: string): string[] {
    const topicKeywordMap: Record<string, string[]> = {
      'identity_discussion': ['name', 'identity', 'who', 'person', 'individual'],
      'animal_discussion': ['dog', 'cat', 'pet', 'animal', 'breed', 'species'],
      'vehicle_discussion': ['car', 'truck', 'vehicle', 'drive', 'transportation'],
      'assistance_request': ['help', 'assist', 'support', 'aid', 'guidance'],
      'information_seeking': ['what', 'how', 'why', 'when', 'where', 'question'],
      'social_interaction': ['hello', 'hi', 'greeting', 'nice', 'meet']
    };
    
    return topicKeywordMap[topic] || [];
  }

  /**
   * Calculate topic coherence
   */
  private calculateTopicCoherence(pragmaticContext: ConversationContext): number {
    if (pragmaticContext.conversationHistory.length < 2) return 1;
    
    const recentTurns = pragmaticContext.conversationHistory.slice(-5);
    let coherenceScore = 0;
    
    // Check for consistent entity references
    const entityCounts = new Map<string, number>();
    recentTurns.forEach(turn => {
      Object.values(turn.entities).forEach(entity => {
        const entityStr = entity as string;
        entityCounts.set(entityStr, (entityCounts.get(entityStr) || 0) + 1);
      });
    });
    
    // Higher coherence for repeated entity references
    const maxEntityCount = Math.max(...Array.from(entityCounts.values()), 0);
    coherenceScore = maxEntityCount / recentTurns.length;
    
    return Math.min(1, coherenceScore);
  }

  /**
   * Detect discourse markers in input
   */
  private detectDiscourseMarkers(input: string): string[] {
    const markers: string[] = [];
    const lowerInput = input.toLowerCase();
    
    const discourseMarkerPatterns = {
      'topic_shift': ['anyway', 'by the way', 'speaking of', 'that reminds me'],
      'elaboration': ['also', 'furthermore', 'in addition', 'moreover'],
      'contrast': ['but', 'however', 'on the other hand', 'although'],
      'conclusion': ['so', 'therefore', 'in conclusion', 'to summarize'],
      'clarification': ['i mean', 'that is', 'in other words', 'specifically'],
      'sequence': ['first', 'then', 'next', 'finally', 'after that']
    };
    
    Object.entries(discourseMarkerPatterns).forEach(([markerType, patterns]) => {
      patterns.forEach(pattern => {
        if (lowerInput.includes(pattern)) {
          markers.push(markerType);
        }
      });
    });
    
    return [...new Set(markers)]; // Remove duplicates
  }

  /**
   * Determine expected response type based on context
   */
  private determineExpectedResponseType(semanticContext: any, conversationPhase: string): string {
    // Base response type on semantic intent
    let responseType = 'acknowledgment';
    
    switch (semanticContext.intent) {
      case 'QUESTION':
      case 'INFORMATION_REQUEST':
      case 'IDENTITY_QUERY':
      case 'ENTITY_QUERY':
      case 'BOT_IDENTITY_QUERY':
        responseType = 'informative_answer';
        break;
      case 'GREETING':
        responseType = 'social_response';
        break;
      case 'IDENTITY_INTRODUCTION':
      case 'ENTITY_INTRODUCTION':
        responseType = 'acknowledgment_with_followup';
        break;
      case 'HELP_REQUEST':
        responseType = 'supportive_response';
        break;
      case 'GRATITUDE':
        responseType = 'gracious_acknowledgment';
        break;
    }
    
    // Modify based on conversation phase
    switch (conversationPhase) {
      case 'opening':
        if (responseType === 'acknowledgment') {
          responseType = 'welcoming_response';
        }
        break;
      case 'deepening':
        if (responseType === 'informative_answer') {
          responseType = 'detailed_explanation';
        }
        break;
      case 'transition':
        // Don't override query responses in transition phase
        if (responseType !== 'informative_answer') {
          responseType = 'transitional_response';
        }
        break;
    }
    
    return responseType;
  }

  /**
   * Get current discourse state for response generation
   */
  getDiscourseState(): {
    topicState: TopicState;
    conversationFlow: ConversationFlow;
    referenceResolution: ReferenceResolution;
  } {
    return {
      topicState: { ...this.topicState },
      conversationFlow: { ...this.conversationFlow },
      referenceResolution: {
        pronouns: new Map(this.referenceResolution.pronouns),
        entityReferences: new Map(this.referenceResolution.entityReferences),
        contextualReferences: new Map(this.referenceResolution.contextualReferences)
      }
    };
  }

  /**
   * Reset discourse state for new conversation
   */
  resetDiscourseState(): void {
    this.topicState = {
      currentTopic: '',
      topicHistory: [],
      topicTransitions: new Map(),
      topicDepth: 0,
      topicCoherence: 0
    };

    this.conversationFlow = {
      currentPhase: 'opening',
      turnsSincePhaseChange: 0,
      expectedNextMoves: ['greeting', 'introduction', 'question'],
      conversationMomentum: 0
    };

    this.referenceResolution = {
      pronouns: new Map(),
      entityReferences: new Map(),
      contextualReferences: new Map()
    };
  }
}
