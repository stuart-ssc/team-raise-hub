import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, School, Building2, Loader2, Settings, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// US States for filter dropdown
const US_STATES = [
  "AK", "AL", "AR", "AZ", "CA", "CO", "CT", "DC", "DE", "FL",
  "GA", "HI", "IA", "ID", "IL", "IN", "KS", "KY", "LA", "MA",
  "MD", "ME", "MI", "MN", "MO", "MS", "MT", "NC", "ND", "NE",
  "NH", "NJ", "NM", "NV", "NY", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VA", "VT", "WA", "WI", "WV", "WY"
];

interface SchoolDistrictBrowserProps {
  onConfigurePage: (entity: {
    id: string;
    name: string;
    type: 'school' | 'district';
    city?: string;
    state?: string;
    hasConfig: boolean;
  }) => void;
}

const ITEMS_PER_PAGE = 10;

export function SchoolDistrictBrowser({ onConfigurePage }: SchoolDistrictBrowserProps) {
  const [entityType, setEntityType] = useState<'school' | 'district'>('school');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search query
  const debounceTimeout = useMemo(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 300);
    return timeout;
  }, [searchQuery]);

  // Cleanup timeout
  useMemo(() => {
    return () => clearTimeout(debounceTimeout);
  }, [debounceTimeout]);

  // Check if any filters are active
  const hasActiveFilters = stateFilter || debouncedQuery;

  // Fetch existing landing page configs to check which entities have configs
  const { data: existingConfigs } = useQuery({
    queryKey: ["landing-page-configs-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_page_configs")
        .select("entity_id, entity_type");
      if (error) throw error;
      
      const configMap = new Map<string, boolean>();
      data?.forEach(config => {
        configMap.set(`${config.entity_type}-${config.entity_id}`, true);
      });
      return configMap;
    },
  });

  // Fetch schools with server-side pagination
  const { data: schoolsData, isLoading: schoolsLoading } = useQuery({
    queryKey: ["schools-browser", stateFilter, debouncedQuery, currentPage],
    queryFn: async () => {
      if (!hasActiveFilters) return { data: [], count: 0 };
      
      let query = supabase
        .from("schools")
        .select("id, school_name, city, state, slug", { count: "exact" });
      
      if (stateFilter) {
        query = query.eq("state", stateFilter);
      }
      
      if (debouncedQuery) {
        query = query.or(`school_name.ilike.%${debouncedQuery}%,city.ilike.%${debouncedQuery}%`);
      }
      
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await query
        .order("school_name")
        .range(start, end);
      
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    enabled: entityType === 'school',
  });

  // Fetch districts with server-side pagination
  const { data: districtsData, isLoading: districtsLoading } = useQuery({
    queryKey: ["districts-browser", stateFilter, debouncedQuery, currentPage],
    queryFn: async () => {
      if (!hasActiveFilters) return { data: [], count: 0 };
      
      let query = supabase
        .from("school_districts")
        .select("id, name, state, slug", { count: "exact" });
      
      if (stateFilter) {
        query = query.eq("state", stateFilter);
      }
      
      if (debouncedQuery) {
        query = query.ilike("name", `%${debouncedQuery}%`);
      }
      
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await query
        .order("name")
        .range(start, end);
      
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    enabled: entityType === 'district',
  });

  const isLoading = entityType === 'school' ? schoolsLoading : districtsLoading;
  const data = entityType === 'school' ? schoolsData : districtsData;
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleEntityTypeChange = useCallback((value: 'school' | 'district') => {
    setEntityType(value);
    setCurrentPage(1);
  }, []);

  const handleStateChange = useCallback((value: string) => {
    setStateFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  }, []);

  const checkHasConfig = useCallback((entityId: string, type: 'school' | 'district') => {
    return existingConfigs?.has(`${type}-${entityId}`) || false;
  }, [existingConfigs]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {entityType === 'school' ? <School className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
          Browse Schools & Districts
        </CardTitle>
        <CardDescription>
          Search for schools or districts to configure their landing pages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={entityType} onValueChange={handleEntityTypeChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="school">
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4" />
                  Schools
                </div>
              </SelectItem>
              <SelectItem value="district">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Districts
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={stateFilter || 'all'} onValueChange={handleStateChange}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {US_STATES.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${entityType === 'school' ? 'schools' : 'districts'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Results */}
        {!hasActiveFilters ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a filter to begin</h3>
            <p className="text-muted-foreground">
              Choose a state or search by name to find {entityType === 'school' ? 'schools' : 'districts'}
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <School className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-2">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount.toLocaleString()} {entityType === 'school' ? 'schools' : 'districts'}
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    {entityType === 'school' && <TableHead>City</TableHead>}
                    <TableHead>State</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entityType === 'school' ? (
                    (data?.data as any[])?.map((school) => {
                      const hasConfig = checkHasConfig(school.id, 'school');
                      return (
                        <TableRow key={school.id}>
                          <TableCell className="font-medium">{school.school_name}</TableCell>
                          <TableCell>{school.city}</TableCell>
                          <TableCell>{school.state}</TableCell>
                          <TableCell>
                            {hasConfig ? (
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                <Check className="h-3 w-3 mr-1" />
                                Configured
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Configured</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={hasConfig ? "outline" : "default"}
                              onClick={() => onConfigurePage({
                                id: school.id,
                                name: school.school_name,
                                type: 'school',
                                city: school.city,
                                state: school.state,
                                hasConfig,
                              })}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              {hasConfig ? 'Edit' : 'Configure'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    (data?.data as any[])?.map((district) => {
                      const hasConfig = checkHasConfig(district.id, 'district');
                      return (
                        <TableRow key={district.id}>
                          <TableCell className="font-medium">{district.name}</TableCell>
                          <TableCell>{district.state}</TableCell>
                          <TableCell>
                            {hasConfig ? (
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                <Check className="h-3 w-3 mr-1" />
                                Configured
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Configured</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={hasConfig ? "outline" : "default"}
                              onClick={() => onConfigurePage({
                                id: district.id,
                                name: district.name,
                                type: 'district',
                                state: district.state,
                                hasConfig,
                              })}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              {hasConfig ? 'Edit' : 'Configure'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
