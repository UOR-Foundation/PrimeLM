// =============================================================================
// SCHEMA.ORG VOCABULARY - Semantic Entity and Relationship Definitions
// =============================================================================

export interface SchemaEntity {
  type: string;
  properties: string[];
  relationships: string[];
  parentTypes: string[];
  description: string;
}

export interface SchemaRelationship {
  property: string;
  domain: string[];  // What types can have this property
  range: string[];   // What types this property can point to
  description: string;
}

export class SchemaVocabulary {
  private entities: Map<string, SchemaEntity> = new Map();
  private relationships: Map<string, SchemaRelationship> = new Map();

  constructor() {
    this.initializeBasicSchema();
  }

  /**
   * Initialize basic Schema.org vocabulary for conversational AI
   */
  private initializeBasicSchema(): void {
    // Core entity types
    this.addEntity('Thing', {
      type: 'Thing',
      properties: ['name', 'description', 'identifier'],
      relationships: [],
      parentTypes: [],
      description: 'The most generic type of item'
    });

    this.addEntity('Person', {
      type: 'Person',
      properties: ['name', 'givenName', 'familyName', 'email', 'telephone'],
      relationships: ['knows', 'owns', 'memberOf', 'worksFor'],
      parentTypes: ['Thing'],
      description: 'A person (alive, dead, undead, or fictional)'
    });

    this.addEntity('Animal', {
      type: 'Animal',
      properties: ['name', 'species', 'breed', 'age', 'color'],
      relationships: ['ownedBy', 'livesAt', 'relatedTo'],
      parentTypes: ['Thing'],
      description: 'Animals including pets, wildlife, etc.'
    });

    this.addEntity('Place', {
      type: 'Place',
      properties: ['name', 'address', 'geo', 'telephone'],
      relationships: ['containedInPlace', 'contains', 'near'],
      parentTypes: ['Thing'],
      description: 'Entities that have a somewhat fixed, physical extension'
    });

    this.addEntity('Organization', {
      type: 'Organization',
      properties: ['name', 'description', 'email', 'telephone', 'address'],
      relationships: ['member', 'parentOrganization', 'subOrganization'],
      parentTypes: ['Thing'],
      description: 'An organization such as a school, NGO, corporation, club, etc.'
    });

    this.addEntity('Vehicle', {
      type: 'Vehicle',
      properties: ['name', 'model', 'manufacturer', 'color', 'year'],
      relationships: ['ownedBy', 'locatedAt'],
      parentTypes: ['Thing'],
      description: 'A vehicle is a device that is designed or used to transport people or cargo'
    });

    this.addEntity('Product', {
      type: 'Product',
      properties: ['name', 'description', 'brand', 'model', 'color'],
      relationships: ['ownedBy', 'manufacturedBy'],
      parentTypes: ['Thing'],
      description: 'Any offered product or service'
    });

    // Core relationships
    this.addRelationship('hasName', {
      property: 'hasName',
      domain: ['Thing'],
      range: ['Text'],
      description: 'The name of the item'
    });

    this.addRelationship('owns', {
      property: 'owns',
      domain: ['Person'],
      range: ['Thing'],
      description: 'Products owned by the person'
    });

    this.addRelationship('ownedBy', {
      property: 'ownedBy',
      domain: ['Thing'],
      range: ['Person'],
      description: 'The person who owns this item'
    });

    this.addRelationship('knows', {
      property: 'knows',
      domain: ['Person'],
      range: ['Person'],
      description: 'The most generic bi-directional social/work relation'
    });

    this.addRelationship('livesAt', {
      property: 'livesAt',
      domain: ['Person', 'Animal'],
      range: ['Place'],
      description: 'The place where the person or animal lives'
    });

    this.addRelationship('worksFor', {
      property: 'worksFor',
      domain: ['Person'],
      range: ['Organization'],
      description: 'Organizations that the person works for'
    });

    console.log('📚 Schema.org vocabulary initialized with', this.entities.size, 'entities and', this.relationships.size, 'relationships');
  }

  /**
   * Add a new entity type to the vocabulary
   */
  addEntity(type: string, entity: SchemaEntity): void {
    this.entities.set(type, entity);
  }

  /**
   * Add a new relationship to the vocabulary
   */
  addRelationship(property: string, relationship: SchemaRelationship): void {
    this.relationships.set(property, relationship);
  }

  /**
   * Infer entity type from text and context
   */
  inferEntityType(entityText: string, context?: string): string | null {
    if (!entityText || typeof entityText !== 'string') {
      return null;
    }
    
    const lowerText = entityText.toLowerCase();
    
    // Direct type mapping
    const typeMapping: Record<string, string> = {
      'dog': 'Animal',
      'cat': 'Animal',
      'pet': 'Animal',
      'bird': 'Animal',
      'fish': 'Animal',
      'horse': 'Animal',
      'car': 'Vehicle',
      'truck': 'Vehicle',
      'bike': 'Vehicle',
      'motorcycle': 'Vehicle',
      'house': 'Place',
      'home': 'Place',
      'office': 'Place',
      'school': 'Place',
      'company': 'Organization',
      'business': 'Organization',
      'team': 'Organization',
      'friend': 'Person',
      'family': 'Person',
      'brother': 'Person',
      'sister': 'Person',
      'mother': 'Person',
      'father': 'Person',
      'phone': 'Product',
      'computer': 'Product',
      'book': 'Product'
    };

    const inferredType = typeMapping[lowerText];
    if (inferredType) {
      console.log(`🔍 Inferred entity type: ${entityText} → ${inferredType}`);
      return inferredType;
    }

    // Context-based inference
    if (context) {
      if (context.includes('name') && !typeMapping[lowerText]) {
        // If we're talking about names and don't recognize the entity, assume it's a person
        return 'Person';
      }
    }

    return null;
  }

  /**
   * Get valid relationships for an entity type
   */
  getValidRelationships(entityType: string): string[] {
    const entity = this.entities.get(entityType);
    if (!entity) return [];
    
    const relationships: string[] = [...entity.relationships];
    
    // Add inherited relationships from parent types
    entity.parentTypes.forEach(parentType => {
      const parentEntity = this.entities.get(parentType);
      if (parentEntity) {
        relationships.push(...parentEntity.relationships);
      }
    });
    
    return [...new Set(relationships)];
  }

  /**
   * Get valid properties for an entity type
   */
  getValidProperties(entityType: string): string[] {
    const entity = this.entities.get(entityType);
    if (!entity) return [];
    
    const properties: string[] = [...entity.properties];
    
    // Add inherited properties from parent types
    entity.parentTypes.forEach(parentType => {
      const parentEntity = this.entities.get(parentType);
      if (parentEntity) {
        properties.push(...parentEntity.properties);
      }
    });
    
    return [...new Set(properties)];
  }

  /**
   * Parse conversational input for semantic relationships
   */
  parseSemanticRelationships(text: string): {
    subject: { text: string; type: string | null };
    predicate: string | null;
    object: { text: string; type: string | null };
    confidence: number;
  } | null {
    if (!text || typeof text !== 'string') {
      return null;
    }
    
    console.log('🔍 Parsing semantic relationships in:', text);
    
    // Pattern: "My X's name is Y"
    const namePattern = /my\s+(\w+)'?s?\s+name\s+is\s+(\w+)/i;
    const nameMatch = text.match(namePattern);
    
    if (nameMatch) {
      const entityText = nameMatch[1];
      const nameText = nameMatch[2];
      const entityType = this.inferEntityType(entityText);
      
      return {
        subject: { text: entityText, type: entityType },
        predicate: 'hasName',
        object: { text: nameText, type: 'Text' },
        confidence: 0.9
      };
    }

    // Pattern: "I have a X"
    const ownershipPattern = /i\s+have\s+a\s+(\w+)/i;
    const ownershipMatch = text.match(ownershipPattern);
    
    if (ownershipMatch) {
      const entityText = ownershipMatch[1];
      const entityType = this.inferEntityType(entityText);
      
      return {
        subject: { text: 'I', type: 'Person' },
        predicate: 'owns',
        object: { text: entityText, type: entityType },
        confidence: 0.8
      };
    }

    // Pattern: "My name is X"
    const identityPattern = /my\s+name\s+is\s+(\w+)/i;
    const identityMatch = text.match(identityPattern);
    
    if (identityMatch) {
      const nameText = identityMatch[1];
      
      return {
        subject: { text: 'I', type: 'Person' },
        predicate: 'hasName',
        object: { text: nameText, type: 'Text' },
        confidence: 0.95
      };
    }

    return null;
  }

  /**
   * Generate semantic query from conversational input
   */
  generateSemanticQuery(text: string): {
    queryType: 'retrieve' | 'store';
    subject: string;
    predicate: string;
    object?: string;
    entityType?: string;
  } | null {
    if (!text || typeof text !== 'string') {
      return null;
    }
    
    console.log('🔍 Generating semantic query for:', text);
    
    // Query patterns: "What is my X's name?" - use original text to preserve case
    const queryPattern = /what\s+is\s+my\s+(\w+)'?s?\s+(\w+)/i;
    const queryMatch = text.match(queryPattern);
    
    if (queryMatch) {
      const entityText = queryMatch[1];
      const propertyText = queryMatch[2].toLowerCase();
      const entityType = this.inferEntityType(entityText.toLowerCase());
      
      if (propertyText === 'name') {
        return {
          queryType: 'retrieve',
          subject: entityText,
          predicate: 'hasName',
          entityType: entityType || undefined
        };
      }
    }

    // Identity query: "What is my name?"
    if (/what\s+is\s+my\s+name/i.test(text)) {
      return {
        queryType: 'retrieve',
        subject: 'user',
        predicate: 'hasName'
      };
    }

    return null;
  }

  /**
   * Get entity information
   */
  getEntityInfo(entityType: string): SchemaEntity | null {
    return this.entities.get(entityType) || null;
  }

  /**
   * Get relationship information
   */
  getRelationshipInfo(property: string): SchemaRelationship | null {
    return this.relationships.get(property) || null;
  }

  /**
   * Check if a relationship is valid between two entity types
   */
  isValidRelationship(subjectType: string, predicate: string, objectType: string): boolean {
    const relationship = this.relationships.get(predicate);
    if (!relationship) return false;
    
    const validDomain = relationship.domain.includes(subjectType) || 
                       relationship.domain.includes('Thing');
    const validRange = relationship.range.includes(objectType) || 
                      relationship.range.includes('Thing') ||
                      relationship.range.includes('Text');
    
    return validDomain && validRange;
  }

  /**
   * Get all entity types
   */
  getAllEntityTypes(): string[] {
    return Array.from(this.entities.keys());
  }

  /**
   * Get all relationship types
   */
  getAllRelationshipTypes(): string[] {
    return Array.from(this.relationships.keys());
  }

  /**
   * Get debug information
   */
  getDebugInfo(): any {
    return {
      entityCount: this.entities.size,
      relationshipCount: this.relationships.size,
      entities: Object.fromEntries(this.entities),
      relationships: Object.fromEntries(this.relationships)
    };
  }
}
