import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";
import { UserList } from "./UserList";
import { AdminDashboard } from "./AdminDashboard";

export function DiscordInterface() {
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  const conversations = useQuery(api.conversations.getUserConversations);
  const currentUser = useQuery(api.users.getCurrentUser);
  const isAdmin = useQuery(api.users.isAdmin);
  const lastNotificationCheck = useRef<number>(Date.now());

  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversationId) {
      // Auto-select general chat if available, otherwise first conversation
      const generalChat = conversations.find((conv: any) => conv.type === "general");
      setSelectedConversationId(generalChat?._id || conversations[0]._id);
    }
  }, [conversations, selectedConversationId]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setShowUserList(true);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'A' && isAdmin) {
        e.preventDefault();
        setShowAdminDashboard(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin]);

  // Global sign out event listener
  useEffect(() => {
    const handleSignOut = () => {
      window.location.reload();
    };

    window.addEventListener('signOut', handleSignOut);
    return () => window.removeEventListener('signOut', handleSignOut);
  }, []);

  if (!currentUser || !conversations) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex chat-layout">
      <div className={`${selectedConversationId ? 'hidden md:block' : 'block'}`}>
        <Sidebar
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          onShowUserList={() => setShowUserList(true)}
          currentUser={currentUser}
        />
      </div>
      
      {selectedConversationId ? (
        <div className="flex-1 flex flex-col">
          <div className="md:hidden bg-gray-800 border-b border-gray-700 p-3">
            <button
              onClick={() => setSelectedConversationId(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to conversations
            </button>
          </div>
          <ChatArea
            conversationId={selectedConversationId}
            currentUser={currentUser}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <h2 className="text-2xl font-semibold mb-2">Welcome to nevelose.xyz</h2>
            <p>Select a conversation to start chatting</p>
          </div>
        </div>
      )}

      {showUserList && (
        <UserList onClose={() => setShowUserList(false)} />
      )}

      {showAdminDashboard && isAdmin && (
        <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
      )}

      {/* Admin Button */}
      {isAdmin && (
        <button
          onClick={() => setShowAdminDashboard(true)}
          className="fixed bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-colors z-40"
          title="Admin Dashboard (Ctrl+Shift+A)"
        >
          ⚙️
        </button>
      )}
    </div>
  );
}
