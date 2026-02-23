import { ChevronDown, Users, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrganizationUser, OrganizationUser } from "@/hooks/useOrganizationUser";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getRoleLabel(role: OrganizationUser): string {
  return role.user_type?.name || "Member";
}

function getGroupLabel(role: OrganizationUser): string {
  return role.groups?.group_name || role.organization?.name || "";
}

function isParentRole(role: OrganizationUser): boolean {
  return role.linked_organization_user_id !== null;
}

interface RoleSwitcherProps {
  compact?: boolean;
  onSelect?: () => void;
}

const RoleSwitcher = ({ compact = false, onSelect }: RoleSwitcherProps) => {
  const { organizationUser, allRoles, switchRole } = useOrganizationUser();
  const navigate = useNavigate();

  if (allRoles.length < 2 || !organizationUser) return null;

  const handleSwitch = (role: OrganizationUser) => {
    switchRole(role.id);
    onSelect?.();
    if (isParentRole(role)) {
      navigate("/dashboard/family");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors outline-none">
        <Shield className="h-4 w-4 flex-shrink-0" />
        <div className={`flex-1 text-left ${compact ? "" : "min-w-0"}`}>
          <div className="truncate text-xs font-semibold">
            {getRoleLabel(organizationUser)}
          </div>
          {!compact && (
            <div className="truncate text-[11px] opacity-70">
              {getGroupLabel(organizationUser)}
            </div>
          )}
        </div>
        <ChevronDown className="h-3 w-3 flex-shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 bg-popover z-50"
      >
        {allRoles.map((role) => (
          <DropdownMenuItem
            key={role.id}
            onClick={() => handleSwitch(role)}
            className={role.id === organizationUser.id ? "bg-accent" : ""}
          >
            <div className="flex items-center gap-2 min-w-0">
              {isParentRole(role) ? (
                <Users className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Shield className="h-4 w-4 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {getRoleLabel(role)}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {getGroupLabel(role)}
                </div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RoleSwitcher;
