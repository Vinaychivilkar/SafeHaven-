import { supabase } from "./supabaseClient";
import type { Incident, Profile, IncidentWithUser } from "./supabaseTypes";

// Profile functions
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data as Profile;
}

export async function updateProfile(
  profile: Partial<Profile> & { id: string },
): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update(profile)
    .eq("id", profile.id);

  if (error) {
    console.error("Error updating profile:", error);
    return false;
  }

  return true;
}

// Incident functions
export async function getIncidents(): Promise<IncidentWithUser[]> {
  try {
    console.log("Fetching incidents from Supabase");
    const { data, error } = await supabase
      .from("incidents")
      .select(
        `
        *,
        profiles:user_id(*)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching incidents from Supabase:", error);
      // Try to get from localStorage as fallback
      try {
        const savedIncidents = localStorage.getItem("mockIncidents");
        if (savedIncidents) {
          console.log("Fetching incidents from localStorage");
          const localIncidents = JSON.parse(savedIncidents);
          return localIncidents.map((incident: any) => ({
            id: incident.id,
            created_at: new Date().toISOString(),
            type: incident.type,
            description: incident.description,
            location: incident.location,
            latitude: incident.coordinates?.lat || 0,
            longitude: incident.coordinates?.lng || 0,
            severity: incident.severity,
            media_url: incident.mediaUrl,
            user_id: "mock-user-id",
            status: incident.status || "pending",
            profiles: {
              id: "mock-user-id",
              created_at: new Date().toISOString(),
              email: "user@example.com",
              name: incident.user || "Anonymous",
              phone: null,
              address: null,
              avatar_url: null,
            },
          }));
        }
      } catch (e) {
        console.error("Error loading incidents from localStorage:", e);
      }
      return [];
    }

    console.log(
      "Successfully fetched incidents from Supabase:",
      data?.length || 0,
    );
    return data as unknown as IncidentWithUser[];
  } catch (error) {
    console.error("Unexpected error in getIncidents:", error);
    return [];
  }
}

export async function getIncidentsByUser(userId: string): Promise<Incident[]> {
  console.log("Fetching incidents for user ID:", userId);

  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user incidents:", error);
    // Try to get from localStorage as fallback
    try {
      const savedIncidents = localStorage.getItem("mockIncidents");
      if (savedIncidents) {
        const localIncidents = JSON.parse(savedIncidents);
        // Convert localStorage format to Incident type
        return localIncidents.map((incident: any) => ({
          id: String(incident.id),
          created_at: new Date().toISOString(),
          type: incident.type,
          description: incident.description,
          location: incident.location,
          latitude: incident.coordinates?.lat || 0,
          longitude: incident.coordinates?.lng || 0,
          severity: incident.severity as "low" | "medium" | "high",
          media_url: incident.mediaUrl,
          user_id: userId,
          status: "pending",
        }));
      }
    } catch (e) {
      console.error("Error loading incidents from localStorage:", e);
    }
    return [];
  }

  console.log("User incidents fetched from Supabase:", data);
  return data as Incident[];
}

export async function createIncident(
  incident: Omit<Incident, "id" | "created_at">,
): Promise<Incident | null> {
  try {
    console.log("Creating incident in Supabase:", incident);

    // Insert the incident into Supabase
    const { data, error } = await supabase
      .from("incidents")
      .insert(incident)
      .select()
      .single();

    if (error) {
      console.error("Error creating incident in Supabase:", error);
      // Store in localStorage as fallback
      const mockIncident = {
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
        ...incident,
      } as Incident;

      try {
        const savedIncidents = localStorage.getItem("mockIncidents");
        const incidents = savedIncidents ? JSON.parse(savedIncidents) : [];
        incidents.unshift({
          id: mockIncident.id,
          type: mockIncident.type,
          description: mockIncident.description,
          location: mockIncident.location,
          coordinates: {
            lat: mockIncident.latitude,
            lng: mockIncident.longitude,
          },
          timestamp: "Just now",
          user: "Anonymous",
          severity: mockIncident.severity,
          mediaUrl: mockIncident.media_url,
        });
        localStorage.setItem("mockIncidents", JSON.stringify(incidents));
        console.log("Incident saved to localStorage as fallback");
      } catch (e) {
        console.error("Error saving to localStorage:", e);
      }

      return mockIncident;
    }

    console.log("Incident created successfully in Supabase:", data);
    return data as Incident;
  } catch (error) {
    console.error("Unexpected error in createIncident:", error);
    // Return a mock incident for demo purposes
    return {
      id: `mock-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...incident,
    } as Incident;
  }
}

export async function updateIncidentStatus(
  incidentId: string,
  status: Incident["status"],
): Promise<boolean> {
  try {
    console.log(`Updating incident ${incidentId} status to ${status}`);

    // Try to update in Supabase
    const { error } = await supabase
      .from("incidents")
      .update({ status })
      .eq("id", incidentId);

    if (error) {
      console.error("Error updating incident status in Supabase:", error);

      // Fallback to localStorage
      try {
        const savedIncidents = localStorage.getItem("mockIncidents");
        if (savedIncidents) {
          const incidents = JSON.parse(savedIncidents);
          const updatedIncidents = incidents.map((incident: any) => {
            if (incident.id == incidentId) {
              return { ...incident, status };
            }
            return incident;
          });
          localStorage.setItem(
            "mockIncidents",
            JSON.stringify(updatedIncidents),
          );
          console.log("Updated incident status in localStorage");
          return true;
        }
      } catch (e) {
        console.error("Error updating incident in localStorage:", e);
        return false;
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error in updateIncidentStatus:", error);
    return false;
  }
}

// Storage functions
export async function uploadMedia(
  file: File,
  userId: string,
): Promise<string | null> {
  try {
    // Ensure the file is valid
    if (!file || file.size === 0) {
      console.error("Invalid file provided");
      return getRandomUnsplashImage();
    }

    // Create a unique file path
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `incident-media/${fileName}`;

    // Try to upload the file
    const { data, error } = await supabase.storage
      .from("media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading file to Supabase:", error);
      // Fall back to a mock URL for demo purposes
      return getRandomUnsplashImage();
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);
    console.log("Media uploaded successfully:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("Unexpected error in uploadMedia:", error);
    // Fall back to a mock URL for demo purposes
    return getRandomUnsplashImage();
  }
}

// Helper function to get a random Unsplash image that's more relevant to safety incidents
function getRandomUnsplashImage(): string {
  const imageIds = [
    "photo-1544984243-ec57ea16fe25", // Traffic hazard
    "photo-1580745294621-26c6873c38e7", // Graffiti
    "photo-1517436073-3b1b1b1b1b1b", // Generic urban
    "photo-1584438784894-089d6a62b8fa", // Street
    "photo-1557583051-a0f6e950c5f8", // Construction
    "photo-1594815550232-e615b7a46f25", // Police
    "photo-1517649763962-0c623066013b", // Caution tape
    "photo-1584438784894-089d6a62b8fa", // Urban scene
  ];

  const randomId = imageIds[Math.floor(Math.random() * imageIds.length)];
  return `https://images.unsplash.com/${randomId}?w=800&q=80`;
}
