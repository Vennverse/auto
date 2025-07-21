interface InterviewQuestion {
  id: string;
  question: string;
  type: 'coding' | 'behavioral' | 'system_design';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  hints: string[];
  testCases?: Array<{
    input: any;
    expected: any;
    description: string;
  }>;
  sampleAnswer?: string;
  boilerplate?: string;
  timeLimit?: number; // in minutes
  companies?: string[];
}

export const QUESTION_BANK: InterviewQuestion[] = [
  // ==================== CODING QUESTIONS - EASY ====================
  {
    id: 'c001',
    question: 'Write a function to find the maximum number in an array.',
    type: 'coding',
    difficulty: 'easy',
    category: 'arrays',
    hints: ['Consider using Math.max()', 'You can use reduce() method', 'Loop through the array and keep track of max'],
    testCases: [
      { input: [1, 5, 3, 9, 2], expected: 9, description: 'Basic array' },
      { input: [-1, -5, -3], expected: -1, description: 'All negative numbers' },
      { input: [42], expected: 42, description: 'Single element' }
    ],
    sampleAnswer: 'function solution(arr) { return Math.max(...arr); }',
    timeLimit: 15,
    companies: ['Google', 'Microsoft', 'Amazon']
  },
  {
    id: 'c002',
    question: 'Implement a function to reverse a string.',
    type: 'coding',
    difficulty: 'easy',
    category: 'strings',
    hints: ['Use split(), reverse(), join()', 'Consider using a loop', 'Think about two pointers approach'],
    testCases: [
      { input: 'hello', expected: 'olleh', description: 'Basic string' },
      { input: 'a', expected: 'a', description: 'Single character' },
      { input: '', expected: '', description: 'Empty string' }
    ],
    sampleAnswer: 'function solution(str) { return str.split("").reverse().join(""); }',
    timeLimit: 10,
    companies: ['Facebook', 'Apple', 'Netflix']
  },
  {
    id: 'c003',
    question: 'Check if a number is prime.',
    type: 'coding',
    difficulty: 'easy',
    category: 'math',
    hints: ['Check divisibility from 2 to sqrt(n)', 'Handle edge cases (1, 2)', 'Use modulus operator'],
    testCases: [
      { input: 17, expected: true, description: 'Prime number' },
      { input: 4, expected: false, description: 'Composite number' },
      { input: 1, expected: false, description: 'Edge case: 1' }
    ],
    sampleAnswer: 'function solution(n) { if (n <= 1) return false; for (let i = 2; i <= Math.sqrt(n); i++) { if (n % i === 0) return false; } return true; }',
    timeLimit: 20,
    companies: ['Google', 'Amazon', 'Microsoft']
  },
  {
    id: 'c004',
    question: 'Find the sum of all elements in an array.',
    type: 'coding',
    difficulty: 'easy',
    category: 'arrays',
    hints: ['Use reduce() method', 'Use a for loop', 'Initialize sum to 0'],
    testCases: [
      { input: [1, 2, 3, 4, 5], expected: 15, description: 'Positive numbers' },
      { input: [-1, -2, -3], expected: -6, description: 'Negative numbers' },
      { input: [], expected: 0, description: 'Empty array' }
    ],
    sampleAnswer: 'function solution(arr) { return arr.reduce((sum, num) => sum + num, 0); }',
    timeLimit: 10,
    companies: ['Facebook', 'Twitter', 'LinkedIn']
  },
  {
    id: 'c005',
    question: 'Remove duplicates from an array.',
    type: 'coding',
    difficulty: 'easy',
    category: 'arrays',
    hints: ['Use Set data structure', 'Use filter with indexOf', 'Use Map to track seen elements'],
    testCases: [
      { input: [1, 2, 2, 3, 4, 4, 5], expected: [1, 2, 3, 4, 5], description: 'Array with duplicates' },
      { input: [1, 2, 3], expected: [1, 2, 3], description: 'No duplicates' },
      { input: [], expected: [], description: 'Empty array' }
    ],
    sampleAnswer: 'function solution(arr) { return [...new Set(arr)]; }',
    timeLimit: 15,
    companies: ['Google', 'Apple', 'Amazon']
  },

  // ==================== CODING QUESTIONS - MEDIUM ====================
  {
    id: 'c101',
    question: 'Two Sum: Find two numbers in an array that sum to a target value.',
    type: 'coding',
    difficulty: 'medium',
    category: 'arrays',
    hints: ['Use a hash map for O(n) solution', 'Store complement values', 'Check if complement exists'],
    testCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1], description: 'Basic two sum' },
      { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2], description: 'Different indices' },
      { input: { nums: [3, 3], target: 6 }, expected: [0, 1], description: 'Same numbers' }
    ],
    sampleAnswer: 'function solution({nums, target}) { const map = new Map(); for (let i = 0; i < nums.length; i++) { const complement = target - nums[i]; if (map.has(complement)) return [map.get(complement), i]; map.set(nums[i], i); } return []; }',
    timeLimit: 25,
    companies: ['Facebook', 'Google', 'Amazon']
  },
  {
    id: 'c102',
    question: 'Valid Parentheses: Check if a string of parentheses is valid.',
    type: 'coding',
    difficulty: 'medium',
    category: 'strings',
    hints: ['Use a stack data structure', 'Match opening and closing brackets', 'Check stack is empty at end'],
    testCases: [
      { input: '()', expected: true, description: 'Simple valid' },
      { input: '()[]{} ', expected: true, description: 'Multiple types' },
      { input: '(]', expected: false, description: 'Invalid mix' }
    ],
    sampleAnswer: 'function solution(s) { const stack = []; const pairs = {")": "(", "}": "{", "]": "["}; for (let char of s) { if (char in pairs) { if (stack.pop() !== pairs[char]) return false; } else { stack.push(char); } } return stack.length === 0; }',
    timeLimit: 20,
    companies: ['Microsoft', 'Apple', 'Google']
  },
  {
    id: 'c103',
    question: 'Palindrome Check: Determine if a string is a palindrome.',
    type: 'coding',
    difficulty: 'medium',
    category: 'strings',
    hints: ['Compare characters from both ends', 'Consider case sensitivity', 'Handle spaces and punctuation'],
    testCases: [
      { input: 'racecar', expected: true, description: 'Simple palindrome' },
      { input: 'hello', expected: false, description: 'Not a palindrome' },
      { input: 'A man a plan a canal Panama', expected: true, description: 'Palindrome with spaces' }
    ],
    sampleAnswer: 'function solution(s) { const cleaned = s.replace(/[^A-Za-z0-9]/g, "").toLowerCase(); return cleaned === cleaned.split("").reverse().join(""); }',
    timeLimit: 25,
    companies: ['Amazon', 'Facebook', 'Netflix']
  },
  {
    id: 'c104',
    question: 'Binary Search: Implement binary search algorithm.',
    type: 'coding',
    difficulty: 'medium',
    category: 'algorithms',
    hints: ['Array must be sorted', 'Use two pointers (left, right)', 'Compare with middle element'],
    testCases: [
      { input: { arr: [1, 3, 5, 7, 9], target: 5 }, expected: 2, description: 'Target found' },
      { input: { arr: [1, 3, 5, 7, 9], target: 6 }, expected: -1, description: 'Target not found' },
      { input: { arr: [2], target: 2 }, expected: 0, description: 'Single element' }
    ],
    sampleAnswer: 'function solution({arr, target}) { let left = 0, right = arr.length - 1; while (left <= right) { const mid = Math.floor((left + right) / 2); if (arr[mid] === target) return mid; else if (arr[mid] < target) left = mid + 1; else right = mid - 1; } return -1; }',
    timeLimit: 30,
    companies: ['Google', 'Microsoft', 'Apple']
  },
  {
    id: 'c105',
    question: 'Merge Two Sorted Arrays: Merge two sorted arrays into one.',
    type: 'coding',
    difficulty: 'medium',
    category: 'arrays',
    hints: ['Use two pointers', 'Compare elements from both arrays', 'Handle remaining elements'],
    testCases: [
      { input: { arr1: [1, 3, 5], arr2: [2, 4, 6] }, expected: [1, 2, 3, 4, 5, 6], description: 'Same length' },
      { input: { arr1: [1, 5, 9], arr2: [2, 3, 4, 6, 7] }, expected: [1, 2, 3, 4, 5, 6, 7, 9], description: 'Different lengths' },
      { input: { arr1: [], arr2: [1, 2, 3] }, expected: [1, 2, 3], description: 'Empty first array' }
    ],
    sampleAnswer: 'function solution({arr1, arr2}) { let result = [], i = 0, j = 0; while (i < arr1.length && j < arr2.length) { if (arr1[i] <= arr2[j]) result.push(arr1[i++]); else result.push(arr2[j++]); } return result.concat(arr1.slice(i)).concat(arr2.slice(j)); }',
    timeLimit: 30,
    companies: ['Amazon', 'Google', 'Facebook']
  },

  // ==================== CODING QUESTIONS - HARD ====================
  {
    id: 'c201',
    question: 'Longest Substring Without Repeating Characters: Find the length of the longest substring without repeating characters.',
    type: 'coding',
    difficulty: 'hard',
    category: 'strings',
    hints: ['Use sliding window technique', 'Keep track of character positions', 'Update window when duplicate found'],
    testCases: [
      { input: 'abcabcbb', expected: 3, description: 'abc' },
      { input: 'bbbbb', expected: 1, description: 'Single character' },
      { input: 'pwwkew', expected: 3, description: 'wke' }
    ],
    sampleAnswer: 'function solution(s) { let maxLength = 0, start = 0; const charIndex = new Map(); for (let end = 0; end < s.length; end++) { if (charIndex.has(s[end])) { start = Math.max(charIndex.get(s[end]) + 1, start); } charIndex.set(s[end], end); maxLength = Math.max(maxLength, end - start + 1); } return maxLength; }',
    timeLimit: 45,
    companies: ['Facebook', 'Google', 'Amazon']
  },
  {
    id: 'c202',
    question: 'Median of Two Sorted Arrays: Find the median of two sorted arrays.',
    type: 'coding',
    difficulty: 'hard',
    category: 'algorithms',
    hints: ['Use binary search', 'Find the partition point', 'Ensure left side <= right side'],
    testCases: [
      { input: { nums1: [1, 3], nums2: [2] }, expected: 2.0, description: 'Odd total length' },
      { input: { nums1: [1, 2], nums2: [3, 4] }, expected: 2.5, description: 'Even total length' },
      { input: { nums1: [0, 0], nums2: [0, 0] }, expected: 0.0, description: 'All zeros' }
    ],
    sampleAnswer: 'function solution({nums1, nums2}) { if (nums1.length > nums2.length) return solution({nums1: nums2, nums2: nums1}); const m = nums1.length, n = nums2.length; let left = 0, right = m; while (left <= right) { const partitionX = Math.floor((left + right) / 2); const partitionY = Math.floor((m + n + 1) / 2) - partitionX; const maxLeftX = partitionX === 0 ? -Infinity : nums1[partitionX - 1]; const minRightX = partitionX === m ? Infinity : nums1[partitionX]; const maxLeftY = partitionY === 0 ? -Infinity : nums2[partitionY - 1]; const minRightY = partitionY === n ? Infinity : nums2[partitionY]; if (maxLeftX <= minRightY && maxLeftY <= minRightX) { if ((m + n) % 2 === 0) return (Math.max(maxLeftX, maxLeftY) + Math.min(minRightX, minRightY)) / 2; else return Math.max(maxLeftX, maxLeftY); } else if (maxLeftX > minRightY) right = partitionX - 1; else left = partitionX + 1; } }',
    timeLimit: 60,
    companies: ['Google', 'Microsoft', 'Apple']
  },
  {
    id: 'c203',
    question: 'Trapping Rain Water: Calculate how much water can be trapped after raining.',
    type: 'coding',
    difficulty: 'hard',
    category: 'algorithms',
    hints: ['Use two pointers approach', 'Track max height on left and right', 'Water level = min(leftMax, rightMax)'],
    testCases: [
      { input: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1], expected: 6, description: 'Complex elevation' },
      { input: [4, 2, 0, 3, 2, 5], expected: 9, description: 'Another example' },
      { input: [3, 0, 2, 0, 4], expected: 7, description: 'Simple case' }
    ],
    sampleAnswer: 'function solution(height) { let left = 0, right = height.length - 1; let leftMax = 0, rightMax = 0; let water = 0; while (left < right) { if (height[left] < height[right]) { if (height[left] >= leftMax) leftMax = height[left]; else water += leftMax - height[left]; left++; } else { if (height[right] >= rightMax) rightMax = height[right]; else water += rightMax - height[right]; right--; } } return water; }',
    timeLimit: 50,
    companies: ['Amazon', 'Facebook', 'Google']
  },

  // ==================== BEHAVIORAL QUESTIONS ====================
  {
    id: 'b001',
    question: 'Tell me about a time when you had to work with a difficult team member. How did you handle it?',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'teamwork',
    hints: ['Use the STAR method (Situation, Task, Action, Result)', 'Focus on your actions and communication', 'Show growth and learning'],
    sampleAnswer: 'I once worked with a colleague who was consistently missing deadlines, affecting our sprint goals. I approached them privately to understand their challenges, discovered they were overwhelmed with personal issues, and offered to help redistribute some tasks. I also established regular check-ins to provide support. This improved our team\'s delivery by 40% and strengthened our working relationship.',
    timeLimit: 5,
    companies: ['Google', 'Microsoft', 'Amazon', 'Facebook']
  },
  {
    id: 'b002',
    question: 'Describe a situation where you had to learn a new technology quickly. What was your approach?',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'learning',
    hints: ['Show learning methodology', 'Mention resources used', 'Quantify the outcome'],
    sampleAnswer: 'When our team needed to migrate to React, I had two weeks to become proficient. I created a structured learning plan: spent mornings on documentation and tutorials, afternoons building small projects, and evenings reviewing best practices. I also joined React communities and found a mentor. This approach helped me successfully lead the migration, reducing our app\'s load time by 30%.',
    timeLimit: 5,
    companies: ['Netflix', 'Airbnb', 'Uber', 'Twitter']
  },
  {
    id: 'b003',
    question: 'Tell me about a time when you disagreed with your manager. How did you handle it?',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'conflict_resolution',
    hints: ['Show respect for authority', 'Focus on facts and data', 'Demonstrate professional communication'],
    sampleAnswer: 'My manager wanted to rush a feature release without proper testing. I respectfully requested a meeting and presented data showing potential risks and customer impact. I proposed a compromise: a limited beta release to gather feedback first. This approach caught three critical bugs, and the manager appreciated my initiative. We established a new process for balancing speed with quality.',
    timeLimit: 5,
    companies: ['Apple', 'Google', 'Microsoft', 'Amazon']
  },
  {
    id: 'b004',
    question: 'Describe a project where you took initiative beyond your assigned responsibilities.',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'leadership',
    hints: ['Show proactive thinking', 'Explain the impact', 'Demonstrate ownership'],
    sampleAnswer: 'While working on a client project, I noticed our deployment process was causing frequent downtime. Although it wasn\'t my responsibility, I researched CI/CD solutions and proposed implementing automated deployments. I created a proof of concept during my free time, presented it to the team, and volunteered to lead implementation. This reduced deployment time by 80% and eliminated weekend outages.',
    timeLimit: 5,
    companies: ['Facebook', 'LinkedIn', 'Spotify', 'Slack']
  },
  {
    id: 'b005',
    question: 'Tell me about a time when you failed at something. How did you handle it?',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'failure_learning',
    hints: ['Be honest about the failure', 'Focus on lessons learned', 'Show how you applied learning'],
    sampleAnswer: 'I once underestimated the complexity of a database migration, causing a production outage. I immediately took ownership, communicated transparently with stakeholders, and worked with the team to restore service within 2 hours. I then conducted a thorough post-mortem, implemented better testing procedures, and created a rollback plan. This experience taught me to always have contingency plans and improved our team\'s deployment practices.',
    timeLimit: 5,
    companies: ['Amazon', 'Netflix', 'Uber', 'Airbnb']
  },

  // ==================== SYSTEM DESIGN QUESTIONS ====================
  {
    id: 's001',
    question: 'Design a URL shortener like bit.ly. What are the key components and how would you scale it?',
    type: 'system_design',
    difficulty: 'hard',
    category: 'web_systems',
    hints: ['Consider database design', 'Think about caching', 'Plan for high traffic', 'URL encoding strategies'],
    sampleAnswer: 'Key components: Load balancer, Web servers, Database (URL mappings), Cache (Redis), Analytics service. Use base62 encoding for short URLs, implement rate limiting, and use CDN for global distribution. For scaling: database sharding, read replicas, distributed caching, and microservices architecture.',
    timeLimit: 45,
    companies: ['Google', 'Facebook', 'Amazon', 'Twitter']
  },
  {
    id: 's002',
    question: 'How would you design a chat application like WhatsApp? Focus on real-time messaging.',
    type: 'system_design',
    difficulty: 'hard',
    category: 'real_time_systems',
    hints: ['WebSocket connections', 'Message queuing', 'Database schema', 'Push notifications'],
    sampleAnswer: 'Architecture: WebSocket servers for real-time communication, message queues (Kafka/RabbitMQ), NoSQL database for message storage, Redis for session management. Implement message status tracking (sent/delivered/read), end-to-end encryption, and push notification services for offline users. Use horizontal scaling and load balancing for high availability.',
    timeLimit: 45,
    companies: ['WhatsApp', 'Facebook', 'Telegram', 'Signal']
  },
  {
    id: 's003',
    question: 'Design a distributed cache system like Redis. How would you handle consistency and availability?',
    type: 'system_design',
    difficulty: 'hard',
    category: 'distributed_systems',
    hints: ['Consistent hashing', 'Replication strategies', 'CAP theorem', 'Failure handling'],
    sampleAnswer: 'Use consistent hashing for data distribution, implement master-slave replication for high availability, use heartbeat mechanisms for failure detection. For consistency: eventual consistency with conflict resolution, write-through/write-behind caching strategies. Include monitoring, metrics collection, and automatic failover mechanisms.',
    timeLimit: 50,
    companies: ['Redis Labs', 'Amazon', 'Google', 'Microsoft']
  },
  {
    id: 's004',
    question: 'Design a social media feed system like Facebook\'s news feed. How would you personalize and scale it?',
    type: 'system_design',
    difficulty: 'hard',
    category: 'social_systems',
    hints: ['Feed generation strategies', 'Content ranking algorithms', 'Caching strategies', 'Real-time updates'],
    sampleAnswer: 'Hybrid approach: push model for active users, pull model for passive users. Use ML algorithms for content ranking, implement timeline generation service, Redis for feed caching. For scaling: content delivery networks, database sharding, and microservices. Include real-time updates via WebSockets and notification services.',
    timeLimit: 50,
    companies: ['Facebook', 'Twitter', 'Instagram', 'LinkedIn']
  },
  {
    id: 's005',
    question: 'Design a video streaming platform like YouTube. How would you handle video processing and delivery?',
    type: 'system_design',
    difficulty: 'hard',
    category: 'media_systems',
    hints: ['Video encoding/transcoding', 'CDN usage', 'Storage systems', 'Recommendation engine'],
    sampleAnswer: 'Components: Upload service, transcoding pipeline, CDN for video delivery, metadata database, recommendation engine. Use cloud storage for video files, implement multiple quality formats, geographic content distribution. For scaling: horizontal scaling of services, caching strategies, and load balancing. Include analytics and monitoring systems.',
    timeLimit: 50,
    companies: ['YouTube', 'Netflix', 'Twitch', 'Vimeo']
  }
];

// Helper functions for question selection
export function getQuestionsByType(type: 'coding' | 'behavioral' | 'system_design'): InterviewQuestion[] {
  return QUESTION_BANK.filter(q => q.type === type);
}

export function getQuestionsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): InterviewQuestion[] {
  return QUESTION_BANK.filter(q => q.difficulty === difficulty);
}

export function getQuestionsByCategory(category: string): InterviewQuestion[] {
  return QUESTION_BANK.filter(q => q.category === category);
}

export function getQuestionsByCompany(company: string): InterviewQuestion[] {
  return QUESTION_BANK.filter(q => q.companies?.includes(company));
}

export function getRandomQuestions(
  type: 'coding' | 'behavioral' | 'system_design',
  difficulty: 'easy' | 'medium' | 'hard',
  count: number
): InterviewQuestion[] {
  const filtered = QUESTION_BANK.filter(q => q.type === type && q.difficulty === difficulty);
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function getQuestionById(id: string): InterviewQuestion | undefined {
  return QUESTION_BANK.find(q => q.id === id);
}

// Export the question bank data for external use
export const questionBank = QUESTION_BANK;

// Generate test questions helper functions
export function generateTestQuestions(
  type: 'coding' | 'behavioral' | 'system_design',
  difficulty: 'easy' | 'medium' | 'hard',
  count: number
): InterviewQuestion[] {
  return getRandomQuestions(type, difficulty, count);
}

export function getQuestionsByDomain(domain: string): InterviewQuestion[] {
  return getQuestionsByCategory(domain);
}