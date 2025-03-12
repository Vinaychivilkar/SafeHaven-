import { Navigate } from "react-router-dom";

function Home() {
  // Home component now just redirects to the map page
  return <Navigate to="/" replace />;
}

export default Home;
