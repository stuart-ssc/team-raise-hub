import { Bell, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
const Dashboard = () => {
  const {
    signOut,
    user
  } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };
  // Mock data for campaigns
  const campaigns = [{
    name: "VIP Dance 2",
    schoolGroup: "Tates Creek High School - Lacrosse",
    goal: "$9,876",
    startDate: "7/28/25",
    endDate: "7/30/25",
    status: "Inactive"
  }, {
    name: "VIP Dance 1",
    schoolGroup: "Tates Creek High School - Football",
    goal: "$5,432",
    startDate: "7/27/25",
    endDate: "8/02/25",
    status: "Inactive"
  }, {
    name: "Test Sponsor-u",
    schoolGroup: "Tates Creek High School - Baseball",
    goal: "$11,000",
    startDate: "7/06/25",
    endDate: "7/24/25",
    status: "Active"
  }, {
    name: "test dance",
    schoolGroup: "Tates Creek High School - Men's Lacrosse",
    goal: "$12,345",
    startDate: "7/29/25",
    endDate: "7/31/25",
    status: "Inactive"
  }];

  // Mock data for donors
  const donors = [{
    name: "Jeff Conner",
    email: "jconner@testemail.com",
    title: "jconner@testemail.com",
    role: "Standard"
  }, {
    name: "Emma Perez",
    email: "eperez@testemail.com",
    title: "eperez@testemail.com",
    role: "Standard"
  }, {
    name: "Raj Mishra",
    email: "rmishra@testemail.com",
    title: "rmishra@testemail.com",
    role: "Standard"
  }];
  return <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b bg-background px-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 id="school-name-title" className="text-3xl font-bold text-foreground">Tates Creek High School</h1>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">Teams/Groups:</span>
              <Badge variant="secondary">Football</Badge>
              <Badge variant="secondary">Softball (Fastpitch)</Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
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

        {/* Main Content */}
        <main className="flex-1 p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">14</div>
                <div className="text-muted-foreground">Active Campaigns</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">$25K</div>
                <div className="text-muted-foreground">Amount Raised</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">1,250</div>
                <div className="text-muted-foreground">2025 Donors</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">$15K</div>
                <div className="text-muted-foreground">Left to Raise</div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Campaigns</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Sort</Button>
                <Button variant="outline" size="sm">Filter</Button>
                <Button size="sm">New</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>School Group</TableHead>
                    <TableHead>Amount Raised</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign, index) => <TableRow key={index}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">{campaign.schoolGroup.split(' - ')[0]}</div>
                        <div className="text-xs text-muted-foreground">{campaign.schoolGroup.split(' - ')[1]}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">Goal: {campaign.goal}</div>
                      </TableCell>
                      <TableCell>{campaign.startDate}</TableCell>
                      <TableCell>{campaign.endDate}</TableCell>
                      <TableCell>
                        <Badge variant={campaign.status === "Active" ? "default" : "secondary"}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">⋮</Button>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Donors Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Donors</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">6 results</span>
                <Button variant="outline" size="sm">Sort</Button>
                <Button variant="outline" size="sm">Filter</Button>
                <Button size="sm">New</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donors.map((donor, index) => <TableRow key={index}>
                      <TableCell className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback>{donor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{donor.name}</span>
                      </TableCell>
                      <TableCell>{donor.email}</TableCell>
                      <TableCell>{donor.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{donor.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">⋮</Button>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>;
};
export default Dashboard;