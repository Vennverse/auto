import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, User, Briefcase, Mail, AlertCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InterviewAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  interviewType: 'virtual' | 'mock';
  candidates: { id: string; name: string; email: string; }[];
  jobPostings: { id: number; title: string; company: string; }[];
  onAssignmentSuccess: () => void;
}

interface JobCandidate {
  id: string;
  name: string;
  email: string;
  applicationStatus?: string;
  appliedAt?: string;
}

export default function InterviewAssignmentModal({
  open,
  onClose,
  interviewType,
  candidates,
  jobPostings,
  onAssignmentSuccess
}: InterviewAssignmentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [jobCandidates, setJobCandidates] = useState<JobCandidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  
  const [formData, setFormData] = useState({
    candidateId: '',
    jobPostingId: '',
    role: '',
    company: '',
    difficulty: 'medium',
    dueDate: '',
    // Virtual interview specific
    duration: 30,
    interviewerPersonality: 'professional',
    jobDescription: '',
    // Mock interview specific
    language: 'javascript',
    totalQuestions: 5,
    interviewTypeSpecific: 'technical'
  });

  // Fetch candidates when job posting is selected
  const fetchCandidatesForJob = async (jobId: number) => {
    setLoadingCandidates(true);
    try {
      const response = await fetch(`/api/candidates/for-job/${jobId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const candidates = await response.json();
        setJobCandidates(candidates);
        setSelectedCandidates([]); // Reset selection
      } else {
        toast({
          title: "Error",
          description: "Failed to load candidates for this job",
          variant: "destructive"
        });
        setJobCandidates([]);
      }
    } catch (error) {
      console.error('Error fetching job candidates:', error);
      toast({
        title: "Error",
        description: "Failed to load candidates",
        variant: "destructive"
      });
      setJobCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedJob = jobPostings.find(job => job.id === Number(formData.jobPostingId));

      if (selectedCandidates.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one candidate",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (!formData.jobPostingId) {
        toast({
          title: "Error", 
          description: "Please select a job posting",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (!formData.jobDescription.trim()) {
        toast({
          title: "Error",
          description: "Job description is required",
          variant: "destructive"
        });
        return;
      }

      const endpoint = interviewType === 'virtual' 
        ? '/api/interviews/virtual/assign'
        : '/api/interviews/mock/assign';

      // Assign interviews to all selected candidates
      const assignmentPromises = selectedCandidates.map(candidateId => {
        const payload = {
          candidateId,
          jobPostingId: formData.jobPostingId ? Number(formData.jobPostingId) : null,
          interviewType: formData.interviewTypeSpecific,
          role: formData.role,
          company: selectedJob?.company || formData.company,
          difficulty: formData.difficulty,
          dueDate: formData.dueDate,
          jobDescription: formData.jobDescription,
          ...(interviewType === 'virtual' ? {
            duration: formData.duration,
            interviewerPersonality: formData.interviewerPersonality,
          } : {
            language: formData.language,
            totalQuestions: formData.totalQuestions
          })
        };

        return fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
      });

      const responses = await Promise.all(assignmentPromises);
      const results = await Promise.all(responses.map(r => r.json()));
      
      const successCount = responses.filter(r => r.ok).length;
      const failCount = responses.length - successCount;

      if (successCount > 0) {
        toast({
          title: "Success",
          description: `${interviewType === 'virtual' ? 'Virtual' : 'Mock'} interview assigned to ${successCount} candidate${successCount > 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}`,
        });
        onAssignmentSuccess();
        onClose();
        resetForm();
      } else {
        toast({
          title: "Error",
          description: results[0]?.message || "Failed to assign interviews",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error assigning interview:', error);
      toast({
        title: "Error",
        description: "Failed to assign interview",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      candidateId: '',
      jobPostingId: '',
      role: '',
      company: '',
      difficulty: 'medium',
      dueDate: '',
      duration: 30,
      interviewerPersonality: 'professional',
      jobDescription: '',
      language: 'javascript',
      totalQuestions: 5,
      interviewTypeSpecific: 'technical'
    });
    setSelectedCandidates([]);
    setJobCandidates([]);
  };

  const handleJobPostingChange = (jobId: string) => {
    const selectedJob = jobPostings.find(job => job.id === Number(jobId));
    setFormData(prev => ({
      ...prev,
      jobPostingId: jobId,
      company: selectedJob?.company || '',
      role: selectedJob?.title || '',
      jobDescription: selectedJob ? `Role: ${selectedJob.title} at ${selectedJob.company}` : ''
    }));
    
    // Fetch candidates who applied to this job
    if (selectedJob) {
      fetchCandidatesForJob(selectedJob.id);
    }
  };

  const handleCandidateSelection = (candidateId: string, checked: boolean) => {
    setSelectedCandidates(prev => {
      if (checked) {
        return [...prev, candidateId];
      } else {
        return prev.filter(id => id !== candidateId);
      }
    });
  };

  const handleSelectAllCandidates = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(jobCandidates.map(c => c.id));
    } else {
      setSelectedCandidates([]);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {interviewType === 'virtual' ? (
              <>
                <User className="h-5 w-5 text-blue-600" />
                Assign Virtual AI Interview
              </>
            ) : (
              <>
                <Briefcase className="h-5 w-5 text-green-600" />
                Assign Coding Test
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Job Posting Selection */}
              <div>
                <Label htmlFor="jobPostingId">Job Posting *</Label>
                <Select value={formData.jobPostingId} onValueChange={handleJobPostingChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job posting first" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobPostings.map(job => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        {job.title} - {job.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Candidate Selection */}
              {formData.jobPostingId && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>
                      <Users className="h-4 w-4 inline mr-2" />
                      Select Candidates *
                    </Label>
                    {loadingCandidates && (
                      <div className="text-sm text-muted-foreground">Loading candidates...</div>
                    )}
                  </div>
                  
                  {!loadingCandidates && (
                    <>
                      {jobCandidates.length > 0 ? (
                        <>
                          <div className="flex items-center space-x-2 border-b pb-2">
                            <Checkbox
                              id="select-all"
                              checked={selectedCandidates.length === jobCandidates.length}
                              onCheckedChange={handleSelectAllCandidates}
                            />
                            <Label htmlFor="select-all" className="text-sm font-medium">
                              Select All ({jobCandidates.length})
                            </Label>
                          </div>
                          
                          <div className="max-h-32 overflow-y-auto space-y-2">
                            {jobCandidates.map((candidate) => (
                              <div key={candidate.id} className="flex items-center space-x-2 p-2 border rounded-md">
                                <Checkbox
                                  id={candidate.id}
                                  checked={selectedCandidates.includes(candidate.id)}
                                  onCheckedChange={(checked) => handleCandidateSelection(candidate.id, checked as boolean)}
                                />
                                <Label htmlFor={candidate.id} className="flex-1 cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span className="font-medium">{candidate.name}</span>
                                    <span className="text-sm text-muted-foreground">({candidate.email})</span>
                                    {candidate.applicationStatus && (
                                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                        {candidate.applicationStatus}
                                      </span>
                                    )}
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            {selectedCandidates.length} of {jobCandidates.length} candidates selected
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No candidates have applied to this job posting yet.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g., Senior Software Engineer"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="e.g., Tech Corp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    min={minDate}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Type Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interview Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="interviewTypeSpecific">Interview Type</Label>
                <Select value={formData.interviewTypeSpecific} onValueChange={(value) => setFormData(prev => ({ ...prev, interviewTypeSpecific: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="system_design">System Design</SelectItem>
                    {interviewType === 'virtual' && <SelectItem value="mixed">Mixed</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              {interviewType === 'virtual' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                      min="15"
                      max="120"
                    />
                  </div>

                  <div>
                    <Label htmlFor="interviewerPersonality">Interviewer Style</Label>
                    <Select value={formData.interviewerPersonality} onValueChange={(value) => setFormData(prev => ({ ...prev, interviewerPersonality: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="challenging">Challenging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language">Programming Language</Label>
                    <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="cpp">C++</SelectItem>
                        <SelectItem value="go">Go</SelectItem>
                        <SelectItem value="rust">Rust</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="totalQuestions">Total Questions</Label>
                    <Input
                      id="totalQuestions"
                      type="number"
                      value={formData.totalQuestions}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalQuestions: Number(e.target.value) }))}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="jobDescription">Job Description *</Label>
                <Textarea
                  id="jobDescription"
                  value={formData.jobDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                  placeholder="Provide job description for tailored questions..."
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-medium text-orange-800">Important Notice</h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• The candidate will receive an email notification with interview details</li>
                    <li>• Full detailed results are only visible to the recruiter (you)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Assigning...' : 'Assign Interview'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}