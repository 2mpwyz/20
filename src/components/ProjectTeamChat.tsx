import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProjectTeamChat } from '../hooks/useProjectTeamChat';
import { Send, Loader, AlertCircle, Upload } from 'lucide-react';

interface ProjectTeamChatProps {
  contractId: string;
  contractNumber: string;
  onClose?: () => void;
}

export default function ProjectTeamChat({
  contractId,
  contractNumber,
  onClose,
}: ProjectTeamChatProps) {
  const { user } = useAuth();
  const { messages, loading, error, sendMessage } = useProjectTeamChat(contractId, user?.id || '');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim()) {
      setLocalError('Message cannot be empty');
      return;
    }

    setIsSending(true);
    setLocalError(null);

    try {
      await sendMessage(messageText.trim());
      setMessageText('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
      setLocalError(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.round((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.round(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Team Chat</h2>
            <p className="text-sm text-slate-600">Contract #{contractNumber}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition"
            >
              ✕
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <p className="text-slate-600 mb-2">No messages yet</p>
                <p className="text-sm text-slate-500">Start a conversation with your team</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isCurrentUser = message.sender_id === user?.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-lg ${
                        isCurrentUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-900 border border-slate-200'
                      }`}
                    >
                      {!isCurrentUser && (
                        <p className={`text-xs font-medium mb-1 ${
                          isCurrentUser ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          {message.sender_name}
                        </p>
                      )}
                      <p className="text-sm">{message.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isCurrentUser ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}

          {error && (
            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-200 bg-white">
          {localError && (
            <div className="mb-3 flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{localError}</p>
            </div>
          )}

          <div className="flex gap-3">
            {/* File Upload Button (placeholder) */}
            <button
              type="button"
              disabled={isSending}
              className="px-3 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-50 transition"
              title="Upload file"
            >
              <Upload className="w-5 h-5" />
            </button>

            {/* Message Input */}
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              disabled={isSending}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isSending || !messageText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {isSending ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
