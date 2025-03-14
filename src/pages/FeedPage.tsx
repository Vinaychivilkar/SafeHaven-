import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangleIcon,
  AlertCircleIcon,
  CarIcon,
  UserIcon,
  ClockIcon,
  MapPinIcon,
  ImageIcon,
} from "lucide-react";

import { getIncidents as fetchIncidentsFromAPI } from "@/lib/api";

// Get incidents from Supabase or fallback to localStorage
const getIncidents = async () => {
  try {
    // Check for cached data first to avoid unnecessary API calls during development
    const cachedData = localStorage.getItem("incidentsCache");
    const cacheTime = localStorage.getItem("incidentsCacheTime");
    const now = Date.now();
    const cacheExpired = !cacheTime || now - parseInt(cacheTime) > 30000; // 30 seconds cache

    if (cachedData && !cacheExpired) {
      console.log("Using cached incidents data");
      return JSON.parse(cachedData);
    }

    // Try to get incidents from Supabase
    const supabaseIncidents = await fetchIncidentsFromAPI();

    if (supabaseIncidents && supabaseIncidents.length > 0) {
      console.log("Loaded incidents from Supabase:", supabaseIncidents);
      const processedIncidents = supabaseIncidents
        .filter((incident) => incident.status !== "deleted") // Filter out deleted incidents
        .map((incident) => {
          console.log(
            `Processing incident ${incident.id}, profile:`,
            incident.profiles,
          );
          return {
            id: incident.id,
            type: incident.type,
            description: incident.description,
            location: incident.location,
            coordinates: { lat: incident.latitude, lng: incident.longitude },
            timestamp: formatTimestamp(incident.created_at),
            user: incident.profiles?.name || "Anonymous",
            severity: incident.severity,
            mediaUrl: incident.media_url,
            status: incident.status,
          };
        });

      // Cache the processed incidents
      localStorage.setItem(
        "incidentsCache",
        JSON.stringify(processedIncidents),
      );
      localStorage.setItem("incidentsCacheTime", Date.now().toString());

      return processedIncidents;
    }

    // Fallback to localStorage
    const savedIncidents = localStorage.getItem("mockIncidents");
    if (savedIncidents) {
      console.log("Falling back to localStorage incidents");
      const incidents = JSON.parse(savedIncidents);
      return incidents.filter((incident: any) => incident.status !== "deleted"); // Filter out deleted incidents
    }
  } catch (error) {
    console.error("Error loading incidents:", error);
  }

  // Default mock data if nothing in Supabase or localStorage
  return [
    {
      id: 1,
      type: "Suspicious Activity",
      description: "Person looking into car windows in the parking lot",
      location: "Bandra, Mumbai",
      coordinates: { lat: 19.0596, lng: 72.8295 },
      timestamp: "10 minutes ago",
      user: "Alex D.",
      severity: "medium",
      mediaUrl:
        "https://images.unsplash.com/photo-1517436073-3b1b1b1b1b1b?w=400&q=80",
    },
    {
      id: 2,
      type: "Traffic Hazard",
      description: "Large pothole causing cars to swerve suddenly",
      location: "Andheri, Mumbai",
      coordinates: { lat: 19.1136, lng: 72.8697 },
      timestamp: "35 minutes ago",
      user: "Jamie L.",
      severity: "high",
      mediaUrl:
        "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=400&q=80",
    },
    {
      id: 3,
      type: "Noise Complaint",
      description: "Loud construction work outside permitted hours",
      location: "Dadar, Mumbai",
      coordinates: { lat: 19.0178, lng: 72.8478 },
      timestamp: "2 hours ago",
      user: "Sam T.",
      severity: "low",
      mediaUrl: null,
    },
    {
      id: 4,
      type: "Property Damage",
      description: "Graffiti on the wall of the community center",
      location: "Juhu, Mumbai",
      coordinates: { lat: 19.1075, lng: 72.8263 },
      timestamp: "5 hours ago",
      user: "Jordan K.",
      severity: "medium",
      mediaUrl:
        "https://images.unsplash.com/photo-1580745294621-26c6873c38e7?w=400&q=80",
    },
  ];
};

// Format timestamp to relative time
const formatTimestamp = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  } catch (error) {
    console.error("Error formatting timestamp:", error, timestamp);
    return "Recently";
  }
};

type Incident = {
  id: string | number;
  type: string;
  description: string;
  location: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  user: string;
  severity: string;
  mediaUrl: string | null;
  status?: string;
};

export default function FeedPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );
  const [showDetails, setShowDetails] = useState(false);
  const mapRef = useRef(null);

  // Load incidents on component mount
  useEffect(() => {
    loadIncidents();
  }, []);

  // Function to load incidents from API or localStorage
  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const loadedIncidents = await getIncidents();
      setIncidents(loadedIncidents);
    } catch (error) {
      console.error("Error loading incidents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh function to get latest incidents
  const refreshIncidents = () => {
    // Clear cache before loading to ensure fresh data
    localStorage.removeItem("incidentsCache");
    loadIncidents();
  };
  const [selectedTab, setSelectedTab] = useState("all");

  const handleViewDetails = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowDetails(true);
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case "Suspicious Activity":
        return <AlertCircleIcon className="h-5 w-5" />;
      case "Traffic Hazard":
        return <CarIcon className="h-5 w-5" />;
      default:
        return <AlertTriangleIcon className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const filteredIncidents =
    selectedTab === "all"
      ? incidents
      : incidents.filter((incident) => {
          if (selectedTab === "high") return incident.severity === "high";
          if (selectedTab === "medium") return incident.severity === "medium";
          if (selectedTab === "low") return incident.severity === "low";
          return true;
        });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Incident Feed</h1>
        <Button size="sm" variant="outline" onClick={refreshIncidents}>
          Refresh
        </Button>
      </div>

      <Tabs
        defaultValue="all"
        value={selectedTab}
        onValueChange={setSelectedTab}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="high" className="text-red-600">
            High
          </TabsTrigger>
          <TabsTrigger value="medium" className="text-yellow-600">
            Medium
          </TabsTrigger>
          <TabsTrigger value="low" className="text-green-600">
            Low
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Loading incidents...</p>
            </CardContent>
          </Card>
        ) : filteredIncidents.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No incidents to display</p>
            </CardContent>
          </Card>
        ) : (
          filteredIncidents.map((incident) => (
            <Card key={incident.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getIncidentIcon(incident.type)}
                    <CardTitle className="text-lg">{incident.type}</CardTitle>
                  </div>
                  <Badge className={getSeverityColor(incident.severity)}>
                    {incident.severity.charAt(0).toUpperCase() +
                      incident.severity.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p>{incident.description}</p>
                <div className="flex flex-col sm:flex-row gap-2 mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{incident.location}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:ml-4">
                    <ClockIcon className="h-4 w-4" />
                    <span>{incident.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:ml-4">
                    <UserIcon className="h-4 w-4" />
                    <span>{incident.user}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => handleViewDetails(incident)}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {showDetails && selectedIncident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getIncidentIcon(selectedIncident.type)}
                  <CardTitle>{selectedIncident.type}</CardTitle>
                </div>
                <Badge className={getSeverityColor(selectedIncident.severity)}>
                  {selectedIncident.severity.charAt(0).toUpperCase() +
                    selectedIncident.severity.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg">{selectedIncident.description}</p>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4" />
                  Location
                </h4>
                <p>{selectedIncident.location}</p>

                {/* Map showing the incident location */}
                <div
                  id="incident-detail-map"
                  className="w-full h-48 bg-muted rounded-md"
                  ref={mapRef}
                >
                  {selectedIncident.coordinates && (
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAEMAN_HiL8f_41DhaK93Fyz01FbisqGw8&q=${selectedIncident.coordinates.lat},${selectedIncident.coordinates.lng}&zoom=15`}
                      allowFullScreen
                    ></iframe>
                  )}
                </div>
              </div>

              {selectedIncident.mediaUrl && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Media
                  </h4>
                  <div className="rounded-md overflow-hidden">
                    <img
                      src={selectedIncident.mediaUrl}
                      alt="Incident media"
                      className="w-full h-auto max-h-80 object-cover"
                      onError={(e) => {
                        // Fallback to a placeholder image if the original fails to load
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1580745294621-26c6873c38e7?w=400&q=80";
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>{selectedIncident.timestamp}</span>
                </div>
                <div className="flex items-center gap-1 sm:ml-4">
                  <UserIcon className="h-4 w-4" />
                  <span>Reported by {selectedIncident.user}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowDetails(false)}
              >
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
