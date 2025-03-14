import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import LoginPage from "./pages/LoginPage";

// Lazy load pages for better performance
const MapPage = lazy(() => import("./pages/MapPage"));
const FeedPage = lazy(() => import("./pages/FeedPage"));
const ReportPage = lazy(() => import("./pages/ReportPage"));
const ReportSuccessPage = lazy(() => import("./pages/ReportSuccessPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

function App() {
  // Import tempo routes using dynamic import
  const TempoRoutes = () => {
    if (import.meta.env.VITE_TEMPO === "true") {
      // Using dynamic import with React.lazy and Suspense instead of require
      try {
        // We already have useRoutes imported at the top level
        const routes = import.meta.glob("/node_modules/tempo-routes/index.js", {
          eager: true,
        })["/node_modules/tempo-routes/index.js"].default;
        return routes;
      } catch (error) {
        console.error("Error loading tempo routes:", error);
        return null;
      }
    }
    return null;
  };

  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            Loading...
          </div>
        }
      >
        <>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<MapPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/report-success" element={<ReportSuccessPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminPage />} />
              {/* Allow Tempo routes to be captured before any catch-all route */}
              {import.meta.env.VITE_TEMPO === "true" && (
                <Route path="/tempobook/*" />
              )}
            </Route>
          </Routes>
          <TempoRoutes />
        </>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
