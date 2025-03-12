import { useState, useEffect, useRef } from "react";
import { getIncidents } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapIcon, FilterIcon } from "lucide-react";

export default function MapPage() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);

  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  // Function to initialize Google Maps
  const initializeMap = async () => {
    console.log("Initializing map", {
      google: !!window.google,
      mapRef: !!mapRef.current,
      googleMapRef: !!googleMapRef.current,
    });
    if (window.google && mapRef.current && !googleMapRef.current) {
      const mapOptions = {
        center: { lat: 19.076, lng: 72.8777 }, // Default to Mumbai, India
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      };

      googleMapRef.current = new window.google.maps.Map(
        mapRef.current,
        mapOptions,
      );

      // Load incidents and display them on the map
      await loadIncidents();

      console.log("Map initialized successfully");
      setMapLoaded(true);
    }
  };

  // Function to load and display incidents
  const loadIncidents = async () => {
    try {
      // Clear existing markers
      markers.forEach((marker) => marker.setMap(null));
      setMarkers([]);

      // Try to get incidents from Supabase first
      let fetchedIncidents = await getIncidents();

      // If no incidents from Supabase, try localStorage
      if (fetchedIncidents.length === 0) {
        try {
          const savedIncidents = localStorage.getItem("mockIncidents");
          if (savedIncidents) {
            const localIncidents = JSON.parse(savedIncidents);
            fetchedIncidents = localIncidents.map((incident: any) => ({
              latitude: incident.coordinates.lat,
              longitude: incident.coordinates.lng,
              type: incident.type,
              severity: incident.severity,
              created_at: new Date().toISOString(),
            }));
          }
        } catch (e) {
          console.error("Error loading incidents from localStorage:", e);
        }
      }

      // If still no incidents, use default mock data
      const incidents =
        fetchedIncidents.length > 0
          ? fetchedIncidents
          : [
              {
                latitude: 19.076,
                longitude: 72.8777,
                type: "Suspicious Activity",
                severity: "medium",
                created_at: new Date().toISOString(),
              },
              {
                latitude: 19.033,
                longitude: 72.8454,
                type: "Traffic Hazard",
                severity: "high",
                created_at: new Date().toISOString(),
              },
              {
                latitude: 19.1136,
                longitude: 72.9005,
                type: "Noise Complaint",
                severity: "low",
                created_at: new Date().toISOString(),
              },
            ];

      // Filter incidents if a filter is selected
      const filteredIncidents = selectedFilter
        ? incidents.filter((incident) => incident.type.includes(selectedFilter))
        : incidents;

      // Create new markers for each incident
      const newMarkers = filteredIncidents.map((incident) => {
        const markerColor =
          incident.severity === "high"
            ? "red"
            : incident.severity === "medium"
              ? "orange"
              : "blue";

        const marker = new window.google.maps.Marker({
          position: { lat: incident.latitude, lng: incident.longitude },
          map: googleMapRef.current,
          title: incident.type,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: markerColor,
            fillOpacity: 0.8,
            strokeWeight: 2,
            strokeColor: "#FFFFFF",
            scale: 12,
          },
          animation: window.google.maps.Animation.DROP,
        });

        const reportTime = new Date(incident.created_at);
        const timeAgo = Math.round((Date.now() - reportTime.getTime()) / 60000);
        const timeDisplay =
          timeAgo < 60
            ? `${timeAgo} minutes ago`
            : `${Math.round(timeAgo / 60)} hours ago`;

        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div><strong>${incident.type}</strong><p>Reported ${timeDisplay}</p></div>`,
        });

        marker.addListener("click", () => {
          infoWindow.open(googleMapRef.current, marker);
        });

        return marker;
      });

      setMarkers(newMarkers);
    } catch (error) {
      console.error("Error loading incidents for map:", error);
    }
  };

  // Load Google Maps API
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAEMAN_HiL8f_41DhaK93Fyz01FbisqGw8&libraries=places,visualization,drawing,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("Google Maps API loaded");
        initializeMap();
      };
      script.onerror = () => {
        console.error("Failed to load Google Maps API");
      };
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    } else {
      console.log("Google Maps API already loaded");
      initializeMap();
    }
  }, []);

  // Google Maps integration
  const mapPlaceholder = (
    <div className="relative w-full h-[70vh] bg-muted rounded-lg flex items-center justify-center">
      {!mapLoaded && (
        <div className="text-center">
          <MapIcon className="h-16 w-16 mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading map...</p>
        </div>
      )}

      <div
        ref={mapRef}
        className="absolute inset-0 bg-card rounded-lg border overflow-hidden"
        style={{ display: mapLoaded ? "block" : "none" }}
      />

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <div className="bg-white p-2 rounded-md shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <FilterIcon className="h-4 w-4" />
            <span className="font-medium">Filter Incidents</span>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant={selectedFilter === null ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => {
                setSelectedFilter(null);
                loadIncidents();
              }}
            >
              All Incidents
            </Button>
            <Button
              size="sm"
              variant={selectedFilter === "Suspicious" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => {
                setSelectedFilter("Suspicious");
                loadIncidents();
              }}
            >
              Suspicious Activity
            </Button>
            <Button
              size="sm"
              variant={selectedFilter === "Traffic" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => {
                setSelectedFilter("Traffic");
                loadIncidents();
              }}
            >
              Traffic Hazards
            </Button>
            <Button
              size="sm"
              variant={selectedFilter === "Noise" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => {
                setSelectedFilter("Noise");
                loadIncidents();
              }}
            >
              Noise Complaints
            </Button>
            <Button
              size="sm"
              variant={selectedFilter === "Property" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => {
                setSelectedFilter("Property");
                loadIncidents();
              }}
            >
              Property Damage
            </Button>
            <Button
              size="sm"
              variant={selectedFilter === "Theft" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => {
                setSelectedFilter("Theft");
                loadIncidents();
              }}
            >
              Theft
            </Button>
            <Button
              size="sm"
              variant={selectedFilter === "Assault" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => {
                setSelectedFilter("Assault");
                loadIncidents();
              }}
            >
              Assault
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Safety Map</h1>
      </div>

      {mapPlaceholder}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium">Safety Rating</h3>
            <p className="text-3xl font-bold text-green-500">85%</p>
            <p className="text-sm text-muted-foreground">
              Current area is generally safe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium">Recent Incidents</h3>
            <p className="text-3xl font-bold">12</p>
            <p className="text-sm text-muted-foreground">In the last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium">Most Common</h3>
            <p className="text-xl font-bold">Traffic Hazards</p>
            <p className="text-sm text-muted-foreground">5 reports this week</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
