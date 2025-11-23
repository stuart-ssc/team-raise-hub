import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

interface BreadcrumbSegment {
  label: string;
  path?: string;
}

interface DashboardBreadcrumbsProps {
  segments: BreadcrumbSegment[];
}

const DashboardBreadcrumbs = ({ segments }: DashboardBreadcrumbsProps) => {
  return (
    <div className="border-b bg-muted/50 px-6 py-2">
      <div className="max-w-7xl mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard" className="flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5" />
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3.5 w-3.5" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  {segment.path && index < segments.length - 1 ? (
                    <BreadcrumbLink asChild>
                      <Link to={segment.path}>{segment.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
};

export default DashboardBreadcrumbs;
