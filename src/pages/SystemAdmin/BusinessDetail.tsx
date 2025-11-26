import { useParams } from "react-router-dom";
import { SystemAdminPageLayout } from "@/components/SystemAdminPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BusinessDetail() {
  const { businessId } = useParams<{ businessId: string }>();

  return (
    <SystemAdminPageLayout title="Business Details" subtitle="Manage business partnership details">
      <Card>
        <CardHeader>
          <CardTitle>Business ID: {businessId}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Business detail page - full CRM functionality to be implemented
          </p>
        </CardContent>
      </Card>
    </SystemAdminPageLayout>
  );
}
