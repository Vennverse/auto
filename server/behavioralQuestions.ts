export interface BehavioralQuestion {
  id: string;
  category: 'leadership' | 'teamwork' | 'problem_solving' | 'adaptability' | 'conflict_resolution' | 'time_management' | 'communication' | 'learning' | 'ethics' | 'decision_making';
  question: string;
  followUps: string[];
  personalityTraits: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  expectedElements: string[];
  situationPrompt?: string;
}

export const behavioralQuestionBank: BehavioralQuestion[] = [
  // Leadership Questions
  {
    id: 'lead_01',
    category: 'leadership',
    question: "Describe a time when you had to lead a project or team without formal authority. How did you motivate others and ensure success?",
    followUps: [
      "What specific strategies did you use to gain buy-in from team members?",
      "How did you handle resistance or pushback?",
      "What would you do differently if faced with a similar situation?"
    ],
    personalityTraits: ['initiative', 'influence', 'responsibility', 'vision'],
    difficulty: 'medium',
    expectedElements: ['specific situation', 'actions taken', 'results achieved', 'lessons learned']
  },
  {
    id: 'lead_02', 
    category: 'leadership',
    question: "Tell me about a time when you had to make an unpopular decision. How did you communicate it and manage the aftermath?",
    followUps: [
      "How did you prepare for the potential backlash?",
      "What communication strategies did you employ?",
      "How did you measure whether your decision was ultimately correct?"
    ],
    personalityTraits: ['decisiveness', 'courage', 'communication', 'integrity'],
    difficulty: 'hard',
    expectedElements: ['decision context', 'stakeholder impact', 'communication approach', 'outcome management']
  },

  // Teamwork Questions
  {
    id: 'team_01',
    category: 'teamwork',
    question: "Describe a situation where you had to work closely with someone whose working style was very different from yours. How did you handle it?",
    followUps: [
      "What specific differences did you notice in working styles?",
      "What adjustments did you make to collaborate effectively?",
      "What did you learn about yourself through this experience?"
    ],
    personalityTraits: ['adaptability', 'empathy', 'collaboration', 'flexibility'],
    difficulty: 'easy',
    expectedElements: ['style differences', 'adaptation strategies', 'relationship building', 'mutual respect']
  },
  {
    id: 'team_02',
    category: 'teamwork',
    question: "Tell me about a time when your team was falling behind on a critical project. What role did you play in getting back on track?",
    followUps: [
      "What were the main factors causing the delays?",
      "How did you assess the situation and prioritize actions?",
      "What was your specific contribution to the solution?"
    ],
    personalityTraits: ['accountability', 'problem-solving', 'initiative', 'collaboration'],
    difficulty: 'medium',
    expectedElements: ['problem identification', 'solution development', 'team coordination', 'results achieved']
  },

  // Problem Solving Questions
  {
    id: 'problem_01',
    category: 'problem_solving',
    question: "Walk me through your approach to solving a complex technical or business problem that had no obvious solution.",
    followUps: [
      "How did you break down the problem into manageable parts?",
      "What resources or help did you seek out?",
      "How did you validate your solution before implementing it?"
    ],
    personalityTraits: ['analytical thinking', 'creativity', 'persistence', 'resourcefulness'],
    difficulty: 'medium',
    expectedElements: ['problem analysis', 'methodology', 'resource utilization', 'solution validation']
  },
  {
    id: 'problem_02',
    category: 'problem_solving',
    question: "Describe a time when you identified a process inefficiency in your workplace. How did you address it?",
    followUps: [
      "How did you first notice the inefficiency?",
      "What data did you gather to support your case?",
      "How did you implement the change and measure its impact?"
    ],
    personalityTraits: ['observation', 'initiative', 'analytical thinking', 'continuous improvement'],
    difficulty: 'easy',
    expectedElements: ['problem identification', 'analysis', 'solution design', 'implementation', 'results measurement']
  },

  // Adaptability Questions
  {
    id: 'adapt_01',
    category: 'adaptability',
    question: "Tell me about a time when you had to quickly learn a new skill or technology for a project. How did you approach it?",
    followUps: [
      "What learning strategies worked best for you?",
      "How did you balance learning time with project deadlines?",
      "How do you stay current with new developments in your field?"
    ],
    personalityTraits: ['learning agility', 'resilience', 'curiosity', 'adaptability'],
    difficulty: 'easy',
    expectedElements: ['learning approach', 'time management', 'application', 'continuous learning mindset']
  },
  {
    id: 'adapt_02',
    category: 'adaptability',
    question: "Describe a major change in your organization or role that you initially resisted. How did you eventually embrace it?",
    followUps: [
      "What were your initial concerns about the change?",
      "What helped shift your perspective?",
      "How do you now approach organizational changes differently?"
    ],
    personalityTraits: ['openness', 'growth mindset', 'resilience', 'self-awareness'],
    difficulty: 'medium',
    expectedElements: ['initial resistance', 'perspective shift', 'adaptation process', 'lessons learned']
  },

  // Conflict Resolution Questions
  {
    id: 'conflict_01',
    category: 'conflict_resolution',
    question: "Tell me about a time when you had a significant disagreement with a colleague or manager. How did you resolve it?",
    followUps: [
      "What was the root cause of the disagreement?",
      "How did you ensure both perspectives were heard?",
      "What was the long-term impact on your working relationship?"
    ],
    personalityTraits: ['communication', 'empathy', 'negotiation', 'emotional intelligence'],
    difficulty: 'medium',
    expectedElements: ['conflict nature', 'resolution approach', 'outcome', 'relationship repair']
  },
  {
    id: 'conflict_02',
    category: 'conflict_resolution',
    question: "Describe a situation where you had to mediate between two team members who were in conflict. What was your approach?",
    followUps: [
      "How did you gather information from both sides?",
      "What strategies did you use to find common ground?",
      "How did you ensure the resolution was sustainable?"
    ],
    personalityTraits: ['neutrality', 'mediation skills', 'fairness', 'leadership'],
    difficulty: 'hard',
    expectedElements: ['situation assessment', 'mediation process', 'solution development', 'follow-up']
  },

  // Time Management Questions
  {
    id: 'time_01',
    category: 'time_management',
    question: "Tell me about a time when you had multiple high-priority tasks with competing deadlines. How did you manage your time and priorities?",
    followUps: [
      "How did you assess which tasks were truly most important?",
      "What tools or methods did you use to stay organized?",
      "How did you communicate with stakeholders about your priorities?"
    ],
    personalityTraits: ['prioritization', 'organization', 'stress management', 'communication'],
    difficulty: 'easy',
    expectedElements: ['priority assessment', 'planning approach', 'execution strategy', 'stakeholder management']
  },

  // Communication Questions
  {
    id: 'comm_01',
    category: 'communication',
    question: "Describe a time when you had to explain a complex technical concept to a non-technical audience. How did you ensure understanding?",
    followUps: [
      "How did you assess your audience's level of technical knowledge?",
      "What analogies or examples did you use to simplify the concept?",
      "How did you confirm that your message was understood?"
    ],
    personalityTraits: ['clarity', 'empathy', 'teaching ability', 'patience'],
    difficulty: 'medium',
    expectedElements: ['audience analysis', 'simplification techniques', 'engagement methods', 'comprehension verification']
  },

  // Learning and Growth Questions
  {
    id: 'learn_01',
    category: 'learning',
    question: "Tell me about a significant professional mistake you made. What did you learn from it and how did it change your approach?",
    followUps: [
      "How did you initially react when you realized the mistake?",
      "What steps did you take to rectify the situation?",
      "How do you now prevent similar mistakes?"
    ],
    personalityTraits: ['accountability', 'growth mindset', 'resilience', 'self-reflection'],
    difficulty: 'medium',
    expectedElements: ['mistake acknowledgment', 'impact assessment', 'corrective actions', 'prevention measures']
  },

  // Ethics and Integrity Questions
  {
    id: 'ethics_01',
    category: 'ethics',
    question: "Describe a situation where you faced an ethical dilemma at work. How did you handle it?",
    followUps: [
      "What factors did you consider in making your decision?",
      "Who did you consult with, if anyone?",
      "How did you ensure your decision aligned with your values?"
    ],
    personalityTraits: ['integrity', 'moral reasoning', 'courage', 'values-driven'],
    difficulty: 'hard',
    expectedElements: ['dilemma description', 'decision-making process', 'value alignment', 'outcome']
  },

  // Decision Making Questions
  {
    id: 'decision_01',
    category: 'decision_making',
    question: "Tell me about a time when you had to make an important decision with incomplete information. What was your process?",
    followUps: [
      "How did you identify what information was most critical?",
      "What assumptions did you have to make?",
      "How did you mitigate the risks of your decision?"
    ],
    personalityTraits: ['analytical thinking', 'risk assessment', 'decisiveness', 'pragmatism'],
    difficulty: 'medium',
    expectedElements: ['information analysis', 'risk assessment', 'decision framework', 'mitigation strategies']
  }
];

export class BehavioralQuestionService {
  selectQuestionsByPersonality(
    personalityType: string,
    difficulty: string = 'medium',
    count: number = 5
  ): BehavioralQuestion[] {
    // Map personality types to relevant categories
    const personalityMapping: Record<string, string[]> = {
      friendly: ['teamwork', 'communication', 'adaptability'],
      professional: ['leadership', 'decision_making', 'problem_solving'],
      challenging: ['conflict_resolution', 'ethics', 'learning']
    };

    const relevantCategories = personalityMapping[personalityType] || 
      ['teamwork', 'communication', 'problem_solving'];

    // Filter questions by categories and difficulty
    let questions = behavioralQuestionBank.filter(q => 
      relevantCategories.includes(q.category) &&
      (difficulty === 'mixed' || q.difficulty === difficulty)
    );

    // If not enough questions, expand to all categories
    if (questions.length < count) {
      questions = behavioralQuestionBank.filter(q => 
        difficulty === 'mixed' || q.difficulty === difficulty
      );
    }

    // Shuffle and select
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  getQuestionsByCategory(category: string, count: number = 3): BehavioralQuestion[] {
    const questions = behavioralQuestionBank.filter(q => q.category === category);
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  generatePersonalityInsights(responses: Array<{question: BehavioralQuestion, response: string}>): {
    traits: Record<string, number>;
    insights: string[];
    recommendations: string[];
  } {
    const traitScores: Record<string, number> = {};
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Analyze trait manifestation in responses
    responses.forEach(({question, response}) => {
      question.personalityTraits.forEach(trait => {
        if (!traitScores[trait]) traitScores[trait] = 0;
        
        // Simple scoring based on response length and keyword presence
        const responseLength = response.length;
        const hasSpecificExamples = /for example|specifically|in particular|such as/i.test(response);
        const hasMetrics = /\d+%|\d+ people|\$\d+|increase|decrease|improve/i.test(response);
        
        let score = 0;
        if (responseLength > 100) score += 20;
        if (responseLength > 200) score += 20;
        if (hasSpecificExamples) score += 30;
        if (hasMetrics) score += 30;
        
        traitScores[trait] += Math.min(100, score);
      });
    });

    // Generate insights based on strongest traits
    const sortedTraits = Object.entries(traitScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    sortedTraits.forEach(([trait, score]) => {
      if (score > 150) {
        insights.push(`Strong ${trait}: Demonstrates clear examples and measurable impact`);
      } else if (score > 100) {
        insights.push(`Moderate ${trait}: Shows awareness but could provide more specific examples`);
      }
    });

    // Generate recommendations
    const weakTraits = Object.entries(traitScores)
      .filter(([,score]) => score < 50)
      .map(([trait]) => trait);

    if (weakTraits.length > 0) {
      recommendations.push(`Consider developing examples for: ${weakTraits.slice(0, 3).join(', ')}`);
    }

    recommendations.push('Practice the STAR method (Situation, Task, Action, Result) for behavioral responses');
    recommendations.push('Include specific metrics and measurable outcomes in your examples');

    return {
      traits: traitScores,
      insights: insights.slice(0, 5),
      recommendations: recommendations.slice(0, 3)
    };
  }
}

export const behavioralQuestionService = new BehavioralQuestionService();