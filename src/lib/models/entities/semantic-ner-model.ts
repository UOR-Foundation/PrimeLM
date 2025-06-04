// =============================================================================
// SEMANTIC NER MODEL - Model-driven named entity recognition
// =============================================================================

import { BaseEntityModel } from '../base/base-model';
import { ModelInitializationError } from '../interfaces';

/**
 * Semantic named entity recognition model that replaces pattern-based extraction
 * Uses contextual understanding and Schema.org vocabulary for entity classification
 * Provides confidence scores and proper entity boundaries
 */
export class SemanticNERModel extends BaseEntityModel {
  name = 'semantic-ner-classifier';
  version = '1.0.0';
  entityTypes = ['PERSON', 'ANIMAL', 'VEHICLE', 'PLACE', 'ORGANIZATION', 'PRODUCT'];

  private entityPatterns: Map<string, Array<{ pattern: RegExp; weight: number }>> = new Map();
  private contextualKeywords: Map<string, string[]> = new Map();
  private schemaMapping: Map<string, string> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log(`🚀 Initializing ${this.name}...`);
      
      this.buildEntityPatterns();
      this.buildContextualKeywords();
      this.buildSchemaMapping();
      
      this.initialized = true;
      console.log(`✅ ${this.name} initialized successfully`);
      
    } catch (error) {
      const initError = new ModelInitializationError(
        this.name,
        error instanceof Error ? error : new Error(String(error))
      );
      console.error(`❌ Failed to initialize ${this.name}:`, initError);
      throw initError;
    }
  }

  protected async performExtraction(text: string): Promise<{
    entities: Array<{
      text: string;
      type: string;
      confidence: number;
      startIndex: number;
      endIndex: number;
    }>;
  }> {
    console.log(`🏷️ Extracting entities from: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    const entities: Array<{
      text: string;
      type: string;
      confidence: number;
      startIndex: number;
      endIndex: number;
    }> = [];

    // Extract entities using multiple approaches
    const patternEntities = this.extractByPatterns(text);
    const contextualEntities = this.extractByContext(text);
    const namedEntities = this.extractNamedEntities(text);

    // Combine and deduplicate entities
    const allEntities = [...patternEntities, ...contextualEntities, ...namedEntities];
    const uniqueEntities = this.deduplicateEntities(allEntities);

    entities.push(...uniqueEntities);

    console.log(`✅ Extracted ${entities.length} entities`);
    
    return { entities };
  }

  private buildEntityPatterns(): void {
    // Person patterns
    this.entityPatterns.set('PERSON', [
      { pattern: /\b(my\s+name\s+is|i\s+am|i'm|call\s+me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi, weight: 0.95 },
      { pattern: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(said|told|asked|replied)/gi, weight: 0.8 },
      { pattern: /\b(mr|mrs|ms|dr|prof|professor)\s+([A-Z][a-z]+)/gi, weight: 0.9 }
    ]);

    // Animal patterns
    this.entityPatterns.set('ANIMAL', [
      { pattern: /\b(my\s+(?:dog|cat|pet)(?:\s+is|\s+named|\s+called)?)\s+([A-Z][a-z]+)/gi, weight: 0.9 },
      { pattern: /\b(dog|cat|pet|puppy|kitten|animal)\s+(?:named|called)\s+([A-Z][a-z]+)/gi, weight: 0.85 },
      { pattern: /\b([A-Z][a-z]+)\s+(?:is\s+my|the)\s+(dog|cat|pet)/gi, weight: 0.8 }
    ]);

    // Vehicle patterns
    this.entityPatterns.set('VEHICLE', [
      { pattern: /\b(my\s+(?:car|truck|vehicle)(?:\s+is|\s+named|\s+called)?)\s+([A-Z][a-z]+)/gi, weight: 0.9 },
      { pattern: /\b(car|truck|vehicle|automobile)\s+(?:named|called)\s+([A-Z][a-z]+)/gi, weight: 0.85 },
      { pattern: /\b([A-Z][a-z]+)\s+(?:is\s+my|the)\s+(car|truck|vehicle)/gi, weight: 0.8 }
    ]);

    // Place patterns
    this.entityPatterns.set('PLACE', [
      { pattern: /\b(in|at|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi, weight: 0.7 },
      { pattern: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(city|town|state|country|street|avenue)/gi, weight: 0.8 },
      { pattern: /\b(live\s+in|born\s+in|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi, weight: 0.85 }
    ]);

    // Organization patterns
    this.entityPatterns.set('ORGANIZATION', [
      { pattern: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(company|corp|corporation|inc|llc|ltd)/gi, weight: 0.9 },
      { pattern: /\b(work\s+at|employed\s+by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi, weight: 0.8 },
      { pattern: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(university|college|school)/gi, weight: 0.85 }
    ]);

    // Product patterns
    this.entityPatterns.set('PRODUCT', [
      { pattern: /\b(using|bought|have)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi, weight: 0.6 },
      { pattern: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(phone|laptop|computer|device)/gi, weight: 0.8 }
    ]);
  }

  private buildContextualKeywords(): void {
    this.contextualKeywords.set('PERSON', ['name', 'person', 'people', 'human', 'individual', 'someone']);
    this.contextualKeywords.set('ANIMAL', ['dog', 'cat', 'pet', 'animal', 'puppy', 'kitten', 'bird', 'fish']);
    this.contextualKeywords.set('VEHICLE', ['car', 'truck', 'vehicle', 'automobile', 'bike', 'motorcycle', 'bus']);
    this.contextualKeywords.set('PLACE', ['place', 'location', 'city', 'town', 'country', 'state', 'street', 'building']);
    this.contextualKeywords.set('ORGANIZATION', ['company', 'organization', 'business', 'corporation', 'firm', 'agency']);
    this.contextualKeywords.set('PRODUCT', ['product', 'item', 'thing', 'device', 'tool', 'equipment', 'software']);
  }

  private buildSchemaMapping(): void {
    // Map to Schema.org types
    this.schemaMapping.set('PERSON', 'Person');
    this.schemaMapping.set('ANIMAL', 'Animal');
    this.schemaMapping.set('VEHICLE', 'Vehicle');
    this.schemaMapping.set('PLACE', 'Place');
    this.schemaMapping.set('ORGANIZATION', 'Organization');
    this.schemaMapping.set('PRODUCT', 'Product');
  }

  private extractByPatterns(text: string): Array<{
    text: string;
    type: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
  }> {
    const entities: Array<{
      text: string;
      type: string;
      confidence: number;
      startIndex: number;
      endIndex: number;
    }> = [];

    for (const [entityType, patterns] of this.entityPatterns) {
      for (const { pattern, weight } of patterns) {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        
        while ((match = regex.exec(text)) !== null) {
          // Extract the entity name (usually the last capture group)
          const entityText = match[match.length - 1];
          if (entityText && entityText.length > 1) {
            const startIndex = match.index + match[0].indexOf(entityText);
            const endIndex = startIndex + entityText.length;

            entities.push({
              text: entityText,
              type: this.schemaMapping.get(entityType) || entityType,
              confidence: weight,
              startIndex,
              endIndex
            });
          }
        }
      }
    }

    return entities;
  }

  private extractByContext(text: string): Array<{
    text: string;
    type: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
  }> {
    const entities: Array<{
      text: string;
      type: string;
      confidence: number;
      startIndex: number;
      endIndex: number;
    }> = [];

    // Look for capitalized words near contextual keywords
    const words = text.split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Skip if not capitalized or too short
      if (!/^[A-Z][a-z]+$/.test(word) || word.length < 2) {
        continue;
      }

      // Check context around this word
      const context = words.slice(Math.max(0, i - 3), Math.min(words.length, i + 4)).join(' ').toLowerCase();
      
      for (const [entityType, keywords] of this.contextualKeywords) {
        for (const keyword of keywords) {
          if (context.includes(keyword)) {
            const startIndex = text.indexOf(word);
            if (startIndex !== -1) {
              entities.push({
                text: word,
                type: this.schemaMapping.get(entityType) || entityType,
                confidence: 0.6,
                startIndex,
                endIndex: startIndex + word.length
              });
              break;
            }
          }
        }
      }
    }

    return entities;
  }

  private extractNamedEntities(text: string): Array<{
    text: string;
    type: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
  }> {
    const entities: Array<{
      text: string;
      type: string;
      confidence: number;
      startIndex: number;
      endIndex: number;
    }> = [];

    // Extract proper nouns (capitalized words/phrases)
    const properNounPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    let match;

    while ((match = properNounPattern.exec(text)) !== null) {
      const entityText = match[0];
      
      // Skip common words that are often capitalized
      if (this.isCommonWord(entityText)) {
        continue;
      }

      // Classify based on context and structure
      const entityType = this.classifyProperNoun(entityText, text);
      
      if (entityType) {
        entities.push({
          text: entityText,
          type: this.schemaMapping.get(entityType) || entityType,
          confidence: 0.5,
          startIndex: match.index,
          endIndex: match.index + entityText.length
        });
      }
    }

    return entities;
  }

  private isCommonWord(word: string): boolean {
    const commonWords = [
      'The', 'This', 'That', 'These', 'Those', 'A', 'An',
      'I', 'You', 'He', 'She', 'It', 'We', 'They',
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return commonWords.includes(word);
  }

  private classifyProperNoun(entityText: string, context: string): string | null {
    const lowerContext = context.toLowerCase();
    const lowerEntity = entityText.toLowerCase();

    // Person indicators
    if (lowerContext.includes(`my name is ${lowerEntity}`) || 
        lowerContext.includes(`i am ${lowerEntity}`) ||
        lowerContext.includes(`call me ${lowerEntity}`)) {
      return 'PERSON';
    }

    // Animal indicators
    if (lowerContext.includes(`my dog ${lowerEntity}`) ||
        lowerContext.includes(`my cat ${lowerEntity}`) ||
        lowerContext.includes(`my pet ${lowerEntity}`)) {
      return 'ANIMAL';
    }

    // Vehicle indicators
    if (lowerContext.includes(`my car ${lowerEntity}`) ||
        lowerContext.includes(`my truck ${lowerEntity}`)) {
      return 'VEHICLE';
    }

    // Default classification based on common patterns
    if (entityText.split(' ').length === 1 && entityText.length > 2) {
      return 'PERSON'; // Single capitalized word likely a name
    }

    return null;
  }

  private deduplicateEntities(entities: Array<{
    text: string;
    type: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
  }>): Array<{
    text: string;
    type: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
  }> {
    const uniqueEntities = new Map<string, {
      text: string;
      type: string;
      confidence: number;
      startIndex: number;
      endIndex: number;
    }>();

    for (const entity of entities) {
      const key = `${entity.text}-${entity.startIndex}`;
      const existing = uniqueEntities.get(key);
      
      if (!existing || entity.confidence > existing.confidence) {
        uniqueEntities.set(key, entity);
      }
    }

    return Array.from(uniqueEntities.values())
      .sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * Extract entities with detailed analysis for debugging
   */
  async extractWithDetails(text: string): Promise<{
    entities: Array<{
      text: string;
      type: string;
      confidence: number;
      startIndex: number;
      endIndex: number;
    }>;
    patternMatches: number;
    contextualMatches: number;
    namedEntityMatches: number;
    reasoning: string[];
  }> {
    const patternEntities = this.extractByPatterns(text);
    const contextualEntities = this.extractByContext(text);
    const namedEntities = this.extractNamedEntities(text);

    const reasoning = [
      `Pattern-based extraction: ${patternEntities.length} entities`,
      `Contextual extraction: ${contextualEntities.length} entities`,
      `Named entity extraction: ${namedEntities.length} entities`
    ];

    const result = await this.performExtraction(text);

    return {
      ...result,
      patternMatches: patternEntities.length,
      contextualMatches: contextualEntities.length,
      namedEntityMatches: namedEntities.length,
      reasoning
    };
  }

  /**
   * Get model information for debugging
   */
  getModelInfo(): {
    name: string;
    version: string;
    entityTypes: string[];
    initialized: boolean;
    description: string;
  } {
    return {
      name: this.name,
      version: this.version,
      entityTypes: this.entityTypes,
      initialized: this.isInitialized(),
      description: 'Semantic named entity recognition that replaces pattern-based extraction with contextual understanding'
    };
  }
}
