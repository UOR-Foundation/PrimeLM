// =============================================================================
// ENTITY MEMORY TESTS
// =============================================================================

import { 
  UnifiedEntityMemory,
  EntityInfo,
  EntityQuery
} from '../entity-memory';

describe('UnifiedEntityMemory', () => {
  let entityMemory: UnifiedEntityMemory;

  beforeEach(() => {
    entityMemory = new UnifiedEntityMemory(100); // Small limit for testing
  });

  describe('constructor', () => {
    it('should create a new UnifiedEntityMemory instance', () => {
      expect(entityMemory).toBeInstanceOf(UnifiedEntityMemory);
    });

    it('should initialize with empty storage', () => {
      const stats = entityMemory.getStats();
      expect(stats.totalEntities).toBe(0);
    });

    it('should accept custom max entities limit', () => {
      const customMemory = new UnifiedEntityMemory(500);
      expect(customMemory).toBeInstanceOf(UnifiedEntityMemory);
    });
  });

  describe('store', () => {
    it('should store identity entities', () => {
      const id = entityMemory.store({
        value: 'Alice',
        type: 'identity',
        confidence: 0.9,
        context: ['introduction']
      });

      expect(id).toBe('identity:alice');
      const entity = entityMemory.get(id);
      expect(entity).toBeTruthy();
      expect(entity!.value).toBe('Alice');
      expect(entity!.type).toBe('identity');
    });

    it('should store relationship entities', () => {
      const id = entityMemory.store({
        value: 'Buddy',
        type: 'relationship',
        subject: 'user',
        relationship: 'hasName',
        entityType: 'dog',
        confidence: 0.8
      });

      expect(id).toBe('user:hasName');
      const entity = entityMemory.get(id);
      expect(entity!.value).toBe('Buddy');
      expect(entity!.relationship).toBe('hasName');
      expect(entity!.subject).toBe('user');
    });

    it('should store attribute entities', () => {
      const id = entityMemory.store({
        value: 'blue',
        type: 'attribute',
        subject: 'car',
        entityType: 'color',
        confidence: 0.7
      });

      expect(id).toBe('car:color:blue');
      const entity = entityMemory.get(id);
      expect(entity!.value).toBe('blue');
      expect(entity!.type).toBe('attribute');
    });

    it('should update existing entities', () => {
      // Store initial entity
      const id1 = entityMemory.store({
        value: 'Alice',
        type: 'identity',
        confidence: 0.7
      });

      // Store same entity again
      const id2 = entityMemory.store({
        value: 'Alice',
        type: 'identity',
        confidence: 0.8
      });

      expect(id1).toBe(id2);
      const entity = entityMemory.get(id1);
      expect(entity!.mentionCount).toBe(2);
      expect(entity!.confidence).toBeGreaterThan(0.7);
    });

    it('should handle context arrays', () => {
      const id = entityMemory.store({
        value: 'test',
        type: 'reference',
        context: ['context1', 'context2', 'context3'],
        confidence: 0.6
      });

      const entity = entityMemory.get(id);
      expect(entity!.context).toEqual(['context1', 'context2', 'context3']);
    });

    it('should limit context array size', () => {
      const id = entityMemory.store({
        value: 'test',
        type: 'reference',
        context: ['c1', 'c2', 'c3'],
        confidence: 0.6
      });

      // Update with more context
      entityMemory.store({
        value: 'test',
        type: 'reference',
        context: ['c4', 'c5', 'c6', 'c7', 'c8'],
        confidence: 0.7
      });

      const entity = entityMemory.get(id);
      expect(entity!.context.length).toBeLessThanOrEqual(5);
    });
  });

  describe('query', () => {
    beforeEach(() => {
      // Setup test data
      entityMemory.store({
        value: 'Alice',
        type: 'identity',
        confidence: 0.9
      });

      entityMemory.store({
        value: 'Buddy',
        type: 'relationship',
        subject: 'user',
        relationship: 'hasName',
        entityType: 'dog',
        confidence: 0.8
      });

      entityMemory.store({
        value: 'blue',
        type: 'attribute',
        subject: 'car',
        entityType: 'car',
        confidence: 0.7
      });

      entityMemory.store({
        value: 'Toyota',
        type: 'reference',
        entityType: 'car',
        confidence: 0.6
      });
    });

    it('should query by type', () => {
      const identities = entityMemory.query({ type: 'identity' });
      expect(identities).toHaveLength(1);
      expect(identities[0].value).toBe('Alice');

      const relationships = entityMemory.query({ type: 'relationship' });
      expect(relationships).toHaveLength(1);
      expect(relationships[0].value).toBe('Buddy');
    });

    it('should query by entity type', () => {
      const dogs = entityMemory.query({ entityType: 'dog' });
      expect(dogs).toHaveLength(1);
      expect(dogs[0].value).toBe('Buddy');

      const cars = entityMemory.query({ entityType: 'car' });
      expect(cars).toHaveLength(2);
    });

    it('should query by relationship', () => {
      const names = entityMemory.query({ relationship: 'hasName' });
      expect(names).toHaveLength(1);
      expect(names[0].value).toBe('Buddy');
    });

    it('should query by subject', () => {
      const userEntities = entityMemory.query({ subject: 'user' });
      expect(userEntities).toHaveLength(1);
      expect(userEntities[0].subject).toBe('user');

      const carEntities = entityMemory.query({ subject: 'car' });
      expect(carEntities).toHaveLength(1);
      expect(carEntities[0].subject).toBe('car');
    });

    it('should query by value', () => {
      const aliceEntities = entityMemory.query({ value: 'Alice' });
      expect(aliceEntities).toHaveLength(1);
      expect(aliceEntities[0].value).toBe('Alice');

      const blueEntities = entityMemory.query({ value: 'blue' });
      expect(blueEntities).toHaveLength(1);
      expect(blueEntities[0].value).toBe('blue');
    });

    it('should query with multiple criteria', () => {
      const dogNames = entityMemory.query({ 
        type: 'relationship',
        entityType: 'dog',
        relationship: 'hasName'
      });
      expect(dogNames).toHaveLength(1);
      expect(dogNames[0].value).toBe('Buddy');
    });

    it('should filter by minimum confidence', () => {
      const highConfidence = entityMemory.query({ minConfidence: 0.8 });
      expect(highConfidence).toHaveLength(2); // Alice and Buddy

      const veryHighConfidence = entityMemory.query({ minConfidence: 0.9 });
      expect(veryHighConfidence).toHaveLength(1); // Only Alice
    });

    it('should return empty array for no matches', () => {
      const noMatches = entityMemory.query({ value: 'nonexistent' });
      expect(noMatches).toEqual([]);
    });

    it('should sort results by confidence and recency', () => {
      // Add more entities with different confidence levels
      entityMemory.store({
        value: 'high_confidence',
        type: 'reference',
        confidence: 0.95
      });

      entityMemory.store({
        value: 'low_confidence',
        type: 'reference',
        confidence: 0.3
      });

      const results = entityMemory.query({ type: 'reference' });
      expect(results[0].confidence).toBeGreaterThanOrEqual(results[1].confidence);
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      entityMemory.store({
        value: 'Alice',
        type: 'identity',
        confidence: 0.9
      });

      entityMemory.store({
        value: 'Buddy',
        type: 'relationship',
        subject: 'dog',
        relationship: 'hasName',
        entityType: 'dog',
        confidence: 0.8
      });
    });

    it('should get user name', () => {
      const userName = entityMemory.getUserName();
      expect(userName).toBe('Alice');
    });

    it('should get entity name by type', () => {
      const dogName = entityMemory.getEntityName('dog');
      expect(dogName).toBe('Buddy');
    });

    it('should get entities by type', () => {
      const dogs = entityMemory.getEntitiesByType('dog');
      expect(dogs).toHaveLength(1);
      expect(dogs[0].value).toBe('Buddy');
    });

    it('should get relationships for subject', () => {
      const dogRelationships = entityMemory.getRelationships('dog');
      expect(dogRelationships).toHaveLength(1);
      expect(dogRelationships[0].relationship).toBe('hasName');
    });

    it('should return null for non-existent user name', () => {
      entityMemory.clear();
      const userName = entityMemory.getUserName();
      expect(userName).toBeNull();
    });

    it('should return null for non-existent entity name', () => {
      const catName = entityMemory.getEntityName('cat');
      expect(catName).toBeNull();
    });
  });

  describe('memory management', () => {
    it('should track access count and last mentioned', () => {
      const id = entityMemory.store({
        value: 'test',
        type: 'reference',
        confidence: 0.5
      });

      const entity1 = entityMemory.get(id);
      expect(entity1!.mentionCount).toBe(1);
      expect(entity1!.lastMentioned).toBeGreaterThan(0);

      // Query should update access information
      entityMemory.query({ value: 'test' });
      
      const entity2 = entityMemory.get(id);
      expect(entity2!.lastMentioned).toBeGreaterThanOrEqual(entity1!.lastMentioned);
    });

    it('should cleanup low-confidence entities when over limit', () => {
      // Fill memory with low-confidence entities
      for (let i = 0; i < 120; i++) {
        entityMemory.store({
          value: `test${i}`,
          type: 'reference',
          confidence: 0.05 // Very low confidence
        });
      }

      const stats = entityMemory.getStats();
      expect(stats.totalEntities).toBeLessThanOrEqual(100);
    });

    it('should preserve high-confidence entities during cleanup', () => {
      // Add high-confidence entity
      const importantId = entityMemory.store({
        value: 'important',
        type: 'identity',
        confidence: 0.95
      });

      // Fill with low-confidence entities
      for (let i = 0; i < 120; i++) {
        entityMemory.store({
          value: `filler${i}`,
          type: 'reference',
          confidence: 0.05
        });
      }

      // Important entity should still exist
      const importantEntity = entityMemory.get(importantId);
      expect(importantEntity).toBeTruthy();
      expect(importantEntity!.value).toBe('important');
    });

    it('should clear all entities', () => {
      entityMemory.store({
        value: 'test1',
        type: 'reference',
        confidence: 0.5
      });

      entityMemory.store({
        value: 'test2',
        type: 'reference',
        confidence: 0.6
      });

      expect(entityMemory.getStats().totalEntities).toBe(2);

      entityMemory.clear();
      expect(entityMemory.getStats().totalEntities).toBe(0);
    });
  });

  describe('statistics', () => {
    beforeEach(() => {
      entityMemory.store({
        value: 'Alice',
        type: 'identity',
        confidence: 0.9
      });

      entityMemory.store({
        value: 'Buddy',
        type: 'relationship',
        entityType: 'dog',
        confidence: 0.8
      });

      entityMemory.store({
        value: 'blue',
        type: 'attribute',
        entityType: 'color',
        confidence: 0.7
      });
    });

    it('should provide comprehensive statistics', () => {
      const stats = entityMemory.getStats();

      expect(stats.totalEntities).toBe(3);
      expect(stats.byType.identity).toBe(1);
      expect(stats.byType.relationship).toBe(1);
      expect(stats.byType.attribute).toBe(1);
      expect(stats.byEntityType.dog).toBe(1);
      expect(stats.byEntityType.color).toBe(1);
      expect(stats.averageConfidence).toBeCloseTo(0.8, 1);
      expect(stats.memoryUsage).toBe('3/100');
    });

    it('should calculate correct average confidence', () => {
      entityMemory.clear();
      
      entityMemory.store({
        value: 'test1',
        type: 'reference',
        confidence: 0.6
      });

      entityMemory.store({
        value: 'test2',
        type: 'reference',
        confidence: 0.8
      });

      const stats = entityMemory.getStats();
      expect(stats.averageConfidence).toBeCloseTo(0.7, 1);
    });

    it('should handle empty memory statistics', () => {
      entityMemory.clear();
      const stats = entityMemory.getStats();

      expect(stats.totalEntities).toBe(0);
      expect(stats.averageConfidence).toBe(0);
      expect(stats.memoryUsage).toBe('0/100');
    });
  });

  describe('edge cases', () => {
    it('should handle empty values', () => {
      const id = entityMemory.store({
        value: '',
        type: 'reference',
        confidence: 0.5
      });

      const entity = entityMemory.get(id);
      expect(entity).toBeTruthy();
      expect(entity!.value).toBe('');
    });

    it('should handle null/undefined values gracefully', () => {
      const id = entityMemory.store({
        value: null,
        type: 'reference',
        confidence: 0.5
      });

      const entity = entityMemory.get(id);
      expect(entity).toBeTruthy();
    });

    it('should handle special characters in values', () => {
      const id = entityMemory.store({
        value: 'test@#$%^&*()',
        type: 'reference',
        confidence: 0.5
      });

      const entity = entityMemory.get(id);
      expect(entity!.value).toBe('test@#$%^&*()');
    });

    it('should handle very long values', () => {
      const longValue = 'a'.repeat(1000);
      const id = entityMemory.store({
        value: longValue,
        type: 'reference',
        confidence: 0.5
      });

      const entity = entityMemory.get(id);
      expect(entity!.value).toBe(longValue);
    });

    it('should handle case sensitivity in values', () => {
      const id1 = entityMemory.store({
        value: 'Alice',
        type: 'identity',
        confidence: 0.8
      });

      const id2 = entityMemory.store({
        value: 'alice',
        type: 'identity',
        confidence: 0.7
      });

      // Should be the same entity (case insensitive)
      expect(id1).toBe(id2);
    });

    it('should handle missing optional fields', () => {
      const id = entityMemory.store({
        value: 'minimal',
        confidence: 0.5
      });

      const entity = entityMemory.get(id);
      expect(entity!.type).toBe('reference'); // Default type
      expect(entity!.context).toEqual([]);
      expect(entity!.metadata).toEqual({});
    });
  });

  describe('indexing', () => {
    it('should maintain consistent indexing', () => {
      const id = entityMemory.store({
        value: 'indexed_test',
        type: 'reference',
        entityType: 'test',
        confidence: 0.7
      });

      // Query by different criteria should find the same entity
      const byValue = entityMemory.query({ value: 'indexed_test' });
      const byType = entityMemory.query({ type: 'reference' });
      const byEntityType = entityMemory.query({ entityType: 'test' });

      expect(byValue).toHaveLength(1);
      expect(byType).toHaveLength(1);
      expect(byEntityType).toHaveLength(1);
      expect(byValue[0].id).toBe(id);
      expect(byType[0].id).toBe(id);
      expect(byEntityType[0].id).toBe(id);
    });

    it('should handle index cleanup during entity removal', () => {
      // This is tested indirectly through the cleanup functionality
      // Fill memory to trigger cleanup
      for (let i = 0; i < 120; i++) {
        entityMemory.store({
          value: `cleanup_test${i}`,
          type: 'reference',
          confidence: 0.05
        });
      }

      // Verify that queries still work correctly after cleanup
      const results = entityMemory.query({ type: 'reference' });
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(100);
    });
  });
});
