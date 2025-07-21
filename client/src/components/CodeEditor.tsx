import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TestCase {
  input: any;
  expected: any;
  description: string;
}

interface CodeEditorProps {
  question: string;
  language: string;
  testCases: TestCase[];
  boilerplate?: string;
  onSubmit: (code: string, results: any) => void;
  timeLimit?: number;
}

export function CodeEditor({ 
  question, 
  language, 
  testCases, 
  boilerplate = "", 
  onSubmit, 
  timeLimit = 30 
}: CodeEditorProps) {
  const [code, setCode] = useState(boilerplate);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60); // Convert to seconds
  const { toast } = useToast();

  // Timer countdown
  React.useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const runCode = async () => {
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter some code to run",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setResults(null);

    try {
      const response = await apiRequest('/api/execute-code', 'POST', {
        code,
        language,
        testCases,
        question
      });

      const data = await response.json();
      setResults(data);

      if (data.success) {
        toast({
          title: "Code executed successfully",
          description: `${data.testResults.passed}/${data.testResults.total} test cases passed`
        });
      } else {
        toast({
          title: "Execution failed",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute code",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const submitSolution = () => {
    if (!results || !results.success) {
      toast({
        title: "Warning",
        description: "Please run your code successfully before submitting",
        variant: "destructive"
      });
      return;
    }

    onSubmit(code, results);
  };

  const getLanguageTemplate = () => {
    switch (language) {
      case 'javascript':
        return `function solution(input) {
  // Your code here
  return input;
}`;
      case 'python':
        return `def solution(input):
    # Your code here
    return input`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with timer */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Coding Challenge</h3>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className={`font-mono ${timeLeft < 300 ? 'text-red-600' : 'text-gray-600'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle>Problem Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{question}</p>
        </CardContent>
      </Card>

      {/* Test Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Test Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testCases.map((testCase, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded">
                <div className="font-semibold text-sm mb-1">Test Case {index + 1}</div>
                <div className="text-sm text-gray-600 mb-2">{testCase.description}</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Input:</span>
                    <div className="font-mono bg-white p-2 rounded border">
                      {JSON.stringify(testCase.input)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Expected:</span>
                    <div className="font-mono bg-white p-2 rounded border">
                      {JSON.stringify(testCase.expected)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Code Editor ({language})</CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={runCode} 
                disabled={isRunning}
                variant="outline"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                {isRunning ? 'Running...' : 'Run Code'}
              </Button>
              <Button 
                onClick={submitSolution} 
                disabled={!results || !results.success}
                size="sm"
              >
                Submit Solution
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={boilerplate || getLanguageTemplate()}
            className="min-h-[300px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Test Results
              {results.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {results.testResults.passed}/{results.testResults.total} Tests Passed
                  </Badge>
                  {results.testResults.passed === results.testResults.total && (
                    <Badge className="bg-green-100 text-green-800">All Tests Passed!</Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  {results.testResults.details.map((detail: any, index: number) => (
                    <div key={index} className={`p-3 rounded border ${
                      detail.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {detail.passed ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="font-medium text-sm">
                          Test Case {index + 1}: {detail.passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <div>Input: <span className="font-mono">{JSON.stringify(detail.input)}</span></div>
                        <div>Expected: <span className="font-mono">{JSON.stringify(detail.expected)}</span></div>
                        <div>Actual: <span className="font-mono">{JSON.stringify(detail.actual)}</span></div>
                        {detail.error && (
                          <div className="text-red-600">Error: {detail.error}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {results.aiEvaluation && (
                  <div className="mt-4 p-4 bg-blue-50 rounded">
                    <h4 className="font-semibold mb-2">AI Code Review</h4>
                    <div className="space-y-2">
                      <div>Score: <Badge>{results.aiEvaluation.score}/100</Badge></div>
                      <div>Feedback: {results.aiEvaluation.feedback}</div>
                      {results.aiEvaluation.suggestions.length > 0 && (
                        <div>
                          <div className="font-medium">Suggestions:</div>
                          <ul className="list-disc pl-5 text-sm">
                            {results.aiEvaluation.suggestions.map((suggestion: string, i: number) => (
                              <li key={i}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>Execution failed: {results.error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CodeEditor;