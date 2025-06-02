// =============================================================================
// UNIFIED ENTITY MEMORY SYSTEM
// =============================================================================

export interface EntityInfo {
  id: string;
  value: any;
  type: 'identity' | 'relationship' | 'attribute' | 'reference';
  entityType?: string; // e.g., 'person', 'animal', 'vehicle'
  relationship?: string; // e.g., 'hasName', 'owns', 'isA'
  subject?: string; // For relationships: who/what has this relationship
  confidence: number;
  lastMentioned: number;
  mentionCount: number;
  context: string[];
  metadata: Record<string, any>;
}

export interface EntityQuery {
  type?: 'identity' | 'relationship' | 'attribute' | 'reference';
  entityType?: string;
  relationship?: string;
  subject?: string;
  value?: any;
  minConfidence?: number;
}

export interface EntityIndex {
  byType: Map<string, Set<string>>;
  byEntityType: Map<string, Set<string>>;
  byRelationship: Map<string, Set<string>>;
  bySubject: Map<string, Set<string>>;
  byValue: Map<string, Set<string>>;
}

export class UnifiedEntityMemory {
  private entities: Map<string, EntityInfo> = new Map();
  private index: EntityIndex;
  private maxEntities: number = 1000;
  private cleanupThreshold: number = 0.1; // Remove entities below this confidence

  constructor(maxEntities: number = 1000) {
    this.maxEntities = maxEntities;
    this.index = {
      byType: new Map(),
      byEntityType: new Map(),
      byRelationship: new Map(),
      bySubject: new Map(),
      byValue: new Map()
    };
  }

  /**
   * Store entity with semantic key generation
   */
  store(entityInfo: Partial<EntityInfo>): string {
    const id = this.generateSemanticKey(entityInfo);
    
    const entity: EntityInfo = {
      id,
      value: entityInfo.value,
      type: entityInfo.type || 'reference',
      entityType: entityInfo.entityType,
      relationship: entityInfo.relationship,
      subject: entityInfo.subject,
      confidence: entityInfo.confidence || 0.8,
      lastMentioned: Date.now(),
      mentionCount: 1,
      context: entityInfo.context || [],
      metadata: entityInfo.metadata || {}
    };

    // Update existing entity or create new one
    if (this.entities.has(id)) {
      const existing = this.entities.get(id)!;
      entity.mentionCount = existing.mentionCount + 1;
      entity.confidence = Math.min(existing.confidence + 0.1, 1.0);
      entity.context = [...existing.context, ...entity.context].slice(-5);
      this.removeFromIndex(existing);
    }

    this.entities.set(id, entity);
    this.addToIndex(entity);

    console.log(`💾 Stored entity: ${id} = ${entity.value} (type: ${entity.type})`);

    // Cleanup if needed
    if (this.entities.size > this.maxEntities) {
      this.cleanup();
    }

    return id;
  }

  /**
   * Generate semantic key for entity
   */
  private generateSemanticKey(entityInfo: Partial<EntityInfo>): string {
    const { type, entityType, relationship, subject, value } = entityInfo;

    switch (type) {
      case 'identity':
        return `identity:${String(value).toLowerCase()}`;
      
      case 'relationship':
        if (subject && relationship) {
          return `${subject}:${relationship}`;
        }
        return `relationship:${String(value).toLowerCase()}`;
      
      case 'attribute':
        if (subject && entityType) {
          return `${subject}:${entityType}:${String(value).toLowerCase()}`;
        }
        return `attribute:${String(value).toLowerCase()}`;
      
      default:
        return `reference:${String(value).toLowerCase()}`;
    }
  }

  /**
   * Query entities with flexible criteria
   */
  query(criteria: EntityQuery): EntityInfo[] {
    let candidateIds = new Set<string>();
    let isFirstCriteria = true;

    // Build candidate set using indexes
    if (criteria.type) {
      const typeIds = this.index.byType.get(criteria.type) || new Set();
      if (isFirstCriteria) {
        candidateIds = new Set(typeIds);
        isFirstCriteria = false;
      } else {
        candidateIds = new Set([...candidateIds].filter(id => typeIds.has(id)));
      }
    }

    if (criteria.entityType) {
      const entityTypeIds = this.index.byEntityType.get(criteria.entityType) || new Set();
      if (isFirstCriteria) {
        candidateIds = new Set(entityTypeIds);
        isFirstCriteria = false;
      } else {
        candidateIds = new Set([...candidateIds].filter(id => entityTypeIds.has(id)));
      }
    }

    if (criteria.relationship) {
      const relationshipIds = this.index.byRelationship.get(criteria.relationship) || new Set();
      if (isFirstCriteria) {
        candidateIds = new Set(relationshipIds);
        isFirstCriteria = false;
      } else {
        candidateIds = new Set([...candidateIds].filter(id => relationshipIds.has(id)));
      }
    }

    if (criteria.subject) {
      const subjectIds = this.index.bySubject.get(criteria.subject) || new Set();
      if (isFirstCriteria) {
        candidateIds = new Set(subjectIds);
        isFirstCriteria = false;
      } else {
        candidateIds = new Set([...candidateIds].filter(id => subjectIds.has(id)));
      }
    }

    if (criteria.value) {
      const valueKey = String(criteria.value).toLowerCase();
      const valueIds = this.index.byValue.get(valueKey) || new Set();
      if (isFirstCriteria) {
        candidateIds = new Set(valueIds);
        isFirstCriteria = false;
      } else {
        candidateIds = new Set([...candidateIds].filter(id => valueIds.has(id)));
      }
    }

    // If no criteria specified, return all entities
    if (isFirstCriteria) {
      candidateIds = new Set(this.entities.keys());
    }

    // Filter by confidence and return sorted results
    const results = [...candidateIds]
      .map(id => this.entities.get(id)!)
      .filter(entity => entity.confidence >= (criteria.minConfidence || 0))
      .sort((a, b) => {
        // Sort by confidence desc, then by last mentioned desc
        if (a.confidence !== b.confidence) {
          return b.confidence - a.confidence;
        }
        return b.lastMentioned - a.lastMentioned;
      });

    return results;
  }

  /**
   * Get entity by semantic key
   */
  get(key: string): EntityInfo | null {
    return this.entities.get(key) || null;
  }

  /**
   * Find user's name
   */
  getUserName(): string | null {
    const identityEntities = this.query({ type: 'identity' });
    return identityEntities.length > 0 ? identityEntities[0].value : null;
  }

  /**
   * Find entity name by type and relationship
   */
  getEntityName(entityType: string): string | null {
    const nameEntities = this.query({ 
      relationship: 'hasName',
      subject: entityType 
    });
    return nameEntities.length > 0 ? nameEntities[0].value : null;
  }

  /**
   * Find all entities of a specific type
   */
  getEntitiesByType(entityType: string): EntityInfo[] {
    return this.query({ entityType });
  }

  /**
   * Find relationships for a subject
   */
  getRelationships(subject: string): EntityInfo[] {
    return this.query({ 
      type: 'relationship',
      subject 
    });
  }

  /**
   * Add entity to indexes
   */
  private addToIndex(entity: EntityInfo): void {
    const { id, type, entityType, relationship, subject, value } = entity;

    // Index by type
    if (type) {
      if (!this.index.byType.has(type)) {
        this.index.byType.set(type, new Set());
      }
      this.index.byType.get(type)!.add(id);
    }

    // Index by entity type
    if (entityType) {
      if (!this.index.byEntityType.has(entityType)) {
        this.index.byEntityType.set(entityType, new Set());
      }
      this.index.byEntityType.get(entityType)!.add(id);
    }

    // Index by relationship
    if (relationship) {
      if (!this.index.byRelationship.has(relationship)) {
        this.index.byRelationship.set(relationship, new Set());
      }
      this.index.byRelationship.get(relationship)!.add(id);
    }

    // Index by subject
    if (subject) {
      if (!this.index.bySubject.has(subject)) {
        this.index.bySubject.set(subject, new Set());
      }
      this.index.bySubject.get(subject)!.add(id);
    }

    // Index by value
    if (value) {
      const valueKey = String(value).toLowerCase();
      if (!this.index.byValue.has(valueKey)) {
        this.index.byValue.set(valueKey, new Set());
      }
      this.index.byValue.get(valueKey)!.add(id);
    }
  }

  /**
   * Remove entity from indexes
   */
  private removeFromIndex(entity: EntityInfo): void {
    const { id, type, entityType, relationship, subject, value } = entity;

    if (type) {
      this.index.byType.get(type)?.delete(id);
    }
    if (entityType) {
      this.index.byEntityType.get(entityType)?.delete(id);
    }
    if (relationship) {
      this.index.byRelationship.get(relationship)?.delete(id);
    }
    if (subject) {
      this.index.bySubject.get(subject)?.delete(id);
    }
    if (value) {
      const valueKey = String(value).toLowerCase();
      this.index.byValue.get(valueKey)?.delete(id);
    }
  }

  /**
   * Cleanup low-confidence entities
   */
  private cleanup(): void {
    const entitiesToRemove: string[] = [];
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    for (const [id, entity] of this.entities) {
      // Remove entities with low confidence that haven't been mentioned recently
      if (entity.confidence < this.cleanupThreshold && entity.lastMentioned < oneHourAgo) {
        entitiesToRemove.push(id);
      }
    }

    // Remove oldest entities if still over limit
    if (this.entities.size - entitiesToRemove.length > this.maxEntities) {
      const sortedEntities = [...this.entities.entries()]
        .sort(([,a], [,b]) => a.lastMentioned - b.lastMentioned);
      
      const additionalToRemove = this.entities.size - entitiesToRemove.length - this.maxEntities;
      for (let i = 0; i < additionalToRemove; i++) {
        entitiesToRemove.push(sortedEntities[i][0]);
      }
    }

    // Remove entities
    for (const id of entitiesToRemove) {
      const entity = this.entities.get(id);
      if (entity) {
        this.removeFromIndex(entity);
        this.entities.delete(id);
      }
    }

    if (entitiesToRemove.length > 0) {
      console.log(`🧹 Cleaned up ${entitiesToRemove.length} entities`);
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    totalEntities: number;
    byType: Record<string, number>;
    byEntityType: Record<string, number>;
    averageConfidence: number;
    memoryUsage: string;
  } {
    const byType: Record<string, number> = {};
    const byEntityType: Record<string, number> = {};
    let totalConfidence = 0;

    for (const entity of this.entities.values()) {
      byType[entity.type] = (byType[entity.type] || 0) + 1;
      if (entity.entityType) {
        byEntityType[entity.entityType] = (byEntityType[entity.entityType] || 0) + 1;
      }
      totalConfidence += entity.confidence;
    }

    return {
      totalEntities: this.entities.size,
      byType,
      byEntityType,
      averageConfidence: this.entities.size > 0 ? totalConfidence / this.entities.size : 0,
      memoryUsage: `${this.entities.size}/${this.maxEntities}`
    };
  }

  /**
   * Clear all entities
   */
  clear(): void {
    this.entities.clear();
    this.index = {
      byType: new Map(),
      byEntityType: new Map(),
      byRelationship: new Map(),
      bySubject: new Map(),
      byValue: new Map()
    };
    console.log('🔄 Entity memory cleared');
  }
}
