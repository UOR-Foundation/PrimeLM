// =============================================================================
// SCHEMA VOCABULARY TESTS
// =============================================================================

import { SchemaVocabulary } from '../schema-vocabulary';

describe('SchemaVocabulary', () => {
  let schemaVocabulary: SchemaVocabulary;

  beforeEach(() => {
    schemaVocabulary = new SchemaVocabulary();
  });

  describe('constructor', () => {
    it('should initialize with basic schema entities', () => {
      expect(schemaVocabulary).toBeInstanceOf(SchemaVocabulary);
      
      const entityTypes = schemaVocabulary.getAllEntityTypes();
      expect(entityTypes).toContain('Thing');
      expect(entityTypes).toContain('Person');
      expect(entityTypes).toContain('Animal');
      expect(entityTypes).toContain('Place');
      expect(entityTypes).toContain('Organization');
      expect(entityTypes).toContain('Vehicle');
      expect(entityTypes).toContain('Product');
    });

    it('should initialize with basic relationships', () => {
      const relationshipTypes = schemaVocabulary.getAllRelationshipTypes();
      expect(relationshipTypes).toContain('hasName');
      expect(relationshipTypes).toContain('owns');
      expect(relationshipTypes).toContain('ownedBy');
      expect(relationshipTypes).toContain('knows');
      expect(relationshipTypes).toContain('livesAt');
      expect(relationshipTypes).toContain('worksFor');
    });
  });

  describe('inferEntityType', () => {
    it('should infer animal types correctly', () => {
      expect(schemaVocabulary.inferEntityType('dog')).toBe('Animal');
      expect(schemaVocabulary.inferEntityType('cat')).toBe('Animal');
      expect(schemaVocabulary.inferEntityType('pet')).toBe('Animal');
      expect(schemaVocabulary.inferEntityType('bird')).toBe('Animal');
      expect(schemaVocabulary.inferEntityType('fish')).toBe('Animal');
      expect(schemaVocabulary.inferEntityType('horse')).toBe('Animal');
    });

    it('should infer vehicle types correctly', () => {
      expect(schemaVocabulary.inferEntityType('car')).toBe('Vehicle');
      expect(schemaVocabulary.inferEntityType('truck')).toBe('Vehicle');
      expect(schemaVocabulary.inferEntityType('bike')).toBe('Vehicle');
      expect(schemaVocabulary.inferEntityType('motorcycle')).toBe('Vehicle');
    });

    it('should infer place types correctly', () => {
      expect(schemaVocabulary.inferEntityType('house')).toBe('Place');
      expect(schemaVocabulary.inferEntityType('home')).toBe('Place');
      expect(schemaVocabulary.inferEntityType('office')).toBe('Place');
      expect(schemaVocabulary.inferEntityType('school')).toBe('Place');
    });

    it('should infer organization types correctly', () => {
      expect(schemaVocabulary.inferEntityType('company')).toBe('Organization');
      expect(schemaVocabulary.inferEntityType('business')).toBe('Organization');
      expect(schemaVocabulary.inferEntityType('team')).toBe('Organization');
    });

    it('should infer person types correctly', () => {
      expect(schemaVocabulary.inferEntityType('friend')).toBe('Person');
      expect(schemaVocabulary.inferEntityType('family')).toBe('Person');
      expect(schemaVocabulary.inferEntityType('brother')).toBe('Person');
      expect(schemaVocabulary.inferEntityType('sister')).toBe('Person');
      expect(schemaVocabulary.inferEntityType('mother')).toBe('Person');
      expect(schemaVocabulary.inferEntityType('father')).toBe('Person');
    });

    it('should infer product types correctly', () => {
      expect(schemaVocabulary.inferEntityType('phone')).toBe('Product');
      expect(schemaVocabulary.inferEntityType('computer')).toBe('Product');
      expect(schemaVocabulary.inferEntityType('book')).toBe('Product');
    });

    it('should handle case insensitivity', () => {
      expect(schemaVocabulary.inferEntityType('DOG')).toBe('Animal');
      expect(schemaVocabulary.inferEntityType('Car')).toBe('Vehicle');
      expect(schemaVocabulary.inferEntityType('HOUSE')).toBe('Place');
    });

    it('should return null for unknown entities', () => {
      expect(schemaVocabulary.inferEntityType('unknown')).toBeNull();
      expect(schemaVocabulary.inferEntityType('xyz123')).toBeNull();
      expect(schemaVocabulary.inferEntityType('')).toBeNull();
    });

    it('should use context for inference when available', () => {
      // When context mentions "name" and entity is unknown, assume Person
      expect(schemaVocabulary.inferEntityType('Alice', 'my name is Alice')).toBe('Person');
      expect(schemaVocabulary.inferEntityType('Bob', 'name context')).toBe('Person');
    });
  });

  describe('parseSemanticRelationships', () => {
    it('should parse name relationships correctly', () => {
      const result = schemaVocabulary.parseSemanticRelationships('My dog\'s name is Buddy');
      
      expect(result).not.toBeNull();
      expect(result!.subject.text).toBe('dog');
      expect(result!.subject.type).toBe('Animal');
      expect(result!.predicate).toBe('hasName');
      expect(result!.object.text).toBe('Buddy');
      expect(result!.object.type).toBe('Text');
      expect(result!.confidence).toBe(0.9);
    });

    it('should parse ownership relationships', () => {
      const result = schemaVocabulary.parseSemanticRelationships('I have a car');
      
      expect(result).not.toBeNull();
      expect(result!.subject.text).toBe('I');
      expect(result!.subject.type).toBe('Person');
      expect(result!.predicate).toBe('owns');
      expect(result!.object.text).toBe('car');
      expect(result!.object.type).toBe('Vehicle');
      expect(result!.confidence).toBe(0.8);
    });

    it('should parse identity relationships', () => {
      const result = schemaVocabulary.parseSemanticRelationships('My name is Alice');
      
      expect(result).not.toBeNull();
      expect(result!.subject.text).toBe('I');
      expect(result!.subject.type).toBe('Person');
      expect(result!.predicate).toBe('hasName');
      expect(result!.object.text).toBe('Alice');
      expect(result!.object.type).toBe('Text');
      expect(result!.confidence).toBe(0.95);
    });

    it('should handle various name patterns', () => {
      const patterns = [
        'My cat\'s name is Whiskers',
        'My car\'s name is Lightning',
        'My friend\'s name is John'
      ];

      patterns.forEach(pattern => {
        const result = schemaVocabulary.parseSemanticRelationships(pattern);
        expect(result).not.toBeNull();
        expect(result!.predicate).toBe('hasName');
      });
    });

    it('should return null for unrecognized patterns', () => {
      const result = schemaVocabulary.parseSemanticRelationships('This is just random text');
      expect(result).toBeNull();
    });

    it('should handle case insensitive matching', () => {
      const result = schemaVocabulary.parseSemanticRelationships('MY DOG\'S NAME IS BUDDY');
      
      expect(result).not.toBeNull();
      expect(result!.subject.text).toBe('DOG');
      expect(result!.object.text).toBe('BUDDY');
    });
  });

  describe('generateSemanticQuery', () => {
    it('should generate queries for entity names', () => {
      const result = schemaVocabulary.generateSemanticQuery('What is my dog\'s name?');
      
      expect(result).not.toBeNull();
      expect(result!.queryType).toBe('retrieve');
      expect(result!.subject).toBe('dog');
      expect(result!.predicate).toBe('hasName');
      expect(result!.entityType).toBe('Animal');
    });

    it('should generate queries for user identity', () => {
      const result = schemaVocabulary.generateSemanticQuery('What is my name?');
      
      expect(result).not.toBeNull();
      expect(result!.queryType).toBe('retrieve');
      expect(result!.subject).toBe('user');
      expect(result!.predicate).toBe('hasName');
    });

    it('should handle various entity types in queries', () => {
      const queries = [
        'What is my car\'s name?',
        'What is my cat\'s name?',
        'What is my friend\'s name?'
      ];

      queries.forEach(query => {
        const result = schemaVocabulary.generateSemanticQuery(query);
        expect(result).not.toBeNull();
        expect(result!.queryType).toBe('retrieve');
        expect(result!.predicate).toBe('hasName');
      });
    });

    it('should return null for unrecognized query patterns', () => {
      const result = schemaVocabulary.generateSemanticQuery('Random question without pattern?');
      expect(result).toBeNull();
    });

    it('should handle case insensitive queries', () => {
      const result = schemaVocabulary.generateSemanticQuery('WHAT IS MY DOG\'S NAME?');
      
      expect(result).not.toBeNull();
      expect(result!.subject).toBe('DOG');
    });
  });

  describe('getValidRelationships', () => {
    it('should return valid relationships for Person', () => {
      const relationships = schemaVocabulary.getValidRelationships('Person');
      
      expect(relationships).toContain('knows');
      expect(relationships).toContain('owns');
      expect(relationships).toContain('memberOf');
      expect(relationships).toContain('worksFor');
    });

    it('should return valid relationships for Animal', () => {
      const relationships = schemaVocabulary.getValidRelationships('Animal');
      
      expect(relationships).toContain('ownedBy');
      expect(relationships).toContain('livesAt');
      expect(relationships).toContain('relatedTo');
    });

    it('should include inherited relationships from parent types', () => {
      const relationships = schemaVocabulary.getValidRelationships('Person');
      
      // Should include relationships from Thing (parent type)
      expect(Array.isArray(relationships)).toBe(true);
      expect(relationships.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown entity types', () => {
      const relationships = schemaVocabulary.getValidRelationships('UnknownType');
      expect(relationships).toEqual([]);
    });

    it('should not contain duplicates', () => {
      const relationships = schemaVocabulary.getValidRelationships('Person');
      const uniqueRelationships = [...new Set(relationships)];
      expect(relationships.length).toBe(uniqueRelationships.length);
    });
  });

  describe('getValidProperties', () => {
    it('should return valid properties for Person', () => {
      const properties = schemaVocabulary.getValidProperties('Person');
      
      expect(properties).toContain('name');
      expect(properties).toContain('givenName');
      expect(properties).toContain('familyName');
      expect(properties).toContain('email');
      expect(properties).toContain('telephone');
    });

    it('should return valid properties for Animal', () => {
      const properties = schemaVocabulary.getValidProperties('Animal');
      
      expect(properties).toContain('name');
      expect(properties).toContain('species');
      expect(properties).toContain('breed');
      expect(properties).toContain('age');
      expect(properties).toContain('color');
    });

    it('should include inherited properties from parent types', () => {
      const properties = schemaVocabulary.getValidProperties('Animal');
      
      // Should include properties from Thing (parent type)
      expect(properties).toContain('name');
      expect(properties).toContain('description');
      expect(properties).toContain('identifier');
    });

    it('should return empty array for unknown entity types', () => {
      const properties = schemaVocabulary.getValidProperties('UnknownType');
      expect(properties).toEqual([]);
    });

    it('should not contain duplicates', () => {
      const properties = schemaVocabulary.getValidProperties('Person');
      const uniqueProperties = [...new Set(properties)];
      expect(properties.length).toBe(uniqueProperties.length);
    });
  });

  describe('isValidRelationship', () => {
    it('should validate correct relationships', () => {
      expect(schemaVocabulary.isValidRelationship('Person', 'owns', 'Vehicle')).toBe(true);
      expect(schemaVocabulary.isValidRelationship('Person', 'knows', 'Person')).toBe(true);
      expect(schemaVocabulary.isValidRelationship('Animal', 'ownedBy', 'Person')).toBe(true);
    });

    it('should handle Thing as universal domain/range', () => {
      expect(schemaVocabulary.isValidRelationship('Thing', 'hasName', 'Text')).toBe(true);
    });

    it('should reject invalid relationships', () => {
      expect(schemaVocabulary.isValidRelationship('Animal', 'worksFor', 'Organization')).toBe(false);
    });

    it('should handle unknown relationships', () => {
      expect(schemaVocabulary.isValidRelationship('Person', 'unknownRelation', 'Thing')).toBe(false);
    });

    it('should handle Text as universal range', () => {
      expect(schemaVocabulary.isValidRelationship('Person', 'hasName', 'Text')).toBe(true);
    });
  });

  describe('entity and relationship management', () => {
    it('should allow adding new entities', () => {
      const newEntity = {
        type: 'TestEntity',
        properties: ['testProp'],
        relationships: ['testRel'],
        parentTypes: ['Thing'],
        description: 'Test entity'
      };

      schemaVocabulary.addEntity('TestEntity', newEntity);
      
      const entityTypes = schemaVocabulary.getAllEntityTypes();
      expect(entityTypes).toContain('TestEntity');
      
      const entityInfo = schemaVocabulary.getEntityInfo('TestEntity');
      expect(entityInfo).toEqual(newEntity);
    });

    it('should allow adding new relationships', () => {
      const newRelationship = {
        property: 'testRelation',
        domain: ['Person'],
        range: ['Thing'],
        description: 'Test relationship'
      };

      schemaVocabulary.addRelationship('testRelation', newRelationship);
      
      const relationshipTypes = schemaVocabulary.getAllRelationshipTypes();
      expect(relationshipTypes).toContain('testRelation');
      
      const relationshipInfo = schemaVocabulary.getRelationshipInfo('testRelation');
      expect(relationshipInfo).toEqual(newRelationship);
    });

    it('should return null for non-existent entities', () => {
      const entityInfo = schemaVocabulary.getEntityInfo('NonExistentEntity');
      expect(entityInfo).toBeNull();
    });

    it('should return null for non-existent relationships', () => {
      const relationshipInfo = schemaVocabulary.getRelationshipInfo('nonExistentRelation');
      expect(relationshipInfo).toBeNull();
    });
  });

  describe('debug information', () => {
    it('should provide debug information', () => {
      const debugInfo = schemaVocabulary.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('entityCount');
      expect(debugInfo).toHaveProperty('relationshipCount');
      expect(debugInfo).toHaveProperty('entities');
      expect(debugInfo).toHaveProperty('relationships');
      
      expect(typeof debugInfo.entityCount).toBe('number');
      expect(typeof debugInfo.relationshipCount).toBe('number');
      expect(debugInfo.entityCount).toBeGreaterThan(0);
      expect(debugInfo.relationshipCount).toBeGreaterThan(0);
    });

    it('should include all entities and relationships in debug info', () => {
      const debugInfo = schemaVocabulary.getDebugInfo();
      
      expect(debugInfo.entities).toHaveProperty('Thing');
      expect(debugInfo.entities).toHaveProperty('Person');
      expect(debugInfo.entities).toHaveProperty('Animal');
      
      expect(debugInfo.relationships).toHaveProperty('hasName');
      expect(debugInfo.relationships).toHaveProperty('owns');
      expect(debugInfo.relationships).toHaveProperty('knows');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty strings gracefully', () => {
      expect(schemaVocabulary.inferEntityType('')).toBeNull();
      expect(schemaVocabulary.parseSemanticRelationships('')).toBeNull();
      expect(schemaVocabulary.generateSemanticQuery('')).toBeNull();
    });

    it('should handle null and undefined inputs', () => {
      expect(() => schemaVocabulary.inferEntityType(null as any)).not.toThrow();
      expect(() => schemaVocabulary.parseSemanticRelationships(null as any)).not.toThrow();
      expect(() => schemaVocabulary.generateSemanticQuery(null as any)).not.toThrow();
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      expect(() => schemaVocabulary.inferEntityType(longString)).not.toThrow();
      expect(() => schemaVocabulary.parseSemanticRelationships(longString)).not.toThrow();
      expect(() => schemaVocabulary.generateSemanticQuery(longString)).not.toThrow();
    });

    it('should handle special characters', () => {
      const specialString = '!@#$%^&*()_+{}|:"<>?[]\\;\',./-=';
      expect(() => schemaVocabulary.inferEntityType(specialString)).not.toThrow();
      expect(() => schemaVocabulary.parseSemanticRelationships(specialString)).not.toThrow();
      expect(() => schemaVocabulary.generateSemanticQuery(specialString)).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete conversation flow', () => {
      // User introduces themselves
      const intro = schemaVocabulary.parseSemanticRelationships('My name is Alice');
      expect(intro).not.toBeNull();
      expect(intro!.subject.type).toBe('Person');
      
      // User introduces pet
      const petIntro = schemaVocabulary.parseSemanticRelationships('My dog\'s name is Buddy');
      expect(petIntro).not.toBeNull();
      expect(petIntro!.subject.type).toBe('Animal');
      
      // User queries about pet
      const petQuery = schemaVocabulary.generateSemanticQuery('What is my dog\'s name?');
      expect(petQuery).not.toBeNull();
      expect(petQuery!.entityType).toBe('Animal');
    });

    it('should maintain consistency across operations', () => {
      const entityType1 = schemaVocabulary.inferEntityType('dog');
      const entityType2 = schemaVocabulary.inferEntityType('dog');
      expect(entityType1).toBe(entityType2);
      
      const relationships1 = schemaVocabulary.getValidRelationships('Person');
      const relationships2 = schemaVocabulary.getValidRelationships('Person');
      expect(relationships1).toEqual(relationships2);
    });

    it('should handle complex entity hierarchies', () => {
      // Test that Animal inherits from Thing
      const animalProperties = schemaVocabulary.getValidProperties('Animal');
      expect(animalProperties).toContain('name'); // From Thing
      expect(animalProperties).toContain('species'); // From Animal
      
      // Test that Person inherits from Thing
      const personProperties = schemaVocabulary.getValidProperties('Person');
      expect(personProperties).toContain('name'); // From Thing
      expect(personProperties).toContain('givenName'); // From Person
    });
  });
});
