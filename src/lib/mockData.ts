import type { Incident } from "./supabaseTypes";

// Function to seed mock data into localStorage
export function seedMockData() {
  // Check if we already have mock data
  if (!localStorage.getItem("mockIncidents")) {
    const mockIncidents = [
      {
        id: 1,
        type: "Suspicious Activity",
        description: "Person looking into car windows in the parking lot",
        location: "Bandra, Mumbai",
        coordinates: { lat: 19.0596, lng: 72.8295 },
        timestamp: "10 minutes ago",
        user: "Alex D.",
        severity: "medium",
        status: "pending",
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
        status: "pending",
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
        status: "pending",
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
        status: "pending",
        mediaUrl:
          "https://images.unsplash.com/photo-1580745294621-26c6873c38e7?w=400&q=80",
      },
    ];

    localStorage.setItem("mockIncidents", JSON.stringify(mockIncidents));
  }
}

// Function to get mock incidents from localStorage
export function getMockIncidents() {
  try {
    const savedIncidents = localStorage.getItem("mockIncidents");
    if (savedIncidents) {
      return JSON.parse(savedIncidents);
    }
  } catch (error) {
    console.error("Error loading incidents from localStorage:", error);
  }
  return [];
}

// Function to add a mock incident to localStorage
export function addMockIncident(incident: any) {
  try {
    const incidents = getMockIncidents();
    incidents.unshift({
      id: Date.now(),
      ...incident,
      timestamp: "Just now",
      status: "pending",
    });
    localStorage.setItem("mockIncidents", JSON.stringify(incidents));
    return true;
  } catch (error) {
    console.error("Error adding mock incident:", error);
    return false;
  }
}
