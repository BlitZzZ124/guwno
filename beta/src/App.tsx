import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { ProfileSetup } from "./components/ProfileSetup";
import { DiscordInterface } from "./components/DiscordInterface";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Authenticated>
        <AuthenticatedApp />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedApp />
      </Unauthenticated>
      <Toaster />
    </div>
  );
}

function AuthenticatedApp() {
  const currentUser = useQuery(api.users.getCurrentUser);

  if (currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser?.profile) {
    return <ProfileSetup />;
  }

  return <DiscordInterface />;
}

function UnauthenticatedApp() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <header className="sticky top-0 z-10 bg-gray-800/80 backdrop-blur-sm h-16 flex justify-between items-center border-b border-gray-700 shadow-sm px-4">
        <h2 className="text-xl font-semibold text-white">nevelose.xyz</h2>
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-4">Welcome to nevelose.xyz</h1>
            <p className="text-xl text-gray-300">Sign in to start messaging</p>
          </div>
          <SignInForm />
        </div>
      </main>
    </div>
  );
}
