import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserType {
  id: string;
  name: string;
}

interface Roster {
  id: number;
  roster_year: number;
  current_roster: boolean;
}

interface AddParticipantFormProps {
  groupId: string;
  groupName: string;
  groupTypeName: string;
  organizationType: 'school' | 'nonprofit';
  organizationId: string;
  rosters: Roster[];
  onBack: () => void;
  onSuccess: () => void;
}

export const AddParticipantForm = ({ groupId, groupName, groupTypeName, organizationType, organizationId, rosters, onBack, onSuccess }: AddParticipantFormProps) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("");
  const [selectedRoster, setSelectedRoster] = useState("");
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);

  const currentRoster = rosters.find(r => r.current_roster);

  useEffect(() => {
    // Set default roster to current roster
    if (currentRoster) {
      setSelectedRoster(currentRoster.id.toString());
    }

    // Fetch user types based on organization type and group type
    const fetchUserTypes = async () => {
      // Determine which user types to fetch based on organization and group type
      let allowedUserTypes: string[] = [];
      
      if (organizationType === 'nonprofit') {
        // Non-profit programs show non-profit roles
        allowedUserTypes = ['Executive Director', 'Board Member', 'Program Director', 'Volunteer'];
      } else if (groupTypeName === 'Sports Team') {
        // School sports teams
        allowedUserTypes = ['Coach', 'Booster Leader', 'Team Player', 'Family Member'];
      } else {
        // School clubs and PTOs
        allowedUserTypes = ['Club Sponsor', 'Club Participant', 'Family Member'];
      }
      
      const { data, error } = await supabase
        .from("user_type")
        .select("id, name")
        .in("name", allowedUserTypes)
        .order("name");

      if (!error && data) {
        setUserTypes(data);
      }
    };

    fetchUserTypes();
  }, [currentRoster]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !selectedUserType || !selectedRoster) {
      return;
    }

    setLoading(true);

    try {
      let userId: string;

      // Use edge function to create user without affecting current session
      const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-user', {
        body: {
          email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          userTypeId: selectedUserType,
          organizationId,
          groupId,
          rosterId: parseInt(selectedRoster)
        }
      });

      if (inviteError) {
        console.error("Error inviting user:", inviteError);
        return;
      }

      if (!inviteData?.success) {
        console.error("Failed to create user invitation");
        return;
      }

      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setSelectedUserType("");
      setSelectedRoster(currentRoster?.id.toString() || "");
      
      onSuccess();
    } catch (error) {
      console.error("Error adding participant:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">

      <Card>
        <CardHeader>
          <CardTitle>Participant Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first-name">First Name *</Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last-name">Last Name *</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="user-type">User Type *</Label>
              <Select value={selectedUserType} onValueChange={setSelectedUserType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  {userTypes.map((userType) => (
                    <SelectItem key={userType.id} value={userType.id}>
                      {userType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="roster">Roster *</Label>
              <Select value={selectedRoster} onValueChange={setSelectedRoster} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select roster" />
                </SelectTrigger>
                <SelectContent>
                  {rosters.map((roster) => (
                    <SelectItem key={roster.id} value={roster.id.toString()}>
                      {roster.roster_year} {roster.current_roster ? "(Current)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Participant"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to {groupName} Roster
      </Button>
    </div>
  );
};