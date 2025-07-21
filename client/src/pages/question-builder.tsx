import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Code, FileText, Check } from "lucide-react";

const questionSchema = z.object({
  type: z.enum(['multiple_choice', 'multiple_select', 'true_false', 'short_answer', 'long_answer', 'coding', 'scenario', 'case_study']),
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.number(), z.array(z.number())]).optional(),
  points: z.number().min(1, "Points must be at least 1"),
  explanation: z.string().optional(),
  domain: z.enum(['technical', 'finance', 'marketing', 'sales', 'hr', 'general']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  keywords: z.array(z.string()).optional(),
  timeLimit: z.number().min(1).optional(),
  // Coding question specific fields
  testCases: z.string().optional(),
  boilerplate: z.string().optional(),
  language: z.enum(['javascript', 'python']).optional(),
});

export default function QuestionBuilder({ templateId }: { templateId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  const questionForm = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      type: 'multiple_choice' as const,
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 10,
      explanation: "",
      domain: 'technical' as const,
      difficulty: 'medium' as const,
      keywords: [],
      timeLimit: 2,
      testCases: "",
      boilerplate: "",
      language: 'javascript' as const,
    },
  });

  const { data: questions = [] } = useQuery({
    queryKey: [`/api/test-templates/${templateId}/questions`],
  });

  const addQuestionMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/test-templates/${templateId}/questions`, "POST", data),
    onSuccess: () => {
      toast({ title: "Question added successfully" });
      setShowAddDialog(false);
      questionForm.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/test-templates/${templateId}/questions`] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add question",
        variant: "destructive" 
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/test-templates/${templateId}/questions/${editingQuestion.id}`, "PUT", data),
    onSuccess: () => {
      toast({ title: "Question updated successfully" });
      setEditingQuestion(null);
      queryClient.invalidateQueries({ queryKey: [`/api/test-templates/${templateId}/questions`] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update question",
        variant: "destructive" 
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: number) => apiRequest(`/api/test-templates/${templateId}/questions/${questionId}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Question deleted successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/test-templates/${templateId}/questions`] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete question",
        variant: "destructive" 
      });
    },
  });

  const onSubmitQuestion = (data: any) => {
    if (editingQuestion) {
      updateQuestionMutation.mutate(data);
    } else {
      addQuestionMutation.mutate(data);
    }
  };

  const questionTypeIcons = {
    multiple_choice: <Check className="w-4 h-4" />,
    multiple_select: <Check className="w-4 h-4" />,
    true_false: <Check className="w-4 h-4" />,
    short_answer: <FileText className="w-4 h-4" />,
    long_answer: <FileText className="w-4 h-4" />,
    coding: <Code className="w-4 h-4" />,
    scenario: <FileText className="w-4 h-4" />,
    case_study: <FileText className="w-4 h-4" />,
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'finance': return 'bg-green-100 text-green-800';
      case 'marketing': return 'bg-purple-100 text-purple-800';
      case 'sales': return 'bg-orange-100 text-orange-800';
      case 'hr': return 'bg-pink-100 text-pink-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const questionType = questionForm.watch('type');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Question Builder</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      <div className="grid gap-4">
        {questions.map((question: any) => (
          <Card key={question.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {questionTypeIcons[question.type as keyof typeof questionTypeIcons]}
                  <CardTitle className="text-lg">{question.question}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingQuestion(question);
                      questionForm.reset(question);
                      setShowAddDialog(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteQuestionMutation.mutate(question.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDomainColor(question.domain)}`}>
                  {question.domain}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {question.points} points
                </span>
              </div>
              
              {question.options && (
                <div className="space-y-1">
                  {question.options.map((option: string, index: number) => (
                    <div key={index} className={`p-2 rounded ${question.correctAnswer === index ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                      {String.fromCharCode(65 + index)}. {option}
                    </div>
                  ))}
                </div>
              )}
              
              {question.explanation && (
                <div className="mt-3 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800">{question.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Question Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
            <DialogDescription>
              Create comprehensive questions for your test template.
            </DialogDescription>
          </DialogHeader>
          <Form {...questionForm}>
            <form onSubmit={questionForm.handleSubmit(onSubmitQuestion)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={questionForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="multiple_select">Multiple Select</SelectItem>
                          <SelectItem value="true_false">True/False</SelectItem>
                          <SelectItem value="short_answer">Short Answer</SelectItem>
                          <SelectItem value="long_answer">Long Answer</SelectItem>
                          <SelectItem value="coding">Coding</SelectItem>
                          <SelectItem value="scenario">Scenario</SelectItem>
                          <SelectItem value="case_study">Case Study</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={questionForm.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="hr">HR</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={questionForm.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={questionForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your question here..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {['multiple_choice', 'multiple_select'].includes(questionType) && (
                <div className="space-y-3">
                  <FormLabel>Options</FormLabel>
                  {[0, 1, 2, 3].map((index) => (
                    <FormField
                      key={index}
                      control={questionForm.control}
                      name={`options.${index}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              placeholder={`Option ${String.fromCharCode(65 + index)}`}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  
                  {questionType === 'multiple_choice' && (
                    <FormField
                      control={questionForm.control}
                      name="correctAnswer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correct Answer</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select correct answer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[0, 1, 2, 3].map((index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  Option {String.fromCharCode(65 + index)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {questionType === 'coding' && (
                <div className="space-y-4">
                  <FormField
                    control={questionForm.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Programming Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="javascript">JavaScript</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={questionForm.control}
                    name="testCases"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Cases (JSON format)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={`Example:
[
  {
    "input": "hello",
    "expected": "Hello",
    "description": "Capitalize first letter"
  },
  {
    "input": "world",
    "expected": "World", 
    "description": "Another test case"
  }
]`}
                            className="min-h-[120px] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={questionForm.control}
                    name="boilerplate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Boilerplate Code (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={`function solution(input) {
  // Your code here
  return input;
}`}
                            className="min-h-[100px] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {questionType === 'true_false' && (
                <FormField
                  control={questionForm.control}
                  name="correctAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correct Answer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select correct answer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">True</SelectItem>
                          <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={questionForm.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {questionType === 'coding' && (
                  <FormField
                    control={questionForm.control}
                    name="timeLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Limit (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="1"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={questionForm.control}
                name="explanation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explanation (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide an explanation for the correct answer..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setEditingQuestion(null);
                    questionForm.reset();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addQuestionMutation.isPending || updateQuestionMutation.isPending}
                  className="flex-1"
                >
                  {editingQuestion ? "Update Question" : "Add Question"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}