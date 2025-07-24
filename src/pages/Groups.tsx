import { useState } from "react";
import { MoreHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";

const mockGroups = [
  {
    id: 1,
    name: "Track and Field",
    school: "Tates Creek High School",
    type: "PTO",
    status: "Inactive",
  },
  {
    id: 2,
    name: "Softball (Fastpitch)",
    school: "Tates Creek High School",
    type: "Sport",
    status: "Inactive",
  },
  {
    id: 3,
    name: "Mens Lacross",
    school: "Tates Creek High School",
    type: "Sport",
    status: "Inactive",
  },
  {
    id: 4,
    name: "Lacrosse",
    school: "Tates Creek High School",
    type: "Club",
    status: "Inactive",
  },
  {
    id: 5,
    name: "Football",
    school: "Tates Creek High School",
    type: "Sport",
    status: "Inactive",
  },
  {
    id: 6,
    name: "Baseball",
    school: "Tates Creek High School",
    type: "Sport",
    status: "Inactive",
  },
];

const Groups = () => {
  const [sortBy, setSortBy] = useState("name");
  const [filterBy, setFilterBy] = useState("all");

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">

            {/* Groups Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Groups</h2>
                
                <div className="flex items-center gap-3">
                  {/* Sort Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-24">
                        Sort
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSortBy("name")}>
                        Name
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("type")}>
                        Type
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("status")}>
                        Status
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Filter Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-24">
                        Filter
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setFilterBy("all")}>
                        All
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterBy("active")}>
                        Active
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterBy("inactive")}>
                        Inactive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* New Button */}
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    New
                  </Button>
                </div>
              </div>

              {/* Groups Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="flex items-center gap-2">
                          Group Name
                          <ChevronDown className="h-4 w-4" />
                        </TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Group Type</TableHead>
                        <TableHead>Manage Roster</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockGroups.map((group) => (
                        <TableRow key={group.id}>
                          <TableCell className="font-medium">{group.name}</TableCell>
                          <TableCell>{group.school}</TableCell>
                          <TableCell>{group.type}</TableCell>
                          <TableCell>
                            <Button variant="default" size="sm">
                              Manage
                            </Button>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">{group.status}</span>
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
                                <DropdownMenuItem>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Groups;