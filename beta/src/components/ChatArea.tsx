import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { ProfileModal } from "./ProfileModal";
import { EmojiPicker } from "./EmojiPicker";
import { AddUsersModal } from "./AddUsersModal";
import { VoiceCallModal } from "./VoiceCallModal";

interface ChatAreaProps {
  conversationId: Id<"conversations">;
  currentUser: any;
}

export function ChatArea({ conversationId, currentUser }: ChatAreaProps) {
  const [messageText, setMessageText] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [showProfile, setShowProfile] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAddUsers, setShowAddUsers] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const conversation = useQuery(api.conversations.getConversation, { conversationId });
  const messages = useQuery(api.messages.getMessages, { conversationId });
  const generalChatMembers = useQuery(
    api.conversations.getGeneralChatMembers,
    conversation?.type === "general" ? { conversationId } : "skip"
  );
  const searchUsers = useQuery(
    api.users.searchUsersInConversation,
    mentionQuery.length >= 1 ? { query: mentionQuery, conversationId } : "skip"
  );
  const typingUsers = useQuery(api.users.getTypingUsers, { conversationId });
  const customEmojis = useQuery(api.users.getCustomEmojis);
  
  const sendMessage = useMutation(api.messages.sendMessage);
  const editMessage = useMutation(api.messages.editMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const setTyping = useMutation(api.users.setTyping);
  const updateLastSeen = useMutation(api.users.updateLastSeen);
  const markConversationAsRead = useMutation(api.unreadMessages.markConversationAsRead);

  // Update last seen every 30 seconds and mark conversation as read
  useEffect(() => {
    const interval = setInterval(() => {
      updateLastSeen();
    }, 30000);

    // Mark conversation as read when viewing it
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      markConversationAsRead({
        conversationId,
        lastMessageId: lastMessage._id,
      });
    }

    return () => clearInterval(interval);
  }, [updateLastSeen, markConversationAsRead, conversationId, messages]);

  // Global notification sound effect - play for all conversations
  useEffect(() => {
    if (messages && messages.length > lastMessageCountRef.current && lastMessageCountRef.current > 0) {
      // Check if the new message is not from the current user
      const latestMessage = messages[messages.length - 1];
      if (latestMessage && latestMessage.senderId !== currentUser?._id) {
        // Play sound regardless of which conversation is active or if window is focused
        if (!currentUser?.profile?.doNotDisturb) {
          const audio = new Audio('https://nevelose.xyz/files/notification.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {
            // Fallback beep sound
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 800;
              gain.gain.value = 0.1;
              osc.start();
              osc.stop(ctx.currentTime + 0.1);
            } catch (e) {}
          });
        }
      }
    }
    lastMessageCountRef.current = messages?.length || 0;
  }, [messages, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle mention suggestions
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleInput = () => {
      const value = input.value;
      const cursorPos = input.selectionStart || 0;
      const textBeforeCursor = value.substring(0, cursorPos);
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
      
      if (mentionMatch) {
        setMentionQuery(mentionMatch[1]);
        setShowMentions(true);
      } else {
        setShowMentions(false);
        setMentionQuery("");
      }
    };

    input.addEventListener('input', handleInput);
    input.addEventListener('keyup', handleInput);
    input.addEventListener('click', handleInput);
    
    return () => {
      input.removeEventListener('input', handleInput);
      input.removeEventListener('keyup', handleInput);
      input.removeEventListener('click', handleInput);
    };
  }, []);

  useEffect(() => {
    if (searchUsers) {
      setMentionSuggestions(searchUsers.slice(0, 5));
    }
  }, [searchUsers]);

  // Handle typing indicator
  const handleTyping = () => {
    setTyping({ conversationId, isTyping: true });
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    const timeout = setTimeout(() => {
      setTyping({ conversationId, isTyping: false });
    }, 3000);
    
    setTypingTimeout(timeout);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      // Stop typing indicator
      setTyping({ conversationId, isTyping: false });
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }

      await sendMessage({
        conversationId,
        content: messageText,
        replyTo: replyTo?._id,
      });
      setMessageText("");
      setReplyTo(null);
      setShowMentions(false);
      setShowEmojiPicker(false);
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editText.trim()) return;

    try {
      await editMessage({
        messageId: messageId as Id<"messages">,
        content: editText,
      });
      setEditingMessage(null);
      setEditText("");
      toast.success("Message edited");
    } catch (error) {
      toast.error("Failed to edit message");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessage({ messageId: messageId as Id<"messages"> });
        toast.success("Message deleted");
      } catch (error) {
        toast.error("Failed to delete message");
      }
    }
  };

  const insertMention = (username: string) => {
    const input = inputRef.current;
    if (!input) return;

    const value = input.value;
    const cursorPos = input.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);
    
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const beforeMention = textBeforeCursor.substring(0, mentionMatch.index);
      const newValue = beforeMention + `@${username} ` + textAfterCursor;
      setMessageText(newValue);
      
      // Set cursor position after the mention
      setTimeout(() => {
        const newCursorPos = beforeMention.length + username.length + 2;
        input.setSelectionRange(newCursorPos, newCursorPos);
        input.focus();
      }, 0);
    }
    
    setShowMentions(false);
  };

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) return;

    const value = input.value;
    const cursorPos = input.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);
    
    const newValue = textBeforeCursor + emoji + textAfterCursor;
    setMessageText(newValue);
    
    // Set cursor position after the emoji
    setTimeout(() => {
      const newCursorPos = cursorPos + emoji.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
      input.focus();
    }, 0);
    
    setShowEmojiPicker(false);
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
      (p: any) => (typeof p === "string" ? p : p._id) !== currentUser?._id
    );
    return (typeof otherParticipant === "string" ? "Unknown User" : otherParticipant?.profile?.displayName) || "Unknown User";
  };

  const getConversationIcon = () => {
    if (!conversation) return "#";
    
    if (conversation.type === "general") {
      return "🌍";
    }
    if (conversation.type === "group") {
      return "👥";
    }
    
    // For DMs, show the other user's avatar
    const otherParticipant = conversation.participants.find(
      (p: any) => (typeof p === "string" ? p : p._id) !== currentUser?._id
    );
    
    if (typeof otherParticipant !== "string" && otherParticipant?.profile?.avatarUrl) {
      return (
        <img
          src={otherParticipant.profile.avatarUrl}
          alt="Avatar"
          className="w-6 h-6 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    
    return "👤";
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "status-online";
      case "away": return "status-away";
      case "dnd": return "status-dnd";
      default: return "status-offline";
    }
  };

  const renderMessageContent = (content: string, mentions?: string[]) => {
    let processedContent = content;
    
    // Handle mentions
    if (mentions && mentions.length > 0) {
      const mentionRegex = /@(\w+)/g;
      processedContent = content.replace(mentionRegex, (match, username) => {
        return `<span class="mention">@${username}</span>`;
      });
    }

    // Handle custom emojis
    if (customEmojis) {
      customEmojis.forEach(emoji => {
        const emojiRegex = new RegExp(`:${emoji.name}:`, 'g');
        processedContent = processedContent.replace(emojiRegex, 
          `<img src="${emoji.imageUrl}" alt=":${emoji.name}:" class="inline-block w-6 h-6 mx-1" />`
        );
      });
    }

    return <div className="message-content" dangerouslySetInnerHTML={{ __html: processedContent }} />;
  };

  const renderEmbeds = (embeds?: any[]) => {
    if (!embeds || embeds.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {embeds.map((embed, index) => (
          <div key={index}>
            {embed.type === "image" && (
              <img
                src={embed.url}
                alt="Embedded image"
                className="embed-image"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="text-xl">
              {getConversationIcon()}
            </div>
            <h2 className="text-xl font-semibold text-white">
              {getConversationTitle()}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Add Users Button */}
            <button
              onClick={() => setShowAddUsers(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Add Users"
            >
              👥➕
            </button>
            
            {/* Voice Call Button */}
            <button
              onClick={() => setShowVoiceCall(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Start Voice Call"
            >
              📞
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 messages-container">
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
                        <div className="relative">
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
                          {/* Status indicator */}
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(message.sender?.profile?.status || "offline")}`}></div>
                        </div>
                      )}
                      
                      {isConsecutive && <div className="w-10"></div>}
                      
                      <div className="flex-1 min-w-0">
                        {!isConsecutive && (
                          <div className="flex items-baseline space-x-2 mb-1">
                            <button
                              onClick={() => setShowProfile(message.senderId)}
                              className="font-semibold text-white hover:underline flex items-center space-x-1"
                            >
                              <span>{message.sender?.profile?.displayName}</span>
                              {message.sender?.profile?.verified && (
                                <span className="verification-check">✓</span>
                              )}
                              {/* Badges */}
                              {message.sender?.profile?.badges?.map((badge: any, badgeIndex: number) => (
                                <img
                                  key={badgeIndex}
                                  src={badge.imageUrl}
                                  alt={badge.name}
                                  title={badge.description || badge.name}
                                  className="w-4 h-4 inline-block"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ))}
                            </button>
                            <span className="text-xs text-gray-400">
                              {formatTime(message._creationTime)}
                            </span>
                          </div>
                        )}
                        
                        <div className="text-gray-300 break-words">
                          {editingMessage === message._id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleEditMessage(message._id);
                                  } else if (e.key === 'Escape') {
                                    setEditingMessage(null);
                                    setEditText("");
                                  }
                                }}
                                className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                autoFocus
                              />
                              <button
                                onClick={() => handleEditMessage(message._id)}
                                className="text-green-400 hover:text-green-300 text-sm"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMessage(null);
                                  setEditText("");
                                }}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <>
                              {renderMessageContent(message.content, message.mentions)}
                              {message.edited && (
                                <span className="text-xs text-gray-500 ml-1">(edited)</span>
                              )}
                              {renderEmbeds(message.embeds)}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Message Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <button
                          onClick={() => setReplyTo(message)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title="Reply"
                        >
                          ↩️
                        </button>
                        {message.senderId === currentUser?._id && (
                          <>
                            <button
                              onClick={() => {
                                setEditingMessage(message._id);
                                setEditText(message.content);
                              }}
                              className="p-1 text-gray-400 hover:text-white transition-colors"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message._id)}
                              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          
          {/* Typing Indicator */}
          {typingUsers && typingUsers.length > 0 && (
            <div className="flex items-center space-x-2 px-3 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-400">
                <span className="font-bold text-white">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0]!.profile?.displayName}`
                    : `${typingUsers.map(u => u!.profile?.displayName).join(', ')}`
                  }
                </span>
                <span className="text-gray-400">
                  {typingUsers.length === 1 ? ' is typing...' : ' are typing...'}
                </span>
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} className="messages-end" />
        </div>

        {/* Message Input */}
        <div className="p-4 bg-gray-800 border-t border-gray-700 flex-shrink-0">
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

          {/* Mention Suggestions */}
          {showMentions && mentionSuggestions.length > 0 && (
            <div className="mb-2 bg-gray-700 rounded-lg border border-gray-600 max-h-32 overflow-y-auto">
              {mentionSuggestions.map((user) => (
                <button
                  key={user._id}
                  onClick={() => insertMention(user.profile?.username || "")}
                  className="w-full px-3 py-2 text-left hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                    {user.profile?.avatarUrl ? (
                      <img
                        src={user.profile.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-xs">👤</span>
                    )}
                  </div>
                  <div>
                    <div className="text-white text-sm">{user.profile?.displayName}</div>
                    <div className="text-gray-400 text-xs">@{user.profile?.username}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <EmojiPicker
              onEmojiSelect={insertEmoji}
              onClose={() => setShowEmojiPicker(false)}
              customEmojis={customEmojis || []}
            />
          )}
          
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  handleTyping();
                }}
                placeholder={`Message ${getConversationTitle()}`}
                className="w-full px-4 py-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                😀
              </button>
            </div>
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Member List for General Chat */}
      {conversation?.type === "general" && (
        <div className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              Members ({generalChatMembers?.length || 0})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {generalChatMembers?.map((member) => (
              <button
                key={member!._id}
                onClick={() => setShowProfile(member!._id)}
                className="w-full p-2 rounded-lg hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                      {member!.profile?.avatarUrl ? (
                        <img
                          src={member!.profile.avatarUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-sm">👤</span>
                      )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(member!.profile?.status || "offline")}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-white truncate">
                        {member!.profile?.displayName}
                      </span>
                      {member!.profile?.verified && (
                        <span className="verification-check">✓</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {member!.profile?.status === "dnd" ? "Do Not Disturb" : member!.profile?.status || "offline"}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          userId={showProfile as Id<"users">}
          onClose={() => setShowProfile(null)}
          isOwnProfile={showProfile === currentUser?._id}
        />
      )}

      {/* Add Users Modal */}
      {showAddUsers && (
        <AddUsersModal
          conversationId={conversationId}
          onClose={() => setShowAddUsers(false)}
        />
      )}

      {/* Voice Call Modal */}
      {showVoiceCall && (
        <VoiceCallModal
          conversationId={conversationId}
          onClose={() => setShowVoiceCall(false)}
        />
      )}
    </div>
  );
}
