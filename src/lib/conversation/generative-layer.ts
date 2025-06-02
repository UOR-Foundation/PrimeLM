// =============================================================================
// GENERATIVE LAYER - Dynamic Natural Language Generation
// =============================================================================

import { SchemaVocabulary } from '../semantic/schema-vocabulary';
import { ConversationContext } from './pragmatic-layer';

export interface GenerationContext {
  responseType: string;
  semanticContext: any;
  discourseContext: any;
  pragmaticContext: ConversationContext;
  primeResonance: any;
}

export interface ResponseComponents {
  opening: string;
  core: string;
  followup: string;
  closing: string;
}

export interface GenerationStyle {
  formality: 'casual' | 'neutral' | 'formal';
  enthusiasm: 'low' | 'medium' | 'high';
  verbosity: 'concise' | 'moderate' | 'detailed';
  personality: 'helpful' | 'analytical' | 'friendly' | 'professional';
}

export class GenerativeLayer {
  private schemaVocabulary: SchemaVocabulary;
  private defaultStyle: GenerationStyle;

  constructor(schemaVocabulary: SchemaVocabulary) {
    this.schemaVocabulary = schemaVocabulary;
    
    this.defaultStyle = {
      formality: 'neutral',
      enthusiasm: 'medium',
      verbosity: 'moderate',
      personality: 'helpful'
    };
  }

  /**
   * Generate dynamic response based on context
   */
  generateResponse(context: GenerationContext): string {
    console.log('🎨 Generating dynamic response...');
    console.log('Response type:', context.responseType);
    console.log('Conversation phase:', context.discourseContext?.conversationPhase);

    // Determine generation style based on context
    const style = this.determineGenerationStyle(context);
    
    // Generate response components
    const components = this.generateResponseComponents(context, style);
    
    // Assemble final response
    const response = this.assembleResponse(components, style);
    
    console.log('🎨 Generated response:', response);
    
    return response;
  }

  /**
   * Determine generation style based on context
   */
  private determineGenerationStyle(context: GenerationContext): GenerationStyle {
    let style = { ...this.defaultStyle };
    
    // Adjust formality based on conversation phase
    switch (context.discourseContext?.conversationPhase) {
      case 'opening':
        style.formality = 'neutral';
        style.enthusiasm = 'medium';
        break;
      case 'exploration':
        style.formality = 'casual';
        style.enthusiasm = 'medium';
        break;
      case 'deepening':
        style.formality = 'neutral';
        style.verbosity = 'detailed';
        break;
      case 'transition':
        style.enthusiasm = 'low';
        style.verbosity = 'concise';
        break;
    }
    
    // Adjust based on semantic intent
    switch (context.semanticContext?.intent) {
      case 'GREETING':
        style.enthusiasm = 'high';
        style.personality = 'friendly';
        break;
      case 'HELP_REQUEST':
        style.personality = 'helpful';
        style.enthusiasm = 'medium';
        break;
      case 'INFORMATION_REQUEST':
      case 'QUESTION':
        style.personality = 'analytical';
        style.verbosity = 'detailed';
        break;
      case 'GRATITUDE':
        style.personality = 'friendly';
        style.enthusiasm = 'medium';
        break;
    }
    
    // Adjust based on conversation momentum
    if (context.discourseContext?.conversationFlow?.conversationMomentum > 0.7) {
      style.enthusiasm = 'high';
      style.verbosity = 'detailed';
    } else if (context.discourseContext?.conversationFlow?.conversationMomentum < 0.3) {
      style.enthusiasm = 'low';
      style.verbosity = 'concise';
    }
    
    return style;
  }

  /**
   * Generate response components
   */
  private generateResponseComponents(context: GenerationContext, style: GenerationStyle): ResponseComponents {
    const components: ResponseComponents = {
      opening: '',
      core: '',
      followup: '',
      closing: ''
    };

    // Generate opening based on response type and style
    components.opening = this.generateOpening(context, style);
    
    // Generate core content
    components.core = this.generateCore(context, style);
    
    // Generate followup if appropriate
    components.followup = this.generateFollowup(context, style);
    
    // Generate closing if needed
    components.closing = this.generateClosing(context, style);

    return components;
  }

  /**
   * Generate opening phrase
   */
  private generateOpening(context: GenerationContext, style: GenerationStyle): string {
    const responseType = context.responseType;
    const conversationPhase = context.discourseContext?.conversationPhase;
    
    // Opening patterns based on response type and style
    const openingPatterns: Record<string, Record<string, string[]>> = {
      'social_response': {
        'friendly': ['Hello!', 'Hi there!', 'Hey!', 'Greetings!'],
        'helpful': ['Hello!', 'Hi!', 'Welcome!'],
        'analytical': ['Hello.', 'Greetings.'],
        'professional': ['Good day.', 'Hello.']
      },
      'acknowledgment_with_followup': {
        'friendly': ['That\'s wonderful!', 'How nice!', 'Great!'],
        'helpful': ['I understand.', 'I see.', 'Got it.'],
        'analytical': ['Noted.', 'Understood.', 'I see.'],
        'professional': ['Acknowledged.', 'Understood.']
      },
      'informative_answer': {
        'friendly': ['Let me help with that!', 'I\'d be happy to explain!'],
        'helpful': ['I can help with that.', 'Let me assist you.'],
        'analytical': ['Based on my analysis,', 'From my understanding,'],
        'professional': ['I can provide that information.']
      },
      'supportive_response': {
        'friendly': ['I\'m here to help!', 'I\'d love to assist!'],
        'helpful': ['I\'m here to help.', 'I can assist you.'],
        'analytical': ['I can provide assistance.', 'I\'m available to help.'],
        'professional': ['I\'m available to assist.']
      },
      'gracious_acknowledgment': {
        'friendly': ['You\'re so welcome!', 'My pleasure!'],
        'helpful': ['You\'re welcome!', 'Happy to help!'],
        'analytical': ['You\'re welcome.', 'Glad I could help.'],
        'professional': ['You\'re welcome.']
      }
    };

    const patterns = openingPatterns[responseType]?.[style.personality] || [''];
    
    if (patterns.length === 0) return '';
    
    // Select pattern based on enthusiasm level
    let selectedPattern = patterns[0];
    if (style.enthusiasm === 'high' && patterns.length > 1) {
      selectedPattern = patterns[Math.min(1, patterns.length - 1)];
    } else if (style.enthusiasm === 'low') {
      selectedPattern = patterns[patterns.length - 1];
    }
    
    return selectedPattern;
  }

  /**
   * Generate core content
   */
  private generateCore(context: GenerationContext, style: GenerationStyle): string {
    const responseType = context.responseType;
    const semanticContext = context.semanticContext;
    const pragmaticContext = context.pragmaticContext;
    
    switch (responseType) {
      case 'social_response':
        return this.generateSocialCore(context, style);
        
      case 'acknowledgment_with_followup':
        return this.generateAcknowledgmentCore(context, style);
        
      case 'informative_answer':
        return this.generateInformativeCore(context, style);
        
      case 'supportive_response':
        return this.generateSupportiveCore(context, style);
        
      case 'gracious_acknowledgment':
        return this.generateGraciousCore(context, style);
        
      case 'welcoming_response':
        return this.generateWelcomingCore(context, style);
        
      case 'detailed_explanation':
        return this.generateDetailedCore(context, style);
        
      case 'transitional_response':
        return this.generateTransitionalCore(context, style);
        
      default:
        return this.generateDefaultCore(context, style);
    }
  }

  /**
   * Generate social response core
   */
  private generateSocialCore(context: GenerationContext, style: GenerationStyle): string {
    const botIdentity = this.getBotIdentityDescription(style);
    const capabilities = this.getCapabilityDescription(style);
    
    if (style.verbosity === 'detailed') {
      return `${botIdentity} ${capabilities}`;
    } else if (style.verbosity === 'moderate') {
      return botIdentity;
    } else {
      return "I'm PrimeBot.";
    }
  }

  /**
   * Generate acknowledgment core
   */
  private generateAcknowledgmentCore(context: GenerationContext, style: GenerationStyle): string {
    const entities = context.semanticContext?.entities || [];
    
    if (entities.length >= 2) {
      // Entity introduction (e.g., "My dog's name is Juno")
      const entityType = entities[0];
      const entityName = entities[1];
      const schemaType = this.schemaVocabulary.inferEntityType(entityType);
      
      let core = this.generateEntityAcknowledgment(entityType, entityName, schemaType, style);
      return core;
    } else if (entities.length === 1) {
      // Single entity (e.g., "My name is Alex")
      const entityName = entities[0];
      return this.generateNameAcknowledgment(entityName, style);
    }
    
    return this.generateGenericAcknowledgment(style);
  }

  /**
   * Generate entity acknowledgment
   */
  private generateEntityAcknowledgment(entityType: string, entityName: string, schemaType: string | null, style: GenerationStyle): string {
    const acknowledgments = this.getEntityAcknowledgmentTemplates(style);
    const template = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
    
    let core = template
      .replace('{entityType}', entityType)
      .replace('{entityName}', entityName);
    
    // Add schema-informed context
    if (schemaType && style.verbosity !== 'concise') {
      const schemaContext = this.generateSchemaContext(entityType, entityName, schemaType, style);
      if (schemaContext) {
        core += ` ${schemaContext}`;
      }
    }
    
    return core;
  }

  /**
   * Get entity acknowledgment templates
   */
  private getEntityAcknowledgmentTemplates(style: GenerationStyle): string[] {
    switch (style.personality) {
      case 'friendly':
        return [
          "It's lovely to know that your {entityType} is named {entityName}!",
          "What a wonderful name for your {entityType} - {entityName}!",
          "I love that your {entityType} is called {entityName}!"
        ];
      case 'helpful':
        return [
          "I understand that your {entityType} is named {entityName}.",
          "Thank you for telling me about {entityName}, your {entityType}.",
          "I've noted that your {entityType} is named {entityName}."
        ];
      case 'analytical':
        return [
          "I've recorded that your {entityType} has the name {entityName}.",
          "Entity relationship noted: {entityType} hasName {entityName}.",
          "I understand the naming relationship for your {entityType}."
        ];
      case 'professional':
        return [
          "I acknowledge that your {entityType} is named {entityName}.",
          "Thank you for providing the name of your {entityType}.",
          "I have recorded the information about {entityName}."
        ];
      default:
        return ["I understand that your {entityType} is named {entityName}."];
    }
  }

  /**
   * Generate schema-informed context
   */
  private generateSchemaContext(entityType: string, entityName: string, schemaType: string, style: GenerationStyle): string {
    const entityInfo = this.schemaVocabulary.getEntityInfo(schemaType);
    if (!entityInfo) return '';
    
    const validProperties = this.schemaVocabulary.getValidProperties(schemaType);
    
    switch (schemaType) {
      case 'Animal':
        if (style.personality === 'friendly') {
          return `Tell me more about ${entityName} - what kind of ${entityType} is ${entityName}?`;
        } else if (style.personality === 'analytical') {
          return `As an Animal entity, ${entityName} has properties like species and breed.`;
        } else {
          return `What kind of ${entityType} is ${entityName}?`;
        }
        
      case 'Vehicle':
        if (style.personality === 'friendly') {
          return `I'd love to hear more about ${entityName}! What kind of ${entityType} is it?`;
        } else {
          return `What type of ${entityType} is ${entityName}?`;
        }
        
      case 'Person':
        if (style.personality === 'friendly') {
          return `It's nice to meet ${entityName}! Tell me more about them.`;
        } else {
          return `Tell me more about ${entityName}.`;
        }
        
      default:
        return `Tell me more about ${entityName}.`;
    }
  }

  /**
   * Generate name acknowledgment
   */
  private generateNameAcknowledgment(name: string, style: GenerationStyle): string {
    const templates = this.getNameAcknowledgmentTemplates(style);
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template.replace('{name}', name);
  }

  /**
   * Get name acknowledgment templates
   */
  private getNameAcknowledgmentTemplates(style: GenerationStyle): string[] {
    switch (style.personality) {
      case 'friendly':
        return [
          "It's wonderful to meet you, {name}!",
          "Nice to meet you, {name}!",
          "Hello {name}! Great to meet you!"
        ];
      case 'helpful':
        return [
          "Nice to meet you, {name}!",
          "Pleased to meet you, {name}!",
          "Good to meet you, {name}!"
        ];
      case 'analytical':
        return [
          "Nice to meet you, {name}.",
          "Good to meet you, {name}.",
          "Pleased to meet you, {name}."
        ];
      case 'professional':
        return [
          "Good to meet you, {name}.",
          "Pleased to meet you, {name}.",
          "Nice to meet you, {name}."
        ];
      default:
        return ["Nice to meet you, {name}!"];
    }
  }

  /**
   * Generate informative core
   */
  private generateInformativeCore(context: GenerationContext, style: GenerationStyle): string {
    const semanticContext = context.semanticContext;
    const pragmaticContext = context.pragmaticContext;
    const currentInput = pragmaticContext.conversationHistory[pragmaticContext.conversationHistory.length - 1]?.text || '';
    
    // Always check for semantic queries first for informative answers
    const queryResult = this.handleSemanticQuery(context, style);
    console.log('🔍 handleSemanticQuery result:', queryResult);
    if (queryResult) return queryResult;
    
    // Generate based on semantic context
    if (semanticContext?.entities && semanticContext.entities.length > 0) {
      const entity = semanticContext.entities[0];
      const entityType = this.schemaVocabulary.inferEntityType(entity);
      
      if (entityType) {
        return this.generateEntityInformation(entity, entityType, style);
      }
    }
    
    // Enhanced fallback with pronoun resolution and pattern matching
    return this.handleUnknownQuery(currentInput, pragmaticContext, style);
  }

  /**
   * Handle unknown queries with enhanced pattern matching
   */
  private handleUnknownQuery(
    input: string,
    pragmaticContext: ConversationContext,
    style: GenerationStyle
  ): string {
    const lowerInput = input.toLowerCase();
    
    // Enhanced pronoun resolution
    if (this.containsPronoun(lowerInput)) {
      const resolvedQuery = this.resolvePronounQuery(input, pragmaticContext);
      if (resolvedQuery) {
        return resolvedQuery;
      }
    }
    
    // Check for specific unknown query patterns that should return "don't have" responses
    if (lowerInput.includes('what is my') && !this.hasKnownEntity(lowerInput, pragmaticContext)) {
      return "I don't have that information. Could you tell me more about it?";
    }
    
    // Enhanced question pattern matching
    if (lowerInput.includes('what') && lowerInput.includes('car')) {
      return "I don't have information about your car. Could you tell me about your car?";
    }
    
    if (lowerInput.includes('what') && lowerInput.includes('do')) {
      return "I'd be happy to help! Could you tell me more about what you're looking for?";
    }
    
    if (lowerInput.includes('how') && lowerInput.includes('old')) {
      return "I don't have age information stored. Could you share that with me?";
    }
    
    if (lowerInput.includes('where') && lowerInput.includes('live')) {
      return "I don't have location information. Where do you live?";
    }
    
    // General question patterns
    if (lowerInput.startsWith('what') || lowerInput.startsWith('how') || lowerInput.startsWith('where') || lowerInput.startsWith('when') || lowerInput.startsWith('why')) {
      return "That's a great question! I don't have that specific information yet. Could you tell me more about it?";
    }
    
    // Possession patterns
    if (lowerInput.includes('do i have') || lowerInput.includes('is my')) {
      return "I don't have that information stored. Could you tell me about it?";
    }
    
    // Default helpful response
    return "I'd like to help with that! Could you provide more details or tell me what you'd like me to know?";
  }
  
  /**
   * Check if input contains pronouns
   */
  private containsPronoun(input: string): boolean {
    const pronouns = ['her', 'his', 'their', 'its', 'she', 'he', 'they', 'it'];
    return pronouns.some(pronoun => input.includes(pronoun));
  }
  
  /**
   * Resolve pronoun-based queries
   */
  private resolvePronounQuery(
    input: string,
    pragmaticContext: ConversationContext
  ): string | null {
    const lowerInput = input.toLowerCase();
    
    // Look for recent entity introductions to resolve pronouns
    const recentHistory = pragmaticContext.conversationHistory.slice(-5);
    
    // Find the most recent entity that could match the pronoun
    for (let i = recentHistory.length - 1; i >= 0; i--) {
      const turn = recentHistory[i];
      if (turn.intent === 'ENTITY_INTRODUCTION') {
        const entities = Object.values(turn.entities);
        
        // Check for female pronouns
        if ((lowerInput.includes('her') || lowerInput.includes('she')) && entities.length >= 2) {
          const entityType = entities[0] as string;
          const entityName = entities[1] as string;
          
          if (this.isFemalePronounEntity(entityType)) {
            if (lowerInput.includes('name')) {
              return `Her name is ${entityName}.`;
            }
            return `You're asking about ${entityName}, your ${entityType}.`;
          }
        }
        
        // Check for male pronouns
        if ((lowerInput.includes('his') || lowerInput.includes('he')) && entities.length >= 2) {
          const entityType = entities[0] as string;
          const entityName = entities[1] as string;
          
          if (this.isMalePronounEntity(entityType)) {
            if (lowerInput.includes('name')) {
              return `His name is ${entityName}.`;
            }
            return `You're asking about ${entityName}, your ${entityType}.`;
          }
        }
        
        // Generic pronoun resolution
        if (entities.length >= 2) {
          const entityType = entities[0] as string;
          const entityName = entities[1] as string;
          
          if (lowerInput.includes('name')) {
            return `The name is ${entityName}.`;
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
    const femaleEntities = ['wife', 'mother', 'sister', 'daughter', 'girlfriend', 'aunt', 'grandmother', 'woman', 'girl'];
    return femaleEntities.includes(entityType.toLowerCase());
  }
  
  /**
   * Check if entity type uses male pronouns
   */
  private isMalePronounEntity(entityType: string): boolean {
    const maleEntities = ['husband', 'father', 'brother', 'son', 'boyfriend', 'uncle', 'grandfather', 'man', 'boy'];
    return maleEntities.includes(entityType.toLowerCase());
  }

  /**
   * Check if we have known entity information for the query
   */
  private hasKnownEntity(input: string, pragmaticContext: ConversationContext): boolean {
    // Check if we have any relevant entity information in memory or conversation history
    const lowerInput = input.toLowerCase();
    
    // Check entity memory
    for (const [key, entity] of pragmaticContext.entityMemory) {
      if (lowerInput.includes(entity.value.toLowerCase()) || lowerInput.includes(key.toLowerCase())) {
        return true;
      }
    }
    
    // Check conversation history for relevant information
    const context = pragmaticContext.conversationHistory.map(turn => turn.text).join(' ').toLowerCase();
    
    // Extract entity from query (e.g., "what is my favorite" -> "favorite")
    const entityMatch = lowerInput.match(/what is my (\w+)/);
    if (entityMatch) {
      const entity = entityMatch[1];
      return context.includes(entity);
    }
    
    return false;
  }

  /**
   * Handle semantic queries
   */
  private handleSemanticQuery(context: GenerationContext, style: GenerationStyle): string | null {
    const pragmaticContext = context.pragmaticContext;
    // Get the CURRENT input, not the last stored input
    const currentInput = pragmaticContext.conversationHistory[pragmaticContext.conversationHistory.length - 1]?.text || '';
    

    
    // Check for bot identity queries
    if (currentInput.toLowerCase().includes('who are you') || 
        currentInput.toLowerCase().includes('what is your name')) {
      return this.handleBotIdentityQuery(style);
    }
    
    // Check for user name queries
    if (currentInput.toLowerCase().includes('what is my name')) {
      return this.handleNameQuery(pragmaticContext, style);
    }
    
    // Check for entity name queries
    const entityNameMatch = currentInput.match(/what is my (\w+)'?s? name/i);
    if (entityNameMatch) {
      const entityType = entityNameMatch[1];
      return this.handleEntityNameQuery(entityType, pragmaticContext, style);
    }
    
    // Check for entity name queries with apostrophe
    const entityNameMatch2 = currentInput.match(/what is my (\w+)'s name/i);
    if (entityNameMatch2) {
      const entityType = entityNameMatch2[1];
      return this.handleEntityNameQuery(entityType, pragmaticContext, style);
    }
    
    // Check for "Who is X?" queries
    const whoIsMatch = currentInput.match(/who is (\w+)/i);
    if (whoIsMatch) {
      const entityName = whoIsMatch[1];
      return this.handleWhoIsQuery(entityName, pragmaticContext, style);
    }
    
    // Check for "favorite" queries FIRST (e.g., "What is my favorite color?")
    const favoriteMatch = currentInput.match(/what is my favorite (\w+)/i);
    console.log('🔍 Favorite regex result:', favoriteMatch);
    if (favoriteMatch) {
      const entity = favoriteMatch[1];
      console.log('🔍 Matched favorite query for entity:', entity);
      return this.handleFavoriteQuery(entity, pragmaticContext, style);
    }
    
    // Check for attribute queries (e.g., "What color is my hair?")
    const attributeMatch = currentInput.match(/what (\w+) is my (\w+)/i);
    if (attributeMatch) {
      const attribute = attributeMatch[1];
      const entity = attributeMatch[2];
      return this.handleAttributeQuery(attribute, entity, pragmaticContext, style);
    }
    
    // Check for general attribute queries (e.g., "What is my hair color?")
    const generalAttributeMatch = currentInput.match(/what is my (\w+) (\w+)/i);
    console.log('🔍 General attribute regex result:', generalAttributeMatch);
    if (generalAttributeMatch) {
      const entity = generalAttributeMatch[1];
      const attribute = generalAttributeMatch[2];
      console.log('🔍 Matched general attribute query - entity:', entity, 'attribute:', attribute);
      return this.handleAttributeQuery(attribute, entity, pragmaticContext, style);
    }
    
    return null;
  }

  /**
   * Handle bot identity queries
   */
  private handleBotIdentityQuery(style: GenerationStyle): string {
    switch (style.personality) {
      case 'friendly':
        return "I'm PrimeBot, your friendly AI assistant! I use mathematical prime factorization and semantic understanding to have conversations.";
      case 'analytical':
        return "I am PrimeBot, an AI system that processes information through mathematical prime factorization and semantic analysis using Schema.org vocabulary.";
      case 'professional':
        return "I am PrimeBot, an AI assistant specializing in semantic understanding and mathematical analysis.";
      default:
        return "I'm PrimeBot, an AI assistant powered by mathematical prime factorization and semantic understanding.";
    }
  }

  /**
   * Handle name queries
   */
  private handleNameQuery(pragmaticContext: ConversationContext, style: GenerationStyle): string {
    // First check entity memory for stored user name
    const userNameEntity = pragmaticContext.entityMemory.get('user_name');
    
    if (userNameEntity && userNameEntity.value) {
      const name = this.capitalizeFirstLetter(userNameEntity.value);
      switch (style.personality) {
        case 'friendly':
          return `Your name is ${name}! I remember you telling me that.`;
        case 'analytical':
          return `Based on stored entity memory, your name is ${name}.`;
        case 'professional':
          return `According to our conversation, your name is ${name}.`;
        default:
          return `Your name is ${name}.`;
      }
    }
    
    // Fallback to conversation history search if not in entity memory
    const context = pragmaticContext.conversationHistory.map(turn => turn.text).join(' ');
    const nameMatch = context.match(/my name is (\w+)/i);
    
    if (nameMatch) {
      const name = this.capitalizeFirstLetter(nameMatch[1]);
      switch (style.personality) {
        case 'friendly':
          return `Your name is ${name}! I remember you telling me that.`;
        case 'analytical':
          return `Based on our conversation history, your name is ${name}.`;
        case 'professional':
          return `According to our conversation, your name is ${name}.`;
        default:
          return `Your name is ${name}.`;
      }
    } else {
      switch (style.personality) {
        case 'friendly':
          return "I don't recall you mentioning your name yet. I'd love to know what to call you!";
        case 'helpful':
          return "I don't recall you mentioning your name. What is your name?";
        case 'analytical':
          return "No name information found in conversation history. Please provide your name.";
        default:
          return "I don't recall you mentioning your name. What is your name?";
      }
    }
  }

  /**
   * Handle entity name queries
   */
  private handleEntityNameQuery(entityType: string, pragmaticContext: ConversationContext, style: GenerationStyle): string {
    // First check entity memory for stored relationships
    for (const [key, entity] of pragmaticContext.entityMemory) {
      if (key === `${entityType}_name` || (entity.relationship === 'hasName' && entity.entityType === entityType)) {
        const entityName = this.capitalizeFirstLetter(entity.value);
        let response = `Your ${entityType} is named ${entityName}.`;
        
        const schemaType = this.schemaVocabulary.inferEntityType(entityType);
        if (schemaType && style.verbosity !== 'concise') {
          const contextualNote = this.generateContextualNote(entityType, entityName, schemaType, style);
          if (contextualNote) {
            response += ` ${contextualNote}`;
          }
        }
        
        return response;
      }
    }
    
    // Fallback to conversation history search
    const context = pragmaticContext.conversationHistory.map(turn => turn.text).join(' ');
    const entityPattern = new RegExp(`my ${entityType}'?s? name is (\\w+)`, 'i');
    const entityMatch = context.match(entityPattern);
    
    if (entityMatch) {
      const entityName = this.capitalizeFirstLetter(entityMatch[1]);
      const schemaType = this.schemaVocabulary.inferEntityType(entityType);
      
      let response = `Your ${entityType} is named ${entityName}.`;
      
      if (schemaType && style.verbosity !== 'concise') {
        const contextualNote = this.generateContextualNote(entityType, entityName, schemaType, style);
        if (contextualNote) {
          response += ` ${contextualNote}`;
        }
      }
      
      return response;
    } else {
      switch (style.personality) {
        case 'friendly':
          return `I don't recall you mentioning your ${entityType}'s name. What is your ${entityType} called?`;
        case 'helpful':
          return `I don't recall you mentioning your ${entityType}'s name. What is your ${entityType}'s name?`;
        case 'analytical':
          return `No naming information found for entity type: ${entityType}. Please provide the name.`;
        default:
          return `I don't recall you mentioning your ${entityType}'s name. What is your ${entityType}'s name?`;
      }
    }
  }

  /**
   * Handle "Who is X?" queries
   */
  private handleWhoIsQuery(entityName: string, pragmaticContext: ConversationContext, style: GenerationStyle): string {
    // Search through entity memory for relationships involving this name
    for (const [key, entity] of pragmaticContext.entityMemory) {
      if (entity.value.toLowerCase() === entityName.toLowerCase()) {
        // Found the entity, determine the relationship
        if (key.endsWith('_name')) {
          const entityType = key.replace('_name', '');
          switch (style.personality) {
            case 'friendly':
              return `${entityName} is your ${entityType}! I remember you telling me about them.`;
            case 'analytical':
              return `Based on our conversation history, ${entityName} is identified as your ${entityType}.`;
            case 'professional':
              return `According to our conversation, ${entityName} is your ${entityType}.`;
            default:
              return `${entityName} is your ${entityType}.`;
          }
        } else if (key === 'user_name') {
          return `${entityName} is you! That's your name.`;
        }
      }
    }
    
    // Entity not found in memory
    switch (style.personality) {
      case 'friendly':
        return `I don't recall you mentioning anyone named ${entityName}. Could you tell me more about them?`;
      case 'helpful':
        return `I don't have information about ${entityName}. Who is ${entityName}?`;
      case 'analytical':
        return `No entity information found for "${entityName}" in conversation history.`;
      default:
        return `I don't recall you mentioning ${entityName}. Who is ${entityName}?`;
    }
  }

  /**
   * Handle favorite queries (e.g., "What is my favorite color?")
   */
  private handleFavoriteQuery(entity: string, pragmaticContext: ConversationContext, style: GenerationStyle): string {
    // Search conversation history for favorite information
    const context = pragmaticContext.conversationHistory.map(turn => turn.text).join(' ').toLowerCase();
    
    // Look for patterns like "my favorite color is blue" or "I like red"
    const patterns = [
      new RegExp(`my favorite ${entity} is ([\w\s]+?)(?:\s|\.|$)`, 'i'),
      new RegExp(`i like ([\w\s]+?) ${entity}(?:\s|\.|$)`, 'i'),
      new RegExp(`favorite ${entity} is ([\w\s]+?)(?:\s|\.|$)`, 'i')
    ];
    
    let favoriteValue: string | null = null;
    
    for (const pattern of patterns) {
      const match = context.match(pattern);
      if (match) {
        favoriteValue = match[1].trim();
        break;
      }
    }
    
    if (favoriteValue) {
      const capitalizedValue = this.capitalizeFirstLetter(favoriteValue);
      switch (style.personality) {
        case 'friendly':
          return `Your favorite ${entity} is ${capitalizedValue}! I remember you telling me that.`;
        case 'analytical':
          return `Based on conversation history, your favorite ${entity} is ${capitalizedValue}.`;
        case 'professional':
          return `According to our conversation, your favorite ${entity} is ${capitalizedValue}.`;
        default:
          return `Your favorite ${entity} is ${capitalizedValue}.`;
      }
    } else {
      // Check entity memory for stored favorites
      for (const [key, entityInfo] of pragmaticContext.entityMemory) {
        if (key.includes(`favorite_${entity}`) && entityInfo.value) {
          return `Your favorite ${entity} is ${entityInfo.value}.`;
        }
      }
      
      // No favorite information found
      switch (style.personality) {
        case 'friendly':
          return `I don't have information about your favorite ${entity}. What is your favorite ${entity}?`;
        case 'helpful':
          return `I don't have information about your favorite ${entity}. Could you tell me what your favorite ${entity} is?`;
        case 'analytical':
          return `No favorite ${entity} information found in conversation history. Please provide this information.`;
        default:
          return `I don't have information about your favorite ${entity}. What is your favorite ${entity}?`;
      }
    }
  }

  /**
   * Handle attribute queries (e.g., "What color is my hair?")
   */
  private handleAttributeQuery(attribute: string, entity: string, pragmaticContext: ConversationContext, style: GenerationStyle): string {
    // Search conversation history for attribute information
    const context = pragmaticContext.conversationHistory.map(turn => turn.text).join(' ').toLowerCase();
    
    // Look for patterns like "my hair is brown" or "my car is red" or "I have a white truck"
    const patterns = [
      new RegExp(`my ${entity} is ([\\w\\s]+?)(?:\\s|\\.|$)`, 'i'),
      new RegExp(`i have a ([\\w\\s]+?) ${entity}(?:\\s|\\.|$)`, 'i'),
      new RegExp(`${entity} is ([\\w\\s]+?)(?:\\s|\\.|$)`, 'i'),
      new RegExp(`([\\w\\s]+?) ${entity}(?:\\s|\\.|$)`, 'i') // More general pattern
    ];
    
    let attributeValue: string | null = null;
    
    for (const pattern of patterns) {
      const match = context.match(pattern);
      if (match) {
        attributeValue = match[1].trim();
        break;
      }
    }
    
    if (attributeValue) {
      // Don't capitalize color values and other attributes that should remain lowercase
      const shouldCapitalize = !this.isLowercaseAttribute(attribute, attributeValue);
      const formattedValue = shouldCapitalize ? this.capitalizeFirstLetter(attributeValue) : attributeValue.toLowerCase();
      
      switch (style.personality) {
        case 'friendly':
          return `Your ${entity} is ${formattedValue}! I remember you telling me that.`;
        case 'analytical':
          return `Based on conversation history, your ${entity} is ${formattedValue}.`;
        case 'professional':
          return `According to our conversation, your ${entity} is ${formattedValue}.`;
        default:
          return `Your ${entity} is ${formattedValue}.`;
      }
    } else {
      // Check entity memory for stored attributes
      for (const [key, entityInfo] of pragmaticContext.entityMemory) {
        if (key.includes(entity) && entityInfo.metadata && entityInfo.metadata[attribute]) {
          const storedValue = entityInfo.metadata[attribute];
          return `Your ${entity} is ${storedValue}.`;
        }
      }
      
      // No attribute information found
      switch (style.personality) {
        case 'friendly':
          return `I don't recall you mentioning the ${attribute} of your ${entity}. What ${attribute} is your ${entity}?`;
        case 'helpful':
          return `I don't have information about your ${entity}'s ${attribute}. Could you tell me what ${attribute} your ${entity} is?`;
        case 'analytical':
          return `No ${attribute} attribute found for entity: ${entity}. Please provide this information.`;
        default:
          return `I don't have information about your ${entity}'s ${attribute}. What ${attribute} is it?`;
      }
    }
  }

  /**
   * Generate contextual note for entities
   */
  private generateContextualNote(entityType: string, entityName: string, schemaType: string, style: GenerationStyle): string {
    switch (schemaType) {
      case 'Animal':
        if (style.personality === 'friendly') {
          return `That's a lovely name for ${entityType === 'Animal' ? 'an animal' : 'a ' + entityType}!`;
        } else {
          return `${entityName} is classified as an Animal entity.`;
        }
      case 'Vehicle':
        return style.personality === 'friendly' ? 
          `${entityName} sounds like a great ${entityType}!` : 
          `${entityName} is classified as a Vehicle entity.`;
      default:
        return '';
    }
  }

  /**
   * Generate entity information
   */
  private generateEntityInformation(entity: string, entityType: string, style: GenerationStyle): string {
    const entityInfo = this.schemaVocabulary.getEntityInfo(entityType);
    
    if (style.personality === 'analytical' && entityInfo) {
      return `I'm analyzing "${entity}" as ${entityType === 'Animal' ? 'an' : 'a'} ${entityType} entity. This type has properties like ${entityInfo.properties.slice(0, 3).join(', ')}.`;
    } else if (style.personality === 'friendly') {
      return `I notice you mentioned "${entity}" - I understand that as ${entityType === 'Animal' ? 'an' : 'a'} ${entityType}. That's interesting!`;
    } else {
      return `I'm processing information about "${entity}" as ${entityType === 'Animal' ? 'an' : 'a'} ${entityType}.`;
    }
  }

  /**
   * Generate generic informative response
   */
  private generateGenericInformativeResponse(style: GenerationStyle): string {
    switch (style.personality) {
      case 'friendly':
        return "That's a great question! I'm working through the information to give you a helpful answer.";
      case 'analytical':
        return "I'm analyzing the semantic relationships and mathematical patterns to provide an accurate response.";
      case 'professional':
        return "I'm processing your request to provide you with the appropriate information.";
      default:
        return "I'm analyzing the information to provide you with an answer.";
    }
  }

  /**
   * Generate supportive core
   */
  private generateSupportiveCore(context: GenerationContext, style: GenerationStyle): string {
    const capabilities = this.getCapabilityDescription(style);
    
    switch (style.personality) {
      case 'friendly':
        return `I can understand relationships between people, animals, places, and things. ${capabilities}`;
      case 'analytical':
        return `I process information through semantic analysis and mathematical prime factorization. ${capabilities}`;
      case 'professional':
        return `I'm equipped to assist with information processing and semantic understanding. ${capabilities}`;
      default:
        return `I can help with understanding relationships and processing information. ${capabilities}`;
    }
  }

  /**
   * Generate gracious core
   */
  private generateGraciousCore(context: GenerationContext, style: GenerationStyle): string {
    switch (style.personality) {
      case 'friendly':
        return "I'm so glad I could help with my semantic understanding!";
      case 'analytical':
        return "I'm pleased that my mathematical analysis was useful.";
      case 'professional':
        return "I'm glad I could provide the assistance you needed.";
      default:
        return "I'm glad I could help!";
    }
  }

  /**
   * Generate welcoming core
   */
  private generateWelcomingCore(context: GenerationContext, style: GenerationStyle): string {
    const botIdentity = this.getBotIdentityDescription(style);
    const capabilities = this.getCapabilityDescription(style);
    
    return `${botIdentity} ${capabilities}`;
  }

  /**
   * Generate detailed core
   */
  private generateDetailedCore(context: GenerationContext, style: GenerationStyle): string {
    // For detailed explanations, provide more comprehensive information
    const informativeCore = this.generateInformativeCore(context, style);
    const technicalDetails = this.getTechnicalDetails(context, style);
    
    return `${informativeCore} ${technicalDetails}`;
  }

  /**
   * Generate transitional core
   */
  private generateTransitionalCore(context: GenerationContext, style: GenerationStyle): string {
    const discourseContext = context.discourseContext;
    
    if (discourseContext?.topicState?.topicHistory?.length > 0) {
      const previousTopic = discourseContext.topicState.topicHistory[discourseContext.topicState.topicHistory.length - 1];
      return `I notice we've moved from discussing ${previousTopic} to a new topic.`;
    }
    
    return "I'm ready to explore whatever you'd like to discuss.";
  }

  /**
   * Generate default core
   */
  private generateDefaultCore(context: GenerationContext, style: GenerationStyle): string {
    const responses: Record<string, string[]> = {
      'friendly': [
        "I'm listening and ready to understand what you're telling me!",
        "I'm here and excited to learn from you!",
        "I'm ready to engage with whatever you'd like to share!",
        "I'm listening carefully and ready to help!"
      ],
      'analytical': [
        "I'm processing the semantic relationships in your message.",
        "I'm analyzing the contextual patterns in our conversation.",
        "I'm ready to process and understand your input.",
        "I'm examining the semantic structure of your communication."
      ],
      'professional': [
        "I'm ready to assist with your inquiry.",
        "I'm prepared to help with your request.",
        "I'm available to provide assistance.",
        "I'm ready to support your needs."
      ],
      'helpful': [
        "I'm listening and ready to help.",
        "I'm here to assist you.",
        "I'm ready to help with whatever you need.",
        "I'm available to support you."
      ]
    };
    
    const personalityResponses = responses[style.personality] || responses['helpful'];
    const randomIndex = Math.floor(Math.random() * personalityResponses.length);
    return personalityResponses[randomIndex];
  }

  /**
   * Generate followup
   */
  private generateFollowup(context: GenerationContext, style: GenerationStyle): string {
    const responseType = context.responseType;
    const conversationPhase = context.discourseContext?.conversationPhase;
    
    // Generate followup based on response type and conversation phase
    if (responseType === 'acknowledgment_with_followup' || 
        responseType === 'welcoming_response' ||
        conversationPhase === 'exploration') {
      
      return this.generateContextualFollowup(context, style);
    }
    
    return '';
  }

  /**
   * Generate contextual followup
   */
  private generateContextualFollowup(context: GenerationContext, style: GenerationStyle): string {
    const conversationPhase = context.discourseContext?.conversationPhase;
    
    switch (conversationPhase) {
      case 'opening':
        return this.generateOpeningFollowup(style);
      case 'exploration':
        return this.generateExplorationFollowup(context, style);
      case 'deepening':
        return this.generateDeepeningFollowup(context, style);
      default:
        return this.generateGenericFollowup(style);
    }
  }

  /**
   * Generate opening followup
   */
  private generateOpeningFollowup(style: GenerationStyle): string {
    switch (style.personality) {
      case 'friendly':
        return "How can I help you today?";
      case 'helpful':
        return "What can I assist you with?";
      case 'analytical':
        return "What would you like to explore?";
      case 'professional':
        return "How may I assist you?";
      default:
        return "How can I help?";
    }
  }

  /**
   * Generate exploration followup
   */
  private generateExplorationFollowup(context: GenerationContext, style: GenerationStyle): string {
    const entities = context.semanticContext?.entities || [];
    
    if (entities.length > 0) {
      const entity = entities[entities.length - 1]; // Most recent entity
      
      switch (style.personality) {
        case 'friendly':
          return `Tell me more about ${entity}!`;
        case 'analytical':
          return `What additional information can you provide about ${entity}?`;
        case 'professional':
          return `Please share more details about ${entity}.`;
        default:
          return `Tell me more about ${entity}.`;
      }
    }
    
    return this.generateGenericFollowup(style);
  }

  /**
   * Generate deepening followup
   */
  private generateDeepeningFollowup(context: GenerationContext, style: GenerationStyle): string {
    switch (style.personality) {
      case 'friendly':
        return "What else would you like to explore about this?";
      case 'analytical':
        return "Are there specific aspects you'd like me to analyze further?";
      case 'professional':
        return "What additional details would be helpful?";
      default:
        return "What else would you like to know?";
    }
  }

  /**
   * Generate generic followup
   */
  private generateGenericFollowup(style: GenerationStyle): string {
    switch (style.personality) {
      case 'friendly':
        return "What would you like to discuss?";
      case 'analytical':
        return "What would you like to analyze?";
      case 'professional':
        return "What would you like to explore?";
      default:
        return "What would you like to discuss?";
    }
  }

  /**
   * Generate closing
   */
  private generateClosing(context: GenerationContext, style: GenerationStyle): string {
    // Only add closing for certain response types and high verbosity
    if (style.verbosity === 'detailed' && 
        (context.responseType === 'welcoming_response' || 
         context.responseType === 'detailed_explanation')) {
      
      switch (style.personality) {
        case 'friendly':
          return "I'm excited to learn more!";
        case 'analytical':
          return "I'm ready to process more information.";
        case 'professional':
          return "I look forward to assisting you further.";
        default:
          return "";
      }
    }
    
    return '';
  }

  /**
   * Assemble final response
   */
  private assembleResponse(components: ResponseComponents, style: GenerationStyle): string {
    const parts: string[] = [];
    
    if (components.opening) parts.push(components.opening);
    if (components.core) parts.push(components.core);
    if (components.followup) parts.push(components.followup);
    if (components.closing) parts.push(components.closing);
    
    return parts.join(' ');
  }

  /**
   * Get bot identity description
   */
  private getBotIdentityDescription(style: GenerationStyle): string {
    switch (style.personality) {
      case 'friendly':
        return "I'm PrimeBot, your friendly AI assistant powered by mathematical prime factorization and semantic understanding.";
      case 'analytical':
        return "I'm PrimeBot, an AI system that processes information through mathematical prime factorization and semantic analysis.";
      case 'professional':
        return "I'm PrimeBot, an AI assistant specializing in semantic understanding and mathematical analysis.";
      default:
        return "I'm PrimeBot, powered by mathematical prime factorization and semantic understanding.";
    }
  }

  /**
   * Get capability description
   */
  private getCapabilityDescription(style: GenerationStyle): string {
    switch (style.verbosity) {
      case 'detailed':
        return "I can understand relationships between people, animals, places, and things using Schema.org vocabulary, maintain conversation memory, and provide contextual responses based on mathematical prime resonance.";
      case 'moderate':
        return "I can understand relationships between entities and maintain conversation context.";
      case 'concise':
        return "I understand entity relationships and context.";
      default:
        return "I can help with understanding relationships and processing information.";
    }
  }

  /**
   * Get technical details
   */
  private getTechnicalDetails(context: GenerationContext, style: GenerationStyle): string {
    if (style.personality !== 'analytical') {
      return '';
    }
    
    return 'Using mathematical prime factorization and Schema.org semantic relationships for analysis.';
  }

  /**
   * Generate generic acknowledgment
   */
  private generateGenericAcknowledgment(style: GenerationStyle): string {
    switch (style.personality) {
      case 'friendly':
        return "That's interesting! I'm learning about what you're telling me.";
      case 'analytical':
        return "Information processed and stored in semantic memory.";
      case 'professional':
        return "I acknowledge the information you've provided.";
      default:
        return "I understand. Thank you for sharing that with me.";
    }
  }

  /**
   * Check if an attribute should remain lowercase
   */
  private isLowercaseAttribute(attribute: string, value: string): boolean {
    const lowercaseAttributes = ['color', 'colour', 'size', 'type', 'style', 'material'];
    const lowercaseValues = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'brown', 'gray', 'grey', 'pink', 'purple', 'orange'];
    
    // Check if the attribute type should be lowercase
    if (lowercaseAttributes.includes(attribute.toLowerCase())) {
      return true;
    }
    
    // Check if the value is a common lowercase word
    if (lowercaseValues.includes(value.toLowerCase())) {
      return true;
    }
    
    return false;
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalizeFirstLetter(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}
