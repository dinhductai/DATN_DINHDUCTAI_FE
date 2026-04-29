import { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { getConversationHistory, sendMessage, getConversationId } from '../services/chatService';
import { ChatAIResponse, ConversationMessage } from '../types/chat';

interface AIChatPanelProps {
  onClose: () => void;
}

export function AIChatPanel({ onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');

  // Fetch conversation history when panel opens
  useEffect(() => {
    loadConversationHistory();
  }, []);

  const loadConversationHistory = async () => {
    try {
      // Try to get existing conversation ID
      const convId = await getConversationId();
      if (convId) {
        setCurrentConversationId(convId);
        const response = await getConversationHistory();
        setMessages(response.content);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      // Start fresh conversation if getting history fails
      setMessages([]);
      setCurrentConversationId('');
    }
  };

  // Auto scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ConversationMessage = {
      chatId: Date.now(),
      conversationId: currentConversationId,
      role: 'USER',
      content: inputMessage,
      createAt: new Date().toISOString(),
      userId: 0
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response: ChatAIResponse = await sendMessage(inputMessage, currentConversationId);

      if (!currentConversationId && response.conversationId) {
        setCurrentConversationId(response.conversationId);
      }

      if (response.structured) {
        setMessages(prev => [
          ...prev,
          {
            chatId: Date.now() + 1,
            conversationId: response.conversationId,
            role: 'ASSISTANT',
            content: JSON.stringify(response),
            createAt: new Date().toISOString(),
            userId: 0
          }
        ]);
      } else {
        const aiMessage: ConversationMessage = {
          chatId: Date.now() + 1,
          conversationId: response.conversationId,
          role: 'ASSISTANT',
          content: response.message,
          createAt: new Date().toISOString(),
          userId: 0
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-96 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Fixed Header */}
      <div className="sticky top-0 bg-white z-10">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Schedule Assistant</h3>
              <p className="text-xs text-gray-500">AI-powered helper</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs hover:bg-blue-100 transition-colors">
              📅 View this week
            </button>
            <button className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs hover:bg-purple-100 transition-colors">
              ➕ Add new class
            </button>
            <button className="px-3 py-1.5 bg-pink-50 text-pink-700 rounded-lg text-xs hover:bg-pink-100 transition-colors">
              📊 Show analytics
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Chat Messages - AUTO HEIGHT SCROLL AREA */}
      <div className="flex-1 min-h-0 overflow-hidden" style={{ maxHeight: '60vh' }}>
        <ScrollArea 
          className="h-full"
          ref={scrollAreaRef}
        >
          <div className="p-4 space-y-4 min-h-full">
            {messages.length === 0 && !isLoading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-700 mb-1">Welcome to Schedule Assistant</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  Ask me anything about your schedule, tasks, or get help with planning your day.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.chatId}
                    className={`flex ${
                      message.role === 'USER' ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === 'ASSISTANT' && (
                      <div className="flex items-start space-x-2 max-w-[85%]">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="bg-gray-100 rounded-lg p-3 space-y-3 min-w-0">
                          {(() => {
                            let parsed: ChatAIResponse | null = null;
                            try {
                              if (message.content.trim().startsWith('{')) {
                                parsed = JSON.parse(message.content) as ChatAIResponse;
                              }
                            } catch { /* not JSON, treat as plain text */ }

                            if (!parsed) {
                              return (
                                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                              );
                            }

                            return (
                              <>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                  {parsed.message}
                                </p>

                                {parsed.summary && (
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="px-2 py-1 bg-gray-200 rounded-md">
                                      Tổng: {parsed.summary.totalTasks}
                                    </span>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                                      <Clock className="inline w-3 h-3 mr-1" />
                                      Đang làm: {parsed.summary.pendingTasks}
                                    </span>
                                    {parsed.summary.overdueTasks > 0 && (
                                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md">
                                        <AlertCircle className="inline w-3 h-3 mr-1" />
                                        Quá hạn: {parsed.summary.overdueTasks}
                                      </span>
                                    )}
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md">
                                      <CheckCircle className="inline w-3 h-3 mr-1" />
                                      Hoàn thành: {parsed.summary.completedToday}
                                    </span>
                                  </div>
                                )}

                                {parsed.tasks && parsed.tasks.length > 0 && (
                                  <div className="space-y-2">
                                    {parsed.tasks.map((task, idx) => (
                                      <div key={idx} className="text-xs bg-white border border-gray-200 rounded-lg p-2">
                                        <div className="flex items-center gap-1 font-medium text-gray-800">
                                          <span>{task.emoji}</span>
                                          <span>{task.title}</span>
                                          <span className={`ml-1 px-1.5 py-0.5 rounded text-white text-[10px] ${
                                            task.priority === 'HIGH' ? 'bg-red-500' :
                                            task.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                                          }`}>
                                            {task.priority}
                                          </span>
                                        </div>
                                        {task.deadline && (
                                          <p className="text-gray-500 mt-0.5">
                                            <Clock className="inline w-3 h-3 mr-1" />
                                            {task.deadline}
                                          </p>
                                        )}
                                        {task.reason && (
                                          <p className="text-gray-400 mt-0.5 italic">{task.reason}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {parsed.recommendations && parsed.recommendations.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">Ưu tiên:</p>
                                    {parsed.recommendations
                                      .sort((a, b) => a.order - b.order)
                                      .map((rec, idx) => (
                                        <div key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                                          <span className="font-bold">{rec.order}.</span>
                                          <span className="font-medium">{rec.taskTitle}</span>
                                          {rec.reason && <span className="text-gray-500">— {rec.reason}</span>}
                                        </div>
                                      ))}
                                  </div>
                                )}

                                {parsed.motivation && (
                                  <div className="text-xs italic text-center text-purple-700 bg-purple-50 rounded p-2">
                                    {parsed.motivation}
                                  </div>
                                )}

                                {parsed.followUp && (
                                  <button
                                    className="text-xs text-blue-600 hover:underline"
                                    onClick={() => {
                                      setInputMessage(parsed!.followUp!);
                                    }}
                                  >
                                    💬 {parsed.followUp}
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                    {message.role === 'USER' && (
                      <div className="bg-blue-600 text-white rounded-lg p-3 max-w-[85%]">
                        <p className="text-sm">{message.content}</p>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2 max-w-[85%]">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-2">
          <Input
            placeholder="Ask me anything about your schedule..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-700 shrink-0"
            disabled={isLoading || !inputMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        /* Webkit browsers (Chrome, Safari) */
        [data-radix-scroll-area-viewport]::-webkit-scrollbar {
          width: 8px;
        }
        
        [data-radix-scroll-area-viewport]::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        [data-radix-scroll-area-viewport]::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
          border: 1px solid #f1f5f9;
        }
        
        [data-radix-scroll-area-viewport]::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* Firefox */
        [data-radix-scroll-area-viewport] {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
      `}</style>
    </div>
  );
}