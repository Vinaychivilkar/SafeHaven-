import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircleIcon, MapIcon, BellIcon } from "lucide-react";

export default function ReportSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate("/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-2" />
          <CardTitle className="text-2xl">Report Submitted!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            Thank you for helping keep your community safe.
          </p>
          <p className="text-sm text-muted-foreground">
            Your report has been received and will be reviewed shortly.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" onClick={() => navigate("/")}>
            <MapIcon className="h-4 w-4 mr-2" />
            Return to Map
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/feed")}
          >
            <BellIcon className="h-4 w-4 mr-2" />
            View Incident Feed
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
