# PrimeLM-Demo

A basic proof of concept implementation demonstrating PrimeLM's Prime Core in a conversational chatbot.

## What This Is

This is a **functional demonstration** - not mocked, faked, or hard-coded. It shows how PrimeLM's Prime Core can create conversational AI using real neural networks and mathematical operations. While basic, all components are genuine implementations.

## Core Concept

PrimeLM demonstrates how a Prime Core can facilitate conversation between users (human and chatbot) by:
- Converting neural embeddings to prime factorizations
- Using mathematical coherence for reasoning and translation
- Maintaining separate identity and user models for each participant
- Creating responses through combinatorial mathematics rather than heavy LLMs

## Architecture

### Current Implementation (Phase 1)
```
Human User ←→ Prime Core ←→ Chatbot User
     ↓              ↓              ↓
Identity Model  Embeddings    Identity Model
     +           Model            +
User Model                   User Model
```

### Full PrimeLM Layered Architecture (Roadmap)
```
┌─────────────────────────────────────────────────────────┐
│                 Conversational Layers                  │
├─────────────────────────────────────────────────────────┤
│ 8. Emotional Intelligence Layer ❤️  (Phase 3)          │
│ 7. Episodic Memory Layer 🧠         (Phase 3)          │
│ 6. Generative Layer 🎨              (Phase 2)          │
│ 5. Discourse Layer 💬               (Phase 2)          │
│ 4. Pragmatic Layer 🎯               (Phase 1) ✅       │
│ 3. Semantic Layer 🧠                (Phase 1) ✅       │
├─────────────────────────────────────────────────────────┤
│                Mathematical Foundation                  │
├─────────────────────────────────────────────────────────┤
│ 2. Prime Resonance Layer 🔢          (Implemented) ✅   │
│ 1. Prime Core Layer ⚡               (Implemented) ✅   │
└─────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

**Phase 1 (Current): Enhanced Semantic + Pragmatic**
- **Semantic Layer**: Schema.org vocabulary, entity-relationship understanding
- **Pragmatic Layer**: Context tracking, conversation memory, intent persistence

**Phase 2: Discourse + Generative**
- **Discourse Layer**: Topic management, conversation flow, reference resolution
- **Generative Layer**: Natural language generation, style adaptation, personality

**Phase 3: Memory + Emotional**
- **Episodic Memory Layer**: Long-term memory, personalization, learning
- **Emotional Intelligence Layer**: Emotion detection, empathy, social awareness

## What It Demonstrates

- **Real Neural Networks**: Uses actual embedding models (transformers.js)
- **Mathematical Operations**: Genuine prime factorization and coherence algorithms
- **User Symmetry**: Both human and chatbot are users with identities
- **Prime Translation**: Mathematical conversion between user representations
- **Basic Conversation**: Functional chatbot interaction

## Implementation

### Core Models (TypeScript)
```typescript
interface IdentityModel {
  id: string;
  name: string;
  type: 'human' | 'chatbot';
  embeddings: number[];
  primeFactors: Record<number, number>;
  personality: object;
}

interface UserModel {
  identity: IdentityModel;
  conversationState: object;
  preferences: object;
}

interface EmbeddingsModel {
  vocabulary: Map<string, number[]>;
  concepts: Map<string, number[]>;
}
```

### File Structure
```
src/
├── app/
│   └── page.tsx              # Chat interface + orchestration
└── lib/
    └── primelm-models.ts     # Models + Prime Core implementation
```

## How It Works

1. **User Input**: Human types message
2. **Prime Conversion**: Input converted through human user model to primes
3. **Mathematical Translation**: Prime Core uses embeddings model for lookup/reasoning
4. **Response Generation**: Mathematical operations create response primes
5. **Chatbot Output**: Response converted through chatbot user model to text
6. **Model Evolution**: Both user models update their conversation state

## What's Basic About This Demo

- **Limited Vocabulary**: Small embeddings model with basic concepts
- **Simple Personalities**: Basic identity traits, not complex behavioral modeling
- **Basic Math Operations**: Core prime factorization and coherence, not advanced algorithms
- **Minimal UI**: Simple chat interface without advanced features
- **No Persistence**: Models reset between sessions

## What's Real About This Demo

- **Actual Neural Networks**: Real transformers.js embedding generation
- **Genuine Mathematics**: True prime factorization and mathematical coherence
- **Functional Models**: Working TypeScript model implementations
- **Real Conversation**: Actual conversational interaction, not scripted responses

## Dependencies

```bash
npm install @xenova/transformers  # Real embedding models
npm install next react react-dom  # UI framework
npm install typescript            # Model definitions
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the chatbot demo.

## Demo Goals

This proof of concept shows:
1. How Prime Core translates between user representations
2. How mathematical operations can create conversational responses
3. How small models + mathematics can enable basic AI conversation
4. How PrimeLM's symmetric user architecture works in practice

## License

MIT License - see LICENSE file for details.
