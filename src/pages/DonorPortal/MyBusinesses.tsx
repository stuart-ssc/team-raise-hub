import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DonorPortalLayout } from "@/components/DonorPortal/DonorPortalLayout";
import { useDonorPortal } from "@/hooks/useDonorPortal";
import { Building2, Edit, Star, ArrowRight, FolderOpen } from "lucide-react";

export default function DonorPortalMyBusinesses() {
  const { linkedBusinesses, isLoading } = useDonorPortal();

  if (isLoading) {
    return (
      <DonorPortalLayout title="My Businesses">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DonorPortalLayout>
    );
  }

  return (
    <DonorPortalLayout 
      title="My Businesses" 
      subtitle="Manage business information for your sponsorship purchases"
    >
      <div className="space-y-6">
        {linkedBusinesses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Linked Businesses</h3>
              <p className="text-muted-foreground mb-4">
                When you make a business sponsorship purchase, your business will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linkedBusinesses.map((link) => (
              <Card key={link.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={link.business.logo_url || undefined} />
                    <AvatarFallback>
                      <Building2 className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{link.business.business_name}</CardTitle>
                    <CardDescription>
                      {link.business.business_email || 'No email on file'}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {link.is_primary_contact && (
                      <Badge variant="default" className="bg-primary">
                        <Star className="h-3 w-3 mr-1" />
                        Primary Contact
                      </Badge>
                    )}
                    {link.role && (
                      <Badge variant="secondary">{link.role}</Badge>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/portal/businesses/${link.business_id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Info
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/portal/businesses/${link.business_id}/assets`}>
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Asset Library
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/portal/businesses/${link.business_id}/campaigns`}>
                        Campaigns
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Section */}
        <Card className="bg-muted/50">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Managing Business Information</h4>
                <p className="text-sm text-muted-foreground">
                  As a business representative, you can update your company information, upload logos, 
                  and manage campaign-specific assets. Each campaign may require different files or information 
                  for your sponsorship.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DonorPortalLayout>
  );
}
