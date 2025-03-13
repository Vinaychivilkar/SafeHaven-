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
