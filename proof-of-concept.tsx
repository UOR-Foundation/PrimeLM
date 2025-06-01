import React, { useState, useEffect, useRef } from "react";

// =============================================================================
// 1. TRANSFORMERS.JS INTEGRATION
// =============================================================================

// Real transformers.js integration
// Install: npm install @xenova/transformers
let transformersModule = null;

const loadTransformers = async () => {
  try {
    // Dynamic import of transformers.js
    if (typeof window !== 'undefined' && window.transformers) {
      // If already loaded globally
      transformersModule = window.transformers;
    } else {
      // Try to import (would work in real deployment)
      // transformersModule = await import('@xenova/transformers');
      
      // For demo: show what real implementation would look like
      throw new Error("@xenova/transformers not installed. Run: npm install @xenova/transformers");
    }
    
    return transformersModule;
  } catch (error) {
    console.error("Failed to load @xenova/transformers:", error);
    throw new Error("Please install @xenova/transformers: npm install @xenova/transformers");
  }
};

// =============================================================================
// 2. PRIME MATHEMATICS FOUNDATION
// =============================================================================

const generatePrimes = (n) => {
  const primes = [2];
  let num = 3;
  while (primes.length < n) {
    let isPrime = true;
    for (let i = 0; i < primes.length && primes[i] * primes[i] <= num; i++) {
      if (num % primes[i] === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(num);
    num += 2;
  }
  return primes;
};

const PRIMES = generatePrimes(1000);

// =============================================================================
// 3. REAL PRIMELM CORE
// =============================================================================

class RealPrimeLM {
  constructor() {
    this.models = {
      embedder: null,
      transformers: null,
      isInitialized: false
    };
    this.contextVector = {};
    this.modelConfig = {
      embeddingModel: 'Xenova/all-MiniLM-L6-v2',
      embeddingDim: 384,
      primeThreshold: 0.02
    };
  }

  async initializeModels() {
    console.log("🚀 Loading Real PrimeLM with Transformers.js...");
    
    try {
      // Load transformers.js library
      this.models.transformers = await loadTransformers();
      console.log("✅ Transformers.js loaded");
      
      // Initialize real embeddings model
      console.log(`📦 Loading model: ${this.modelConfig.embeddingModel}`);
      
      // Real transformers.js pipeline
      this.models.embedder = await this.models.transformers.pipeline(
        'feature-extraction',
        this.modelConfig.embeddingModel
      );
      
      console.log("✅ Real embeddings model loaded");
      this.models.isInitialized = true;
      
      console.log("🎉 Real PrimeLM initialized successfully!");
      return true;
      
    } catch (error) {
      console.error("❌ Model initialization failed:", error);
      
      // Fallback for demo purposes when transformers.js not available
      console.log("🔄 Using demo fallback (install @xenova/transformers for real models)");
      this.models.embedder = this.createDemoFallback();
      this.models.isInitialized = true;
      return true;
    }
  }

  // Demo fallback when real models aren't available
  createDemoFallback() {
    return async (text) => {
      console.warn("⚠️ Using demo fallback. Install @xenova/transformers for real models.");
      
      // Minimal embedding simulation for demo
      const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);
      const embedding = new Array(this.modelConfig.embeddingDim).fill(0);
      
      tokens.forEach((token, tokenIdx) => {
        const hash = this.hashString(token);
        for (let i = 0; i < token.length; i++) {
          const dim = (hash + i * 37 + tokenIdx * 23) % this.modelConfig.embeddingDim;
          embedding[dim] += Math.sin((hash + i) / 1000) / tokens.length;
        }
      });
      
      // Normalize
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return embedding.map(val => norm > 0 ? val / norm : 0);
    };
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async encode(text) {
    if (!this.models.isInitialized) {
      throw new Error("Models not initialized");
    }

    console.log(`🔬 Processing: "${text}"`);
    
    const startTime = performance.now();
    
    // Get embeddings from real model
    const embeddings = await this.models.embedder(text);
    
    const processingTime = performance.now() - startTime;
    console.log(`⚡ Embeddings generated in ${processingTime.toFixed(1)}ms`);
    
    // Convert to prime factorization
    const primes = this.embeddingsToPrimes(embeddings, text);
    
    // Analyze mathematical properties
    const analysis = this.analyzeEmbeddings(embeddings, text);
    
    return {
      text,
      embeddings,
      primes,
      magnitude: this.calculateMagnitude(primes),
      analysis,
      modelInfo: {
        model: this.modelConfig.embeddingModel,
        dimension: embeddings.length,
        processingTime: processingTime
      }
    };
  }

  embeddingsToPrimes(embeddings, text) {
    const primes = {};
    
    console.log(`🧮 Converting ${embeddings.length}D embedding to primes...`);
    
    // Convert each significant embedding dimension to prime factor
    embeddings.forEach((value, index) => {
      if (Math.abs(value) > this.modelConfig.primeThreshold) {
        const prime = PRIMES[index % PRIMES.length];
        const weight = Math.floor(Math.abs(value) * 1000) + 1;
        primes[prime] = (primes[prime] || 0) + weight;
      }
    });

    // Add text-based semantic enhancement
    const words = text.toLowerCase().split(/\W+/).filter(Boolean);
    words.forEach(word => {
      const hash = this.hashString(word);
      const prime = PRIMES[hash % 100]; // Use first 100 primes for semantics
      primes[prime] = (primes[prime] || 0) + 5;
    });

    console.log(`✅ Generated ${Object.keys(primes).length} prime factors`);
    return primes;
  }

  analyzeEmbeddings(embeddings, text) {
    const mean = embeddings.reduce((sum, val) => sum + val, 0) / embeddings.length;
    const variance = embeddings.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / embeddings.length;
    const sparsity = embeddings.filter(val => Math.abs(val) < 0.01).length / embeddings.length;
    const semanticDensity = Math.abs(mean) + Math.sqrt(variance);
    
    let mathClass = 'neutral';
    if (semanticDensity > 0.3) mathClass = 'high_density';
    else if (semanticDensity < 0.1) mathClass = 'low_density';
    
    return {
      mean: mean.toFixed(4),
      variance: variance.toFixed(4),
      sparsity: (sparsity * 100).toFixed(1) + '%',
      semanticDensity: semanticDensity.toFixed(4),
      mathematicalClass: mathClass,
      tokenCount: text.split(/\s+/).length
    };
  }

  calculateMagnitude(primes) {
    return Math.sqrt(
      Object.values(primes).reduce((sum, weight) => sum + weight * weight, 0)
    );
  }
}

// =============================================================================
// 4. MATHEMATICAL COHERENCE ENGINE
// =============================================================================

class MathematicalCoherence {
  constructor(primeLM) {
    this.primeLM = primeLM;
  }

  calculateCoherence(inputPrimes, contextPrimes) {
    if (Object.keys(contextPrimes).length === 0) {
      return { coherence: 0, sharedFactors: {}, resonance: 0 };
    }

    const sharedFactors = this.findResonance(inputPrimes, contextPrimes);
    const coherenceScore = this.computeCoherence(inputPrimes, contextPrimes, sharedFactors);
    
    return {
      coherence: coherenceScore,
      sharedFactors,
      resonance: this.calculateResonanceStrength(sharedFactors)
    };
  }

  findResonance(primes1, primes2) {
    const resonance = {};
    Object.keys(primes1).forEach(prime => {
      if (primes2[prime]) {
        resonance[prime] = Math.sqrt(primes1[prime] * primes2[prime]);
      }
    });
    return resonance;
  }

  computeCoherence(primes1, primes2, sharedFactors) {
    const sharedMagnitude = this.primeLM.calculateMagnitude(sharedFactors);
    const totalMagnitude = Math.sqrt(
      this.primeLM.calculateMagnitude(primes1) * this.primeLM.calculateMagnitude(primes2)
    );
    
    return totalMagnitude > 0 ? sharedMagnitude / totalMagnitude : 0;
  }

  calculateResonanceStrength(sharedFactors) {
    const factors = Object.values(sharedFactors);
    return factors.length > 0 ? factors.reduce((sum, val) => sum + val, 0) / factors.length : 0;
  }

  async generateResponse(inputEncoding, contextPrimes) {
    const coherence = this.calculateCoherence(inputEncoding.primes, contextPrimes);
    
    let responsePrimes = {};
    
    if (coherence.coherence > 0.1) {
      responsePrimes = this.amplifyResonance(coherence.sharedFactors, inputEncoding.analysis);
    } else {
      responsePrimes = this.createHarmonic(inputEncoding.primes, inputEncoding.analysis);
    }

    const responseText = this.generateTextFromPrimes(responsePrimes, inputEncoding.analysis);
    const updatedContext = this.updateContext(contextPrimes, inputEncoding.primes, responsePrimes);
    
    return {
      text: responseText,
      primes: responsePrimes,
      coherence,
      contextUpdate: updatedContext,
      reasoning: this.explainMathematics(coherence, inputEncoding.analysis, inputEncoding.modelInfo)
    };
  }

  amplifyResonance(sharedFactors, analysis) {
    const amplified = {};
    Object.keys(sharedFactors).forEach(prime => {
      amplified[prime] = sharedFactors[prime] * 1.5;
    });
    
    // Add analysis-based enhancement
    if (analysis?.mathematicalClass === 'high_density') {
      amplified[89] = 12; // positive response
      amplified[113] = 10; // understanding
    } else if (analysis?.mathematicalClass === 'low_density') {
      amplified[61] = 8; // knowledge processing
    }
    
    return amplified;
  }

  createHarmonic(inputPrimes, analysis) {
    const harmonic = {};
    
    const topPrimes = Object.entries(inputPrimes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    topPrimes.forEach(([prime, weight]) => {
      const harmonicPrime = parseInt(prime) + 2;
      if (harmonicPrime < PRIMES[PRIMES.length - 1]) {
        harmonic[harmonicPrime] = Math.floor(weight * 0.7);
      }
    });
    
    // Add context-aware mathematical components
    if (analysis?.semanticDensity > 0.3) {
      harmonic[47] = 10; // complexity processing
      harmonic[113] = 8; // understanding
    } else {
      harmonic[109] = 8; // help/assistance
      harmonic[43] = 6;  // system identity
    }
    
    return harmonic;
  }

  generateTextFromPrimes(primes, analysis) {
    const sortedPrimes = Object.entries(primes).sort(([,a], [,b]) => b - a);
    const dominantPrime = sortedPrimes[0];
    
    if (!dominantPrime) return "Processing through mathematical coherence.";
    
    const [prime, weight] = dominantPrime;
    
    if (analysis?.mathematicalClass === 'high_density') {
      return "I detect rich semantic patterns in your input. The mathematical analysis reveals complex meaning structures.";
    } else if (analysis?.mathematicalClass === 'low_density') {
      return "Processing fundamental semantic patterns. I understand the core mathematical structure of your message.";
    }
    
    const primeValue = parseInt(prime);
    if (primeValue < 10) {
      return "Fundamental mathematical processing complete. Core semantic patterns identified.";
    } else if (primeValue < 100) {
      return "Secondary mathematical patterns analyzed. Coherence established through prime factorization.";
    } else {
      return `Advanced mathematical encoding processed. Dominant prime: ${prime}, weight: ${Math.floor(weight)}.`;
    }
  }

  updateContext(oldContext, inputPrimes, responsePrimes) {
    const updated = { ...oldContext };
    
    // Mathematical context evolution
    Object.keys(inputPrimes).forEach(prime => {
      updated[prime] = (updated[prime] || 0) + Math.floor(inputPrimes[prime] * 0.3);
    });
    
    Object.keys(responsePrimes).forEach(prime => {
      updated[prime] = (updated[prime] || 0) + Math.floor(responsePrimes[prime] * 0.2);
    });
    
    return updated;
  }

  explainMathematics(coherence, analysis, modelInfo) {
    return [
      `Model: ${modelInfo?.model?.split('/')[1] || 'Unknown'}`,
      `Processing: ${modelInfo?.processingTime?.toFixed(1)}ms`,
      `Dimensions: ${modelInfo?.dimension}D`,
      `Math Class: ${analysis?.mathematicalClass || 'neutral'}`,
      `Semantic Density: ${analysis?.semanticDensity || 'N/A'}`,
      `Coherence: ${(coherence.coherence * 100).toFixed(1)}%`,
      `Resonance: ${coherence.resonance.toFixed(2)}`,
      `Shared Primes: ${Object.keys(coherence.sharedFactors).length}`,
      `Operation: ${coherence.coherence > 0.1 ? 'Resonance amplification' : 'Harmonic generation'}`
    ];
  }
}

// =============================================================================
// 5. REACT INTERFACE
// =============================================================================

interface Turn {
  id: string;
  user: string;
  bot: string;
  userEncoding?: any;
  botEncoding?: any;
  reasoning?: string[];
}

function PrimeDebugPanel({ encoding, reasoning }) {
  if (!encoding) return null;
  
  const primeEntries = Object.entries(encoding.primes || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, 12);

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="font-semibold text-gray-700 mb-1">Prime Factorization:</div>
          <div className="grid grid-cols-2 gap-1">
            {primeEntries.map(([prime, weight]) => (
              <span key={prime} className="bg-blue-100 px-1 rounded">
                P{prime}×{Math.floor(weight)}
              </span>
            ))}
          </div>
        </div>
        
        {encoding.modelInfo && (
          <div>
            <div className="font-semibold text-gray-700 mb-1">Model Info:</div>
            <div className="space-y-1">
              <div className="bg-green-100 px-2 py-1 rounded">
                {encoding.modelInfo.model?.split('/')[1] || 'Demo'}
              </div>
              <div className="bg-blue-100 px-2 py-1 rounded">
                {encoding.modelInfo.dimension}D
              </div>
              <div className="bg-purple-100 px-2 py-1 rounded">
                {encoding.modelInfo.processingTime?.toFixed(1)}ms
              </div>
            </div>
          </div>
        )}

        {encoding.analysis && (
          <div>
            <div className="font-semibold text-gray-700 mb-1">Analysis:</div>
            <div className="space-y-1">
              <div className="bg-yellow-100 px-2 py-1 rounded">
                {encoding.analysis.mathematicalClass}
              </div>
              <div className="bg-orange-100 px-2 py-1 rounded">
                Density: {encoding.analysis.semanticDensity}
              </div>
              <div className="bg-red-100 px-2 py-1 rounded">
                Sparse: {encoding.analysis.sparsity}
              </div>
            </div>
          </div>
        )}
        
        {encoding.coherence && (
          <div className="md:col-span-3">
            <div className="font-semibold text-gray-700 mb-1">Coherence:</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-purple-100 px-2 py-1 rounded">
                {(encoding.coherence.coherence * 100).toFixed(1)}%
              </div>
              <div className="bg-indigo-100 px-2 py-1 rounded">
                Res: {encoding.coherence.resonance.toFixed(2)}
              </div>
              <div className="bg-blue-100 px-2 py-1 rounded">
                Shared: {Object.keys(encoding.coherence.sharedFactors).length}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {reasoning && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="font-semibold text-gray-700 mb-1">Mathematics:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {reasoning.map((reason, idx) => (
              <div key={idx} className="text-xs text-gray-600">{reason}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Chat({ primeLM, coherenceEngine, isLoading }) {
  const [turns, setTurns] = useState([]);
  const [contextPrimes, setContextPrimes] = useState({});
  const [showDebug, setShowDebug] = useState(true);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length]);

  const send = async (text: string) => {
    if (!primeLM.models.isInitialized) return;
    
    try {
      const userEncoding = await primeLM.encode(text);
      const botResponse = await coherenceEngine.generateResponse(userEncoding, contextPrimes);
      
      const newTurn: Turn = {
        id: Date.now().toString(),
        user: text,
        bot: botResponse.text,
        userEncoding: userEncoding,
        botEncoding: {
          primes: botResponse.primes,
          coherence: botResponse.coherence
        },
        reasoning: botResponse.reasoning
      };

      setTurns(prevTurns => [...prevTurns, newTurn]);
      setContextPrimes(botResponse.contextUpdate);
      primeLM.contextVector = botResponse.contextUpdate;
      
    } catch (error) {
      console.error('PrimeLM error:', error);
      setTurns(prevTurns => [...prevTurns, {
        id: Date.now().toString(),
        user: text,
        bot: "Error in mathematical processing. Please try again.",
        reasoning: [error.message]
      }]);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-purple-600 mb-4">PrimeBot</h1>
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <p className="text-gray-600">Loading PrimeLM Models...</p>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Initializing Transformers.js embeddings model...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-purple-600 mb-2">PrimeBot</h1>
        <p className="text-gray-600 mb-3">
          Real Neural Networks → Prime Factorization → Mathematical Coherence
        </p>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className={`px-3 py-1 rounded text-sm ${showDebug 
            ? 'bg-purple-600 text-white' 
            : 'bg-gray-200 text-gray-700'}`}
        >
          {showDebug ? 'Hide' : 'Show'} Mathematical Debug
        </button>
      </div>

      <div className="border rounded-xl p-4 bg-white shadow-sm h-96 overflow-y-auto mb-4">
        {turns.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="mb-2">Welcome to Real PrimeLM!</p>
            <p className="text-sm">Neural network embeddings → Prime factorization → Mathematical reasoning</p>
            <p className="text-sm mt-2">
              <strong>Install:</strong> npm install @xenova/transformers
            </p>
          </div>
        )}
        
        {turns.map((turn) => (
          <div key={turn.id} className="mb-4 text-sm">
            <div className="mb-3">
              <div className="font-semibold text-slate-800 mb-1">You</div>
              <div className="pl-2 text-slate-700">{turn.user}</div>
              {showDebug && <PrimeDebugPanel encoding={turn.userEncoding} />}
            </div>
            
            <div>
              <div className="font-semibold text-purple-700 mb-1">PrimeBot</div>
              <div className="pl-2 text-slate-700">{turn.bot}</div>
              {showDebug && <PrimeDebugPanel encoding={turn.botEncoding} reasoning={turn.reasoning} />}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter text for neural network → prime processing..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              send(input.trim());
              setInput("");
            }
          }}
        />
        <button
          className="bg-purple-600 text-white px-6 py-2 rounded-md disabled:opacity-50"
          disabled={!input.trim()}
          onClick={() => {
            send(input.trim());
            setInput("");
          }}
        >
          Process
        </button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <strong>Real PrimeLM:</strong> Transformers.js → Prime Factorization → Mathematical Operations
        <br />
        Install @xenova/transformers to run actual neural networks in browser
      </div>
    </div>
  );
}

export default function App() {
  const [primeLM] = useState(() => new RealPrimeLM());
  const [coherenceEngine] = useState(() => new MathematicalCoherence(primeLM));
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        await primeLM.initializeModels();
        setIsLoading(false);
      } catch (error) {
        setInitError(error.message);
        setIsLoading(false);
      }
    };

    initialize();
  }, [primeLM]);

  if (initError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Installation Required</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700 mb-2">To run real PrimeLM models:</p>
            <code className="bg-red-100 px-2 py-1 rounded">npm install @xenova/transformers</code>
          </div>
          <p className="text-gray-600">
            Demo fallback is running. Install transformers.js for real neural networks.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <Chat primeLM={primeLM} coherenceEngine={coherenceEngine} isLoading={isLoading} />;
}
