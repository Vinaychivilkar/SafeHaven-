export type Profile = {
  id: string;
  created_at: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
};

export type Incident = {
  id: string;
  created_at: string;
  type: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  severity: "low" | "medium" | "high";
  media_url: string | null;
  user_id: string;
  status: "pending" | "verified" | "resolved";
};

export type IncidentWithUser = Incident & {
  profiles: Profile;
};
