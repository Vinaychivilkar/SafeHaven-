import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthForm from "@/components/auth/AuthForm";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (user && !loading) {
      console.log("User authenticated, redirecting", user);
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  const handleAuthSuccess = () => {
    navigate(from, { replace: true });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <AuthForm onSuccess={handleAuthSuccess} />
      </div>
    </div>
  );
}
