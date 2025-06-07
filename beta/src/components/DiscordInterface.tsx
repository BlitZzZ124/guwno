import { useState } from "react";
import { useQuery } from "convex/react";
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

  return (
    <div className="h-screen flex bg-gray-900 text-white">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations || []}
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
        onShowUserList={() => setShowUserList(true)}
        currentUser={currentUser}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <ChatArea
            conversationId={selectedConversationId}
            currentUser={currentUser}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-semibold text-gray-300 mb-2">
                Welcome to nevelose.xyz
              </h2>
              <p className="text-gray-500">
                Select a conversation or start a new one to begin messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* User List Modal */}
      {showUserList && (
        <UserList
          onClose={() => setShowUserList(false)}
          onStartConversation={(conversationId) => {
            setSelectedConversationId(conversationId as Id<"conversations">);
            setShowUserList(false);
          }}
        />
      )}
    </div>
  );
}
