import { Card, CardContent } from "@/components/ui/card";
import { Building2, Heart } from "lucide-react";

interface OrganizationTypeSelectorProps {
  onSelect: (type: 'school' | 'nonprofit') => void;
}

export const OrganizationTypeSelector = ({ onSelect }: OrganizationTypeSelectorProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Welcome to Sponsorly!</h2>
        <p className="text-muted-foreground">What type of organization are you with?</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
          onClick={() => onSelect('school')}
        >
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">School</h3>
            <p className="text-sm text-muted-foreground">
              K-12 schools, athletic programs, teams, clubs, and booster organizations
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
          onClick={() => onSelect('nonprofit')}
        >
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Non-Profit</h3>
            <p className="text-sm text-muted-foreground">
              501(c)(3) organizations, charities, and community programs
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
