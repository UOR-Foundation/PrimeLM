// =============================================================================
// ERROR HANDLING SYSTEM TESTS
// =============================================================================

import {
  GracefulErrorHandler,
  ErrorContext,
  FallbackStrategy,
  safeAsync,
  safeSync,
  createErrorContext
} from '../error-handling';

describe('GracefulErrorHandler', () => {
  let errorHandler: GracefulErrorHandler;

  beforeEach(() => {
    errorHandler = new GracefulErrorHandler();
    // Clear console to avoid test pollution
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create a new GracefulErrorHandler instance', () => {
      expect(errorHandler).toBeInstanceOf(GracefulErrorHandler);
    });

    it('should initialize with default fallback strategies', () => {
      const stats = errorHandler.getStats();
      expect(stats.totalErrors).toBe(0);
      expect(stats.recoverySuccessRate).toBe(0);
    });
  });

  describe('handleError', () => {
    it('should handle knowledge base fallback', async () => {
      const error = new Error('knowledge base failed');
      const context: ErrorContext = {
        component: 'knowledge-bootstrap',
        operation: 'initialize',
        timestamp: Date.now(),
        severity: 'medium',
        recoverable: true
      };

      const result = await errorHandler.handleError(error, context) as any;
      
      expect(result).toBeDefined();
      expect(result.vocabulary).toBeInstanceOf(Map);
      expect(result.vocabularyPrimes).toBeInstanceOf(Map);
      expect(result.vocabulary.has('hello')).toBe(true);
      expect(result.vocabulary.has('help')).toBe(true);
      expect(result.vocabulary.has('name')).toBe(true);
    });

    it('should handle embedding generation fallback', async () => {
      const error = new Error('embedding pipeline failed');
      const context: ErrorContext = {
        component: 'embedding-generation',
        operation: 'generate',
        input: 'hello world',
        timestamp: Date.now(),
        severity: 'medium',
        recoverable: true
      };

      const result = await errorHandler.handleError(error, context) as number[];
      
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(384);
      expect(typeof result[0]).toBe('number');
    });

    it('should handle entity memory fallback', async () => {
      const error = new Error('entity storage failed');
      const context: ErrorContext = {
        component: 'entity-memory',
        operation: 'store',
        input: 'what is my name',
        timestamp: Date.now(),
        severity: 'medium',
        recoverable: true
      };

      const result = await errorHandler.handleError(error, context) as string;
      
      expect(typeof result).toBe('string');
      expect(result).toContain('name');
    });

    it('should handle semantic query fallback', async () => {
      const error = new Error('No semantic query handler');
      const context: ErrorContext = {
        component: 'semantic-query',
        operation: 'process',
        input: 'hello there',
        timestamp: Date.now(),
        severity: 'medium',
        recoverable: true
      };

      const result = await errorHandler.handleError(error, context) as string;
      
      expect(typeof result).toBe('string');
      expect(result.toLowerCase()).toContain('hello');
    });

    it('should handle prime resonance fallback', async () => {
      const error = new Error('prime calculation failed');
      const context: ErrorContext = {
        component: 'prime-resonance',
        operation: 'calculate',
        input: 'test input',
        timestamp: Date.now(),
        severity: 'medium',
        recoverable: true
      };

      const result = await errorHandler.handleError(error, context) as Record<number, number>;
      
      expect(typeof result).toBe('object');
      expect(result[2]).toBeDefined();
      expect(result[3]).toBeDefined();
      expect(result[5]).toBeDefined();
      expect(result[7]).toBeDefined();
    });

    it('should use generic fallback when no specific strategy matches', async () => {
      const error = new Error('unknown error');
      const context: ErrorContext = {
        component: 'unknown-component',
        operation: 'unknown-operation',
        input: 'test input',
        timestamp: Date.now(),
        severity: 'medium',
        recoverable: true
      };

      const result = await errorHandler.handleError(error, context) as string;
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return default value when provided', async () => {
      const error = new Error('test error');
      const context: ErrorContext = {
        component: 'test',
        operation: 'test',
        timestamp: Date.now(),
        severity: 'critical',
        recoverable: false
      };
      const defaultValue = 'default response';

      // Remove all fallback strategies to force default value usage
      const handler = new GracefulErrorHandler();
      handler['fallbackStrategies'] = [];

      const result = await handler.handleError(error, context, defaultValue);
      expect(result).toBe(defaultValue);
    });

    it('should throw user-friendly error when no fallback works and no default', async () => {
      const error = new Error('test error');
      const context: ErrorContext = {
        component: 'test',
        operation: 'test',
        timestamp: Date.now(),
        severity: 'critical',
        recoverable: false
      };

      // Remove all fallback strategies
      const handler = new GracefulErrorHandler();
      handler['fallbackStrategies'] = [];

      await expect(handler.handleError(error, context)).rejects.toThrow();
    });
  });

  describe('addFallbackStrategy', () => {
    it('should add custom fallback strategy', () => {
      const customStrategy: FallbackStrategy = {
        name: 'custom_test_strategy',
        condition: (error, context) => context.component === 'test-component',
        execute: (error, context) => 'custom response',
        priority: 1
      };

      errorHandler.addFallbackStrategy(customStrategy);

      // Test that the custom strategy is used
      const error = new Error('test error');
      const context: ErrorContext = {
        component: 'test-component',
        operation: 'test',
        timestamp: Date.now(),
        severity: 'medium',
        recoverable: true
      };

      return errorHandler.handleError(error, context).then(result => {
        expect(result).toBe('custom response');
      });
    });

    it('should sort strategies by priority', () => {
      const strategy1: FallbackStrategy = {
        name: 'strategy1',
        condition: () => true,
        execute: () => 'strategy1',
        priority: 5
      };

      const strategy2: FallbackStrategy = {
        name: 'strategy2',
        condition: () => true,
        execute: () => 'strategy2',
        priority: 1
      };

      errorHandler.addFallbackStrategy(strategy1);
      errorHandler.addFallbackStrategy(strategy2);

      // Strategy2 should be used first due to lower priority number
      const error = new Error('test');
      const context: ErrorContext = {
        component: 'test',
        operation: 'test',
        timestamp: Date.now(),
        severity: 'medium',
        recoverable: true
      };

      return errorHandler.handleError(error, context).then(result => {
        expect(result).toBe('strategy2');
      });
    });
  });

  describe('error recording and stats', () => {
    it('should record error statistics', async () => {
      const error = new Error('test error');
      const context: ErrorContext = {
        component: 'test-component',
        operation: 'test-operation',
        timestamp: Date.now(),
        severity: 'medium',
        recoverable: true
      };

      await errorHandler.handleError(error, context);

      const stats = errorHandler.getStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorsByComponent['test-component']).toBe(1);
      expect(stats.errorsBySeverity['medium']).toBe(1);
      expect(stats.lastError).toEqual(context);
    });

    it('should track recovery success rate', async () => {
      const error = new Error('test error');
      const context: ErrorContext = {
        component: 'knowledge-bootstrap',
        operation: 'test',
        timestamp: Date.now(),
        severity: 'medium',
        recoverable: true
      };

      await errorHandler.handleError(error, context);

      const stats = errorHandler.getStats();
      expect(stats.recoverySuccessRate).toBeGreaterThan(0);
    });

    it('should maintain error history limit', async () => {
      const handler = new GracefulErrorHandler();
      handler['maxErrorHistory'] = 3; // Set small limit for testing

      for (let i = 0; i < 5; i++) {
        const error = new Error(`error ${i}`);
        const context: ErrorContext = {
          component: 'test',
          operation: `operation-${i}`,
          timestamp: Date.now(),
          severity: 'low',
          recoverable: true
        };
        await handler.handleError(error, context);
      }

      const recentErrors = handler.getRecentErrors(10);
      expect(recentErrors.length).toBe(3);
      expect(recentErrors[2].operation).toBe('operation-4');
    });
  });

  describe('getSystemHealth', () => {
    it('should return healthy status for low error rate', () => {
      // Create a fresh handler to ensure no previous errors
      const freshHandler = new GracefulErrorHandler();
      const health = freshHandler.getSystemHealth();
      expect(health.status).toBe('healthy');
      expect(health.errorRate).toBe(0);
      expect(health.recentErrors).toBe(0);
    });

    it('should return degraded status for moderate error rate', async () => {
      // Generate some errors
      for (let i = 0; i < 3; i++) {
        const error = new Error(`error ${i}`);
        const context: ErrorContext = {
          component: 'test',
          operation: 'test',
          timestamp: Date.now(),
          severity: 'medium',
          recoverable: true
        };
        await errorHandler.handleError(error, context);
      }

      const health = errorHandler.getSystemHealth();
      expect(health.recentErrors).toBe(3);
      expect(health.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('pattern-based responses', () => {
    it('should handle greeting patterns', async () => {
      const error = new Error('semantic query failed');
      const context: ErrorContext = {
        component: 'semantic-query',
        operation: 'process',
        input: 'hello there',
        timestamp: Date.now(),
        severity: 'medium',
        recoverable: true
      };

      const result = await errorHandler.handleError(error, context) as string;
      expect(result.toLowerCase()).toContain('hello');
    });

    it('should handle question patterns', async () => {
      const error = new Error('semantic query failed');
      const context: ErrorContext = {
        component: 'semantic-query',
        operation: 'process',
        input: 'what is the weather like?',
        timestamp: Date.now(),
        severity: 'medium',
        recoverable: true
      };

      const result = await errorHandler.handleError(error, context) as string;
      expect(result.toLowerCase()).toContain('question');
    });

    it('should handle help patterns', async () => {
      const error = new Error('semantic query failed');
      const context: ErrorContext = {
        component: 'semantic-query',
        operation: 'process',
        input: 'can you help me?',
        timestamp: Date.now(),
        severity: 'medium',
        recoverable: true
      };

      const result = await errorHandler.handleError(error, context) as string;
      expect(result.toLowerCase()).toContain('help');
    });

    it('should handle name introduction patterns', async () => {
      const error = new Error('entity memory failed');
      const context: ErrorContext = {
        component: 'entity-memory',
        operation: 'store',
        input: 'my name is Alice',
        timestamp: Date.now(),
        severity: 'medium',
        recoverable: true
      };

      const result = await errorHandler.handleError(error, context) as string;
      expect(result).toContain('Alice');
    });

    it('should handle gratitude patterns', async () => {
      const error = new Error('semantic query failed');
      const context: ErrorContext = {
        component: 'semantic-query',
        operation: 'process',
        input: 'thank you very much',
        timestamp: Date.now(),
        severity: 'medium',
        recoverable: true
      };

      const result = await errorHandler.handleError(error, context) as string;
      expect(result.toLowerCase()).toContain('welcome');
    });
  });

  describe('clearHistory', () => {
    it('should clear error history and reset stats', async () => {
      // Generate some errors first
      const error = new Error('test error');
      const context: ErrorContext = {
        component: 'test',
        operation: 'test',
        timestamp: Date.now(),
        severity: 'medium',
        recoverable: true
      };

      await errorHandler.handleError(error, context);
      
      let stats = errorHandler.getStats();
      expect(stats.totalErrors).toBe(1);

      errorHandler.clearHistory();

      stats = errorHandler.getStats();
      expect(stats.totalErrors).toBe(0);
      expect(stats.errorsByComponent).toEqual({});
      expect(stats.errorsBySeverity).toEqual({});
      expect(stats.recoverySuccessRate).toBe(0);
    });
  });

  describe('severity levels', () => {
    it('should log different severity levels appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'error');
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      const consoleLogSpy = jest.spyOn(console, 'log');

      const severities: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];

      for (const severity of severities) {
        const error = new Error(`${severity} error`);
        const context: ErrorContext = {
          component: 'test',
          operation: 'test',
          timestamp: Date.now(),
          severity,
          recoverable: true
        };

        await errorHandler.handleError(error, context);
      }

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🚨 CRITICAL ERROR'), expect.any(Error));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ HIGH ERROR'), expect.any(Error));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️ MEDIUM ERROR'), expect.any(Error));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ℹ️ LOW ERROR'), expect.any(Error));
    });
  });
});

describe('safeAsync', () => {
  let errorHandler: GracefulErrorHandler;

  beforeEach(() => {
    errorHandler = new GracefulErrorHandler();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return result when operation succeeds', async () => {
    const operation = async () => 'success';
    const context = { component: 'test', operation: 'test' };

    const result = await safeAsync(operation, context, errorHandler);
    expect(result).toBe('success');
  });

  it('should handle error and return fallback', async () => {
    const operation = async () => {
      throw new Error('test error');
    };
    const context = { component: 'knowledge-bootstrap', operation: 'test' };

    const result = await safeAsync(operation, context, errorHandler) as any;
    expect(result).toBeDefined();
    expect(result.vocabulary).toBeInstanceOf(Map);
  });

  it('should return default value when provided', async () => {
    const operation = async () => {
      throw new Error('test error');
    };
    const context = { component: 'unknown', operation: 'test' };
    const defaultValue = 'default';

    // Create handler with no fallback strategies
    const handler = new GracefulErrorHandler();
    handler['fallbackStrategies'] = [];

    const result = await safeAsync(operation, context, handler, defaultValue);
    expect(result).toBe(defaultValue);
  });
});

describe('safeSync', () => {
  let errorHandler: GracefulErrorHandler;

  beforeEach(() => {
    errorHandler = new GracefulErrorHandler();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return result when operation succeeds', () => {
    const operation = () => 'success';
    const context = { component: 'test', operation: 'test' };

    const result = safeSync(operation, context, errorHandler);
    expect(result).toBe('success');
  });

  it('should handle error and return fallback', () => {
    // Add a sync fallback strategy for testing
    const syncStrategy: FallbackStrategy = {
      name: 'sync_prime_fallback',
      condition: (error, context) => context.component === 'prime-resonance',
      execute: (error, context) => ({ 2: 1, 3: 1, 5: 1 }),
      priority: 1
    };
    
    errorHandler.addFallbackStrategy(syncStrategy);
    
    const operation = () => {
      throw new Error('prime calculation failed');
    };
    const context = { component: 'prime-resonance', operation: 'test', input: 'test' };

    const result = safeSync(operation, context, errorHandler);
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('should return default value when provided', () => {
    const operation = () => {
      throw new Error('test error');
    };
    const context = { component: 'unknown', operation: 'test' };
    const defaultValue = 'default';

    // Create handler with no fallback strategies
    const handler = new GracefulErrorHandler();
    handler['fallbackStrategies'] = [];

    const result = safeSync(operation, context, handler, defaultValue);
    expect(result).toBe(defaultValue);
  });

  it('should throw error for async fallback in sync context', () => {
    const operation = () => {
      throw new Error('test error');
    };
    const context = { component: 'test', operation: 'test' };

    // Add async fallback strategy
    const asyncStrategy: FallbackStrategy = {
      name: 'async_strategy',
      condition: () => true,
      execute: async () => 'async result',
      priority: 1
    };

    errorHandler.addFallbackStrategy(asyncStrategy);

    expect(() => safeSync(operation, context, errorHandler)).toThrow('Async fallback not supported in sync context');
  });
});

describe('createErrorContext', () => {
  it('should create error context with required fields', () => {
    const context = createErrorContext('test-component', 'test-operation');

    expect(context.component).toBe('test-component');
    expect(context.operation).toBe('test-operation');
    expect(context.timestamp).toBeCloseTo(Date.now(), -2); // Within 100ms
    expect(context.severity).toBe('medium');
    expect(context.recoverable).toBe(true);
  });

  it('should merge provided options', () => {
    const options = {
      severity: 'high' as const,
      recoverable: false,
      input: 'test input',
      metadata: { key: 'value' }
    };

    const context = createErrorContext('test-component', 'test-operation', options);

    expect(context.severity).toBe('high');
    expect(context.recoverable).toBe(false);
    expect(context.input).toBe('test input');
    expect(context.metadata).toEqual({ key: 'value' });
  });
});

describe('fallback embedding generation', () => {
  let errorHandler: GracefulErrorHandler;

  beforeEach(() => {
    errorHandler = new GracefulErrorHandler();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should generate consistent embeddings for same input', async () => {
    const error = new Error('embedding failed');
    const context: ErrorContext = {
      component: 'embedding-generation',
      operation: 'generate',
      input: 'hello world',
      timestamp: Date.now(),
      severity: 'medium',
      recoverable: true
    };

    const result1 = await errorHandler.handleError(error, context) as number[];
    const result2 = await errorHandler.handleError(error, context) as number[];

    expect(result1).toEqual(result2);
  });

  it('should generate different embeddings for different inputs', async () => {
    const error = new Error('embedding failed');
    
    const context1: ErrorContext = {
      component: 'embedding-generation',
      operation: 'generate',
      input: 'hello world',
      timestamp: Date.now(),
      severity: 'medium',
      recoverable: true
    };

    const context2: ErrorContext = {
      component: 'embedding-generation',
      operation: 'generate',
      input: 'goodbye world',
      timestamp: Date.now(),
      severity: 'medium',
      recoverable: true
    };

    const result1 = await errorHandler.handleError(error, context1) as number[];
    const result2 = await errorHandler.handleError(error, context2) as number[];

    expect(result1).not.toEqual(result2);
  });

  it('should generate normalized embeddings', async () => {
    const error = new Error('embedding failed');
    const context: ErrorContext = {
      component: 'embedding-generation',
      operation: 'generate',
      input: 'test input',
      timestamp: Date.now(),
      severity: 'medium',
      recoverable: true
    };

    const result = await errorHandler.handleError(error, context) as number[];
    
    // Check if embedding is normalized (magnitude close to 1)
    const magnitude = Math.sqrt(result.reduce((sum: number, val: number) => sum + val * val, 0));
    expect(magnitude).toBeCloseTo(1, 1);
  });
});

describe('edge cases', () => {
  let errorHandler: GracefulErrorHandler;

  beforeEach(() => {
    errorHandler = new GracefulErrorHandler();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle empty input gracefully', async () => {
    const error = new Error('test error');
    const context: ErrorContext = {
      component: 'semantic-query',
      operation: 'process',
      input: '',
      timestamp: Date.now(),
      severity: 'medium',
      recoverable: true
    };

    const result = await errorHandler.handleError(error, context) as string;
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle null input gracefully', async () => {
    const error = new Error('test error');
    const context: ErrorContext = {
      component: 'semantic-query',
      operation: 'process',
      input: null,
      timestamp: Date.now(),
      severity: 'medium',
      recoverable: true
    };

    const result = await errorHandler.handleError(error, context) as string;
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle undefined input gracefully', async () => {
    const error = new Error('test error');
    const context: ErrorContext = {
      component: 'semantic-query',
      operation: 'process',
      timestamp: Date.now(),
      severity: 'medium',
      recoverable: true
    };

    const result = await errorHandler.handleError(error, context) as string;
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle very long input', async () => {
    const longInput = 'word '.repeat(1000);
    const error = new Error('embedding failed');
    const context: ErrorContext = {
      component: 'embedding-generation',
      operation: 'generate',
      input: longInput,
      timestamp: Date.now(),
      severity: 'medium',
      recoverable: true
    };

    const result = await errorHandler.handleError(error, context) as number[];
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(384);
  });

  it('should handle special characters in input', async () => {
    const specialInput = '!@#$%^&*()_+{}|:"<>?[]\\;\',./ 测试 🚀';
    const error = new Error('semantic query failed');
    const context: ErrorContext = {
      component: 'semantic-query',
      operation: 'process',
      input: specialInput,
      timestamp: Date.now(),
      severity: 'medium',
      recoverable: true
    };

    const result = await errorHandler.handleError(error, context) as string;
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
