import { Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useSchoolUser } from "@/hooks/useSchoolUser";
import { useNavigate } from "react-router-dom";

const DashboardHeader = () => {
  const { signOut } = useAuth();
  const { schoolUser } = useSchoolUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-background px-6 py-4 flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <h1 id="school-name-title" className="text-3xl font-bold text-foreground">{schoolUser?.schools?.school_name || "School"}</h1>
        <div className="flex items-center gap-4 mb-3">
          <span className="text-muted-foreground">Teams/Groups:</span>
          <Badge variant="secondary">Football</Badge>
          <Badge variant="secondary">Softball (Fastpitch)</Badge>
        </div>
      </div>
      
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;