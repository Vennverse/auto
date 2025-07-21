import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Database, 
  Search, 
  Plus, 
  BarChart3, 
  Filter, 
  Brain, 
  Code, 
  BookOpen, 
  Briefcase,
  Users,
  Target,
  Settings
} from 'lucide-react';

interface QuestionBankStats {
  total: number;
  byCategory: Record<string, number>;
  byDomain: Record<string, number>;
  byDifficulty: Record<string, number>;
  byType: Record<string, number>;
}

interface Question {
  id: number;
  questionId: string;
  type: string;
  category: string;
  domain: string;
  subCategory: string;
  difficulty: string;
  question: string;
  options: string[];
  correctAnswer: any;
  explanation: string;
  points: number;
  timeLimit: number;
  tags: string[];
  keywords: string[];
  testCases?: string;
  boilerplate?: string;
  language?: string;
  isActive: boolean;
}

export default function QuestionBank() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for question bank stats
  const { data: stats, isLoading: statsLoading } = useQuery<QuestionBankStats>({
    queryKey: ['/api/question-bank/stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/question-bank/stats');
      return response.json();
    }
  });

  // Query for available domains
  const { data: domains = [] } = useQuery<string[]>({
    queryKey: ['/api/question-bank/domains'],
    queryFn: async () => {
      const response = await apiRequest('/api/question-bank/domains');
      return response.json();
    }
  });

  // Query for available tags
  const { data: tags = [] } = useQuery<string[]>({
    queryKey: ['/api/question-bank/tags'],
    queryFn: async () => {
      const response = await apiRequest('/api/question-bank/tags');
      return response.json();
    }
  });

  // Query for questions with search/filter
  const { data: questions = [], isLoading: questionsLoading, refetch: refetchQuestions } = useQuery<Question[]>({
    queryKey: ['/api/question-bank/search', { searchTerm, selectedCategory, selectedDomain, selectedDifficulty }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedDomain && selectedDomain !== 'all') params.append('domain', selectedDomain);
      if (selectedDifficulty && selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);
      params.append('limit', '50');
      
      const response = await apiRequest(`/api/question-bank/search?${params}`);
      return response.json();
    },
    enabled: activeTab === 'browse' || activeTab === 'search'
  });

  // Initialize question bank mutation
  const initQuestionBank = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/question-bank/init', 'POST');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question bank initialized successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/question-bank/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize question bank",
        variant: "destructive"
      });
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'extreme': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general_aptitude': return <Brain className="w-4 h-4" />;
      case 'english': return <BookOpen className="w-4 h-4" />;
      case 'domain_specific': return <Briefcase className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case 'technical': return <Code className="w-4 h-4" />;
      case 'finance': return <BarChart3 className="w-4 h-4" />;
      case 'marketing': return <Users className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Question Bank</h1>
            <p className="text-gray-600">Comprehensive test question database with dynamic generation</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="browse">Browse Questions</TabsTrigger>
          <TabsTrigger value="generate">Generate Tests</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(stats?.byCategory || {}).length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Domains</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(stats?.byDomain || {}).length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Available Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tags.length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Questions by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats?.byCategory || {}).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category)}
                        <span className="capitalize">{category.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{count}</Badge>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / (stats?.total || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Questions by Domain</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats?.byDomain || {}).map(([domain, count]) => (
                    <div key={domain} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getDomainIcon(domain)}
                        <span className="capitalize">{domain}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{count}</Badge>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(count / (stats?.total || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Question Difficulty Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats?.byDifficulty || {}).map(([difficulty, count]) => (
                  <div key={difficulty} className="text-center">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(difficulty)}`}>
                      {difficulty}
                    </div>
                    <div className="text-2xl font-bold mt-2">{count}</div>
                    <div className="text-sm text-gray-600">{((count / (stats?.total || 1)) * 100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browse" className="mt-6">
          <div className="mb-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general_aptitude">General Aptitude</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="domain_specific">Domain Specific</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {domains.map(domain => (
                    <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="extreme">Extreme</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {questionsLoading ? (
              <div className="text-center py-8">Loading questions...</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No questions found matching your criteria.</div>
            ) : (
              questions.map((question) => (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(question.category)}
                        <Badge variant="outline">{question.type}</Badge>
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                        <Badge variant="outline">{question.points} pts</Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {question.timeLimit} min
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="font-medium">{question.question}</div>
                      
                      {question.options && question.options.length > 0 && (
                        <div className="space-y-1">
                          {question.options.map((option, idx) => (
                            <div key={idx} className="text-sm text-gray-600 pl-4">
                              {String.fromCharCode(65 + idx)}. {option}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.testCases && (
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm font-medium mb-1">Test Cases:</div>
                          <pre className="text-xs text-gray-600 overflow-x-auto">
                            {JSON.stringify(JSON.parse(question.testCases), null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-sm text-gray-500">Tags:</span>
                        <div className="flex flex-wrap gap-1">
                          {question.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="generate" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Generation</CardTitle>
              <p className="text-sm text-gray-600">
                Generate dynamic tests based on job profiles and requirements
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Test generation is available through individual test templates.
                  <br />
                  Go to Test Management to create and generate tests.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Initialize Question Bank</CardTitle>
                <p className="text-sm text-gray-600">
                  Initialize the question bank with comprehensive pre-built questions
                </p>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => initQuestionBank.mutate()}
                  disabled={initQuestionBank.isPending}
                  className="w-full"
                >
                  {initQuestionBank.isPending ? 'Initializing...' : 'Initialize Question Bank'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}