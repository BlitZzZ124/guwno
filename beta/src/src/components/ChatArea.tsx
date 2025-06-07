import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { ProfileModal } from "./ProfileModal";

interface ChatAreaProps {
  conversationId: Id<"conversations">;
  currentUser: any;
}

export function ChatArea({ conversationId, currentUser }: ChatAreaProps) {
  const [messageText, setMessageText] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [showProfile, setShowProfile] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  const conversation = useQuery(api.conversations.getConversation, { conversationId });
  const messages = useQuery(api.messages.getMessages, { conversationId });
  const sendMessage = useMutation(api.messages.sendMessage);

  // Notification sound effect
  useEffect(() => {
    if (messages && messages.length > lastMessageCountRef.current && lastMessageCountRef.current > 0) {
      // Check if the new message is not from the current user
      const latestMessage = messages[messages.length - 1];
      if (latestMessage && latestMessage.senderId !== currentUser?._id) {
        // Play notification sound
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors if audio can't play
      }
    }
    lastMessageCountRef.current = messages?.length || 0;
  }, [messages, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      await sendMessage({
        conversationId,
        content: messageText,
        replyTo: replyTo?._id,
      });
      setMessageText("");
      setReplyTo(null);
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const getConversationTitle = () => {
    if (!conversation) return "Loading...";
    
    if (conversation.type === "general") {
      return "General Chat";
    }
    if (conversation.type === "group" && conversation.name) {
      return conversation.name;
    }
    
    const otherParticipant = conversation.participants.find(
      (p: any) => p._id !== currentUser?._id
    );
    return otherParticipant?.profile?.displayName || "Unknown User";
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages: any[]) => {
    const groups: { [key: string]: any[] } = {};
    
    messages?.forEach((message) => {
      const dateKey = new Date(message._creationTime).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });

    return Object.entries(groups).map(([date, msgs]) => ({
      date: new Date(date).getTime(),
      messages: msgs,
    }));
  };

  const messageGroups = groupMessagesByDate(messages || []);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-6">
        <div className="flex items-center space-x-3">
          <span className="text-xl">
            {conversation?.type === "general" ? "🌍" : "#"}
          </span>
          <h2 className="text-xl font-semibold text-white">
            {getConversationTitle()}
          </h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messageGroups.map((group) => (
          <div key={group.date}>
            {/* Date Separator */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-700"></div>
              <div className="px-4 text-xs text-gray-400 font-medium">
                {formatDate(group.date)}
              </div>
              <div className="flex-1 h-px bg-gray-700"></div>
            </div>

            {/* Messages for this date */}
            {group.messages.map((message, index) => {
              const prevMessage = index > 0 ? group.messages[index - 1] : null;
              const isConsecutive = prevMessage?.senderId === message.senderId &&
                (message._creationTime - prevMessage._creationTime) < 300000; // 5 minutes

              return (
                <div key={message._id} className="group">
                  {message.replyTo && (
                    <div className="ml-12 mb-1 text-sm text-gray-400 border-l-2 border-gray-600 pl-3">
                      <span className="font-medium">
                        {message.replyTo.sender?.profile?.displayName}
                      </span>
                      : {message.replyTo.content.substring(0, 100)}
                      {message.replyTo.content.length > 100 && "..."}
                    </div>
                  )}
                  
                  <div className={`flex items-start space-x-3 hover:bg-gray-800/50 px-3 py-1 rounded ${
                    isConsecutive ? "mt-1" : "mt-4"
                  }`}>
                    {!isConsecutive && (
                      <button
                        onClick={() => setShowProfile(message.senderId)}
                        className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-blue-500 transition-all"
                      >
                        {message.sender?.profile?.avatarUrl ? (
                          <img
                            src={message.sender.profile.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-lg">👤</span>
                        )}
                      </button>
                    )}
                    
                    {isConsecutive && <div className="w-10"></div>}
                    
                    <div className="flex-1 min-w-0">
                      {!isConsecutive && (
                        <div className="flex items-baseline space-x-2 mb-1">
                          <button
                            onClick={() => setShowProfile(message.senderId)}
                            className="font-semibold text-white hover:underline"
                          >
                            {message.sender?.profile?.displayName}
                          </button>
                          <span className="text-xs text-gray-400">
                            {formatTime(message._creationTime)}
                          </span>
                        </div>
                      )}
                      
                      <div className="text-gray-300 break-words">
                        {message.content}
                        {message.edited && (
                          <span className="text-xs text-gray-500 ml-1">(edited)</span>
                        )}
                      </div>
                    </div>

                    {/* Message Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setReplyTo(message)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Reply"
                      >
                        ↩️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        {replyTo && (
          <div className="mb-2 p-2 bg-gray-700 rounded-lg flex items-center justify-between">
            <div className="text-sm text-gray-300">
              Replying to <span className="font-medium">{replyTo.sender?.profile?.displayName}</span>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={`Message ${getConversationTitle()}`}
            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          userId={showProfile as Id<"users">}
          onClose={() => setShowProfile(null)}
          isOwnProfile={showProfile === currentUser?._id}
        />
      )}
    </div>
  );
}
