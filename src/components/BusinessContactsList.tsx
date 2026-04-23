import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LinkedContact {
  donor_id: string;
  role: string | null;
  is_primary_contact: boolean;
  blocked_at?: string | null;
  donor_profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
  };
}

interface BusinessContactsListProps {
  businessId: string;
  contacts: LinkedContact[];
  recommendedTarget?: 'business_entity' | 'primary_contact' | 'specific_contact';
  specificContactId?: string | null;
  compact?: boolean;
  showOutreachActions?: boolean;
}

export const BusinessContactsList = ({
  contacts,
  recommendedTarget,
  specificContactId,
  compact = false,
  showOutreachActions = false
}: BusinessContactsListProps) => {
  const navigate = useNavigate();
  
  const displayedContacts = compact ? contacts.slice(0, 3) : contacts;
  const remainingCount = compact ? Math.max(0, contacts.length - 3) : 0;

  const isRecommendedContact = (contactId: string) => {
    if (recommendedTarget === 'primary_contact') {
      return contacts.find(c => c.is_primary_contact)?.donor_id === contactId;
    }
    if (recommendedTarget === 'specific_contact') {
      return specificContactId === contactId;
    }
    return false;
  };

  if (contacts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No contacts linked to this business
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayedContacts.map((contact) => {
        const fullName = `${contact.donor_profiles.first_name || ''} ${contact.donor_profiles.last_name || ''}`.trim() || 'Unnamed Contact';
        const isRecommended = isRecommendedContact(contact.donor_id);
        const isDisengaged = !!contact.blocked_at;

        return (
          <div
            key={contact.donor_id}
            className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
              isRecommended
                ? 'bg-primary/10 border-2 border-primary'
                : isDisengaged
                ? 'bg-muted/30 hover:bg-muted/50 opacity-70'
                : 'bg-muted/50 hover:bg-muted'
            }`}
          >
            <div
              className="flex items-center gap-2 flex-1 cursor-pointer"
              onClick={() => navigate(`/dashboard/donors/${contact.donor_id}`)}
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{fullName}</span>
                  {contact.is_primary_contact && (
                    <Badge variant="secondary" className="text-xs">
                      Primary
                    </Badge>
                  )}
                  {isRecommended && (
                    <Badge variant="default" className="text-xs">
                      Recommended
                    </Badge>
                  )}
                  {isDisengaged && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Disengaged
                    </Badge>
                  )}
                </div>
                {contact.role && (
                  <p className="text-xs text-muted-foreground">{contact.role}</p>
                )}
              </div>
            </div>
            
            {showOutreachActions && !isDisengaged && (
              <div className="flex items-center gap-1">
                {contact.donor_profiles.email && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `mailto:${contact.donor_profiles.email}`;
                    }}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                )}
                {contact.donor_profiles.phone && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `tel:${contact.donor_profiles.phone}`;
                    }}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {remainingCount > 0 && (
        <p className="text-xs text-muted-foreground">
          +{remainingCount} more contact{remainingCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};