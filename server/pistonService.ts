import axios from 'axios';

interface PistonExecutionResult {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: null | string;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
    signal: null | string;
  };
}

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

export class PistonService {
  private readonly baseUrl = 'https://emkc.org/api/v2/piston';
  private readonly supportedLanguages = {
    javascript: 'javascript',
    python: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    csharp: 'csharp',
    php: 'php',
    ruby: 'ruby',
    go: 'go',
    rust: 'rust',
    kotlin: 'kotlin',
    swift: 'swift',
    typescript: 'typescript'
  };

  async getAvailableLanguages() {
    try {
      const response = await axios.get(`${this.baseUrl}/runtimes`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available languages:', error);
      return [];
    }
  }

  async executeCode(code: string, language: string, testCases: TestCase[] = []): Promise<CodeExecutionResult> {
    const normalizedLanguage = this.supportedLanguages[language.toLowerCase() as keyof typeof this.supportedLanguages];
    
    if (!normalizedLanguage) {
      return {
        success: false,
        error: `Language ${language} not supported`
      };
    }

    try {
      // For test cases, wrap the code with test execution logic
      let wrappedCode = code;
      
      if (testCases.length > 0) {
        wrappedCode = this.wrapCodeWithTests(code, testCases, normalizedLanguage);
      }

      const response = await axios.post(`${this.baseUrl}/execute`, {
        language: normalizedLanguage,
        version: '*', // Use latest version
        files: [
          {
            name: `main.${this.getFileExtension(normalizedLanguage)}`,
            content: wrappedCode
          }
        ]
      });

      const result: PistonExecutionResult = response.data;

      if (result.run.code !== 0) {
        return {
          success: false,
          error: result.run.stderr || 'Code execution failed',
          output: result.run.stdout
        };
      }

      // Parse test results if available
      if (testCases.length > 0) {
        return this.parseTestResults(result.run.stdout, testCases);
      }

      return {
        success: true,
        output: result.run.stdout
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Code execution failed'
      };
    }
  }

  private wrapCodeWithTests(code: string, testCases: TestCase[], language: string): string {
    switch (language) {
      case 'javascript':
        return `
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

      case 'python':
        return `
import json

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

      case 'java':
        return `
import java.util.*;
import com.google.gson.*;

${code}

public class Main {
    public static void main(String[] args) {
        // Test cases would be embedded here
        System.out.println("Test execution not implemented for Java yet");
    }
}
        `;

      default:
        return code;
    }
  }

  private parseTestResults(output: string, testCases: TestCase[]): CodeExecutionResult {
    try {
      const results = JSON.parse(output.trim());
      const passed = results.filter((r: any) => r.passed).length;

      return {
        success: true,
        testResults: {
          passed,
          total: testCases.length,
          details: results
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse test results',
        output
      };
    }
  }

  private getFileExtension(language: string): string {
    const extensions: { [key: string]: string } = {
      javascript: 'js',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      php: 'php',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      kotlin: 'kt',
      swift: 'swift',
      typescript: 'ts'
    };
    return extensions[language] || 'txt';
  }

  // Get language-specific boilerplate code
  getBoilerplate(language: string, functionName: string = 'solution'): string {
    switch (language.toLowerCase()) {
      case 'javascript':
        return `function ${functionName}(input) {
    // Your code here
    return input;
}`;

      case 'python':
        return `def ${functionName}(input):
    # Your code here
    return input`;

      case 'java':
        return `public class Solution {
    public static Object ${functionName}(Object input) {
        // Your code here
        return input;
    }
}`;

      case 'cpp':
        return `#include <iostream>
#include <vector>
using namespace std;

auto ${functionName}(auto input) {
    // Your code here
    return input;
}`;

      case 'python':
        return `def ${functionName}(input):
    # Your code here
    return input`;

      default:
        return `// ${language} boilerplate not available
function ${functionName}(input) {
    // Your code here
    return input;
}`;
    }
  }
}

export const pistonService = new PistonService();