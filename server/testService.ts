import { storage } from "./storage";
import { sendEmail } from "./emailService";
import { paymentService } from "./paymentService";
import type { InsertTestTemplate, InsertTestAssignment, TestTemplate } from "@shared/schema";

interface TestQuestion {
  id: string;
  type: 'multiple_choice' | 'coding' | 'essay' | 'true_false';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  points: number;
  explanation?: string;
}

export class TestService {
  // Generate predefined test templates for different job profiles
  async createPlatformTestTemplates(): Promise<void> {
    const templates = this.getPredefinedTemplates();
    
    for (const template of templates) {
      try {
        await storage.createTestTemplate(template);
      } catch (error) {
        console.log(`Template ${template.title} might already exist, skipping...`);
      }
    }
  }

  private getPredefinedTemplates(): InsertTestTemplate[] {
    return [
      // Software Engineer Templates
      {
        title: "JavaScript Fundamentals",
        description: "Test covering JavaScript basics, ES6+, and modern programming concepts",
        category: "technical",
        jobProfile: "software_engineer",
        difficultyLevel: "intermediate",
        timeLimit: 45,
        passingScore: 70,
        isGlobal: true,
        questions: this.getJavaScriptQuestions(),
      },
      {
        title: "React Development Assessment",
        description: "Advanced React concepts, hooks, state management, and best practices",
        category: "technical",
        jobProfile: "frontend_developer",
        difficultyLevel: "advanced",
        timeLimit: 60,
        passingScore: 75,
        isGlobal: true,
        questions: this.getReactQuestions(),
      },
      {
        title: "Python Programming Challenge",
        description: "Python fundamentals, data structures, algorithms, and object-oriented programming",
        category: "technical",
        jobProfile: "python_developer",
        difficultyLevel: "intermediate",
        timeLimit: 50,
        passingScore: 70,
        isGlobal: true,
        questions: this.getPythonQuestions(),
      },
      {
        title: "Data Science & Analytics",
        description: "Statistics, data analysis, machine learning concepts, and Python/R",
        category: "technical",
        jobProfile: "data_scientist",
        difficultyLevel: "advanced",
        timeLimit: 75,
        passingScore: 80,
        isGlobal: true,
        questions: this.getDataScienceQuestions(),
      },
      {
        title: "Digital Marketing Fundamentals",
        description: "SEO, SEM, social media marketing, analytics, and campaign management",
        category: "general",
        jobProfile: "marketing",
        difficultyLevel: "intermediate",
        timeLimit: 40,
        passingScore: 65,
        isGlobal: true,
        questions: this.getMarketingQuestions(),
      },
      {
        title: "System Design & Architecture",
        description: "Distributed systems, scalability, microservices, and architectural patterns",
        category: "technical",
        jobProfile: "software_engineer",
        difficultyLevel: "expert",
        timeLimit: 90,
        passingScore: 85,
        isGlobal: true,
        questions: this.getSystemDesignQuestions(),
      },
    ];
  }

  private getJavaScriptQuestions(): TestQuestion[] {
    return [
      {
        id: "js1",
        type: "multiple_choice",
        question: "What is the output of: console.log(typeof NaN)?",
        options: ["number", "NaN", "undefined", "object"],
        correctAnswer: 0,
        points: 5,
        explanation: "NaN is of type 'number' in JavaScript, even though it represents 'Not a Number'."
      },
      {
        id: "js2",
        type: "multiple_choice",
        question: "Which method is used to add elements to the end of an array?",
        options: ["append()", "push()", "add()", "insert()"],
        correctAnswer: 1,
        points: 5,
        explanation: "The push() method adds one or more elements to the end of an array."
      },
      {
        id: "js3",
        type: "coding",
        question: "Write a function that takes an array of numbers and returns the sum of all even numbers.",
        points: 15,
        explanation: "Solution should use filter/reduce or a loop to identify even numbers and sum them."
      },
      {
        id: "js4",
        type: "multiple_choice",
        question: "What does 'this' refer to in an arrow function?",
        options: ["The global object", "The calling object", "The lexical scope", "undefined"],
        correctAnswer: 2,
        points: 10,
        explanation: "Arrow functions inherit 'this' from their lexical scope, not the calling object."
      },
      {
        id: "js5",
        type: "essay",
        question: "Explain the difference between let, const, and var in JavaScript. Provide examples.",
        points: 15,
        explanation: "Should cover scope differences, hoisting, and reassignment rules."
      }
    ];
  }

  private getReactQuestions(): TestQuestion[] {
    return [
      {
        id: "react1",
        type: "multiple_choice",
        question: "Which hook is used to manage state in functional components?",
        options: ["useEffect", "useState", "useContext", "useReducer"],
        correctAnswer: 1,
        points: 5,
        explanation: "useState is the primary hook for managing local state in functional components."
      },
      {
        id: "react2",
        type: "coding",
        question: "Create a custom hook called useCounter that manages a counter with increment, decrement, and reset functions.",
        points: 20,
        explanation: "Should return an object with count value and three functions."
      },
      {
        id: "react3",
        type: "multiple_choice",
        question: "When should you use useCallback?",
        options: ["Always for functions", "To prevent re-renders", "To memoize expensive calculations", "When passing functions to child components"],
        correctAnswer: 3,
        points: 10,
        explanation: "useCallback is useful when passing functions to child components to prevent unnecessary re-renders."
      },
      {
        id: "react4",
        type: "essay",
        question: "Explain the concept of lifting state up in React and when you should use it.",
        points: 15,
        explanation: "Should explain moving state to common ancestor and data flow patterns."
      }
    ];
  }

  private getPythonQuestions(): TestQuestion[] {
    return [
      {
        id: "py1",
        type: "multiple_choice",
        question: "What is the output of: print(3 * '2')?",
        options: ["6", "'222'", "Error", "'32'"],
        correctAnswer: 1,
        points: 5,
        explanation: "String multiplication in Python repeats the string."
      },
      {
        id: "py2",
        type: "coding",
        question: "Write a function that finds the second largest number in a list.",
        points: 15,
        explanation: "Should handle edge cases and return the second largest unique value."
      },
      {
        id: "py3",
        type: "multiple_choice",
        question: "Which data structure would you use for implementing a stack?",
        options: ["tuple", "list", "dict", "set"],
        correctAnswer: 1,
        points: 5,
        explanation: "Lists with append() and pop() methods are perfect for stack operations."
      },
      {
        id: "py4",
        type: "essay",
        question: "Explain the difference between deep copy and shallow copy in Python.",
        points: 10,
        explanation: "Should cover when each is used and the copy module."
      }
    ];
  }

  private getDataScienceQuestions(): TestQuestion[] {
    return [
      {
        id: "ds1",
        type: "multiple_choice",
        question: "What is the primary purpose of cross-validation in machine learning?",
        options: ["Increase accuracy", "Prevent overfitting", "Speed up training", "Reduce data size"],
        correctAnswer: 1,
        points: 10,
        explanation: "Cross-validation helps assess model performance and prevent overfitting."
      },
      {
        id: "ds2",
        type: "essay",
        question: "Explain the difference between supervised and unsupervised learning with examples.",
        points: 15,
        explanation: "Should provide clear definitions and real-world examples."
      },
      {
        id: "ds3",
        type: "multiple_choice",
        question: "Which metric is most appropriate for evaluating a classification model with imbalanced classes?",
        options: ["Accuracy", "Precision", "F1-score", "R-squared"],
        correctAnswer: 2,
        points: 10,
        explanation: "F1-score balances precision and recall, making it ideal for imbalanced datasets."
      },
      {
        id: "ds4",
        type: "coding",
        question: "Write Python code to calculate the correlation coefficient between two variables using pandas.",
        points: 15,
        explanation: "Should use pandas corr() method or numpy corrcoef()."
      }
    ];
  }

  private getMarketingQuestions(): TestQuestion[] {
    return [
      {
        id: "mkt1",
        type: "multiple_choice",
        question: "What does CTR stand for in digital marketing?",
        options: ["Cost To Revenue", "Click Through Rate", "Customer Target Ratio", "Content Traffic Rating"],
        correctAnswer: 1,
        points: 5,
        explanation: "CTR measures the percentage of people who click on a specific link."
      },
      {
        id: "mkt2",
        type: "essay",
        question: "Describe a comprehensive SEO strategy for a new e-commerce website.",
        points: 20,
        explanation: "Should cover on-page, off-page, technical SEO, and content strategy."
      },
      {
        id: "mkt3",
        type: "multiple_choice",
        question: "Which social media platform typically has the highest conversion rate for B2B marketing?",
        options: ["Facebook", "Instagram", "LinkedIn", "Twitter"],
        correctAnswer: 2,
        points: 10,
        explanation: "LinkedIn is specifically designed for professional networking and B2B marketing."
      }
    ];
  }

  private getSystemDesignQuestions(): TestQuestion[] {
    return [
      {
        id: "sd1",
        type: "essay",
        question: "Design a scalable URL shortening service like bit.ly. Explain your architecture, database design, and how you would handle 100M URLs per day.",
        points: 25,
        explanation: "Should cover load balancing, database sharding, caching, and URL encoding strategies."
      },
      {
        id: "sd2",
        type: "multiple_choice",
        question: "What is the primary benefit of using microservices architecture?",
        options: ["Faster development", "Independent scaling", "Reduced complexity", "Lower costs"],
        correctAnswer: 1,
        points: 10,
        explanation: "Microservices allow independent scaling and deployment of different components."
      },
      {
        id: "sd3",
        type: "essay",
        question: "Explain how you would implement eventual consistency in a distributed database system.",
        points: 20,
        explanation: "Should cover CAP theorem, conflict resolution, and practical implementation strategies."
      }
    ];
  }

  // Send test assignment email
  async sendTestAssignmentEmail(
    recipientEmail: string,
    recipientName: string,
    testTitle: string,
    dueDate: Date,
    testUrl: string,
    recruiterName: string
  ): Promise<boolean> {
    const dueDateStr = dueDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Assignment - AutoJobr</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 0 10px; }
          .test-card { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .test-title { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .due-date { color: #e74c3c; font-weight: bold; font-size: 16px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; text-align: center; }
          .cta-button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Test Assignment</h1>
            <p>You've been assigned a skills assessment</p>
          </div>
          
          <div class="content">
            <p>Hello <strong>${recipientName}</strong>,</p>
            
            <p>You have been assigned a skills assessment by <strong>${recruiterName}</strong> as part of your job application process.</p>
            
            <div class="test-card">
              <div class="test-title">${testTitle}</div>
              <p><strong>Due Date:</strong> <span class="due-date">${dueDateStr}</span></p>
              <p>Please complete this test before the deadline to continue with your application.</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> 
              <ul>
                <li>You have until <strong>${dueDateStr}</strong> to complete this test</li>
                <li>Once started, the timer cannot be paused</li>
                <li>Make sure you have a stable internet connection</li>
                <li>You will have the option to retake the test for $5 if needed</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${testUrl}" class="cta-button">Take Test Now</a>
            </div>
            
            <div class="footer">
              <p>This test is part of the AutoJobr platform. If you have any questions, please contact the recruiter directly.</p>
              <p style="color: #999; font-size: 12px;">© 2025 AutoJobr. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmail({
      to: recipientEmail,
      subject: `Skills Assessment Assignment: ${testTitle}`,
      html: emailHtml,
    });
  }

  // Calculate test score
  calculateScore(questions: TestQuestion[], answers: Record<string, any>): number {
    let totalPoints = 0;
    let earnedPoints = 0;

    for (const question of questions) {
      totalPoints += question.points;
      const userAnswer = answers[question.id];

      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        if (userAnswer === question.correctAnswer) {
          earnedPoints += question.points;
        }
      } else if (question.type === 'coding' || question.type === 'essay') {
        // For coding and essay questions, we'll need manual grading or AI assistance
        // For now, give partial credit based on answer length and keywords
        if (userAnswer && typeof userAnswer === 'string' && userAnswer.length > 20) {
          earnedPoints += Math.floor(question.points * 0.7); // 70% for attempting
        }
      }
    }

    return Math.round((earnedPoints / totalPoints) * 100);
  }

  // Process retake payment
  async processRetakePayment(
    assignmentId: number,
    userId: string,
    paymentProvider: 'stripe' | 'paypal' | 'razorpay',
    paymentIntentId: string
  ): Promise<boolean> {
    try {
      let paymentVerified = false;

      switch (paymentProvider) {
        case 'stripe':
          paymentVerified = await paymentService.verifyStripePayment(paymentIntentId);
          break;
        case 'paypal':
          paymentVerified = await paymentService.verifyPayPalOrder(paymentIntentId);
          break;
        case 'razorpay':
          paymentVerified = paymentService.verifyRazorpayPayment(paymentIntentId, '5', 'usd');
          break;
      }

      if (paymentVerified) {
        // Create payment record
        await storage.createTestRetakePayment({
          testAssignmentId: assignmentId,
          userId: userId,
          amount: 500, // $5 in cents
          currency: 'USD',
          paymentProvider: paymentProvider,
          paymentIntentId: paymentIntentId,
          paymentStatus: 'completed',
        });

        // Enable retake
        await storage.updateTestAssignment(assignmentId, {
          retakeAllowed: true,
          retakePaymentId: paymentIntentId,
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error processing retake payment:', error);
      return false;
    }
  }
}

export const testService = new TestService();