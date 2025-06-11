import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { DiscordApp } from "./components/DiscordApp";

export default function App() {
  return (
    <div className="h-screen bg-discord-dark text-white overflow-hidden">
      <Authenticated>
        <DiscordApp />
      </Authenticated>
      <Unauthenticated>
        <div className="h-full flex items-center justify-center bg-discord-darker">
          <div className="w-full max-w-md mx-auto p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome to Nevelose</h1>
              <p className="text-discord-muted">Sign in to continue</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
      <Toaster />
    </div>
  );
}
