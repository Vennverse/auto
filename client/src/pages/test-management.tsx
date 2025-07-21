import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Users, 
  BarChart, 
  FileText, 
  Edit, 
  Trash2,
  Send,
  Settings,
  CheckSquare,
  Square,
  BookOpen
} from "lucide-react";

const jobProfiles = [
  "software_engineer",
  "frontend_developer", 
  "backend_developer",
  "fullstack_developer",
  "python_developer",
  "data_scientist",
  "data_analyst",
  "marketing",
  "sales",
  "product_manager",
  "designer",
  "devops_engineer"
];

const difficultyLevels = ["beginner", "intermediate", "advanced", "expert"];
const categories = ["technical", "behavioral", "general"];

const createTestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  jobProfile: z.string().min(1, "Job profile is required"),
  difficultyLevel: z.string().min(1, "Difficulty level is required"),
  timeLimit: z.number().min(1, "Time limit must be at least 1 minute"),
  passingScore: z.number().min(0).max(100, "Passing score must be between 0-100"),
  useQuestionBank: z.boolean().default(false),
  aptitudeQuestions: z.number().min(0).max(50).default(15),
  englishQuestions: z.number().min(0).max(30).default(6),
  domainQuestions: z.number().min(0).max(30).default(9),
  includeExtremeQuestions: z.boolean().default(true),
  questions: z.array(z.object({
    id: z.string(),
    type: z.enum(['multiple_choice', 'coding', 'essay', 'true_false']),
    question: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.string(), z.number()]).optional(),
    points: z.number(),
    explanation: z.string().optional(),
  })).default([]),
});

const assignTestSchema = z.object({
  testTemplateId: z.number(),
  jobPostingId: z.number().optional(),
  dueDate: z.string().min(1, "Due date is required"),
});

export default function TestManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobProfile, setSelectedJobProfile] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [selectedJobPosting, setSelectedJobPosting] = useState<number | null>(null);
  const [useQuestionBank, setUseQuestionBank] = useState(false);

  // Fetch test templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/test-templates"],
  });

  // Fetch applications for assignment
  const { data: applications = [] } = useQuery({
    queryKey: ["/api/recruiter/applications"],
  });

  // Initialize platform templates
  const initTemplatesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/admin/init-test-templates", "POST");
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Platform test templates initialized successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/test-templates"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to initialize templates",
        variant: "destructive" 
      });
    },
  });

  // Create test template
  const createTestForm = useForm({
    resolver: zodResolver(createTestSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      jobProfile: "",
      difficultyLevel: "",
      timeLimit: 30,
      passingScore: 70,
      useQuestionBank: false,
      aptitudeQuestions: 15,
      englishQuestions: 6,
      domainQuestions: 9,
      includeExtremeQuestions: true,
      questions: [
        {
          id: "q1",
          type: "multiple_choice" as const,
          question: "Sample question",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: 0,
          points: 10,
          explanation: "This is a sample question"
        }
      ],
    },
  });

  // Watch for useQuestionBank form changes
  const watchUseQuestionBank = createTestForm.watch("useQuestionBank");
  useEffect(() => {
    setUseQuestionBank(watchUseQuestionBank);
  }, [watchUseQuestionBank]);

  const createTestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/test-templates", "POST", data);
      const template = await response.json();
      
      // If using question bank, generate questions automatically
      if (data.useQuestionBank) {
        try {
          const generateResponse = await apiRequest(`/api/test-templates/${template.id}/generate`, "POST", {
            aptitudeQuestions: data.aptitudeQuestions,
            englishQuestions: data.englishQuestions,
            domainQuestions: data.domainQuestions,
            includeExtremeQuestions: data.includeExtremeQuestions,
            jobProfile: data.jobProfile,
            difficultyLevel: data.difficultyLevel
          });
          const generatedQuestions = await generateResponse.json();
          return { ...template, questionsGenerated: generatedQuestions.length };
        } catch (error) {
          console.error("Failed to generate questions:", error);
          return { ...template, questionsGenerated: 0 };
        }
      }
      
      return template;
    },
    onSuccess: (data: any) => {
      if (data.questionsGenerated > 0) {
        toast({ 
          title: "Test template created successfully",
          description: `Generated ${data.questionsGenerated} questions from question bank`
        });
      } else {
        toast({ title: "Test template created successfully" });
      }
      setShowCreateDialog(false);
      createTestForm.reset();
      setUseQuestionBank(false);
      queryClient.invalidateQueries({ queryKey: ["/api/test-templates"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create test template",
        variant: "destructive" 
      });
    },
  });

  // Assign test
  const assignTestForm = useForm({
    resolver: zodResolver(assignTestSchema),
    defaultValues: {
      testTemplateId: 0,
      jobPostingId: undefined,
      dueDate: "",
    },
  });

  const assignTestMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('assignTestMutation called with:', data);
      
      // Validate required fields
      if (!data.testTemplateId || !data.candidateIds || data.candidateIds.length === 0) {
        throw new Error('Missing required fields for test assignment');
      }
      
      // Submit for each selected candidate
      const assignments = [];
      for (const candidateId of data.candidateIds) {
        console.log('Assigning test to candidate:', candidateId);
        
        const assignmentPayload = {
          testTemplateId: data.testTemplateId,
          jobSeekerId: candidateId,
          jobPostingId: data.jobPostingId,
          dueDate: data.dueDate,
        };
        
        console.log('Assignment payload:', assignmentPayload);
        
        try {
          const response = await apiRequest("/api/test-assignments", "POST", assignmentPayload);
          const assignment = await response.json();
          assignments.push(assignment);
          console.log('Successfully assigned test to candidate:', candidateId);
        } catch (error) {
          console.error('Error assigning test to candidate:', candidateId, error);
          throw error;
        }
      }
      return assignments;
    },
    onSuccess: (assignments) => {
      toast({ 
        title: `Test assigned successfully to ${assignments.length} candidate(s)`, 
        description: "Email notifications sent to all selected candidates." 
      });
      setShowAssignDialog(false);
      setSelectedCandidates([]);
      setSelectedJobPosting(null);
      assignTestForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to assign test",
        variant: "destructive" 
      });
    },
  });

  // Delete test template
  const deleteTestMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/test-templates/${id}`, "DELETE");
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Test template deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/test-templates"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete test template",
        variant: "destructive" 
      });
    },
  });

  // Filter templates
  const filteredTemplates = templates.filter((template: any) => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJobProfile = selectedJobProfile === "all" || template.jobProfile === selectedJobProfile;
    const matchesDifficulty = selectedDifficulty === "all" || template.difficultyLevel === selectedDifficulty;
    
    return matchesSearch && matchesJobProfile && matchesDifficulty;
  });

  const onCreateTest = (data: any) => {
    // Handle question bank vs manual questions
    let questions = [];
    
    if (!data.useQuestionBank) {
      // Use manual questions with at least one sample
      questions = data.questions && data.questions.length > 0 ? data.questions : [
        {
          id: "q1",
          type: "multiple_choice",
          question: "Sample question - please edit this after creation",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: 0,
          points: 10,
          explanation: "This is a sample question that should be edited"
        }
      ];
    }

    createTestMutation.mutate({
      ...data,
      questions: questions,
    });
  };

  const onAssignTest = (data: any) => {
    try {
      console.log('onAssignTest called with data:', data);
      console.log('selectedTemplate:', selectedTemplate);
      console.log('selectedCandidates:', selectedCandidates);
      
      // Validate required data
      if (!selectedTemplate?.id) {
        toast({
          title: "Error",
          description: "No test template selected",
          variant: "destructive"
        });
        return;
      }
      
      if (selectedCandidates.length === 0) {
        toast({
          title: "Error", 
          description: "Please select at least one candidate",
          variant: "destructive"
        });
        return;
      }
      
      if (!data.dueDate) {
        toast({
          title: "Error",
          description: "Please select a due date",
          variant: "destructive"
        });
        return;
      }
      
      const dueDate = new Date(data.dueDate);
      dueDate.setHours(23, 59, 59); // Set to end of day
      
      const assignmentData = {
        testTemplateId: selectedTemplate.id,
        jobPostingId: data.jobPostingId,
        candidateIds: selectedCandidates,
        dueDate: dueDate.toISOString(),
      };
      
      console.log('Assignment data to submit:', assignmentData);
      
      assignTestMutation.mutate(assignmentData);
    } catch (error) {
      console.error('Error in onAssignTest:', error);
      toast({
        title: "Error",
        description: "Failed to prepare test assignment",
        variant: "destructive"
      });
    }
  };

  // Helper functions for candidate selection
  const handleCandidateSelect = (candidateId: string, checked: boolean) => {
    if (checked) {
      setSelectedCandidates([...selectedCandidates, candidateId]);
    } else {
      setSelectedCandidates(selectedCandidates.filter(id => id !== candidateId));
    }
  };

  const handleSelectAll = (jobPostingId: number, candidates: any[]) => {
    const allCandidateIds = candidates.map(app => app.applicantId);
    if (selectedCandidates.length === allCandidateIds.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(allCandidateIds);
    }
  };

  const getCandidatesForJobPosting = (jobPostingId: number) => {
    return applications.filter(app => app.jobPostingId === jobPostingId);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-orange-100 text-orange-800";
      case "expert": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical": return "bg-blue-100 text-blue-800";
      case "behavioral": return "bg-purple-100 text-purple-800";
      case "general": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading test templates...</p>
          </div>
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
            <FileText className="w-8 h-8 text-blue-600" />
            Test Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create, manage, and assign skills assessments to candidates
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setLocation("/admin/question-bank")}
            variant="outline"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Question Bank
          </Button>
          <Button
            onClick={() => setLocation("/recruiter/test-assignments")}
            variant="outline"
          >
            <BarChart className="w-4 h-4 mr-2" />
            View Assignments
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Test
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      {templates.length === 0 && (
        <Card className="mb-6 border-dashed">
          <CardContent className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No test templates found</h3>
            <p className="text-gray-600 mb-4">
              Initialize platform templates or create your own custom tests
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => initTemplatesMutation.mutate()}
                disabled={initTemplatesMutation.isPending}
                variant="outline"
              >
                <Settings className="w-4 h-4 mr-2" />
                Initialize Platform Templates
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Test
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tests by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedJobProfile} onValueChange={setSelectedJobProfile}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Job Profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Profiles</SelectItem>
                {jobProfiles.filter(profile => profile && profile.trim()).map((profile) => (
                  <SelectItem key={profile} value={profile}>
                    {profile.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {difficultyLevels.filter(level => level && level.trim()).map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template: any) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  {template.description && (
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                  )}
                </div>
                {!template.isGlobal && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (template.id) {
                          setLocation(`/recruiter/question-builder/${template.id}`);
                        }
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTestMutation.mutate(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                  <Badge className={getDifficultyColor(template.difficultyLevel)}>
                    {template.difficultyLevel}
                  </Badge>
                  {template.isGlobal && (
                    <Badge variant="secondary">Platform</Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {template.timeLimit} min
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart className="w-4 h-4" />
                    {template.passingScore}% pass
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <strong>Job Profile:</strong> {template.jobProfile.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowAssignDialog(true);
                    setSelectedCandidates([]);
                    setSelectedJobPosting(null);
                    assignTestForm.reset({
                      testTemplateId: template.id,
                      jobPostingId: undefined,
                      dueDate: "",
                    });
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Assign Test
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && templates.length > 0 && (
        <div className="text-center py-8">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tests match your filters</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Create Test Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Test Template</DialogTitle>
            <DialogDescription>
              Create a custom test template for your specific requirements. You can use our question bank or add questions after creation.
            </DialogDescription>
          </DialogHeader>
          <Form {...createTestForm}>
            <form onSubmit={createTestForm.handleSubmit(onCreateTest)} className="space-y-4">
              <FormField
                control={createTestForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Advanced React Development Assessment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createTestForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of what this test covers..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createTestForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.filter(category => category && category.trim()).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createTestForm.control}
                  name="jobProfile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Profile</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job profile" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {jobProfiles.filter(profile => profile && profile.trim()).map((profile) => (
                            <SelectItem key={profile} value={profile}>
                              {profile.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={createTestForm.control}
                  name="difficultyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {difficultyLevels.filter(level => level && level.trim()).map((level) => (
                            <SelectItem key={level} value={level}>
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createTestForm.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Limit (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="180" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createTestForm.control}
                  name="passingScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passing Score (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Question Bank Options */}
              <div className="space-y-4 border-t pt-4">
                <FormField
                  control={createTestForm.control}
                  name="useQuestionBank"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Use Question Bank</FormLabel>
                        <div className="text-sm text-gray-600">
                          Auto-generate questions from our curated question bank (14 questions available)
                        </div>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            setUseQuestionBank(checked as boolean);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {(useQuestionBank || watchUseQuestionBank) && (
                  <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                    <div className="text-sm text-gray-600 mb-3">
                      Configure automatic question distribution:
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={createTestForm.control}
                        name="aptitudeQuestions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aptitude Questions</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                max="50" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <div className="text-xs text-gray-500">Logic & reasoning</div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createTestForm.control}
                        name="englishQuestions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>English Questions</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                max="30" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <div className="text-xs text-gray-500">Grammar & vocabulary</div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createTestForm.control}
                        name="domainQuestions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Technical Questions</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                max="30" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <div className="text-xs text-gray-500">Job-specific skills</div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={createTestForm.control}
                      name="includeExtremeQuestions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Include challenging questions</FormLabel>
                            <div className="text-sm text-gray-600">
                              Add harder questions to better evaluate top candidates
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <strong>Note:</strong> After creating the template, you can add custom questions or edit auto-generated ones in the Question Builder.
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTestMutation.isPending}
                  className="flex-1"
                >
                  {createTestMutation.isPending ? "Creating..." : "Create Test"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assign Test Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Test: {selectedTemplate?.title}</DialogTitle>
            <DialogDescription>
              Select candidates from your job applications and set a deadline for this test assignment.
            </DialogDescription>
          </DialogHeader>
          <Form {...assignTestForm}>
            <form onSubmit={assignTestForm.handleSubmit(onAssignTest, (errors) => {
              console.error('Form validation errors:', errors);
              toast({
                title: "Form Error",
                description: "Please check all required fields",
                variant: "destructive"
              });
            })} className="space-y-4">
              
              {/* Job Posting Selection */}
              <div className="space-y-3">
                <FormLabel>Select Job Posting (Optional)</FormLabel>
                <Select onValueChange={(value) => setSelectedJobPosting(value === "all" ? null : parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Applications" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Applications</SelectItem>
                    {Array.from(new Set(applications.map((app: any) => app.jobPostingId)))
                      .filter(Boolean)
                      .map((jobId: any) => {
                        const job = applications.find((app: any) => app.jobPostingId === jobId);
                        return (
                          <SelectItem key={jobId} value={jobId.toString()}>
                            {job?.jobPostingTitle || `Job ${jobId}`}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>

              {/* Candidate Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>Select Candidates</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const filteredApps = selectedJobPosting 
                        ? applications.filter((app: any) => app.jobPostingId === selectedJobPosting)
                        : applications;
                      const allIds = filteredApps.map((app: any) => app.applicantId);
                      setSelectedCandidates(
                        selectedCandidates.length === allIds.length ? [] : allIds
                      );
                    }}
                  >
                    {selectedCandidates.length === (selectedJobPosting 
                      ? applications.filter((app: any) => app.jobPostingId === selectedJobPosting)
                      : applications).length ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Select All
                      </>
                    )}
                  </Button>
                </div>

                {/* Candidate List */}
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {(selectedJobPosting 
                    ? applications.filter((app: any) => app.jobPostingId === selectedJobPosting)
                    : applications
                  ).map((app: any, index: number) => (
                    <div key={`${app.applicantId}-${app.id || index}`} className="flex items-center space-x-3 p-3 border-b last:border-b-0 hover:bg-gray-50">
                      <Checkbox
                        id={`candidate-${app.applicantId}`}
                        checked={selectedCandidates.includes(app.applicantId)}
                        onCheckedChange={(checked) => handleCandidateSelect(app.applicantId, checked as boolean)}
                      />
                      <label 
                        htmlFor={`candidate-${app.applicantId}`} 
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{app.applicantName}</div>
                        <div className="text-sm text-gray-500">
                          {app.jobPostingTitle || 'General Application'} • {app.applicantEmail}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>

                {selectedCandidates.length > 0 && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    {selectedCandidates.length} candidate(s) selected
                  </div>
                )}
              </div>

              {/* Due Date */}
              <FormField
                control={assignTestForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        min={new Date().toISOString().split('T')[0]}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Test Details */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Test Details:</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>Duration: {selectedTemplate?.timeLimit} minutes</div>
                  <div>Passing Score: {selectedTemplate?.passingScore}%</div>
                  <div>Difficulty: {selectedTemplate?.difficultyLevel}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAssignDialog(false);
                    setSelectedCandidates([]);
                    setSelectedJobPosting(null);
                    assignTestForm.reset();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={assignTestMutation.isPending || selectedCandidates.length === 0}
                  className="flex-1"
                >
                  {assignTestMutation.isPending ? "Assigning..." : `Assign Test to ${selectedCandidates.length} Candidate(s)`}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}