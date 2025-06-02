'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PrimeCore } from '../lib/core/primelm-models';

interface Message {
  id: string;
  text: string;
  sender: 'human' | 'chatbot';
  timestamp: Date;
  primeFactors?: Record<number, number>;
  coherence?: number;
}

function DebugPanel({ primeCore, showDebug }: { primeCore: PrimeCore | null, showDebug: boolean }) {
  if (!showDebug || !primeCore) return null;
  
  const debugInfo = primeCore.getDebugInfo();
  
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
      <h3 className="font-semibold text-gray-700 mb-3">Prime Core Debug Info</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Human User Info */}
        <div>
          <h4 className="font-medium text-blue-600 mb-2">Human User</h4>
          <div className="space-y-1">
            <div className="bg-blue-100 px-2 py-1 rounded">
              ID: {debugInfo.humanUser.identity.id}
            </div>
            <div className="bg-blue-100 px-2 py-1 rounded">
              Turns: {debugInfo.humanUser.conversationState.turnCount}
            </div>
            <div className="bg-blue-100 px-2 py-1 rounded">
              Prime Factors: {debugInfo.humanUser.conversationState.primeCount}
            </div>
            <div className="bg-blue-100 px-2 py-1 rounded text-xs">
              Traits: {debugInfo.humanUser.identity.personality.traits.join(', ')}
            </div>
          </div>
        </div>
        
        {/* Chatbot User Info */}
        <div>
          <h4 className="font-medium text-purple-600 mb-2">Chatbot User</h4>
          <div className="space-y-1">
            <div className="bg-purple-100 px-2 py-1 rounded">
              ID: {debugInfo.chatbotUser.identity.id}
            </div>
            <div className="bg-purple-100 px-2 py-1 rounded">
              Turns: {debugInfo.chatbotUser.conversationState.turnCount}
            </div>
            <div className="bg-purple-100 px-2 py-1 rounded">
              Prime Factors: {debugInfo.chatbotUser.conversationState.primeCount}
            </div>
            <div className="bg-purple-100 px-2 py-1 rounded text-xs">
              Traits: {debugInfo.chatbotUser.identity.personality.traits.join(', ')}
            </div>
          </div>
        </div>
      </div>
      
      {/* Coherence Info */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">Conversation Coherence:</span>
          <span className="bg-green-100 px-3 py-1 rounded font-mono">
            {(debugInfo.coherence * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, showPrimes }: { message: Message, showPrimes: boolean }) {
  const isHuman = message.sender === 'human';
  
  return (
    <div className={`flex ${isHuman ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isHuman 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200 text-gray-800'
      }`}>
        <div className="text-sm font-medium mb-1">
          {isHuman ? 'You' : 'PrimeBot'}
        </div>
        <div>{message.text}</div>
        
        {showPrimes && message.primeFactors && (
          <div className="mt-2 pt-2 border-t border-opacity-20 border-white">
            <div className="text-xs opacity-75">
              Prime Factors: {Object.keys(message.primeFactors).length}
            </div>
            {message.coherence !== undefined && (
              <div className="text-xs opacity-75">
                Coherence: {(message.coherence * 100).toFixed(1)}%
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PrimeLMChat() {
  const [primeCore, setPrimeCore] = useState<PrimeCore | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [showPrimes, setShowPrimes] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializePrimeCore = async () => {
      try {
        console.log('🚀 Starting PrimeLM initialization...');
        const core = new PrimeCore();
        await core.initialize();
        setPrimeCore(core);
        setIsInitializing(false);
        
        // Add welcome message
        setMessages([{
          id: '1',
          text: "Hello! I'm PrimeBot, powered by PrimeLM's Prime Core. I process conversation through mathematical prime factorization. Try asking me something!",
          sender: 'chatbot',
          timestamp: new Date()
        }]);
        
      } catch (error) {
        console.error('❌ Failed to initialize PrimeLM:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
        setIsInitializing(false);
      }
    };

    initializePrimeCore();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !primeCore || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'human',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      const response = await primeCore.processConversation(inputText.trim());
      const debugInfo = primeCore.getDebugInfo();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'chatbot',
        timestamp: new Date(),
        primeFactors: debugInfo.chatbotUser.conversationState.primeFactors,
        coherence: debugInfo.coherence
      };

      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('❌ Error processing message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error processing your message. Please try again.",
        sender: 'chatbot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Initializing PrimeLM Core</h2>
          <p className="text-gray-500">Loading neural network models and prime mathematics...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Initialization Failed</h2>
          <p className="text-gray-600 mb-4">{initError}</p>
          <p className="text-sm text-gray-500">
            Make sure you have installed the required dependencies:
            <br />
            <code className="bg-gray-200 px-2 py-1 rounded mt-2 inline-block">
              npm install @xenova/transformers
            </code>
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">PrimeLM Demo</h1>
              <p className="text-gray-600">Conversational AI through Prime Core mathematics</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`px-3 py-1 rounded text-sm ${
                  showDebug ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Debug
              </button>
              <button
                onClick={() => setShowPrimes(!showPrimes)}
                className={`px-3 py-1 rounded text-sm ${
                  showPrimes ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Primes
              </button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="h-96 overflow-y-auto p-4">
            {messages.map(message => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                showPrimes={showPrimes}
              />
            ))}
            {isProcessing && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-200 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-pulse">Processing through Prime Core...</div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isProcessing}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Debug Panel */}
        <DebugPanel primeCore={primeCore} showDebug={showDebug} />

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-4">
          <p>
            <strong>PrimeLM Demo:</strong> Real neural networks → Prime factorization → Mathematical coherence
          </p>
          <p className="mt-1">
            No mocking or hard-coding - functional proof of concept implementation
          </p>
        </div>
      </div>
    </div>
  );
}
