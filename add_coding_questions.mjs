import { db } from './server/db.js';
import { questionBank } from './shared/schema.js';

const codingQuestions = [
  {
    type: 'coding',
    category: 'domain_specific',
    domain: 'technical',
    subCategory: 'algorithms',
    difficulty: 'easy',
    question: 'Write a function that returns the sum of two numbers.',
    correctAnswer: JSON.stringify({
      javascript: 'function add(a, b) { return a + b; }',
      python: 'def add(a, b):\n    return a + b'
    }),
    explanation: 'Simple addition function that takes two parameters and returns their sum.',
    points: 5,
    timeLimit: 10,
    tags: ['javascript', 'python', 'basic', 'math'],
    keywords: ['function', 'sum', 'addition', 'parameters'],
    testCases: JSON.stringify([
      { input: [2, 3], expected: 5, description: 'Adding positive numbers' },
      { input: [-1, 1], expected: 0, description: 'Adding negative and positive' },
      { input: [0, 0], expected: 0, description: 'Adding zeros' }
    ]),
    boilerplate: JSON.stringify({
      javascript: 'function add(a, b) {\n    // Your code here\n}',
      python: 'def add(a, b):\n    # Your code here\n    pass'
    }),
    language: 'javascript,python',
    isActive: true
  },
  {
    type: 'coding',
    category: 'domain_specific',
    domain: 'technical',
    subCategory: 'algorithms',
    difficulty: 'medium',
    question: 'Write a function that reverses a string without using built-in reverse methods.',
    correctAnswer: JSON.stringify({
      javascript: 'function reverseString(str) {\n    let result = "";\n    for (let i = str.length - 1; i >= 0; i--) {\n        result += str[i];\n    }\n    return result;\n}',
      python: 'def reverse_string(s):\n    result = ""\n    for i in range(len(s) - 1, -1, -1):\n        result += s[i]\n    return result'
    }),
    explanation: 'Manual string reversal using loop iteration from end to beginning.',
    points: 10,
    timeLimit: 15,
    tags: ['javascript', 'python', 'strings', 'loops'],
    keywords: ['reverse', 'string', 'iteration', 'loop'],
    testCases: JSON.stringify([
      { input: ['hello'], expected: 'olleh', description: 'Reverse simple string' },
      { input: [''], expected: '', description: 'Reverse empty string' },
      { input: ['a'], expected: 'a', description: 'Reverse single character' }
    ]),
    boilerplate: JSON.stringify({
      javascript: 'function reverseString(str) {\n    // Your code here\n}',
      python: 'def reverse_string(s):\n    # Your code here\n    pass'
    }),
    language: 'javascript,python',
    isActive: true
  },
  {
    type: 'coding',
    category: 'domain_specific',
    domain: 'technical',
    subCategory: 'algorithms',
    difficulty: 'medium',
    question: 'Write a function that finds the largest number in an array.',
    correctAnswer: JSON.stringify({
      javascript: 'function findMax(arr) {\n    if (arr.length === 0) return undefined;\n    let max = arr[0];\n    for (let i = 1; i < arr.length; i++) {\n        if (arr[i] > max) {\n            max = arr[i];\n        }\n    }\n    return max;\n}',
      python: 'def find_max(arr):\n    if not arr:\n        return None\n    max_val = arr[0]\n    for num in arr[1:]:\n        if num > max_val:\n            max_val = num\n    return max_val'
    }),
    explanation: 'Find maximum value in array by iterating through all elements.',
    points: 10,
    timeLimit: 15,
    tags: ['javascript', 'python', 'arrays', 'comparison'],
    keywords: ['maximum', 'array', 'loop', 'comparison'],
    testCases: JSON.stringify([
      { input: [[1, 5, 3, 9, 2]], expected: 9, description: 'Find max in positive numbers' },
      { input: [[-1, -5, -3]], expected: -1, description: 'Find max in negative numbers' },
      { input: [[42]], expected: 42, description: 'Single element array' }
    ]),
    boilerplate: JSON.stringify({
      javascript: 'function findMax(arr) {\n    // Your code here\n}',
      python: 'def find_max(arr):\n    # Your code here\n    pass'
    }),
    language: 'javascript,python',
    isActive: true
  },
  {
    type: 'coding',
    category: 'domain_specific',
    domain: 'technical',
    subCategory: 'algorithms',
    difficulty: 'hard',
    question: 'Write a function that checks if a string is a palindrome (reads the same forwards and backwards).',
    correctAnswer: JSON.stringify({
      javascript: 'function isPalindrome(str) {\n    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, "");\n    let left = 0;\n    let right = cleaned.length - 1;\n    while (left < right) {\n        if (cleaned[left] !== cleaned[right]) {\n            return false;\n        }\n        left++;\n        right--;\n    }\n    return true;\n}',
      python: 'def is_palindrome(s):\n    cleaned = "".join(c.lower() for c in s if c.isalnum())\n    left, right = 0, len(cleaned) - 1\n    while left < right:\n        if cleaned[left] != cleaned[right]:\n            return False\n        left += 1\n        right -= 1\n    return True'
    }),
    explanation: 'Check if string is palindrome by comparing characters from both ends, ignoring case and non-alphanumeric characters.',
    points: 15,
    timeLimit: 25,
    tags: ['javascript', 'python', 'strings', 'algorithms'],
    keywords: ['palindrome', 'string', 'comparison', 'two-pointer'],
    testCases: JSON.stringify([
      { input: ['racecar'], expected: true, description: 'Simple palindrome' },
      { input: ['A man, a plan, a canal: Panama'], expected: true, description: 'Palindrome with spaces and punctuation' },
      { input: ['race a car'], expected: false, description: 'Not a palindrome' }
    ]),
    boilerplate: JSON.stringify({
      javascript: 'function isPalindrome(str) {\n    // Your code here\n}',
      python: 'def is_palindrome(s):\n    # Your code here\n    pass'
    }),
    language: 'javascript,python',
    isActive: true
  },
  {
    type: 'coding',
    category: 'domain_specific',
    domain: 'technical',
    subCategory: 'algorithms',
    difficulty: 'hard',
    question: 'Write a function that implements the Fibonacci sequence (returns the nth Fibonacci number).',
    correctAnswer: JSON.stringify({
      javascript: 'function fibonacci(n) {\n    if (n <= 1) return n;\n    let a = 0, b = 1;\n    for (let i = 2; i <= n; i++) {\n        let temp = a + b;\n        a = b;\n        b = temp;\n    }\n    return b;\n}',
      python: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b'
    }),
    explanation: 'Calculate nth Fibonacci number using iterative approach for efficiency.',
    points: 20,
    timeLimit: 30,
    tags: ['javascript', 'python', 'fibonacci', 'math'],
    keywords: ['fibonacci', 'sequence', 'iteration', 'math'],
    testCases: JSON.stringify([
      { input: [0], expected: 0, description: 'Fibonacci of 0' },
      { input: [1], expected: 1, description: 'Fibonacci of 1' },
      { input: [6], expected: 8, description: 'Fibonacci of 6' }
    ]),
    boilerplate: JSON.stringify({
      javascript: 'function fibonacci(n) {\n    // Your code here\n}',
      python: 'def fibonacci(n):\n    # Your code here\n    pass'
    }),
    language: 'javascript,python',
    isActive: true
  },
  {
    type: 'coding',
    category: 'domain_specific',
    domain: 'technical',
    subCategory: 'data-structures',
    difficulty: 'extreme',
    question: 'Write a function that finds the two numbers in an array that add up to a target sum.',
    correctAnswer: JSON.stringify({
      javascript: 'function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}',
      python: 'def two_sum(nums, target):\n    num_map = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in num_map:\n            return [num_map[complement], i]\n        num_map[num] = i\n    return []'
    }),
    explanation: 'Find two numbers that sum to target using hash map for O(n) time complexity.',
    points: 25,
    timeLimit: 35,
    tags: ['javascript', 'python', 'hash-map', 'algorithms'],
    keywords: ['two-sum', 'hash-map', 'target', 'complement'],
    testCases: JSON.stringify([
      { input: [[2, 7, 11, 15], 9], expected: [0, 1], description: 'Two sum found at beginning' },
      { input: [[3, 2, 4], 6], expected: [1, 2], description: 'Two sum found at middle/end' },
      { input: [[3, 3], 6], expected: [0, 1], description: 'Two sum with duplicates' }
    ]),
    boilerplate: JSON.stringify({
      javascript: 'function twoSum(nums, target) {\n    // Your code here\n}',
      python: 'def two_sum(nums, target):\n    # Your code here\n    pass'
    }),
    language: 'javascript,python',
    isActive: true
  }
];

async function addCodingQuestions() {
  try {
    console.log('Adding coding questions to question bank...');
    
    // Insert all coding questions
    for (const question of codingQuestions) {
      await db.insert(questionBank).values(question);
    }
    
    console.log(`Successfully added ${codingQuestions.length} coding questions!`);
    
    // Verify the questions were added
    const totalQuestions = await db.select({ count: questionBank.id }).from(questionBank);
    console.log(`Total questions in database: ${totalQuestions.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding coding questions:', error);
    process.exit(1);
  }
}

addCodingQuestions();