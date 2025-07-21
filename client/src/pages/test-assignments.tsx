import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User, 
  Calendar, 
  BarChart, 
  Eye,
  ArrowLeft,
  Trophy,
  RefreshCw,
  Mail,
  DollarSign
} from "lucide-react";

const statusIcons = {
  assigned: <AlertCircle className="w-4 h-4 text-yellow-600" />,
  started: <Clock className="w-4 h-4 text-blue-600" />,
  completed: <CheckCircle className="w-4 h-4 text-green-600" />,
  expired: <XCircle className="w-4 h-4 text-red-600" />,
};

const statusColors = {
  assigned: "bg-yellow-100 text-yellow-800 border-yellow-200",
  started: "bg-blue-100 text-blue-800 border-blue-200", 
  completed: "bg-green-100 text-green-800 border-green-200",
  expired: "bg-red-100 text-red-800 border-red-200",
};

export default function TestAssignments() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // Fetch test assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["/api/recruiter/test-assignments"],
  });

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment: any) => {
    const matchesSearch = 
      assignment.jobSeeker?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.jobSeeker?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.jobSeeker?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.testTemplate?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group assignments by status
  const groupedAssignments = {
    assigned: filteredAssignments.filter((a: any) => a.status === 'assigned'),
    started: filteredAssignments.filter((a: any) => a.status === 'started'),
    completed: filteredAssignments.filter((a: any) => a.status === 'completed'),
    expired: filteredAssignments.filter((a: any) => a.status === 'expired'),
  };

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) return "text-green-600";
    if (score >= passingScore - 10) return "text-yellow-600";
    return "text-red-600";
  };

  const formatTimeSpent = (seconds: number) => {
    if (!seconds) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'completed' && new Date() > new Date(dueDate);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading test assignments...</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedAssignment) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedAssignment(null)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assignments
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Test Assignment Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedAssignment.testTemplate?.title} - {selectedAssignment.jobSeeker?.firstName} {selectedAssignment.jobSeeker?.lastName}
            </p>
          </div>
        </div>

        {/* Assignment Details */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Candidate Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Candidate Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {selectedAssignment.jobSeeker?.firstName?.[0]}{selectedAssignment.jobSeeker?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">
                    {selectedAssignment.jobSeeker?.firstName} {selectedAssignment.jobSeeker?.lastName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedAssignment.jobSeeker?.email}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {statusIcons[selectedAssignment.status as keyof typeof statusIcons]}
                    <Badge className={statusColors[selectedAssignment.status as keyof typeof statusColors]}>
                      {selectedAssignment.status.charAt(0).toUpperCase() + selectedAssignment.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Assigned Date</label>
                  <div className="text-sm mt-1">
                    {formatDate(selectedAssignment.assignedAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5" />
                Test Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-semibold">{selectedAssignment.testTemplate?.title}</div>
                <div className="text-sm text-gray-600">
                  {selectedAssignment.testTemplate?.description}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Duration</label>
                  <div className="text-sm mt-1 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedAssignment.testTemplate?.timeLimit} minutes
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Passing Score</label>
                  <div className="text-sm mt-1 flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    {selectedAssignment.testTemplate?.passingScore}%
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Due Date</label>
                <div className="text-sm mt-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(selectedAssignment.dueDate)}
                  {isOverdue(selectedAssignment.dueDate, selectedAssignment.status) && (
                    <Badge variant="destructive" className="ml-2">Overdue</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          {selectedAssignment.status === 'completed' && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(selectedAssignment.score, selectedAssignment.testTemplate?.passingScore)}`}>
                      {selectedAssignment.score}%
                    </div>
                    <div className="text-sm text-gray-600">Final Score</div>
                    <Progress 
                      value={selectedAssignment.score} 
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatTimeSpent(selectedAssignment.timeSpent)}
                    </div>
                    <div className="text-sm text-gray-600">Time Spent</div>
                    <div className="text-xs text-gray-500 mt-1">
                      out of {selectedAssignment.testTemplate?.timeLimit} minutes
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {selectedAssignment.score >= selectedAssignment.testTemplate?.passingScore ? (
                        <span className="text-green-600">PASSED</span>
                      ) : (
                        <span className="text-red-600">FAILED</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Result</div>
                    {selectedAssignment.retakeAllowed && (
                      <Badge variant="outline" className="mt-1">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Retake Available
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-sm text-gray-600 mb-2">Completed on:</div>
                  <div className="text-sm font-medium">
                    {formatDate(selectedAssignment.completedAt)}
                  </div>
                </div>

                {selectedAssignment.retakeCount > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">Retake Information</div>
                    <div className="text-sm text-blue-700">
                      This candidate has used {selectedAssignment.retakeCount} of {selectedAssignment.maxRetakes} allowed retakes.
                      {selectedAssignment.retakePaymentId && (
                        <span className="flex items-center gap-1 mt-1">
                          <DollarSign className="w-3 h-3" />
                          Payment verified for retake
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Test Progress */}
          {selectedAssignment.status === 'started' && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Test in Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="animate-pulse">
                    <Clock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Test Started</h3>
                  <p className="text-gray-600 mb-4">
                    The candidate started this test on {formatDate(selectedAssignment.startedAt)}
                  </p>
                  <div className="text-sm text-gray-500">
                    Please wait for the candidate to complete the test. You'll receive the results automatically.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Status */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Communication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notification</div>
                  <div className="text-sm text-gray-600">
                    {selectedAssignment.emailSent ? 
                      "Test assignment email sent successfully" :
                      "Email notification pending"
                    }
                  </div>
                </div>
                <Badge variant={selectedAssignment.emailSent ? "default" : "secondary"}>
                  {selectedAssignment.emailSent ? "Sent" : "Pending"}
                </Badge>
              </div>
              
              {selectedAssignment.remindersSent > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-sm text-gray-600">
                    {selectedAssignment.remindersSent} reminder email(s) sent
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart className="w-8 h-8 text-blue-600" />
            Test Assignments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor and manage test assignments for your candidates
          </p>
        </div>
        <Button
          onClick={() => setLocation("/recruiter/test-management")}
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Test Management
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{groupedAssignments.assigned.length}</div>
                <div className="text-sm text-gray-600">Assigned</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{groupedAssignments.started.length}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{groupedAssignments.completed.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{groupedAssignments.expired.length}</div>
                <div className="text-sm text-gray-600">Expired</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by candidate name, email, or test title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="started">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No test assignments found</h3>
            <p className="text-gray-600 mb-4">
              {assignments.length === 0 
                ? "You haven't assigned any tests yet. Start by creating and assigning tests to candidates."
                : "No assignments match your current filters. Try adjusting your search criteria."
              }
            </p>
            {assignments.length === 0 && (
              <Button onClick={() => setLocation("/recruiter/test-management")}>
                Create & Assign Tests
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment: any) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent 
                className="pt-6"
                onClick={() => setSelectedAssignment(assignment)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar>
                      <AvatarFallback>
                        {assignment.jobSeeker?.firstName?.[0]}{assignment.jobSeeker?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold">
                          {assignment.jobSeeker?.firstName} {assignment.jobSeeker?.lastName}
                        </div>
                        <Badge className={statusColors[assignment.status as keyof typeof statusColors]}>
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </Badge>
                        {isOverdue(assignment.dueDate, assignment.status) && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {assignment.testTemplate?.title}
                      </div>
                      
                      {assignment.jobPosting && (
                        <div className="text-sm text-blue-600 mt-1">
                          Applied to: {assignment.jobPosting.title}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {formatDate(assignment.dueDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {assignment.testTemplate?.timeLimit}min
                        </span>
                        {assignment.score !== null && (
                          <span className={`flex items-center gap-1 font-medium ${getScoreColor(assignment.score, assignment.testTemplate?.passingScore)}`}>
                            <Trophy className="w-3 h-3" />
                            {assignment.score}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}