import { useState, useEffect } from "react";
import { MoreHorizontal, ChevronDown, ArrowLeft } from "lucide-react";
import { NewRosterForm } from "@/components/NewRosterForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolUser } from "@/hooks/useSchoolUser";

interface Roster {
  id: number;
  group_id: string;
  roster_year: number;
  current_roster: boolean;
  created_at: string;
}

interface Group {
  id: string;
  group_name: string;
  school_name: string;
  group_type_name: string;
  status: boolean;
}

interface RostersProps {
  selectedGroup: Group;
  onBack: () => void;
}

const Rosters = ({ selectedGroup, onBack }: RostersProps) => {
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRosterForm, setShowNewRosterForm] = useState(false);
  const { schoolUser } = useSchoolUser();

  const fetchRosters = async () => {
    if (!selectedGroup) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("rosters")
        .select("*")
        .eq("group_id", selectedGroup.id)
        .order("roster_year", { ascending: false });

      if (error) {
        console.error("Error fetching rosters:", error);
        return;
      }

      setRosters(data || []);
      
      // Extract unique years
      const years = [...new Set((data || []).map(roster => roster.roster_year))].sort((a, b) => b - a);
      setAvailableYears(years);
    } catch (error) {
      console.error("Error fetching rosters:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGroup) {
      fetchRosters();
    }
  }, [selectedGroup]);

  const handleSort = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortDirection("desc");
    }
  };

  // Apply filtering and sorting
  const filteredRosters = rosters.filter((roster) => {
    if (selectedYear === "all") return true;
    return roster.roster_year.toString() === selectedYear;
  });

  const sortedRosters = [...filteredRosters].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case "roster_year":
        aValue = a.roster_year;
        bValue = b.roster_year;
        break;
      case "current_roster":
        aValue = a.current_roster ? "Current" : "Past";
        bValue = b.current_roster ? "Current" : "Past";
        break;
      case "created_at":
      default:
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === "asc" ? comparison : -comparison;
    } else {
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === "asc" ? comparison : -comparison;
    }
  });

   return (
     <div id="rosters-table" className="space-y-4">
       <div className="flex items-center justify-between">
         <h2 className="text-xl font-semibold text-foreground">
           {selectedGroup.group_name} Roster
         </h2>
         
         <div className="flex items-center gap-3">
           {/* Year Filter */}
           <Select value={selectedYear} onValueChange={setSelectedYear}>
             <SelectTrigger className="w-32">
               <SelectValue placeholder="Year" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Years</SelectItem>
               {availableYears.map((year) => (
                 <SelectItem key={year} value={year.toString()}>
                   {year}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>

           {/* Sort Dropdown */}
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="outline" className="w-24">
                 Sort
                 <ChevronDown className="ml-2 h-4 w-4" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent>
               <DropdownMenuItem onClick={() => handleSort("roster_year")}>
                 Year {sortBy === "roster_year" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => handleSort("current_roster")}>
                 Status {sortBy === "current_roster" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => handleSort("created_at")}>
                 Created {sortBy === "created_at" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>

            {/* New Button */}
             <Button 
               className="bg-primary text-primary-foreground hover:bg-primary/90"
               onClick={() => setShowNewRosterForm(true)}
             >
               New Roster
             </Button>
         </div>
       </div>

       {/* Rosters Table */}
       <Card>
         <CardContent className="p-0">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead className="flex items-center gap-2">
                   Roster Year
                   <ChevronDown className="h-4 w-4" />
                 </TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead>Created Date</TableHead>
                 <TableHead>Manage Players</TableHead>
                 <TableHead className="w-12"></TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {loading ? (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-4">
                     Loading...
                   </TableCell>
                 </TableRow>
               ) : rosters.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                     No rosters found
                   </TableCell>
                 </TableRow>
               ) : (
                 sortedRosters.map((roster) => (
                   <TableRow key={roster.id}>
                     <TableCell className="font-medium">{roster.roster_year}</TableCell>
                     <TableCell>
                       <span className={roster.current_roster ? "text-green-600" : "text-muted-foreground"}>
                         {roster.current_roster ? "Current" : "Past"}
                       </span>
                     </TableCell>
                     <TableCell>
                       {new Date(roster.created_at).toLocaleDateString()}
                     </TableCell>
                     <TableCell>
                       <Button variant="default" size="sm">
                         Manage
                       </Button>
                     </TableCell>
                     <TableCell>
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="sm">
                             <MoreHorizontal className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuItem>Edit</DropdownMenuItem>
                           <DropdownMenuItem>
                             {roster.current_roster ? "Archive" : "Make Current"}
                           </DropdownMenuItem>
                           <DropdownMenuItem className="text-red-600">
                             Delete
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </CardContent>
        </Card>
        
         <div className="mt-4">
           <Button variant="ghost" size="sm" onClick={onBack} className="text-xs">
             <ArrowLeft className="h-3 w-3 mr-1" />
             Back to Groups
           </Button>
         </div>

         <NewRosterForm
           open={showNewRosterForm}
           onOpenChange={setShowNewRosterForm}
           onSubmit={(data) => {
             console.log("New roster data:", data);
             // TODO: Implement roster creation logic
           }}
         />
       </div>
    );
};

export default Rosters;