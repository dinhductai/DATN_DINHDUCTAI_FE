import { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { sendMessageMode1, getConversationId } from '../services/chatService';
import { Mode1ChatResponse, ChatMode, CHAT_MODES, ConversationMessage } from '../types/chat';
import { useTranslation } from '../contexts/LanguageContext';

interface AIChatPanelProps {
  onClose: () => void;
}

export function AIChatPanel({ onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const [currentMode, setCurrentMode] = useState<ChatMode>(1);
  const { t } = useTranslation();

  // Load conversation when mode changes
  useEffect(() => {
    loadConversationHistory();
  }, [currentMode]);

  const loadConversationHistory = async () => {
    setMessages([]);
    setCurrentConversationId('');
    try {
      const convId = await getConversationId(currentMode);
      if (convId) {
        setCurrentConversationId(convId);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const switchMode = async (mode: ChatMode) => {
    if (mode === currentMode) return;
    setCurrentMode(mode);
    setMessages([]);
    setCurrentConversationId('');
    setInputMessage('');
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
      const response: Mode1ChatResponse = await sendMessageMode1(inputMessage, currentConversationId, currentMode);

      if (!currentConversationId && response.conversationId) {
        setCurrentConversationId(response.conversationId);
      }

      const aiMessage: ConversationMessage = {
        chatId: Date.now() + 1,
        conversationId: response.conversationId,
        role: 'ASSISTANT',
        content: JSON.stringify(response),
        createAt: new Date().toISOString(),
        userId: 0
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const renderMode1Response = (content: string) => {
    let parsed: Mode1ChatResponse | null = null;
    try {
      if (content.trim().startsWith('{')) {
        parsed = JSON.parse(content) as Mode1ChatResponse;
      }
    } catch { /* not JSON */ }

    if (!parsed) {
      return (
        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
          {content}
        </p>
      );
    }

    const priorityColor = (priority: string) => {
      if (priority === 'Cao') return 'bg-red-500';
      if (priority === 'Trung bình') return 'bg-yellow-500';
      return 'bg-green-500';
    };

    const priorityBadgeColor = (priority: string) => {
      if (priority === 'Cao') return 'bg-red-100 text-red-700';
      if (priority === 'Trung bình') return 'bg-yellow-100 text-yellow-700';
      return 'bg-green-100 text-green-700';
    };

    return (
      <>
        {parsed.message && (
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
            {parsed.message}
          </p>
        )}

        {/* Summary chips */}
        {parsed.summary && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 bg-gray-200 rounded-md">
              {t('chat_total')} {parsed.summary.totalTasks}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
              {t('chat_todo')} {parsed.summary.todoCount}
            </span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md">
              {t('chat_inProgress')} {parsed.summary.inProgressCount}
            </span>
            {parsed.summary.overdueCount > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md">
                <AlertCircle className="inline w-3 h-3 mr-1" />
                {t('chat_overdue')} {parsed.summary.overdueCount}
              </span>
            )}
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md">
              <CheckCircle className="inline w-3 h-3 mr-1" />
              {t('chat_completed')} {parsed.summary.doneCount}
            </span>
            {parsed.summary.eventCount > 0 && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md">
                {t('chat_events')} {parsed.summary.eventCount}
              </span>
            )}
          </div>
        )}

        {/* Highlight */}
        {parsed.highlight && (parsed.highlight.mostUrgent || parsed.highlight.mostImportant) && (
          <div className="space-y-1">
            {parsed.highlight.mostUrgent && (
              <div className="text-xs bg-orange-50 border border-orange-200 rounded-lg p-2">
                <span className="font-semibold text-orange-700">⏰ Khẩn cấp: </span>
                <span className="text-gray-700">{parsed.highlight.mostUrgent}</span>
              </div>
            )}
            {parsed.highlight.mostImportant && (
              <div className="text-xs bg-blue-50 border border-blue-200 rounded-lg p-2">
                <span className="font-semibold text-blue-700">⭐ Quan trọng: </span>
                <span className="text-gray-700">{parsed.highlight.mostImportant}</span>
              </div>
            )}
          </div>
        )}

        {/* Task list */}
        {parsed.tasks && parsed.tasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600">📋 Tasks:</p>
            {parsed.tasks.map((task, idx) => (
              <div key={idx} className="text-xs bg-white border border-gray-200 rounded-lg p-2">
                <div className="flex items-center gap-1 font-medium text-gray-800">
                  <span>{task.title}</span>
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-white text-[10px] ${priorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-1 py-0.5 rounded text-[10px] ${
                    task.status === 'Hoàn thành' ? 'bg-green-100 text-green-700' :
                    task.status === 'Đang làm' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {task.status}
                  </span>
                </div>
                {task.deadline && (
                  <p className="text-gray-500 mt-0.5">
                    <Clock className="inline w-3 h-3 mr-1" />
                    {task.deadline}
                    {task.deadlineInfo && <span className="ml-1 text-gray-400">({task.deadlineInfo})</span>}
                  </p>
                )}
                {task.reason && (
                  <p className="text-gray-400 mt-0.5 italic">{task.reason}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Event list */}
        {parsed.events && parsed.events.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600">🎉 Sự kiện:</p>
            {parsed.events.map((event, idx) => (
              <div key={idx} className="text-xs bg-purple-50 border border-purple-200 rounded-lg p-2">
                <div className="flex items-center gap-1 font-medium text-gray-800">
                  <span>{event.title}</span>
                  <span className={`px-1.5 py-0.5 rounded text-white text-[10px] ${priorityColor(event.priority)}`}>
                    {event.priority}
                  </span>
                </div>
                {event.startTime && (
                  <p className="text-gray-500 mt-0.5">
                    <Clock className="inline w-3 h-3 mr-1" />
                    {event.startTime}
                  </p>
                )}
                {event.location && (
                  <p className="text-gray-500 mt-0.5">
                    📍 {event.isOnline ? t('chat_online') : event.location}
                  </p>
                )}
                {event.reason && (
                  <p className="text-gray-400 mt-0.5 italic">{event.reason}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Fallback plain text */}
        {!parsed.message && !parsed.summary && !parsed.tasks?.length && !parsed.events?.length && (
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
            {content}
          </p>
        )}
      </>
    );
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
              <h3 className="font-semibold text-sm">{t('chat_assistant')}</h3>
              <p className="text-xs text-gray-500">{t('chat_aiAssistant')}</p>
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

        {/* Mode Tabs */}
        <div className="p-3 border-b border-gray-100 bg-white">
          <div className="flex gap-1">
            {CHAT_MODES.map((modeInfo) => (
              <button
                key={modeInfo.mode}
                onClick={() => switchMode(modeInfo.mode)}
                className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-xs transition-all ${
                  currentMode === modeInfo.mode
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-base">{modeInfo.icon}</span>
                <span className="font-medium leading-tight">{modeInfo.label}</span>
              </button>
            ))}
          </div>
          {CHAT_MODES[currentMode - 1] && (
            <p className="text-[10px] text-center text-gray-400 mt-1.5">
              {CHAT_MODES[currentMode - 1].description}
            </p>
          )}
        </div>
      </div>

      {/* Scrollable Chat Messages */}
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
                <h3 className="font-semibold text-gray-700 mb-1">
                  {CHAT_MODES[currentMode - 1]?.label}
                </h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  {currentMode === 1
                    ? t('chat_hint')
                    : CHAT_MODES[currentMode - 1]?.description}
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
                        <div className="bg-gray-100 rounded-lg p-3 space-y-2 min-w-0">
                          {currentMode === 1
                            ? renderMode1Response(message.content)
                            : (
                              <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            )
                          }
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
            placeholder={
              currentMode === 1
                ? t('chat_inputPlaceholder')
                : CHAT_MODES[currentMode - 1]?.description
            }
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
        [data-radix-scroll-area-viewport] {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
      `}</style>
    </div>
  );
}
