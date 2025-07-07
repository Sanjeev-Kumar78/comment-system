import React, { useState } from "react";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { LoginForm } from "./components/LoginForm";
import { SignupForm } from "./components/SignupForm";
import { CommentsSection } from "./components/CommentsSection";
import { Header } from "./components/Header";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CommentsRefreshProvider } from "./contexts/CommentsRefreshContext";

const AuthWrapper: React.FC = () => {
  const { user, loading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {isLoginMode ? (
          <LoginForm onToggleMode={() => setIsLoginMode(false)} />
        ) : (
          <SignupForm onToggleMode={() => setIsLoginMode(true)} />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CommentsRefreshProvider>
        <Header />
        <main className="py-8">
          <CommentsSection />
        </main>
      </CommentsRefreshProvider>
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthWrapper />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
