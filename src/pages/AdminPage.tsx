import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { getIncidents, updateIncidentStatus } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangleIcon,
  SearchIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  FilterIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Check if user is admin
  useEffect(() => {
    if (user && user.email !== "admin@gmail.com") {
      navigate("/");
    }
  }, [user, navigate]);

  // Load incidents
  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const data = await getIncidents();
      setIncidents(data);
    } catch (error) {
      console.error("Error loading incidents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyIncident = async (incidentId, status) => {
    try {
      await updateIncidentStatus(incidentId, status);
      // Refresh the list
      loadIncidents();
    } catch (error) {
      console.error(`Error ${status} incident:`, error);
    }
  };

  const handleDeleteIncident = async (incidentId) => {
    if (window.confirm("Are you sure you want to delete this incident?")) {
      try {
        // In a real app, this would call an API endpoint to delete the incident
        await updateIncidentStatus(incidentId, "deleted");
        // For now, just remove it from the local state
        setIncidents(
          incidents.filter((incident) => incident.id !== incidentId),
        );
      } catch (error) {
        console.error("Error deleting incident:", error);
      }
    }
  };

  // Filter incidents based on search term and filters
  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || incident.status === statusFilter;
    const matchesType =
      typeFilter === "all" || incident.type?.includes(typeFilter);

    return matchesSearch && matchesStatus && matchesType;
  });

  const getSeverityColor = (severity) => {
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

  const getStatusColor = (status) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800 border-green-200";
      case "resolved":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "deleted":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button size="sm" variant="outline" onClick={loadIncidents}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incident Management</CardTitle>
          <CardDescription>
            Review, verify, or delete reported incidents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <div className="w-40">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-40">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Suspicious">
                      Suspicious Activity
                    </SelectItem>
                    <SelectItem value="Traffic">Traffic Hazard</SelectItem>
                    <SelectItem value="Noise">Noise Complaint</SelectItem>
                    <SelectItem value="Property">Property Damage</SelectItem>
                    <SelectItem value="Theft">Theft</SelectItem>
                    <SelectItem value="Assault">Assault</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading incidents...</p>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              <p className="text-muted-foreground">No incidents found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIncidents.map((incident) => (
                <Card key={incident.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {incident.media_url && (
                      <div className="md:w-1/4 h-40 md:h-auto">
                        <img
                          src={incident.media_url}
                          alt="Incident"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1580745294621-26c6873c38e7?w=400&q=80";
                          }}
                        />
                      </div>
                    )}
                    <div
                      className={`flex-1 p-4 ${!incident.media_url ? "md:w-full" : ""}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <AlertTriangleIcon className="h-5 w-5" />
                            {incident.type}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Reported by{" "}
                            {incident.profiles?.name || incident.user_id}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            className={getSeverityColor(incident.severity)}
                          >
                            {incident.severity?.charAt(0).toUpperCase() +
                              incident.severity?.slice(1)}
                          </Badge>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status?.charAt(0).toUpperCase() +
                              incident.status?.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      <p className="mb-2">{incident.description}</p>

                      <div className="text-sm text-muted-foreground mb-4">
                        <p>Location: {incident.location}</p>
                        <p>
                          Reported:{" "}
                          {new Date(incident.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          onClick={() =>
                            handleVerifyIncident(incident.id, "verified")
                          }
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600"
                          onClick={() =>
                            handleVerifyIncident(incident.id, "resolved")
                          }
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDeleteIncident(incident.id)}
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredIncidents.length} of {incidents.length} incidents
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
