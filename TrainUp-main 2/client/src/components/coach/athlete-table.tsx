import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2, Search } from "lucide-react";

interface Athlete {
  id: number;
  firstName: string;
  lastName: string;
  teamPosition: string;
  role: string;
  profileImage?: string;
}

interface AthleteTableProps {
  athletes: Athlete[];
  isLoading: boolean;
}

export default function AthleteTable({ athletes, isLoading }: AthleteTableProps) {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  
  // Filter athletes based on search query
  const filteredAthletes = athletes.filter(athlete => {
    const fullName = `${athlete.firstName} ${athlete.lastName}`.toLowerCase();
    const position = athlete.teamPosition?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || position.includes(query);
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredAthletes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedAthletes = filteredAthletes.slice(startIndex, startIndex + itemsPerPage);
  
  // Mock readiness data - in a real app, this would come from API
  const getRandomReadiness = () => {
    // Generate random readiness scores
    const ranges = [
      { min: 85, max: 100, status: "Ready" },
      { min: 60, max: 84, status: "Moderate" },
      { min: 0, max: 59, status: "At Risk" },
    ];
    
    const rangeIndex = Math.floor(Math.random() * 10) < 7 ? 0 : (Math.floor(Math.random() * 10) < 7 ? 1 : 2);
    const range = ranges[rangeIndex];
    
    return {
      value: Math.floor(Math.random() * (range.max - range.min + 1)) + range.min,
      status: range.status
    };
  };
  
  // Mock last entry time - in a real app, this would come from API
  const getRandomLastEntry = () => {
    const options = [
      "Today, 9:30 AM",
      "Today, 7:20 AM",
      "Yesterday, 6:15 PM",
      "Yesterday, 8:45 AM"
    ];
    
    return options[Math.floor(Math.random() * options.length)];
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Athlete Status</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Athlete Status</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search athlete"
            className="pl-9 w-[250px]"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredAthletes.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Athlete</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Readiness</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Entry</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedAthletes.map((athlete) => {
                    const readiness = getRandomReadiness();
                    return (
                      <tr key={athlete.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar>
                              <AvatarImage 
                                src={athlete.profileImage || ""} 
                                alt={`${athlete.firstName} ${athlete.lastName}`} 
                              />
                              <AvatarFallback>
                                {athlete.firstName[0]}{athlete.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{athlete.firstName} {athlete.lastName}</div>
                              <div className="text-xs text-gray-500">{athlete.teamPosition}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                readiness.status === "Ready" 
                                  ? "bg-accent" 
                                  : readiness.status === "Moderate" 
                                  ? "bg-warning" 
                                  : "bg-destructive"
                              }`} 
                              style={{ width: `${readiness.value}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{readiness.value}%</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {getRandomLastEntry()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge 
                            variant={
                              readiness.status === "Ready" 
                                ? "success" 
                                : readiness.status === "Moderate" 
                                ? "warning" 
                                : "destructive"
                            }
                          >
                            {readiness.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <Button 
                            variant="link" 
                            onClick={() => navigate(`/coach/athlete-logs?id=${athlete.id}`)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Showing {Math.min(filteredAthletes.length, startIndex + 1)} to {Math.min(filteredAthletes.length, startIndex + itemsPerPage)} of {filteredAthletes.length} athletes
              </div>
              
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {[...Array(totalPages)].map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink
                          isActive={currentPage === index + 1}
                          onClick={() => setCurrentPage(index + 1)}
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No athletes found</p>
            {searchQuery && (
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search query
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
