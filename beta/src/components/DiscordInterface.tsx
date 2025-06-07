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
    const interval = setInterval(() => {
      updateLastSeen();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [updateLastSeen]);

  // Auto-select general chat if no conversation is selected
  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversationId) {
      const generalChat = conversations.find(conv => conv.type === "general");
      if (generalChat) {
        setSelectedConversationId(generalChat._id);
      }
    }
  }, [conversations, selectedConversationId]);

  // Handle sign out event
  useEffect(() => {
    const handleSignOut = () => {
      // Find and click the actual sign out button
      const signOutButton = document.querySelector('[data-testid="sign-out-button"]') as HTMLButtonElement;
      if (signOutButton) {
        signOutButton.click();
      }
    };

    window.addEventListener('signOut', handleSignOut);
    return () => window.removeEventListener('signOut', handleSignOut);
  }, []);

  const handleSelectConversation = (conversationId: Id<"conversations">) => {
    setSelectedConversationId(conversationId);
    setShowUserList(false);
  };

  const handleStartConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId as Id<"conversations">);
    setShowUserList(false);
  };

  if (!currentUser || !conversations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-900 text-white">
      <Sidebar
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
        onShowUserList={() => setShowUserList(true)}
        currentUser={currentUser}
      />
      
      {selectedConversationId ? (
        <ChatArea
          conversationId={selectedConversationId}
          currentUser={currentUser}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-400 mb-4">
              Welcome to nevelose.xyz
            </h2>
            <p className="text-gray-500">
              Select a conversation to start chatting
            </p>
          </div>
        </div>
      )}

      {showUserList && (
        <UserList
          onClose={() => setShowUserList(false)}
          onStartConversation={handleStartConversation}
        />
      )}
    </div>
  );
}
