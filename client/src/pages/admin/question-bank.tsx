import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  Code, 
  Brain, 
  Globe, 
  Building, 
  X,
  Save,
  Eye,
  Edit,
  Trash2
} from "lucide-react";

const questionTypes = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'multiple_select', label: 'Multiple Select' },
  { value: 'true_false', label: 'True/False' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'long_answer', label: 'Long Answer' },
  { value: 'coding', label: 'Coding' },
  { value: 'scenario', label: 'Scenario' },
  { value: 'case_study', label: 'Case Study' }
];

const categories = [
  { value: 'general_aptitude', label: 'General Aptitude', icon: Brain },
  { value: 'english', label: 'English', icon: Globe },
  { value: 'domain_specific', label: 'Domain Specific', icon: Building }
];

const domains = [
  { value: 'general', label: 'General' },
  { value: 'technical', label: 'Technical' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'sales', label: 'Sales' }
];

const difficulties = [
  { value: 'easy', label: 'Easy', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'hard', label: 'Hard', color: 'bg-orange-100 text-orange-800' },
  { value: 'extreme', label: 'Extreme', color: 'bg-red-100 text-red-800' }
];

const commonTags = [
  'math', 'logic', 'reasoning', 'grammar', 'comprehension', 'vocabulary',
  'programming', 'algorithms', 'data-structures', 'javascript', 'python',
  'marketing', 'sales', 'finance', 'accounting', 'hr', 'management',
  'problem-solving', 'critical-thinking', 'analysis', 'communication'
];

interface QuestionFormData {
  type: string;
  category: string;
  domain: string;
  subCategory: string;
  difficulty: string;
  question: string;
  options: string[];
  correctAnswer: string | number | number[];
  explanation: string;
  points: number;
  timeLimit: number;
  tags: string[];
  keywords: string[];
  testCases?: string;
  boilerplate?: string;
  language?: string;
}

export default function QuestionBankAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDomain, setFilterDomain] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  
  const [formData, setFormData] = useState<QuestionFormData>({
    type: 'multiple_choice',
    category: 'general_aptitude',
    domain: 'general',
    subCategory: '',
    difficulty: 'medium',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    points: 5,
    timeLimit: 2,
    tags: [],
    keywords: []
  });
  
  const [newTag, setNewTag] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  // Fetch questions with filters
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['/api/question-bank/search', { 
      q: searchQuery, 
      category: filterCategory, 
      domain: filterDomain,
      difficulty: filterDifficulty 
    }],
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['/api/question-bank/stats'],
  });

  // Add question mutation
  const addQuestionMutation = useMutation({
    mutationFn: (questionData: any) => 
      apiRequest('/api/question-bank/questions', 'POST', questionData),
    onSuccess: () => {
      toast({
        title: "Question Added Successfully",
        description: "The new question has been added to the question bank.",
      });
      setShowAddForm(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/question-bank'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Adding Question",
        description: error.message || "Failed to add question to the bank.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'multiple_choice',
      category: 'general_aptitude',
      domain: 'general',
      subCategory: '',
      difficulty: 'medium',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      points: 5,
      timeLimit: 2,
      tags: [],
      keywords: []
    });
    setNewTag("");
    setNewKeyword("");
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(keyword => keyword !== keywordToRemove)
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.question.trim()) {
      toast({
        title: "Validation Error",
        description: "Question text is required.",
        variant: "destructive",
      });
      return;
    }

    if (formData.type === 'multiple_choice' || formData.type === 'multiple_select') {
      const validOptions = formData.options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        toast({
          title: "Validation Error",
          description: "At least 2 options are required for multiple choice questions.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!formData.correctAnswer) {
      toast({
        title: "Validation Error",
        description: "Correct answer is required.",
        variant: "destructive",
      });
      return;
    }

    addQuestionMutation.mutate({
      ...formData,
      id: `custom_${Date.now()}`,
      options: formData.options.filter(opt => opt.trim())
    });
  };

  const getDifficultyBadge = (difficulty: string) => {
    const diff = difficulties.find(d => d.value === difficulty);
    return diff ? (
      <Badge className={diff.color}>{diff.label}</Badge>
    ) : (
      <Badge>{difficulty}</Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Question Bank Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Add, edit, and manage questions for your assessment system
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Question
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.total || 0}</div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.aptitude || 0}</div>
                  <div className="text-sm text-gray-600">Aptitude</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.english || 0}</div>
                  <div className="text-sm text-gray-600">English</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building className="w-8 h-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.domain || 0}</div>
                  <div className="text-sm text-gray-600">Domain Specific</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search Questions</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by question text, tags, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  {difficulties.map(diff => (
                    <SelectItem key={diff.value} value={diff.value}>{diff.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Questions Found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || filterCategory || filterDifficulty 
                  ? "No questions match your current filters." 
                  : "Start by adding your first question to the bank."}
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </CardContent>
          </Card>
        ) : (
          questions.map((question: any) => (
            <Card key={question.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{question.type.replace('_', ' ')}</Badge>
                      {getDifficultyBadge(question.difficulty)}
                      <Badge variant="secondary">{question.category.replace('_', ' ')}</Badge>
                      <span className="text-sm text-gray-500">
                        {question.points} pts • {question.timeLimit} min
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{question.question}</h3>
                    
                    {/* Tags */}
                    {question.tags && question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {question.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Options for multiple choice */}
                    {(question.type === 'multiple_choice' || question.type === 'multiple_select') && question.options && (
                      <div className="mt-3 space-y-1">
                        {question.options.map((option: string, index: number) => (
                          <div key={index} className="text-sm text-gray-600">
                            {String.fromCharCode(65 + index)}. {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Question Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Add New Question</h2>
                <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="type">Question Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="domain">Domain</Label>
                    <Select value={formData.domain} onValueChange={(value) => setFormData(prev => ({ ...prev, domain: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {domains.map(domain => (
                          <SelectItem key={domain.value} value={domain.value}>{domain.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {difficulties.map(diff => (
                          <SelectItem key={diff.value} value={diff.value}>{diff.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      min="1"
                      value={formData.points}
                      onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 5 }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      min="1"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 2 }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subCategory">Sub Category</Label>
                  <Input
                    id="subCategory"
                    placeholder="e.g., Mathematics, Grammar, Programming"
                    value={formData.subCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, subCategory: e.target.value }))}
                  />
                </div>

                {/* Question */}
                <div>
                  <Label htmlFor="question">Question Text</Label>
                  <Textarea
                    id="question"
                    placeholder="Enter your question here..."
                    value={formData.question}
                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Options for multiple choice */}
                {(formData.type === 'multiple_choice' || formData.type === 'multiple_select') && (
                  <div>
                    <Label>Answer Options</Label>
                    <div className="space-y-2">
                      {formData.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-8 text-sm text-gray-500">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, options: [...prev.options, ''] }))}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                  </div>
                )}

                {/* Correct Answer */}
                <div>
                  <Label htmlFor="correctAnswer">Correct Answer</Label>
                  {formData.type === 'multiple_choice' ? (
                    <Select value={formData.correctAnswer.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, correctAnswer: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct option" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.options.map((option, index) => (
                          option.trim() && (
                            <SelectItem key={index} value={index.toString()}>
                              {String.fromCharCode(65 + index)}. {option}
                            </SelectItem>
                          )
                        ))}
                      </SelectContent>
                    </Select>
                  ) : formData.type === 'true_false' ? (
                    <Select value={formData.correctAnswer.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, correctAnswer: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select true or false" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="correctAnswer"
                      placeholder="Enter the correct answer"
                      value={formData.correctAnswer}
                      onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    />
                  )}
                </div>

                {/* Explanation */}
                <div>
                  <Label htmlFor="explanation">Explanation (Optional)</Label>
                  <Textarea
                    id="explanation"
                    placeholder="Explain why this is the correct answer..."
                    value={formData.explanation}
                    onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                    rows={2}
                  />
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags</Label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {commonTags.map(tag => (
                        <Button
                          key={tag}
                          type="button"
                          size="sm"
                          variant={formData.tags.includes(tag) ? "default" : "outline"}
                          onClick={() => {
                            if (formData.tags.includes(tag)) {
                              handleRemoveTag(tag);
                            } else {
                              setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                            }
                          }}
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      />
                      <Button type="button" onClick={handleAddTag}>Add</Button>
                    </div>
                    
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-auto p-0 w-4 h-4"
                              onClick={() => handleRemoveTag(tag)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <Label>Keywords</Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add keyword for search"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                      />
                      <Button type="button" onClick={handleAddKeyword}>Add</Button>
                    </div>
                    
                    {formData.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {formData.keywords.map(keyword => (
                          <Badge key={keyword} variant="outline" className="flex items-center gap-1">
                            {keyword}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-auto p-0 w-4 h-4"
                              onClick={() => handleRemoveKeyword(keyword)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Submit Buttons */}
                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addQuestionMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {addQuestionMutation.isPending ? 'Adding...' : 'Add Question'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}