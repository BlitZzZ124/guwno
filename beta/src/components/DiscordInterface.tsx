import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";
import { UserList } from "./UserList";
import { Id } from "../../convex/_generated/dataModel";

export function DiscordInterface() {
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [showUserList, setShowUserList] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUser);
  const conversations = useQuery(api.conversations.getConversations);
  const updateLastSeen = useMutation(api.users.updateLastSeen);

  // Update last seen periodically
  useEffect(() => {
    if (currentUser) {
      updateLastSeen();
      const interval = setInterval(() => {
        updateLastSeen();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [currentUser, updateLastSeen]);

  // Auto-select general chat if no conversation is selected
  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversationId) {
      const generalChat = conversations.find(conv => conv.type === "general");
      if (generalChat) {
        setSelectedConversationId(generalChat._id);
      }
    }
  }, [conversations, selectedConversationId]);

  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="chat-layout bg-gray-900 text-white">
      <div className="chat-content">
        <Sidebar
          conversations={conversations || []}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          onShowUserList={() => setShowUserList(true)}
          currentUser={currentUser}
        />
        
        {selectedConversationId ? (
          <ChatArea
            conversationId={selectedConversationId}
            currentUser={currentUser}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center text-gray-400">
              <h2 className="text-2xl font-semibold mb-2">Welcome to nevelose.xyz</h2>
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        )}

        {showUserList && (
          <UserList
            onClose={() => setShowUserList(false)}
            onStartConversation={(conversationId) => {
              setShowUserList(false);
              setSelectedConversationId(conversationId as Id<"conversations">);
            }}
          />
        )}
      </div>
    </div>
  );
}
