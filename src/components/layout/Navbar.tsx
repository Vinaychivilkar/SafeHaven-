import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "../auth/AuthProvider";
import { MapIcon, AlertCircleIcon, UserIcon, BellIcon } from "lucide-react";

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl">
          SafeHaven
        </Link>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex flex-col items-center text-xs">
              <MapIcon className="h-5 w-5" />
              <span>Map</span>
            </Link>
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <Link to="/feed" className="flex flex-col items-center text-xs">
              <BellIcon className="h-5 w-5" />
              <span>Feed</span>
            </Link>
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <Link to="/report" className="flex flex-col items-center text-xs">
              <AlertCircleIcon className="h-5 w-5" />
              <span>Report</span>
            </Link>
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <Link to="/profile" className="flex flex-col items-center text-xs">
              <UserIcon className="h-5 w-5" />
              <span>Profile</span>
            </Link>
          </Button>

          {user?.email === "admin@gmail.com" && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin" className="flex flex-col items-center text-xs">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 1.32 4.24 2.5 2.5 0 0 0 1.98 3A2.5 2.5 0 0 0 12 19.5a2.5 2.5 0 0 0 3.64-5.2 2.5 2.5 0 0 0 1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5z" />
                  <path d="M12 12v.01" />
                </svg>
                <span>Admin</span>
              </Link>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="ml-2"
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
