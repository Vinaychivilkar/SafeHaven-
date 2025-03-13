import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { createIncident, uploadMedia } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangleIcon,
  MapPinIcon,
  ImageIcon,
  SendIcon,
} from "lucide-react";

const incidentTypes = [
  { value: "suspicious", label: "Suspicious Activity" },
  { value: "traffic", label: "Traffic Hazard" },
  { value: "noise", label: "Noise Complaint" },
  { value: "property", label: "Property Damage" },
  { value: "theft", label: "Theft" },
  { value: "assault", label: "Assault" },
  { value: "other", label: "Other" },
];

export default function ReportPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    description: "",
    location: "",
    coordinates: { lat: 19.076, lng: 72.8777 }, // Default to Mumbai
    media: null as File | null,
    mediaPreview: "",
  });

  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markerRef = useRef(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);

      setFormData((prev) => ({
        ...prev,
        media: file,
        mediaPreview: previewUrl,
      }));
    }
  };

  // Initialize Google Maps for location picking
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAEMAN_HiL8f_41DhaK93Fyz01FbisqGw8&libraries=places,visualization,drawing,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeLocationPicker();
      };
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    } else {
      initializeLocationPicker();
    }
  }, []);

  const initializeLocationPicker = () => {
    const mapElement = document.getElementById("location-picker-map");
    if (window.google && mapElement && !googleMapRef.current) {
      const mapOptions = {
        center: { lat: 19.076, lng: 72.8777 }, // Mumbai
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
      };

      googleMapRef.current = new window.google.maps.Map(mapElement, mapOptions);

      // Add a draggable marker
      markerRef.current = new window.google.maps.Marker({
        position: { lat: 19.076, lng: 72.8777 },
        map: googleMapRef.current,
        draggable: true,
        title: "Drag to set incident location",
      });

      // Update coordinates and get address when marker is dragged
      markerRef.current.addListener("dragend", () => {
        const position = markerRef.current.getPosition();
        const lat = position.lat();
        const lng = position.lng();

        setFormData((prev) => ({
          ...prev,
          coordinates: { lat, lng },
        }));

        // Get address from coordinates using Geocoding API
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results[0]) {
            setFormData((prev) => ({
              ...prev,
              location: results[0].formatted_address,
            }));
          }
        });
      });

      // Add search box for location
      const input = document.getElementById("location") as HTMLInputElement;
      const searchBox = new window.google.maps.places.SearchBox(input);

      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (places.length === 0) return;

        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        // Update map and marker position
        googleMapRef.current.setCenter(place.geometry.location);
        markerRef.current.setPosition(place.geometry.location);

        // Update form data
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setFormData((prev) => ({
          ...prev,
          location: place.formatted_address || input.value,
          coordinates: { lat, lng },
        }));
      });
    }
  };

  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!user) {
        throw new Error("You must be logged in to submit a report");
      }

      let mediaUrl = null;
      if (formData.media) {
        mediaUrl = await uploadMedia(formData.media, user.id);
      }

      const incidentData = {
        type:
          incidentTypes.find((t) => t.value === formData.type)?.label ||
          "Unknown",
        description: formData.description,
        location: formData.location,
        latitude: formData.coordinates.lat,
        longitude: formData.coordinates.lng,
        severity:
          Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low",
        media_url: mediaUrl,
        user_id: user.id,
        status: "pending",
      };

      console.log("Submitting incident with data:", incidentData);

      // First try to save to Supabase
      const result = await createIncident(incidentData);

      if (!result) {
        console.warn("Failed to save to Supabase");

        // Save to localStorage as fallback
        try {
          const savedIncidents = localStorage.getItem("mockIncidents");
          const incidents = savedIncidents ? JSON.parse(savedIncidents) : [];
          incidents.unshift({
            id: Date.now(),
            type: incidentData.type,
            description: incidentData.description,
            location: incidentData.location,
            coordinates: {
              lat: incidentData.latitude,
              lng: incidentData.longitude,
            },
            timestamp: "Just now",
            user: user.email?.split("@")[0] || "Anonymous",
            severity: incidentData.severity,
            mediaUrl: mediaUrl,
            status: "pending",
          });
          localStorage.setItem("mockIncidents", JSON.stringify(incidents));
          console.log("Incident saved to localStorage as fallback");
        } catch (e) {
          console.error("Error saving to localStorage:", e);
        }
      } else {
        console.log("Incident successfully saved to Supabase:", result);
      }

      // Show success and redirect
      navigate("/report-success");
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Report an Incident</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5" />
              Incident Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="incident-type">Incident Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange("type", value)}
              >
                <SelectTrigger id="incident-type">
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  {incidentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what happened..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="Enter address or location description"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
              />
              <div
                className="relative w-full h-40 bg-muted rounded-md"
                id="location-picker-map"
              ></div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="media" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Add Photos/Videos (Optional)
              </Label>
              <Input
                id="media"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
              {formData.media && (
                <p className="text-sm text-muted-foreground">
                  File selected: {formData.media.name}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={
                isSubmitting ||
                !formData.type ||
                !formData.description ||
                !formData.location
              }
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <SendIcon className="h-4 w-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
