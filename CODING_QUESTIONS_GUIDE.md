# Coding Questions System - Complete Guide

## Overview

The AutoJobr platform features a comprehensive coding question system that allows recruiters to create, execute, and evaluate coding challenges for candidates. This system includes secure code execution, automated testing, and AI-powered evaluation.

## How It Works

### 1. Question Creation (Recruiter Side)

Recruiters can create coding questions through the Question Builder interface:

**Question Fields:**
- **Question**: Problem statement describing what the candidate needs to solve
- **Language**: Programming language (JavaScript or Python)
- **Test Cases**: JSON array of test cases with input, expected output, and description
- **Boilerplate Code**: Optional starter code template
- **Time Limit**: Maximum time allowed to complete the question
- **Points**: Score value for the question
- **Difficulty**: Easy, Medium, or Hard

**Example Test Cases Format:**
```json
[
  {
    "input": "hello world",
    "expected": "Hello World",
    "description": "Capitalize first letter of each word"
  },
  {
    "input": "javascript",
    "expected": "Javascript",
    "description": "Single word capitalization"
  }
]
```

### 2. Code Execution Engine

The system uses a secure code execution service (`codeExecutionService.ts`) that:

**Security Features:**
- Executes code in isolated temporary files
- 10-second timeout protection
- Automatic cleanup of temporary files
- Sandboxed execution environment

**Supported Languages:**
- **JavaScript**: Uses Node.js runtime
- **Python**: Uses Python 3 runtime

**Execution Process:**
1. Code is wrapped with test runner logic
2. Each test case is executed against the solution
3. Results are compared with expected outputs
4. Detailed feedback is provided for each test case

### 3. Test Taking Experience (Candidate Side)

Candidates interact with the CodeEditor component which provides:

**Features:**
- Real-time code editing with syntax highlighting
- Live timer countdown
- Test case visibility with input/expected output
- Run code functionality to test before submission
- Immediate feedback on test results

**Workflow:**
1. Candidate sees the problem statement
2. Reviews test cases to understand requirements
3. Writes solution in the code editor
4. Runs code to test against provided test cases
5. Submits final solution

### 4. AI-Powered Evaluation

The system includes AI evaluation using Groq:

**Evaluation Criteria:**
- Code correctness and functionality
- Code quality and best practices
- Algorithm efficiency
- Code readability and style

**AI Feedback Includes:**
- Numerical score (0-100)
- Detailed feedback on the solution
- Suggestions for improvement
- Code quality assessment

## API Endpoints

### Code Execution
```
POST /api/execute-code
```

**Request Body:**
```json
{
  "code": "function solution(input) { return input.toUpperCase(); }",
  "language": "javascript",
  "testCases": [
    {
      "input": "hello",
      "expected": "HELLO",
      "description": "Convert to uppercase"
    }
  ],
  "question": "Write a function that converts input to uppercase"
}
```

**Response:**
```json
{
  "success": true,
  "testResults": {
    "passed": 1,
    "total": 1,
    "details": [
      {
        "input": "hello",
        "expected": "HELLO",
        "actual": "HELLO",
        "passed": true,
        "description": "Convert to uppercase"
      }
    ]
  },
  "aiEvaluation": {
    "score": 95,
    "feedback": "Excellent solution with proper implementation",
    "suggestions": ["Consider adding input validation"]
  }
}
```

## Implementation Details

### Database Schema

Coding questions are stored with additional fields:
- `testCases`: JSON string containing test case array
- `boilerplate`: Optional starter code
- `language`: Programming language for the question

### Security Measures

1. **Timeout Protection**: 10-second execution limit
2. **Isolation**: Each execution in separate temporary file
3. **Cleanup**: Automatic file removal after execution
4. **Sandboxing**: Limited system access during execution

### Error Handling

The system handles various error scenarios:
- Compilation errors
- Runtime exceptions
- Timeout errors
- Invalid test case formats
- System resource issues

## Best Practices

### For Recruiters Creating Questions:

1. **Clear Problem Statements**: Write detailed, unambiguous problem descriptions
2. **Comprehensive Test Cases**: Include edge cases and normal scenarios
3. **Appropriate Difficulty**: Match question difficulty to role requirements
4. **Good Examples**: Provide clear input/output examples
5. **Realistic Time Limits**: Allow sufficient time for problem solving

### For System Maintenance:

1. **Regular Cleanup**: Monitor temporary file cleanup
2. **Performance Monitoring**: Track execution times and resource usage
3. **Security Updates**: Keep runtime environments updated
4. **Backup Test Cases**: Maintain test case integrity

## Troubleshooting

### Common Issues:

1. **Code Execution Fails**: Check syntax and runtime environment
2. **Test Cases Not Passing**: Verify expected output format
3. **Timeout Errors**: Optimize code or increase time limits
4. **AI Evaluation Unavailable**: Check Groq API connectivity

### Debug Steps:

1. Test code execution manually
2. Validate test case JSON format
3. Check server logs for detailed errors
4. Verify API endpoint connectivity

## Future Enhancements

Planned improvements include:
- Support for more programming languages (Java, C++, Go)
- Advanced code analysis and plagiarism detection
- Interactive debugging capabilities
- Performance benchmarking
- Code collaboration features

This system provides a robust foundation for technical assessment while maintaining security and providing comprehensive feedback to both recruiters and candidates.