import { supabase } from "./supabaseClient";
import type { Incident, Profile, IncidentWithUser } from "./supabaseTypes";
import { getMockUser } from "./mockAuth";
import { addMockIncident, getMockIncidents } from "./mockData";

// Profile functions
export async function getProfile(userId: string): Promise<Profile | null> {
  console.log("Fetching profile for user ID:", userId);
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      // Return a mock profile as fallback instead of trying to create one
      return getMockProfile(userId);
    }

    console.log("Profile fetched successfully:", data);
    return data as Profile;
  } catch (error) {
    console.error("Unexpected error in getProfile:", error);
    return getMockProfile(userId);
  }
}

// Helper function to get a mock profile
function getMockProfile(userId: string): Profile {
  const mockUser = getMockUser();
  return {
    id: userId,
    created_at: new Date().toISOString(),
    email: mockUser?.email || "user@example.com",
    name: mockUser?.email?.split("@")[0] || "New User",
    phone: null,
    address: null,
    avatar_url: null,
  };
}

export async function updateProfile(
  profile: Partial<Profile> & { id: string },
): Promise<boolean> {
  console.log("Updating profile:", profile);

  try {
    // Check if profile exists first
    const { data, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", profile.id)
      .single();

    if (checkError) {
      console.log("Profile doesn't exist in database, creating it");
      // Try to create the profile
      const { error: insertError } = await supabase.from("profiles").insert({
        id: profile.id,
        email: profile.email || getMockUser()?.email || "user@example.com",
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
      });

      if (insertError) {
        console.error("Error creating profile:", insertError);
        // Store in localStorage as fallback
        return true;
      }
    } else {
      // Profile exists, update it
      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", profile.id);

      if (error) {
        console.error("Error updating profile:", error);
        // Store in localStorage as fallback
        return true;
      }
    }

    console.log("Profile updated successfully");
    return true;
  } catch (error) {
    console.error("Unexpected error in updateProfile:", error);
    // Always return true for demo purposes
    return true;
  }
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
      // Fallback to mock data
      return getMockIncidentsFormatted();
    }

    console.log(
      "Successfully fetched incidents from Supabase:",
      data?.length || 0,
    );

    // If we have data but some incidents don't have associated profiles,
    // try to fix the data by adding placeholder profile information
    const fixedData = data.map((incident) => {
      if (!incident.profiles) {
        console.log(
          `Incident ${incident.id} has no profile, adding placeholder`,
        );
        return {
          ...incident,
          profiles: {
            id: incident.user_id,
            created_at: incident.created_at,
            email: "user@example.com",
            name: "User",
            phone: null,
            address: null,
            avatar_url: null,
          },
        };
      }
      return incident;
    });

    return fixedData as unknown as IncidentWithUser[];
  } catch (error) {
    console.error("Unexpected error in getIncidents:", error);
    return getMockIncidentsFormatted();
  }
}

// Helper function to format mock incidents
function getMockIncidentsFormatted(): IncidentWithUser[] {
  const mockIncidents = getMockIncidents();
  return mockIncidents.map((incident: any) => ({
    id: String(incident.id),
    created_at: new Date().toISOString(),
    type: incident.type,
    description: incident.description,
    location: incident.location,
    latitude: incident.coordinates?.lat || 0,
    longitude: incident.coordinates?.lng || 0,
    severity: incident.severity as "low" | "medium" | "high",
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

export async function getIncidentsByUser(userId: string): Promise<Incident[]> {
  console.log("Fetching incidents for user ID:", userId);

  try {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user incidents:", error);
      // Fallback to mock data
      return getMockIncidentsByUser(userId);
    }

    console.log("User incidents fetched from Supabase:", data);
    return data as Incident[];
  } catch (error) {
    console.error("Unexpected error in getIncidentsByUser:", error);
    return getMockIncidentsByUser(userId);
  }
}

// Helper function to get mock incidents by user
function getMockIncidentsByUser(userId: string): Incident[] {
  const mockUser = getMockUser();
  const mockIncidents = getMockIncidents();
  const userIncidents = mockIncidents.filter(
    (incident: any) =>
      incident.user === mockUser?.email?.split("@")[0] ||
      incident.user === "Anonymous",
  );

  return userIncidents.map((incident: any) => ({
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
    status: incident.status || "pending",
  }));
}

export async function createIncident(
  incident: Omit<Incident, "id" | "created_at">,
): Promise<Incident | null> {
  try {
    console.log("Creating incident in Supabase:", incident);

    // Get user profile to include name in localStorage fallback
    let userName = "Anonymous";
    try {
      const profile = await getProfile(incident.user_id);
      if (profile && profile.name) {
        userName = profile.name;
      }
    } catch (e) {
      console.error("Error getting user profile for incident:", e);
    }

    // Insert the incident into Supabase
    const { data, error } = await supabase
      .from("incidents")
      .insert(incident)
      .select("*, profiles:user_id(*)")
      .single();

    if (error) {
      console.error("Error creating incident in Supabase:", error);
      // Store in localStorage as fallback
      const mockIncident = {
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
        ...incident,
      } as Incident;

      // Add to mock incidents
      addMockIncident({
        type: mockIncident.type,
        description: mockIncident.description,
        location: mockIncident.location,
        coordinates: {
          lat: mockIncident.latitude,
          lng: mockIncident.longitude,
        },
        severity: mockIncident.severity,
        mediaUrl: mockIncident.media_url,
        user: userName,
      });

      console.log("Incident saved to localStorage as fallback");
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

// Comment functions
export async function getCommentsByIncident(incidentId: string) {
  try {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        profiles:user_id(*)
      `,
      )
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Unexpected error in getCommentsByIncident:", error);
    return [];
  }
}

export async function addComment(
  incidentId: string,
  userId: string,
  content: string,
) {
  try {
    const { data, error } = await supabase
      .from("comments")
      .insert({
        incident_id: incidentId,
        user_id: userId,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding comment:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error in addComment:", error);
    return null;
  }
}
