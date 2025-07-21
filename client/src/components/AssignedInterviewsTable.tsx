import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Eye, 
  User, 
  Calendar, 
  Clock, 
  Award, 
  RefreshCw,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AssignedInterview {
  id: number;
  type: string;
  role: string;
  company: string;
  difficulty: string;
  status: string;
  assignedAt: string;
  dueDate: string;
  overallScore: number | null;
  candidateName: string;
  candidateEmail: string;
  interviewCategory: 'virtual' | 'mock';
  retakeCount: number;
  maxRetakes: number;
}

interface PartialResults {
  id: number;
  overallScore: number | null;
  technicalScore?: number;
  communicationScore?: number;
  confidenceScore?: number;
  score?: number;
  strengths: string[];
  weaknesses: string[];
  partialFeedback: string;
  canRetake: boolean;
  retakePrice: number;
  candidateName: string;
  candidateEmail: string;
  status: string;
  retakeCount: number;
}

export default function AssignedInterviewsTable() {
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<AssignedInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResults, setSelectedResults] = useState<PartialResults | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    fetchAssignedInterviews();
  }, []);

  const fetchAssignedInterviews = async () => {
    try {
      const response = await fetch('/api/interviews/assigned');
      const data = await response.json();
      
      if (response.ok) {
        setInterviews(data);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch assigned interviews",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching assigned interviews:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assigned interviews",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const viewPartialResults = async (interview: AssignedInterview) => {
    setResultsLoading(true);
    try {
      const response = await fetch(`/api/interviews/${interview.interviewCategory}/${interview.id}/partial-results`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedResults(data);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch results",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching partial results:', error);
      toast({
        title: "Error",
        description: "Failed to fetch results",
        variant: "destructive"
      });
    } finally {
      setResultsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'active':
      case 'assigned':
        return <Badge variant="outline" className="border-blue-200 text-blue-800">Active</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreDisplay = (score: number | null) => {
    if (score === null) return 'Not yet completed';
    
    const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
    return <span className={`font-medium ${color}`}>{score}%</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isDueToday = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return due.toDateString() === today.toDateString();
  };

  const isOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assigned Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading assigned interviews...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assigned Interviews</CardTitle>
          <Button 
            onClick={fetchAssignedInterviews}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {interviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No interviews assigned yet. Use the "Assign Interview" button to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Retakes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviews.map((interview) => (
                    <TableRow key={`${interview.interviewCategory}-${interview.id}`}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{interview.candidateName}</div>
                          <div className="text-sm text-gray-500">{interview.candidateEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{interview.role}</div>
                          {interview.company && (
                            <div className="text-sm text-gray-500">{interview.company}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className="capitalize">
                            {interview.interviewCategory}
                          </Badge>
                          <div className="text-sm text-gray-500 capitalize">
                            {interview.type} • {interview.difficulty}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(interview.status)}
                      </TableCell>
                      <TableCell>
                        {getScoreDisplay(interview.overallScore)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className={`text-sm ${
                            isOverdue(interview.dueDate) ? 'text-red-600 font-medium' :
                            isDueToday(interview.dueDate) ? 'text-orange-600 font-medium' :
                            'text-gray-700'
                          }`}>
                            {formatDate(interview.dueDate)}
                          </div>
                          {isOverdue(interview.dueDate) && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                          {isDueToday(interview.dueDate) && !isOverdue(interview.dueDate) && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                              Due Today
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {interview.retakeCount} / {interview.maxRetakes}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewPartialResults(interview)}
                          disabled={resultsLoading}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partial Results Dialog */}
      <Dialog open={!!selectedResults} onOpenChange={() => setSelectedResults(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Interview Results Summary</DialogTitle>
          </DialogHeader>
          
          {selectedResults && (
            <div className="space-y-6">
              {/* Candidate Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <User className="h-8 w-8 text-gray-600" />
                <div>
                  <h3 className="font-medium">{selectedResults.candidateName}</h3>
                  <p className="text-sm text-gray-600">{selectedResults.candidateEmail}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {selectedResults.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-orange-600" />
                  )}
                  <span className="font-medium">Status:</span>
                  {getStatusBadge(selectedResults.status)}
                </div>
              </div>

              {/* Score Summary */}
              {selectedResults.overallScore !== null && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedResults.overallScore || selectedResults.score}%
                    </div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                  </div>
                  
                  {selectedResults.technicalScore && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedResults.technicalScore}%
                      </div>
                      <div className="text-sm text-gray-600">Technical</div>
                    </div>
                  )}
                  
                  {selectedResults.communicationScore && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedResults.communicationScore}%
                      </div>
                      <div className="text-sm text-gray-600">Communication</div>
                    </div>
                  )}

                  {selectedResults.confidenceScore && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedResults.confidenceScore}%
                      </div>
                      <div className="text-sm text-gray-600">Confidence</div>
                    </div>
                  )}
                </div>
              )}

              {/* Partial Feedback */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Performance Summary</h4>
                <p className="text-sm text-gray-700">{selectedResults.partialFeedback}</p>
              </div>

              {/* Retake Information */}
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-medium">Retake Information</h4>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>• Retakes used: {selectedResults.retakeCount} / 2</p>
                  <p>• Retake available: {selectedResults.canRetake ? 'Yes' : 'No'}</p>
                  <p>• Retake price: ${selectedResults.retakePrice}</p>
                </div>
              </div>

              {/* Important Notice */}
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <h4 className="font-medium">Important Notice</h4>
                </div>
                <p className="text-sm text-orange-700">
                  This is a summary view only. Detailed feedback, question responses, and full analytics are only available to the candidate to encourage honest performance and potential retakes.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}