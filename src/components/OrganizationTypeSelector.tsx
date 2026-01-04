import { Card, CardContent } from "@/components/ui/card";
import { Building2, Heart, Gift } from "lucide-react";

interface OrganizationTypeSelectorProps {
  onSelect: (type: 'school' | 'nonprofit' | 'donor') => void;
}

export const OrganizationTypeSelector = ({ onSelect }: OrganizationTypeSelectorProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Welcome to Sponsorly!</h2>
        <p className="text-muted-foreground">How would you like to get started?</p>
      </div>
      <div className="grid gap-4">
        <Card 
          className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
          onClick={() => onSelect('donor')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
              <Gift className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">I'm a Supporter</h3>
              <p className="text-sm text-muted-foreground">
                View my purchases, receipts, and messages from organizations I've supported
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or manage an organization
            </span>
          </div>
        </div>
        
        <Card 
          className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
          onClick={() => onSelect('school')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">School</h3>
              <p className="text-sm text-muted-foreground">
                K-12 schools, athletic programs, teams, clubs, and booster organizations
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
          onClick={() => onSelect('nonprofit')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
              <Heart className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Non-Profit</h3>
              <p className="text-sm text-muted-foreground">
                501(c)(3) organizations, charities, and community programs
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
