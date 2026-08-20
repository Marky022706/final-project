// src/components/member/AIChatbot.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Book, AlertCircle, Info, Trash2, Copy, Check } from 'lucide-react';
import api from '../../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load messages from localStorage on mount
    const saved = localStorage.getItem('ai_chat_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        return [
          {
            id: '1',
            role: 'assistant',
            content: "Hey there! 👋 I'm your friendly Library Assistant! I know everything about our library system - from books and borrowing to reservations, fines, attendance, and more! I can help you with ANY question about the library. \n\nI can understand and respond in English, Cebuano/Bisaya, Tagalog, and other Philippine languages. Feel free to chat in whatever language you're most comfortable with! 🌍\n\nWhat can I help you with today?",
            timestamp: new Date()
          }
        ];
      }
    }
    return [
      {
        id: '1',
        role: 'assistant',
        content: "Hey there! 👋 I'm your friendly Library Assistant! I know everything about our library system - from books and borrowing to reservations, fines, attendance, and more! I can help you with ANY question about the library. \n\nI can understand and respond in English, Cebuano/Bisaya, Tagalog, and other Philippine languages. Feel free to chat in whatever language you're most comfortable with! 🌍\n\nWhat can I help you with today?",
        timestamp: new Date()
      }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ai_chat_messages', JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await api.post('/ai/chat', {
        message: userMessage.content,
        conversation_history: messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content
        }))
      });

      // Ensure typing animation shows for at least 3 seconds
      const typingStartTime = Date.now();
      const minTypingDuration = 3000; // 3 seconds minimum

      if (response.data && response.data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.data.response,
          timestamp: new Date()
        };

        const elapsedTime = Date.now() - typingStartTime;
        const remainingDelay = Math.max(0, minTypingDuration - elapsedTime);

        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, assistantMessage]);
        }, remainingDelay);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      const typingStartTime = Date.now();
      const minTypingDuration = 3000;
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting to the AI service. Please try again later or contact library staff for assistance.',
        timestamp: new Date()
      };

      const elapsedTime = Date.now() - typingStartTime;
      const remainingDelay = Math.max(0, minTypingDuration - elapsedTime);

      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, errorMessage]);
      }, remainingDelay);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Hey there! 👋 I'm your friendly Library Assistant! I know everything about our library system - from books and borrowing to reservations, fines, attendance, and more! I can help you with ANY question about the library. \n\nI can understand and respond in English, Cebuano/Bisaya, Tagalog, and other Philippine languages. Feel free to chat in whatever language you're most comfortable with! 🌍\n\nWhat can I help you with today?",
        timestamp: new Date()
      }
    ]);
  };

  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-6 z-50 w-96 h-[500px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col animate-slide-up sm:w-96 w-[calc(100vw-3rem)] sm:right-6 right-4 sm:bottom-20 bottom-16">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Library AI Assistant</h3>
            <p className="text-[10px] text-emerald-100">Powered by AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearConversation}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Trash2 className="h-4 w-4 text-white" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close chat"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                  <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1 max-w-[75%]">
              <div
                className={`rounded-2xl p-3 ${
                  message.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="text-xs leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-1">{children}</ol>,
                        li: ({ children }) => <li className="text-xs">{children}</li>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
              <div className="flex items-center gap-2 px-1">
                <p className="text-[9px] opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {message.role === 'assistant' && (
                  <button
                    onClick={() => handleCopyMessage(message.content, message.id)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    aria-label="Copy message"
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-400" />
                    )}
                  </button>
                )}
              </div>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0">
                <div className="p-2 bg-emerald-600 rounded-full">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setInput('Search for books about web development')}
            className="flex-shrink-0 px-3 py-1.5 text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
          >
            <Book className="h-3 w-3 inline mr-1" />
            Find Books
          </button>
          <button
            onClick={() => setInput('What are the library borrowing rules?')}
            className="flex-shrink-0 px-3 py-1.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Info className="h-3 w-3 inline mr-1" />
            Library Rules
          </button>
          <button
            onClick={() => setInput('Check my borrowed books and fines')}
            className="flex-shrink-0 px-3 py-1.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <AlertCircle className="h-3 w-3 inline mr-1" />
            My Books
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about the library..."
            className="flex-1 px-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl transition-colors"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
