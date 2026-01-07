import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LinkedChild {
  organizationUserId: string;
  firstName: string;
  lastName: string;
  groupName: string | null;
  organizationName: string;
}

interface MyConnectedStudentsCardProps {
  userId: string;
}

export default function MyConnectedStudentsCard({ userId }: MyConnectedStudentsCardProps) {
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinkedChildren();
  }, [userId]);

  const fetchLinkedChildren = async () => {
    try {
      // Get parent's organization_user records that have linked_organization_user_id
      const { data: parentLinks, error: parentError } = await supabase
        .from('organization_user')
        .select(`
          id,
          linked_organization_user_id,
          organization_id
        `)
        .eq('user_id', userId)
        .eq('active_user', true)
        .not('linked_organization_user_id', 'is', null);

      if (parentError) throw parentError;

      if (!parentLinks || parentLinks.length === 0) {
        setChildren([]);
        setLoading(false);
        return;
      }

      // Get the children's organization_user records
      const childOrgUserIds = parentLinks.map(p => p.linked_organization_user_id).filter(Boolean) as string[];
      
      const { data: childOrgUsers, error: childError } = await supabase
        .from('organization_user')
        .select(`
          id,
          user_id,
          group_id,
          organization_id,
          groups:groups(group_name),
          organization:organizations(name)
        `)
        .in('id', childOrgUserIds)
        .eq('active_user', true);

      if (childError) throw childError;

      if (!childOrgUsers || childOrgUsers.length === 0) {
        setChildren([]);
        setLoading(false);
        return;
      }

      // Get profiles for the children
      const childUserIds = childOrgUsers.map(c => c.user_id).filter(Boolean) as string[];
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', childUserIds);

      if (profileError) throw profileError;

      // Map children with their profile info
      const linkedChildren: LinkedChild[] = childOrgUsers.map(child => {
        const profile = profiles?.find(p => p.id === child.user_id);
        return {
          organizationUserId: child.id,
          firstName: profile?.first_name || 'Unknown',
          lastName: profile?.last_name || '',
          groupName: (child.groups as any)?.group_name || null,
          organizationName: (child.organization as any)?.name || 'Unknown Organization',
        };
      });

      setChildren(linkedChildren);
    } catch (error) {
      console.error('Error fetching linked children:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (children.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          My Connected Students
        </CardTitle>
        <CardDescription>
          You're tracking fundraising progress for these students
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {children.map((child) => (
            <div
              key={child.organizationUserId}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div>
                <p className="font-medium">
                  {child.firstName} {child.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {child.organizationName}
                </p>
              </div>
              {child.groupName && (
                <Badge variant="secondary">{child.groupName}</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
