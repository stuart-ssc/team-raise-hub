import { useCampaignSponsors, CampaignSponsor } from "@/hooks/useCampaignSponsors";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

interface SponsorRecognitionDisplayProps {
  campaignId: string;
  variant?: "grid" | "carousel" | "inline" | "banner";
  size?: "sm" | "md" | "lg";
  showNames?: boolean;
  maxDisplay?: number;
  title?: string;
  linkToWebsite?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: { logo: "h-10 w-10", text: "text-xs" },
  md: { logo: "h-16 w-16", text: "text-sm" },
  lg: { logo: "h-24 w-24", text: "text-base" },
};

function SponsorLogo({
  sponsor,
  size,
  showName,
  linkToWebsite,
}: {
  sponsor: CampaignSponsor;
  size: "sm" | "md" | "lg";
  showName: boolean;
  linkToWebsite: boolean;
}) {
  const sizeClass = sizeClasses[size];
  const initials = sponsor.businessName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const content = (
    <div className="flex flex-col items-center gap-2">
      <Avatar className={cn(sizeClass.logo, "border border-border bg-muted")}>
        <AvatarImage
          src={sponsor.displayLogo || undefined}
          alt={sponsor.businessName}
          className="object-contain p-1"
        />
        <AvatarFallback className="bg-muted text-muted-foreground">
          {sponsor.displayLogo ? (
            initials
          ) : (
            <Building2 className={size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8"} />
          )}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <span className={cn(sizeClass.text, "text-center text-muted-foreground font-medium max-w-[100px] truncate")}>
          {sponsor.businessName}
        </span>
      )}
    </div>
  );

  if (linkToWebsite && sponsor.websiteUrl) {
    return (
      <a
        href={sponsor.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
      >
        {content}
      </a>
    );
  }

  return content;
}

function GridVariant({
  sponsors,
  size,
  showNames,
  linkToWebsite,
}: {
  sponsors: CampaignSponsor[];
  size: "sm" | "md" | "lg";
  showNames: boolean;
  linkToWebsite: boolean;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
      {sponsors.map((sponsor) => (
        <SponsorLogo
          key={sponsor.id}
          sponsor={sponsor}
          size={size}
          showName={showNames}
          linkToWebsite={linkToWebsite}
        />
      ))}
    </div>
  );
}

function CarouselVariant({
  sponsors,
  size,
  showNames,
  linkToWebsite,
}: {
  sponsors: CampaignSponsor[];
  size: "sm" | "md" | "lg";
  showNames: boolean;
  linkToWebsite: boolean;
}) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-6 min-w-max px-2">
        {sponsors.map((sponsor) => (
          <SponsorLogo
            key={sponsor.id}
            sponsor={sponsor}
            size={size}
            showName={showNames}
            linkToWebsite={linkToWebsite}
          />
        ))}
      </div>
    </div>
  );
}

function InlineVariant({
  sponsors,
  size,
  linkToWebsite,
}: {
  sponsors: CampaignSponsor[];
  size: "sm" | "md" | "lg";
  linkToWebsite: boolean;
}) {
  const sizeClass = sizeClasses[size];

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <span className="text-sm text-muted-foreground">Sponsored by:</span>
      <div className="flex items-center gap-3">
        {sponsors.map((sponsor) => {
          const initials = sponsor.businessName
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          const logo = (
            <Avatar
              key={sponsor.id}
              className={cn(sizeClass.logo, "border border-border bg-muted")}
              title={sponsor.businessName}
            >
              <AvatarImage
                src={sponsor.displayLogo || undefined}
                alt={sponsor.businessName}
                className="object-contain p-1"
              />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          );

          if (linkToWebsite && sponsor.websiteUrl) {
            return (
              <a
                key={sponsor.id}
                href={sponsor.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                {logo}
              </a>
            );
          }

          return logo;
        })}
      </div>
    </div>
  );
}

function BannerVariant({
  sponsors,
  linkToWebsite,
}: {
  sponsors: CampaignSponsor[];
  linkToWebsite: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sponsors.map((sponsor) => {
        const initials = sponsor.businessName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        const content = (
          <div
            key={sponsor.id}
            className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card"
          >
            <Avatar className="h-16 w-16 border border-border bg-muted">
              <AvatarImage
                src={sponsor.displayLogo || undefined}
                alt={sponsor.businessName}
                className="object-contain p-1"
              />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {sponsor.businessName}
              </p>
              {sponsor.websiteUrl && (
                <p className="text-sm text-muted-foreground truncate">
                  {sponsor.websiteUrl.replace(/^https?:\/\//, "")}
                </p>
              )}
            </div>
          </div>
        );

        if (linkToWebsite && sponsor.websiteUrl) {
          return (
            <a
              key={sponsor.id}
              href={sponsor.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-90 transition-opacity"
            >
              {content}
            </a>
          );
        }

        return content;
      })}
    </div>
  );
}

function LoadingSkeleton({ variant, count = 4 }: { variant: string; count?: number }) {
  if (variant === "inline") {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-3">
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function SponsorRecognitionDisplay({
  campaignId,
  variant = "grid",
  size = "md",
  showNames = true,
  maxDisplay,
  title = "Our Sponsors",
  linkToWebsite = false,
  className,
}: SponsorRecognitionDisplayProps) {
  const { data: sponsors, isLoading } = useCampaignSponsors(campaignId);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
        <LoadingSkeleton variant={variant} />
      </div>
    );
  }

  if (!sponsors || sponsors.length === 0) {
    return null; // Don't show section if no sponsors
  }

  const displayedSponsors = maxDisplay ? sponsors.slice(0, maxDisplay) : sponsors;

  return (
    <div className={cn("space-y-4", className)}>
      {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
      
      {variant === "grid" && (
        <GridVariant
          sponsors={displayedSponsors}
          size={size}
          showNames={showNames}
          linkToWebsite={linkToWebsite}
        />
      )}
      
      {variant === "carousel" && (
        <CarouselVariant
          sponsors={displayedSponsors}
          size={size}
          showNames={showNames}
          linkToWebsite={linkToWebsite}
        />
      )}
      
      {variant === "inline" && (
        <InlineVariant
          sponsors={displayedSponsors}
          size={size}
          linkToWebsite={linkToWebsite}
        />
      )}
      
      {variant === "banner" && (
        <BannerVariant
          sponsors={displayedSponsors}
          linkToWebsite={linkToWebsite}
        />
      )}
    </div>
  );
}
