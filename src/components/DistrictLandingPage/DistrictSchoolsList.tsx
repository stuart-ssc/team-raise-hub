import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DistrictSchoolsListProps {
  districtId: string;
  stateSlug: string;
}

const ITEMS_PER_PAGE = 24;

const DistrictSchoolsList = ({ districtId, stateSlug }: DistrictSchoolsListProps) => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const { data: schools, isLoading } = useQuery({
    queryKey: ['district-schools', districtId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, school_name, slug')
        .eq('school_district_id', districtId)
        .order('school_name');
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!schools || schools.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No schools found in this district.
      </p>
    );
  }

  const visibleSchools = schools.slice(0, visibleCount);
  const hasMore = visibleCount < schools.length;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visibleSchools.map((school) => (
          <Link
            key={school.id}
            to={`/schools/${stateSlug}/${school.slug}`}
            className="px-4 py-3 rounded-lg border border-border bg-background hover:bg-primary hover:border-primary transition-colors group"
          >
            <p className="text-sm font-medium text-foreground group-hover:text-white transition-colors line-clamp-2">
              {school.school_name}
            </p>
          </Link>
        ))}
      </div>
      
      {hasMore && (
        <div className="text-center mt-6">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
          >
            Load More Schools ({schools.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
};

export default DistrictSchoolsList;
