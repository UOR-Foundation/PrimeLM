// =============================================================================
// CONFIG TESTS
// =============================================================================

import { globalConfig } from '../config';

describe('globalConfig', () => {
  it('should have default configuration values', () => {
    expect(globalConfig).toBeDefined();
    expect(typeof globalConfig).toBe('object');
  });

  it('should have core configuration', () => {
    const config = globalConfig.getConfig();
    expect(config.core).toBeDefined();
    expect(config.core.embeddingModel).toBeDefined();
    expect(config.core.embeddingDimension).toBeGreaterThan(0);
  });

  it('should have prime configuration', () => {
    const config = globalConfig.getConfig();
    expect(config.core.primeThreshold).toBeGreaterThan(0);
    expect(config.core.maxPrimes).toBeGreaterThan(0);
  });

  it('should have memory configuration', () => {
    const config = globalConfig.getConfig();
    expect(config.episodicMemory).toBeDefined();
    expect(config.episodicMemory.maxEpisodes).toBeGreaterThan(0);
    expect(config.entityMemory).toBeDefined();
    expect(config.entityMemory.maxEntities).toBeGreaterThan(0);
  });

  it('should have conversation configuration', () => {
    const config = globalConfig.getConfig();
    expect(config.conversation).toBeDefined();
    expect(config.conversation.maxHistoryLength).toBeGreaterThan(0);
    expect(config.conversation.maxContextWindow).toBeGreaterThan(0);
  });

  it('should have valid model paths', () => {
    const config = globalConfig.getConfig();
    expect(config.core.embeddingModel).toContain('Xenova');
    expect(typeof config.core.embeddingModel).toBe('string');
  });

  it('should have reasonable threshold values', () => {
    const config = globalConfig.getConfig();
    expect(config.core.primeThreshold).toBeLessThan(1);
    expect(config.core.primeThreshold).toBeGreaterThan(0);
  });

  it('should have reasonable memory limits', () => {
    const config = globalConfig.getConfig();
    expect(config.episodicMemory.maxEpisodes).toBeLessThan(10000);
    expect(config.entityMemory.maxEntities).toBeLessThan(10000);
  });

  it('should validate configuration', () => {
    const validation = globalConfig.validateConfig();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it('should allow configuration updates', () => {
    const originalConfig = globalConfig.getConfig();
    globalConfig.updateSection('debug', { enabled: false });
    const updatedConfig = globalConfig.getConfig();
    expect(updatedConfig.debug.enabled).toBe(false);
    
    // Reset to original
    globalConfig.updateSection('debug', { enabled: originalConfig.debug.enabled });
  });
});
