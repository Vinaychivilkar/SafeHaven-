import { Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import Navbar from "./Navbar";

export default function MainLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {user && <Navbar />}
      <main className="container mx-auto py-4 px-4">
        <Outlet />
      </main>
    </div>
  );
}
