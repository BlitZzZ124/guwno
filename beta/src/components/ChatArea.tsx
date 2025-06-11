import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ProfileModal } from "./ProfileModal";

interface ChatAreaProps {
  channelId?: Id<"channels">;
  channelName?: string;
  dmId?: Id<"directMessages">;
  type: "channel" | "dm";
}

export function ChatArea({ channelId, channelName, dmId, type }: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const sendMessage = useMutation(type === "channel" ? api.messages.sendMessage : api.directMessages.sendDMMessage);
  const editMessage = useMutation(api.messages.editMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const addReaction = useMutation(type === "channel" ? api.reactions.addReaction : api.directMessages.addDMReaction);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  
  const messages = useQuery(
    type === "channel" ? api.messages.getChannelMessages : api.directMessages.getDMMessages,
    type === "channel" && channelId 
      ? { channelId, paginationOpts: { numItems: 50, cursor: null } }
      : type === "dm" && dmId
      ? { dmId, paginationOpts: { numItems: 50, cursor: null } }
      : "skip"
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const args = type === "channel" && channelId
      ? { channelId, content: message.trim() }
      : type === "dm" && dmId
      ? { dmId, content: message.trim() }
      : null;

    if (args) {
      await sendMessage(args as any);
      setMessage("");
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editingContent.trim()) return;
    
    await editMessage({ messageId: messageId as Id<"messages">, content: editingContent.trim() });
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      await deleteMessage({ messageId: messageId as Id<"messages"> });
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    const args = type === "channel" 
      ? { messageId: messageId as Id<"messages">, emoji }
      : { messageId: messageId as Id<"dmMessages">, emoji };
    
    await addReaction(args as any);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      const { storageId } = await result.json();
      
      // Send message with attachment
      const args = type === "channel" && channelId
        ? { channelId, content: "", attachments: [storageId] }
        : type === "dm" && dmId
        ? { dmId, content: "", attachments: [storageId] }
        : null;

      if (args) {
        await sendMessage(args as any);
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
    }
  };

  const renderAttachment = (attachment: { id: string; url: string | null }) => {
    if (!attachment.url) return null;

    const isImage = attachment.url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    const isVideo = attachment.url.match(/\.(mp4|webm|ogg)$/i);

    if (isImage) {
      return (
        <div className="media-embed mt-2">
          <img
            src={attachment.url}
            alt="Attachment"
            className="max-w-md rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(attachment.url!, '_blank')}
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="media-embed mt-2">
          <video
            src={attachment.url}
            controls
            className="max-w-md rounded-lg"
          />
        </div>
      );
    }

    return (
      <div className="mt-2">
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-2 bg-discord-light rounded text-discord-text hover:bg-discord-lighter transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          Attachment
        </a>
      </div>
    );
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

  const headerTitle = type === "channel" ? channelName : "Direct Message";

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-discord-border bg-discord-dark shadow-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-discord-muted" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5.88 4.12L13.76 12l-7.88 7.88L8 22l10-10L8 2z"/>
            </svg>
            <h3 className="font-semibold text-white">{headerTitle}</h3>
          </div>
          
          {/* Channel/DM Actions */}
          <div className="flex items-center space-x-2">
            <button className="p-1 text-discord-muted hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </button>
            <button className="p-1 text-discord-muted hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </button>
            <button className="p-1 text-discord-muted hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {messages?.page.map((msg, index) => {
            const prevMsg = index > 0 ? messages.page[index - 1] : null;
            const showDateSeparator = !prevMsg || 
              new Date(msg._creationTime).toDateString() !== new Date(prevMsg._creationTime).toDateString();
            const isGrouped = prevMsg && 
              prevMsg.authorId === msg.authorId && 
              (msg._creationTime - prevMsg._creationTime) < 300000; // 5 minutes

            return (
              <div key={msg._id}>
                {showDateSeparator && (
                  <div className="flex items-center my-6">
                    <div className="flex-1 h-px bg-discord-border"></div>
                    <div className="px-4 text-xs text-discord-muted font-semibold">
                      {formatDate(msg._creationTime)}
                    </div>
                    <div className="flex-1 h-px bg-discord-border"></div>
                  </div>
                )}
                
                <div className={`group flex hover:bg-discord-message-hover px-4 py-0.5 -mx-4 rounded relative ${isGrouped ? 'mt-0.5' : 'mt-4'}`}>
                  {!isGrouped && (
                    <div 
                      className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 cursor-pointer"
                      onClick={() => setSelectedProfile(msg.author)}
                    >
                      {msg.author.avatar ? (
                        <img
                          src={msg.author.avatar}
                          alt={msg.author.displayName || msg.author.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {(msg.author.displayName || msg.author.name || "U").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className={`flex-1 ${isGrouped ? 'ml-14' : ''}`}>
                    {!isGrouped && (
                      <div className="flex items-baseline mb-1">
                        <span 
                          className="font-semibold text-white mr-2 cursor-pointer hover:underline"
                          onClick={() => setSelectedProfile(msg.author)}
                        >
                          {msg.author.displayName || msg.author.name}
                        </span>
                        <span className="text-xs text-discord-muted">
                          {formatTime(msg._creationTime)}
                        </span>
                      </div>
                    )}
                    
                    {editingMessageId === msg._id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="flex-1 px-2 py-1 bg-discord-input text-white rounded border border-discord-border focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleEditMessage(msg._id);
                            } else if (e.key === "Escape") {
                              setEditingMessageId(null);
                              setEditingContent("");
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditMessage(msg._id)}
                          className="px-2 py-1 bg-discord-green text-white rounded text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditingContent("");
                          }}
                          className="px-2 py-1 bg-discord-red text-white rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        {msg.content && (
                          <div className="text-discord-text leading-relaxed">
                            {msg.content}
                            {msg.edited && (
                              <span className="text-xs text-discord-muted ml-1">(edited)</span>
                            )}
                          </div>
                        )}
                        
                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.attachments.map((attachmentId) => 
                              renderAttachment({ id: attachmentId, url: null })
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Reactions */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg._id, emoji)}
                            className={`flex items-center px-2 py-1 rounded text-xs transition-colors ${
                              msg.userReactions?.includes(emoji)
                                ? "bg-discord-blurple text-white"
                                : "bg-discord-hover text-discord-muted hover:bg-discord-selected"
                            }`}
                          >
                            <span className="mr-1">{emoji}</span>
                            <span>{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Actions */}
                  <div className="absolute top-0 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-discord-dark border border-discord-border rounded shadow-lg flex">
                    <button
                      onClick={() => handleReaction(msg._id, "👍")}
                      className="p-1 hover:bg-discord-hover text-discord-muted hover:text-white"
                      title="Add reaction"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </button>
                    {msg.authorId === msg.author._id && (
                      <>
                        <button
                          onClick={() => {
                            setEditingMessageId(msg._id);
                            setEditingContent(msg.content);
                          }}
                          className="p-1 hover:bg-discord-hover text-discord-muted hover:text-white"
                          title="Edit message"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="p-1 hover:bg-discord-hover text-discord-muted hover:text-discord-red"
                          title="Delete message"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-discord-muted hover:text-white transition-colors"
              title="Upload file"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </button>
            <div className="flex-1 bg-discord-input rounded-lg">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Message ${type === "channel" ? `#${channelName}` : "Direct Message"}`}
                className="w-full px-4 py-3 bg-transparent text-white placeholder-discord-muted focus:outline-none"
              />
            </div>
            <button
              type="button"
              className="p-2 text-discord-muted hover:text-white transition-colors"
              title="Emoji"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,6C9.79,6 8,7.79 8,10H10C10,8.9 10.9,8 12,8C13.1,8 14,8.9 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10C16,7.79 14.21,6 12,6M11,16H13V18H11V16Z"/>
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Profile Modal */}
      {selectedProfile && (
        <ProfileModal 
          user={selectedProfile} 
          onClose={() => setSelectedProfile(null)} 
        />
      )}
    </>
  );
}
