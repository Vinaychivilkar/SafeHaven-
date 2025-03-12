import { useState, useEffect } from "react";
import { getProfile, updateProfile, getIncidentsByUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  BellIcon,
  UserIcon,
  MapPinIcon,
  HistoryIcon,
  SettingsIcon,
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    id: user?.id || "",
    name: "",
    email: user?.email || "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserIncidents();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const profile = await getProfile(user.id);
      if (profile) {
        setProfileData({
          id: user.id,
          name: profile.name || "New User",
          email: profile.email,
          phone: profile.phone || "",
          address: profile.address || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    pushNotifications: true,
    nearbyIncidents: true,
    safetyUpdates: false,
    communityAlerts: true,
  });

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNotificationToggle = (field: string) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [field]: !prev[field as keyof typeof notificationSettings],
    }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const success = await updateProfile({
        id: user.id,
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
      });

      if (success) {
        setIsEditing(false);
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An error occurred while updating your profile.");
    }
  };

  const [reportedIncidents, setReportedIncidents] = useState([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);

  const fetchUserIncidents = async () => {
    if (!user) return;

    setIncidentsLoading(true);
    try {
      const incidents = await getIncidentsByUser(user.id);
      setReportedIncidents(
        incidents.map((incident) => ({
          id: incident.id,
          type: incident.type,
          date: new Date(incident.created_at).toLocaleDateString(),
          status:
            incident.status.charAt(0).toUpperCase() + incident.status.slice(1),
        })),
      );
    } catch (error) {
      console.error("Error fetching user incidents:", error);
    } finally {
      setIncidentsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <CardTitle className="mt-2">{profileData.name}</CardTitle>
              <CardDescription>{profileData.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{profileData.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HistoryIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Member since June 2023</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel Editing" : "Edit Profile"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex items-center gap-2"
              >
                <BellIcon className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <HistoryIcon className="h-4 w-4" />
                My Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) =>
                        handleProfileChange("name", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        handleProfileChange("email", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) =>
                        handleProfileChange("phone", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) =>
                        handleProfileChange("address", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
                {isEditing && (
                  <CardFooter>
                    <Button onClick={handleSaveProfile} className="w-full">
                      Save Changes
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BellIcon className="h-5 w-5" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-alerts">Email Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="email-alerts"
                      checked={notificationSettings.emailAlerts}
                      onCheckedChange={() =>
                        handleNotificationToggle("emailAlerts")
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications on your device
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={() =>
                        handleNotificationToggle("pushNotifications")
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="nearby-incidents">Nearby Incidents</Label>
                      <p className="text-sm text-muted-foreground">
                        Get alerts about incidents near your location
                      </p>
                    </div>
                    <Switch
                      id="nearby-incidents"
                      checked={notificationSettings.nearbyIncidents}
                      onCheckedChange={() =>
                        handleNotificationToggle("nearbyIncidents")
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="safety-updates">Safety Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly safety reports for your area
                      </p>
                    </div>
                    <Switch
                      id="safety-updates"
                      checked={notificationSettings.safetyUpdates}
                      onCheckedChange={() =>
                        handleNotificationToggle("safetyUpdates")
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="community-alerts">Community Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get alerts from community moderators
                      </p>
                    </div>
                    <Switch
                      id="community-alerts"
                      checked={notificationSettings.communityAlerts}
                      onCheckedChange={() =>
                        handleNotificationToggle("communityAlerts")
                      }
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Save Notification Settings</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HistoryIcon className="h-5 w-5" />
                    My Reported Incidents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {incidentsLoading ? (
                    <p className="text-center text-muted-foreground py-4">
                      Loading your incidents...
                    </p>
                  ) : reportedIncidents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      You haven't reported any incidents yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {reportedIncidents.map((incident) => (
                        <div
                          key={incident.id}
                          className="flex items-center justify-between border-b pb-3"
                        >
                          <div>
                            <p className="font-medium">{incident.type}</p>
                            <p className="text-sm text-muted-foreground">
                              Reported on {incident.date}
                            </p>
                          </div>
                          <div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                incident.status === "Verified"
                                  ? "bg-blue-100 text-blue-800"
                                  : incident.status === "Resolved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {incident.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View All Reports
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
