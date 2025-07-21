import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Video, 
  Code, 
  Users, 
  Clock, 
  Award,
  TrendingUp,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import InterviewAssignmentModal from "@/components/InterviewAssignmentModal";
import AssignedInterviewsTable from "@/components/AssignedInterviewsTable";

interface StatsData {
  totalAssigned: number;
  completed: number;
  pending: number;
  averageScore: number;
  virtualInterviews: number;
  mockInterviews: number;
}

export default function InterviewAssignments() {
  const { toast } = useToast();
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedInterviewType, setSelectedInterviewType] = useState<'virtual' | 'mock'>('virtual');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch candidates (job seekers)
  const { data: candidates = [] } = useQuery({
    queryKey: ['/api/users/candidates'],
    queryFn: async () => {
      const response = await fetch('/api/users/candidates');
      if (!response.ok) throw new Error('Failed to fetch candidates');
      return response.json();
    }
  });

  // Fetch job postings
  const { data: jobPostings = [] } = useQuery({
    queryKey: ['/api/jobs/postings'],
    queryFn: async () => {
      const response = await fetch('/api/jobs/postings');
      if (!response.ok) throw new Error('Failed to fetch job postings');
      return response.json();
    }
  });

  // Fetch interview assignment stats
  const { data: stats } = useQuery({
    queryKey: ['/api/interviews/stats', refreshKey],
    queryFn: async () => {
      const response = await fetch('/api/interviews/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const openAssignmentModal = (type: 'virtual' | 'mock') => {
    setSelectedInterviewType(type);
    setShowAssignmentModal(true);
  };

  const handleAssignmentSuccess = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Success",
      description: "Interview assigned successfully and email sent to candidate",
    });
  };

  const defaultStats: StatsData = {
    totalAssigned: 0,
    completed: 0,
    pending: 0,
    averageScore: 0,
    virtualInterviews: 0,
    mockInterviews: 0
  };

  const currentStats = stats || defaultStats;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interview Assignments</h1>
          <p className="text-gray-600">Assign and manage virtual AI interviews and mock coding tests</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => openAssignmentModal('virtual')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Video className="h-4 w-4 mr-2" />
            Assign Virtual Interview
          </Button>
          <Button 
            onClick={() => openAssignmentModal('mock')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Code className="h-4 w-4 mr-2" />
            Assign Mock Interview
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assigned</p>
                <p className="text-2xl font-bold">{currentStats.totalAssigned}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{currentStats.completed}</p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{currentStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold">{currentStats.averageScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interview Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-600" />
              Virtual AI Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {currentStats.virtualInterviews}
            </div>
            <p className="text-sm text-gray-600">
              Conversational AI interviews with real-time feedback and scoring
            </p>
            <div className="mt-4">
              <Button 
                onClick={() => openAssignmentModal('virtual')}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Virtual Interview
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-green-600" />
              Mock Coding Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {currentStats.mockInterviews}
            </div>
            <p className="text-sm text-gray-600">
              Technical coding challenges with live code execution and AI evaluation
            </p>
            <div className="mt-4">
              <Button 
                onClick={() => openAssignmentModal('mock')}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Mock Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Features */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Assignment Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Recruiter-Only Results
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Detailed interview results are only visible to recruiters, candidates see limited summary
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Email Notifications
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Automatic email notifications sent to candidates with interview details and deadlines
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Interviews Table */}
      <AssignedInterviewsTable key={refreshKey} />

      {/* Assignment Modal */}
      <InterviewAssignmentModal
        open={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        interviewType={selectedInterviewType}
        candidates={candidates}
        jobPostings={jobPostings}
        onAssignmentSuccess={handleAssignmentSuccess}
      />
    </div>
  );
}