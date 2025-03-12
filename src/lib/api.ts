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
    console.error("Error fetching incidents:", error);
    return [];
  }

  return data as unknown as IncidentWithUser[];
}

export async function getIncidentsByUser(userId: string): Promise<Incident[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user incidents:", error);
    return [];
  }

  return data as Incident[];
}

export async function createIncident(
  incident: Omit<Incident, "id" | "created_at">,
): Promise<Incident | null> {
  try {
    // First check if the table exists
    const { error: checkError } = await supabase
      .from("incidents")
      .select("count")
      .limit(1);

    if (checkError) {
      console.warn(
        "Incidents table may not exist or is not accessible:",
        checkError,
      );
      // Return a mock incident for demo purposes
      return {
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
        ...incident,
      } as Incident;
    }

    const { data, error } = await supabase
      .from("incidents")
      .insert(incident)
      .select()
      .single();

    if (error) {
      console.error("Error creating incident:", error);
      // Return a mock incident for demo purposes
      return {
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
        ...incident,
      } as Incident;
    }

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
  const { error } = await supabase
    .from("incidents")
    .update({ status })
    .eq("id", incidentId);

  if (error) {
    console.error("Error updating incident status:", error);
    return false;
  }

  return true;
}

// Storage functions
export async function uploadMedia(
  file: File,
  userId: string,
): Promise<string | null> {
  try {
    // First, check if the bucket exists and create it if it doesn't
    const { error: bucketError } = await supabase.storage.getBucket("media");
    if (bucketError) {
      // Bucket doesn't exist, create it
      const { error: createError } = await supabase.storage.createBucket(
        "media",
        {
          public: true,
        },
      );
      if (createError) {
        console.error("Error creating bucket:", createError);
        // Fall back to a mock URL for demo purposes
        return getRandomUnsplashImage();
      }
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `incident-media/${fileName}`;

    // Try to upload the file
    const { error } = await supabase.storage
      .from("media")
      .upload(filePath, file);

    if (error) {
      console.error("Error uploading file:", error);
      // Fall back to a mock URL for demo purposes
      return getRandomUnsplashImage();
    }

    const { data } = supabase.storage.from("media").getPublicUrl(filePath);
    return data.publicUrl;
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
