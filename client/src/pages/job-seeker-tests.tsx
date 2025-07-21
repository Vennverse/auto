import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  Trophy, 
  PlayCircle, 
  FileText,
  RefreshCw,
  Building,
  AlertTriangle,
  TrendingUp
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

export default function JobSeekerTests() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch test assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["/api/jobseeker/test-assignments"],
  });

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment: any) => {
    const matchesSearch = 
      assignment.testTemplate?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.recruiter?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.recruiter?.firstName?.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) return "text-green-600";
    if (score >= passingScore - 10) return "text-yellow-600";
    return "text-red-600";
  };

  const getActionButton = (assignment: any) => {
    const isExpired = isOverdue(assignment.dueDate, assignment.status);
    const passingScore = assignment.testTemplate?.passingScore || 70;
    const hasFailed = assignment.status === 'completed' && assignment.score < passingScore;
    
    if (assignment.status === 'completed') {
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation(`/test/${assignment.id}`)}
          >
            <FileText className="w-4 h-4 mr-2" />
            View Results
          </Button>
          
          {/* Show retake option for failed tests */}
          {hasFailed && !assignment.retakeAllowed && (
            <Button
              size="sm"
              onClick={() => setLocation(`/test/${assignment.id}/retake-payment`)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retake $5
            </Button>
          )}
          
          {assignment.retakeAllowed && (
            <Button
              size="sm"
              onClick={() => setLocation(`/test/${assignment.id}`)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Retake
            </Button>
          )}
        </div>
      );
    }
    
    if (isExpired) {
      return (
        <Button variant="outline" size="sm" disabled>
          <XCircle className="w-4 h-4 mr-2" />
          Expired
        </Button>
      );
    }
    
    if (assignment.status === 'started') {
      return (
        <Button
          size="sm"
          onClick={() => setLocation(`/test/${assignment.id}`)}
        >
          <PlayCircle className="w-4 h-4 mr-2" />
          Continue Test
        </Button>
      );
    }
    
    return (
      <Button
        size="sm"
        onClick={() => setLocation(`/test/${assignment.id}`)}
      >
        <PlayCircle className="w-4 h-4 mr-2" />
        Take Test
      </Button>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your tests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="w-8 h-8 text-blue-600" />
          My Tests
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View and complete your assigned skill assessments
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{groupedAssignments.assigned.length}</div>
                <div className="text-sm text-gray-600">Pending</div>
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
                  placeholder="Search by test title or company..."
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
                <SelectItem value="assigned">Pending</SelectItem>
                <SelectItem value="started">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tests List */}
      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tests found</h3>
            <p className="text-gray-600 mb-4">
              {assignments.length === 0 
                ? "You haven't been assigned any tests yet. Check back later or contact recruiters you've applied to."
                : "No tests match your current filters. Try adjusting your search criteria."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment: any) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar>
                      <AvatarFallback>
                        {assignment.recruiter?.companyName?.[0] || assignment.recruiter?.firstName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{assignment.testTemplate?.title}</h3>
                        <Badge className={statusColors[assignment.status as keyof typeof statusColors]}>
                          {statusIcons[assignment.status as keyof typeof statusIcons]}
                          <span className="ml-1">
                            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                          </span>
                        </Badge>
                        {isOverdue(assignment.dueDate, assignment.status) && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {assignment.recruiter?.companyName || `${assignment.recruiter?.firstName} ${assignment.recruiter?.lastName}`}
                        </span>
                      </div>
                      
                      {assignment.testTemplate?.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {assignment.testTemplate.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">
                            {assignment.testTemplate?.timeLimit} minutes
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">
                            {assignment.testTemplate?.passingScore}% to pass
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">
                            Due: {formatDate(assignment.dueDate)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Results Display */}
                      {assignment.status === 'completed' && (
                        <div className="mt-4 space-y-3">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className={`text-xl font-bold ${getScoreColor(assignment.score, assignment.testTemplate?.passingScore)}`}>
                                    {assignment.score}%
                                  </div>
                                  <div className="text-xs text-gray-600">Score</div>
                                </div>
                                
                                <div className="text-center">
                                  <div className={`text-lg font-bold ${assignment.score >= assignment.testTemplate?.passingScore ? 'text-green-600' : 'text-red-600'}`}>
                                    {assignment.score >= assignment.testTemplate?.passingScore ? 'PASSED' : 'FAILED'}
                                  </div>
                                  <div className="text-xs text-gray-600">Result</div>
                                </div>
                                
                                {assignment.timeSpent && (
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-700">
                                      {Math.round(assignment.timeSpent / 60)}m
                                    </div>
                                    <div className="text-xs text-gray-600">Time</div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={assignment.score} 
                                  className="w-24"
                                />
                                {assignment.retakeAllowed && (
                                  <Badge variant="outline" className="text-xs">
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Retake Available
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Violations Warning */}
                          {assignment.answers?._violations?.totalViolations > 0 && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-center gap-2 text-yellow-700">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="font-medium text-sm">
                                  {assignment.answers._violations.totalViolations} violation(s) detected
                                </span>
                              </div>
                              <p className="text-xs text-yellow-600 mt-1">
                                Score reduced due to potential cheating behavior
                              </p>
                            </div>
                          )}
                          
                          {/* Retake Motivation for Failed Tests */}
                          {assignment.score < assignment.testTemplate?.passingScore && !assignment.retakeAllowed && (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start gap-3">
                                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <h4 className="font-semibold text-blue-900 text-sm">Don't Give Up - Show Your True Potential!</h4>
                                  <p className="text-sm text-blue-700 mt-1 mb-3">
                                    You were just {assignment.testTemplate?.passingScore - assignment.score} points away from passing. 
                                    A retake could be the difference between landing your dream job and missing out.
                                  </p>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-600">
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Fresh questions</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Learn from mistakes</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Prove dedication</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Impress recruiter</span>
                                    </div>
                                  </div>
                                  <div className="mt-3 text-xs text-blue-600 font-medium">
                                    💡 Many successful candidates retake tests to improve their scores
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Progress Display */}
                      {assignment.status === 'started' && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-800">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Test started on {formatDate(assignment.startedAt)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {getActionButton(assignment)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}