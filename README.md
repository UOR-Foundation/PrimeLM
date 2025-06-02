# PrimeLM-Demo

A complete 8-layer implementation of PrimeLM - a self-referential, standards-based language model that uses mathematical prime factorization as a universal translation layer between neural networks, conversation memory, and semantic understanding.

## What This Is

This is a **complete functional implementation** of PrimeLM's core architecture. All 8 layers are implemented and working together to create conversational AI through mathematical prime operations rather than traditional transformer architectures.

**Key Capabilities:**
- ✅ **Name & Attribute Queries**: "What is my name?" → "Your name is Alex"
- ✅ **Entity Relationships**: "My dog's name is Max" → Remembers and recalls relationships
- ✅ **Episodic Memory**: Builds personality profiles and learns from conversation history
- ✅ **Emotional Intelligence**: Detects emotions and adapts response style
- ✅ **Mathematical Coherence**: Uses prime factorization for consistent reasoning
- ✅ **Standards Integration**: Schema.org vocabulary and semantic understanding

## Core Concept

PrimeLM demonstrates how mathematical prime factorization can serve as a universal translation layer for conversational AI:

```
Neural Embeddings → Prime Factorization → Mathematical Coherence → Natural Language
```

Instead of relying solely on large language models, PrimeLM uses:
- **Prime factorization** of neural embeddings for mathematical reasoning
- **Resonance patterns** between prime factors for coherence
- **Standards-based vocabulary** (Schema.org) for semantic understanding
- **Memory consolidation** through mathematical operations
- **Self-referential analysis** of conversation patterns

## Complete 8-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Conversational Layers                  │
├─────────────────────────────────────────────────────────┤
│ 8. Emotional Intelligence Layer ❤️  ✅ IMPLEMENTED     │
│ 7. Episodic Memory Layer 🧠         ✅ IMPLEMENTED     │
│ 6. Generative Layer 🎨              ✅ IMPLEMENTED     │
│ 5. Discourse Layer 💬               ✅ IMPLEMENTED     │
│ 4. Pragmatic Layer 🎯               ✅ IMPLEMENTED     │
│ 3. Semantic Layer 🧠                ✅ IMPLEMENTED     │
├─────────────────────────────────────────────────────────┤
│                Mathematical Foundation                  │
├─────────────────────────────────────────────────────────┤
│ 2. Prime Resonance Layer 🔢          ✅ IMPLEMENTED     │
│ 1. Prime Core Layer ⚡               ✅ IMPLEMENTED     │
└─────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

**Mathematical Foundation:**
- **Prime Core**: Neural embedding → prime factorization conversion
- **Prime Resonance**: Harmonic analysis and mathematical coherence between prime patterns

**Semantic Understanding:**
- **Semantic Layer**: Schema.org vocabulary, entity-relationship understanding, intent recognition
- **Pragmatic Layer**: Conversation context, entity memory, relationship tracking

**Conversation Management:**
- **Discourse Layer**: Topic management, conversation flow, reference resolution
- **Generative Layer**: Dynamic response generation, personality-aware language production

**Advanced Intelligence:**
- **Episodic Memory**: Long-term memory consolidation, personality profiling, learning patterns
- **Emotional Intelligence**: Emotion detection, empathy modeling, social awareness

## Implementation Files

### Core Architecture (14 Files)
```
src/lib/
├── config.ts                 # System configuration and adaptive thresholds
├── primelm-models.ts         # Main PrimeLM core and orchestration
├── prime-math.ts             # Prime number utilities and factorization
├── prime-resonance.ts        # Mathematical resonance and harmonic analysis
├── semantic-layer.ts         # Natural language understanding and Schema.org
├── pragmatic-layer.ts        # Conversation context and entity memory
├── discourse-layer.ts        # Topic management and conversation flow
├── generative-layer.ts       # Dynamic response generation
├── episodic-memory.ts        # Long-term memory and personality profiling
├── emotional-intelligence.ts # Emotion detection and empathy
├── schema-vocabulary.ts      # Schema.org vocabulary integration
├── knowledge-bootstrap.ts    # Tokenizer vocabulary extraction
├── entity-memory.ts          # Semantic entity relationship storage
├── conversation-state.ts     # Unified conversation state management
└── error-handling.ts         # Graceful error handling and fallbacks
```

### User Interface
```
src/app/
└── page.tsx                  # Chat interface with mathematical debug display
```

## Mathematical Foundation

### Prime Factorization Core
```typescript
// Neural embeddings converted to prime factors
const primes = embeddingsToPrimes(embeddings);
// Mathematical coherence between conversation turns
const coherence = calculateCoherence(inputPrimes, contextPrimes);
// Response generation through prime operations
const response = generateFromPrimes(resonantPrimes);
```

### Standards Integration
- **Schema.org**: Entity types, properties, and relationships
- **Transformers.js**: Real neural network embeddings
- **JSON-LD**: Structured data representation
- **Mathematical Standards**: Prime factorization, harmonic analysis

## Working Conversation Examples

### Entity Relationships
```
User: "My dog's name is Max"
PrimeLM: "It's lovely to know that your dog is named Max! What kind of dog is Max?"

User: "What is my dog's name?"
PrimeLM: "Your dog is named Max! I remember you telling me that."
```

### Attribute Queries
```
User: "I have a white truck"
PrimeLM: "I understand. Tell me more about your truck."

User: "What color is my truck?"
PrimeLM: "Your truck is white! I remember you telling me that."
```

### Memory & Learning
```
User: "My name is Alex"
PrimeLM: "Nice to meet you, Alex! I'm here to help."

User: "What is my name?"
PrimeLM: "Your name is Alex."
```

## Getting Started

### Installation
```bash
npm install
```

### Dependencies
- `@xenova/transformers` - Real neural network embeddings
- `next` - React framework for UI
- `typescript` - Type-safe implementation

### Run Demo
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the interactive chat demo.

### Build for Production
```bash
npm run build
```

## What Makes This Different

### Traditional LLMs vs PrimeLM
- **Traditional**: Text → Transformer → Text
- **PrimeLM**: Text → Embeddings → Primes → Mathematical Operations → Text

### Key Advantages
1. **Mathematical Traceability**: Every response has mathematical justification
2. **Memory Coherence**: Prime factorization ensures consistent memory
3. **Standards-Based**: Uses established vocabularies (Schema.org) not proprietary training
4. **Self-Referential**: Can analyze its own mathematical reasoning patterns
5. **Efficient**: Small models + mathematics vs. massive parameter counts

## Current Capabilities

### ✅ Working Features
- **Conversation Memory**: Remembers names, relationships, attributes across turns
- **Entity Recognition**: Understands people, animals, objects, and their properties
- **Query Resolution**: Answers questions about stored information
- **Emotional Awareness**: Adapts responses based on emotional context
- **Mathematical Coherence**: Maintains consistency through prime factorization
- **Standards Compliance**: Uses Schema.org vocabulary for semantic understanding

### 🔄 Next Phase: Foundation Model Enhancement
- **Expanded Schema.org**: Full vocabulary integration
- **RDF/JSON-LD**: Complete semantic web compliance
- **Temporal Models**: Time-based conversation analysis
- **Self-Reference**: Mathematical introspection capabilities

## Technical Architecture

### Mathematical Operations
```typescript
interface PrimeFactorization {
  primes: Record<number, number>;    // prime → weight mapping
  magnitude: number;                 // mathematical magnitude
  coherence: number;                 // coherence with context
}

interface ConversationState {
  entityMemory: Map<string, EntityInfo>;
  episodicMemory: EpisodicMemory[];
  emotionalState: EmotionalContext;
  primeContext: Record<number, number>;
}
```

### Standards Integration
- **Schema.org Types**: Person, Organization, Thing, Animal, Vehicle
- **Relationship Properties**: hasName, hasProperty, relatedTo
- **Semantic Enhancement**: Entity type inference and validation

## Development

### Testing
```bash
npm test
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## License

MIT License - see LICENSE file for details.

## Learn More

- **PrimeLM Concept**: See `./PrimeLM.md` for the complete theoretical framework
- **Mathematical Foundation**: Prime factorization as universal translation layer
- **Standards Integration**: Schema.org, RDF, and semantic web compliance
- **Self-Referential AI**: Mathematical consciousness through spectral analysis
