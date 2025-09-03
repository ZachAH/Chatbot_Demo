import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Define a type for the available AI models
type AiModel = 'gemini' | 'chatgpt' | 'claude';

// Define the interface for a chat message
interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  model?: AiModel;
}

// Inline SVG for the user icon
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Inline SVG for the bot icon
const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot">
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

// Simple "thinking" animation component
const ThinkingAnimation = () => (
  <div className="thinking-animation">
    <div className="dot"></div>
    <div className="dot dot-delay-100"></div>
    <div className="dot dot-delay-200"></div>
  </div>
);

// Component to display a single message bubble
const Message: React.FC<ChatMessage> = ({ text, sender, model }) => {
  const isUser = sender === 'user';
  return (
    <div className={`message-container ${isUser ? 'message-user' : 'message-bot'}`}>
      {!isUser && (
        <div className="message-icon bot-icon">
          <BotIcon />
        </div>
      )}
      <div className={`message-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
        <p className="message-text">{text}</p>
        {!isUser && model && (
          <span className="model-info">Powered by {model.charAt(0).toUpperCase() + model.slice(1)}</span>
        )}
      </div>
      {isUser && (
        <div className="message-icon user-icon">
          <UserIcon />
        </div>
      )}
    </div>
  );
};

// Main App Component
export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<AiModel>('gemini');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to call the Gemini API
  const getGeminiResponse = async (userMessage: string): Promise<string> => {
    const systemPrompt = "You are a helpful chatbot assistant. Respond to user queries concisely and professionally. If they ask about a service you can provide, offer to help them and provide a brief description.";
    const userQuery = userMessage;
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        tools: [{ "google_search": {} }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            console.error("API request failed with status:", response.status, response.statusText);
            throw new Error(`API request failed with status: ${response.status}`);
        }

        const result = await response.json();
        const candidate = result.candidates?.[0];
        if (candidate && candidate.content?.parts?.[0]?.text) {
          return candidate.content.parts[0].text;
        } else {
          return "I'm sorry, I couldn't generate a response. Please try again.";
        }
    } catch (error) {
        console.error("API call failed:", error);
        return "Oops! I seem to be having a network issue or an API issue. Please try again.";
    }
  };

  // Mock response for the OpenAI API
  const getOpenAIResponse = async (): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return "This is a response from the simulated ChatGPT. I can help you with creative writing, code snippets, and general knowledge.";
  };

  // Function to get a chatbot response based on the selected model
  const getBotResponse = async (userMessage: string, model: AiModel): Promise<string> => {
    switch (model) {
      case 'gemini': {
        return getGeminiResponse(userMessage);
      }
      case 'chatgpt': {
        return getOpenAIResponse();
      }
      case 'claude':
        // Mock response for Claude
        await new Promise(resolve => setTimeout(resolve, 500));
        return "Hello! I am the simulated Claude model. I am known for my coherent and thoughtful long-form responses.";
      default:
        return "I'm not sure which model you want me to use.";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (trimmedInput === '') return;

    // Add user message to the chat
    const newUserMessage: ChatMessage = { text: trimmedInput, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate a brief delay for a more realistic feel
    setTimeout(async () => {
      const botResponseText = await getBotResponse(trimmedInput, selectedModel);
      const newBotMessage: ChatMessage = { text: botResponseText, sender: 'bot', model: selectedModel };
      setMessages(prevMessages => [...prevMessages, newBotMessage]);
      setIsTyping(false);
    }, 1500);
  };

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleModelChange = (model: AiModel) => {
    setSelectedModel(model);
    setMessages([]); // Clear chat history when model changes
  };

  const getButtonClassName = (model: AiModel) => {
    return `model-button ${selectedModel === model ? 'active' : ''}`;
  };

  return (
    <div className="app-container">
      <div className="chatbot-container">
        <div className="chatbot-card">
          {/* Header */}
          <div className="chat-header">
            <h1 className="header-title">Chatbot Demo</h1>
            <div className="model-selector">
              <button
                onClick={() => handleModelChange('gemini')}
                className={getButtonClassName('gemini')}
              >
                Gemini
              </button>
              <button
                onClick={() => handleModelChange('chatgpt')}
                className={getButtonClassName('chatgpt')}
              >
                ChatGPT
              </button>
              <button
                onClick={() => handleModelChange('claude')}
                className={getButtonClassName('claude')}
              >
                Claude
              </button>
            </div>
          </div>

          {/* Chat window */}
          <div className="chat-window custom-scrollbar">
            {messages.length === 0 && (
              <div className="chat-placeholder">
                Start a conversation or select a model.
              </div>
            )}
            {messages.map((msg, index) => (
              <Message key={index} text={msg.text} sender={msg.sender} model={msg.model} />
            ))}
            {isTyping && (
              <div className="message-container message-bot">
                <div className="message-icon bot-icon">
                  <BotIcon />
                </div>
                <div className="message-bubble bot-bubble">
                  <ThinkingAnimation />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="chat-input-area">
            <form onSubmit={handleSendMessage} className="input-form">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
              />
              <button type="submit" className="send-button">
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="disclaimer-container">
        <div className="disclaimer-card">
        <h2 className="disclaimer-title">API Disclaimer</h2>
          <p>
            For this demo, **Gemini** is the only model that is connected to a live API.
            The **ChatGPT** and **Claude** models are simulated to demonstrate the user experience. This approach helps in showcasing a multi-model chatbot without incurring costs for API requests from other providers.
          </p>
        </div>
      </div>
    </div>
  );
}
