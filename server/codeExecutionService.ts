import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

interface TestCase {
  input: any;
  expected: any;
  description: string;
}

interface CodeExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  testResults?: {
    passed: number;
    total: number;
    details: Array<{
      testCase: TestCase;
      passed: boolean;
      actual?: any;
      error?: string;
    }>;
  };
}

export class CodeExecutionService {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp_executions');
    this.ensureTempDir();
  }

  private async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  async executeJavaScript(code: string, testCases: TestCase[]): Promise<CodeExecutionResult> {
    const executionId = randomUUID();
    const filePath = path.join(this.tempDir, `${executionId}.js`);

    try {
      // Create test wrapper
      const testWrapper = `
        ${code}
        
        const testCases = ${JSON.stringify(testCases)};
        const results = [];
        
        for (const testCase of testCases) {
          try {
            const result = solution(testCase.input);
            results.push({
              input: testCase.input,
              expected: testCase.expected,
              actual: result,
              passed: JSON.stringify(result) === JSON.stringify(testCase.expected),
              description: testCase.description
            });
          } catch (error) {
            results.push({
              input: testCase.input,
              expected: testCase.expected,
              actual: null,
              passed: false,
              error: error.message,
              description: testCase.description
            });
          }
        }
        
        console.log(JSON.stringify(results));
      `;

      await fs.writeFile(filePath, testWrapper);

      // Execute with timeout
      const output = execSync(`timeout 10s node ${filePath}`, {
        encoding: 'utf8',
        timeout: 10000
      });

      const testResults = JSON.parse(output.trim());
      const passed = testResults.filter((r: any) => r.passed).length;

      return {
        success: true,
        testResults: {
          passed,
          total: testCases.length,
          details: testResults
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Code execution failed'
      };
    } finally {
      // Clean up
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error cleaning up temp file:', error);
      }
    }
  }

  async executePython(code: string, testCases: TestCase[]): Promise<CodeExecutionResult> {
    const executionId = randomUUID();
    const filePath = path.join(this.tempDir, `${executionId}.py`);

    try {
      const testWrapper = `
import json
import sys

${code}

test_cases = ${JSON.stringify(testCases)}
results = []

for test_case in test_cases:
    try:
        result = solution(test_case['input'])
        results.append({
            'input': test_case['input'],
            'expected': test_case['expected'],
            'actual': result,
            'passed': result == test_case['expected'],
            'description': test_case['description']
        })
    except Exception as e:
        results.append({
            'input': test_case['input'],
            'expected': test_case['expected'],
            'actual': None,
            'passed': False,
            'error': str(e),
            'description': test_case['description']
        })

print(json.dumps(results))
      `;

      await fs.writeFile(filePath, testWrapper);

      const output = execSync(`timeout 10s python3 ${filePath}`, {
        encoding: 'utf8',
        timeout: 10000
      });

      const testResults = JSON.parse(output.trim());
      const passed = testResults.filter((r: any) => r.passed).length;

      return {
        success: true,
        testResults: {
          passed,
          total: testCases.length,
          details: testResults
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Code execution failed'
      };
    } finally {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error cleaning up temp file:', error);
      }
    }
  }

  async executeCode(code: string, language: string, testCases: TestCase[]): Promise<CodeExecutionResult> {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return this.executeJavaScript(code, testCases);
      case 'python':
      case 'py':
        return this.executePython(code, testCases);
      default:
        return {
          success: false,
          error: `Language ${language} not supported`
        };
    }
  }

  // AI-powered code evaluation using Groq for more complex assessment
  async evaluateWithAI(code: string, question: string, testCases: TestCase[]): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
  }> {
    try {
      const { groqService } = await import('./groqService');
      
      const prompt = `Score code (0-100). Return JSON:
${code}

Q: ${question}
Tests: ${JSON.stringify(testCases)}

{"score": number, "feedback": "brief", "suggestions": ["tip1", "tip2"]}`;

      const response = await groqService.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 300
      });

      const evaluation = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        score: evaluation.score || 0,
        feedback: evaluation.feedback || 'No feedback available',
        suggestions: evaluation.suggestions || []
      };

    } catch (error) {
      console.error('AI evaluation error:', error);
      return {
        score: 0,
        feedback: 'Unable to evaluate code with AI',
        suggestions: []
      };
    }
  }
}

export const codeExecutionService = new CodeExecutionService();