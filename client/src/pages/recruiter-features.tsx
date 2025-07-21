import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Target, 
  TestTube, 
  Shield,
  Brain,
  MessageSquare,
  BarChart3,
  Zap,
  CheckCircle,
  TrendingUp,
  Clock,
  Mail,
  Filter,
  Building,
  DollarSign,
  Award,
  Search,
  FileText,
  Globe,
  Bot,
  PlayCircle,
  Eye,
  AlertTriangle,
  Timer,
  CheckSquare,
  BookOpen,
  Cpu,
  UserCheck,
  Headphones,
  Star,
  ArrowRight
} from "lucide-react";

export default function RecruiterFeatures() {
  const handleGetStarted = () => {
    window.location.href = "/auth";
  };

  const features = [
    {
      icon: TestTube,
      title: "Comprehensive Test System",
      description: "Create and manage tests across multiple domains with AI-powered automatic scoring",
      details: [
        "Technical, Finance, Marketing, Sales, HR, and General assessments",
        "AI-powered automatic scoring for all question types",
        "Multiple choice, coding, essays, scenarios, and case studies",
        "Custom question builder with difficulty levels",
        "Template library with platform and custom templates"
      ],
      highlight: "AI Scoring"
    },
    {
      icon: CheckSquare,
      title: "Multi-Candidate Test Assignment",
      description: "Efficiently assign tests to multiple candidates with advanced filtering",
      details: [
        "Checkbox-based multi-candidate selection",
        "Filter candidates by specific job postings",
        "Select All functionality for bulk assignments",
        "Automated email notifications with test links",
        "Due date management and reminders"
      ],
      highlight: "Bulk Assignment"
    },
    {
      icon: Shield,
      title: "Anti-Cheating Protection",
      description: "Advanced proctoring system ensures test integrity",
      details: [
        "Copy-paste prevention with warnings",
        "Tab switching monitoring and alerts",
        "Fullscreen mode enforcement",
        "Right-click blocking",
        "Automatic test submission after 5 violations"
      ],
      highlight: "Secure Testing"
    },
    {
      icon: Timer,
      title: "Real-Time Test Monitoring",
      description: "Track test progress and detect violations in real-time",
      details: [
        "Live test progress tracking",
        "Time monitoring with alerts",
        "Violation detection and logging",
        "Comprehensive scoring analytics",
        "Test completion notifications"
      ],
      highlight: "Live Tracking"
    },
    {
      icon: Target,
      title: "Premium Candidate Targeting",
      description: "Advanced B2B revenue model with precise candidate filtering",
      details: [
        "Education filtering (schools, degrees, GPA)",
        "Experience level and skills matching",
        "Certifications and club memberships",
        "Dynamic pricing $99-$300+ based on precision",
        "Real-time candidate reach estimation"
      ],
      highlight: "B2B Revenue"
    },
    {
      icon: Brain,
      title: "AI-Powered Matching",
      description: "Advanced AI algorithms to find the perfect candidates",
      details: [
        "Job description analysis and skill extraction",
        "Candidate profile matching with scores",
        "Skill gap analysis and recommendations",
        "Cultural fit assessment",
        "Interview preparation tips"
      ],
      highlight: "85%+ Accuracy"
    },
    {
      icon: BarChart3,
      title: "Job Discovery Playlists",
      description: "Spotify-like job browsing with curated playlists",
      details: [
        "Curated job playlists by category",
        "Multi-source aggregation (LinkedIn, Indeed, Glassdoor)",
        "Bookmarking and organization",
        "Advanced search and filtering",
        "Trending opportunities tracking"
      ],
      highlight: "New Feature"
    },
    {
      icon: MessageSquare,
      title: "Candidate Communication",
      description: "Integrated messaging system for seamless recruitment",
      details: [
        "Real-time messaging with candidates",
        "Automated email notifications",
        "Interview scheduling integration",
        "Message templates and quick responses",
        "Communication history tracking"
      ],
      highlight: "Integrated Chat"
    },
    {
      icon: Building,
      title: "Company Profile Management",
      description: "Showcase your company and attract top talent",
      details: [
        "Comprehensive company profiles",
        "Culture and values showcase",
        "Team member highlights",
        "Benefits and perks listing",
        "Company size and industry tags"
      ],
      highlight: "Professional Branding"
    },
    {
      icon: DollarSign,
      title: "Flexible Payment Options",
      description: "Multiple payment methods with competitive pricing",
      details: [
        "Stripe, PayPal, and Razorpay integration",
        "Monthly subscription at $49/month",
        "Premium targeting add-ons",
        "Test retake fees ($5 per attempt)",
        "Usage-based pricing for large teams"
      ],
      highlight: "Competitive Pricing"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive recruitment metrics and insights",
      details: [
        "Application tracking and conversion rates",
        "Candidate quality scoring",
        "Test performance analytics",
        "Time-to-hire metrics",
        "ROI tracking and reporting"
      ],
      highlight: "Data-Driven"
    },
    {
      icon: Zap,
      title: "Workflow Automation",
      description: "Streamline your recruitment process with smart automation",
      details: [
        "Automated candidate screening",
        "Smart job posting distribution",
        "Interview scheduling automation",
        "Follow-up email sequences",
        "Status update notifications"
      ],
      highlight: "Time-Saving"
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$49",
      period: "per month",
      description: "Perfect for small teams and startups",
      features: [
        "Up to 10 job postings",
        "Basic test templates",
        "Email support",
        "Standard analytics",
        "50 candidate profiles"
      ],
      highlight: false
    },
    {
      name: "Professional",
      price: "$99",
      period: "per month",
      description: "Ideal for growing companies",
      features: [
        "Unlimited job postings",
        "Custom test creation",
        "Premium targeting",
        "Advanced analytics",
        "500 candidate profiles",
        "Priority support"
      ],
      highlight: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact sales",
      description: "For large organizations",
      features: [
        "Everything in Professional",
        "Custom integrations",
        "Dedicated account manager",
        "SLA guarantee",
        "Unlimited users",
        "Advanced security"
      ],
      highlight: false
    }
  ];

  const testimonials = [
    {
      name: "David Kim",
      role: "Head of Talent",
      company: "TechCorp",
      content: "AutoJobr's test system helped us reduce hiring time by 60%. The AI scoring is incredibly accurate and the anti-cheating features give us confidence in results.",
      rating: 5
    },
    {
      name: "Jennifer Walsh",
      role: "HR Director",
      company: "FinanceFlow",
      content: "The multi-candidate assignment feature is a game-changer. We can now test 50+ candidates simultaneously with just a few clicks.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Recruitment Lead",
      company: "StartupX",
      content: "Premium targeting helped us find exactly the right candidates. The ROI is incredible - we're saving $50k+ annually on recruitment costs.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AutoJobr for Recruiters</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Features
              </Button>
              <Button variant="ghost" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                Pricing
              </Button>
              <Button onClick={handleGetStarted} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              🚀 New: AI-Powered Test System
            </Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Revolutionize Your Recruitment Process
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The most advanced recruitment platform with AI-powered testing, multi-candidate assignment, 
              anti-cheating protection, and premium targeting. Find the perfect candidates faster than ever.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
                <PlayCircle className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Hire Top Talent</h2>
            <p className="text-xl text-gray-600">Comprehensive tools designed for modern recruitment teams</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {feature.highlight}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-600">Flexible pricing for teams of all sizes</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.highlight ? 'border-blue-500 shadow-lg' : ''}`}>
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold">
                    {plan.price}
                    <span className="text-lg text-gray-500 font-normal">/{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.highlight ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''}`}
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={handleGetStarted}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by Top Companies</h2>
            <p className="text-xl text-gray-600">See what recruitment leaders are saying about AutoJobr</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <CardDescription className="text-gray-600 italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role} at {testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Recruitment?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of companies using AutoJobr to find, test, and hire the best talent faster than ever before.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-blue-600">
              <Headphones className="mr-2 h-5 w-5" />
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}