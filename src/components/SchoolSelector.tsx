import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

interface School {
  id: string;
  school_name: string;
  city: string;
  state: string;
}

interface SchoolSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SchoolSelector({ value, onChange, placeholder = "Search schools..." }: SchoolSelectorProps) {
  const [open, setOpen] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchSchools = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSchools([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('id, school_name, city, state')
          .ilike('school_name', `%${searchTerm}%`)
          .limit(50)
          .order('school_name');

        if (error) throw error;
        setSchools(data || []);
      } catch (error) {
        console.error('Error fetching schools:', error);
        setSchools([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSchools, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const selectedSchool = schools.find(school => 
    `${school.school_name} (${school.city}, ${school.state})` === value
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background text-left font-normal"
        >
          {value ? value : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-50 bg-popover" align="start">
        <Command className="bg-popover">
          <CommandInput 
            placeholder="Type to search schools..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList className="max-h-[200px]">
            <CommandEmpty>
              {loading ? "Searching..." : searchTerm.length < 2 ? "Type at least 2 characters to search" : "No schools found."}
            </CommandEmpty>
            <CommandGroup>
              {schools.map((school) => {
                const displayValue = `${school.school_name} (${school.city}, ${school.state})`;
                return (
                  <CommandItem
                    key={school.id}
                    value={displayValue}
                    onSelect={() => {
                      onChange(displayValue);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === displayValue ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {displayValue}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}