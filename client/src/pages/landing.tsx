import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle, 
  Brain, 
  Target, 
  Shield, 
  Zap, 
  Globe, 
  Users, 
  BarChart3, 
  Sparkles, 
  Trophy, 
  Clock, 
  Search,
  FileText,
  Building,
  Star,
  TrendingUp,
  MessageSquare,
  Play,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Rocket,
  Eye,
  Award,
  BookOpen,
  Code,
  Database,
  Settings,
  PlusCircle,
  MapPin,
  DollarSign,
  Calendar,
  Filter,
  Layers,
  Lightbulb,
  PieChart,
  Activity,
  Headphones,
  Mail,
  Heart,
  Smile
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";

// Platform screenshots - using placeholder images for now
const dashboardImage = "data:image/svg+xml;base64," + btoa('<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="#374151" font-family="Arial" font-size="24">Dashboard Preview</text></svg>');
const resumeImage = "data:image/svg+xml;base64," + btoa('<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="#374151" font-family="Arial" font-size="24">Resume Analysis</text></svg>');
const jobMatchImage = "data:image/svg+xml;base64," + btoa('<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="#374151" font-family="Arial" font-size="24">Job Matching</text></svg>');
const applicationImage = "data:image/svg+xml;base64," + btoa('<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="#374151" font-family="Arial" font-size="24">Applications</text></svg>');
const careerAiImage = "data:image/svg+xml;base64," + btoa('<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="#374151" font-family="Arial" font-size="24">Career AI</text></svg>');
const testSystemImage = "data:image/svg+xml;base64," + btoa('<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="#374151" font-family="Arial" font-size="24">Test System</text></svg>');
const recruitingImage = "data:image/svg+xml;base64," + btoa('<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="#374151" font-family="Arial" font-size="24">Recruiting</text></svg>');
const analyticsImage = "data:image/svg+xml;base64," + btoa('<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="#374151" font-family="Arial" font-size="24">Analytics</text></svg>');
const messagingImage = "data:image/svg+xml;base64," + btoa('<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="#374151" font-family="Arial" font-size="24">Messaging</text></svg>');

// Platform Slider Component
const PlatformSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      title: "Application Tracking Dashboard",
      description: "Complete job application management with pipeline visualization, success metrics, and activity tracking",
      image: dashboardImage,
      alt: "Job Applications Dashboard showing pipeline, stats, and recent activity",
      features: [
        "Real-time application pipeline tracking",
        "Success rate and interview analytics",
        "Activity feed with timestamps",
        "One-click application sync"
      ],
      highlight: "Track 5 applications • 0% response rate • 0 interviews scheduled"
    },
    {
      title: "Resume Management & Analysis",
      description: "Upload multiple resumes and get instant AI-powered ATS optimization with detailed scoring",
      image: resumeImage,
      alt: "Resume management interface with upload and analysis features",
      features: [
        "Upload up to 2 resumes simultaneously",
        "40% ATS score with improvement tracking",
        "Instant analysis of strengths and weaknesses",
        "208.3 kB file size optimization"
      ],
      highlight: "40% ATS Score • 2 Strengths • 4 Improvements • 3 Missing Keywords"
    },
    {
      title: "Detailed AI Resume Analysis",
      description: "Comprehensive resume breakdown with ATS scoring, formatting analysis, and actionable recommendations",
      image: applicationImage,
      alt: "Detailed resume analysis showing ATS score, formatting, and recommendations",
      features: [
        "Overall ATS score (40%) with detailed breakdown",
        "Formatting score (60%) with specific issues",
        "Content quality assessment",
        "Missing keywords identification",
        "Keyword suggestions for improvement"
      ],
      highlight: "Missing: programming languages, agile methodologies, cloud platforms"
    },
    {
      title: "Personal Career AI Assistant",
      description: "Get personalized career guidance powered by Groq AI with location-specific market insights",
      image: analyticsImage,
      alt: "Personal Career AI Assistant interface with analysis options",
      features: [
        "CEO career goal setting and planning",
        "5-year timeline with strategic milestones",
        "Location-based market analysis (Bangalore)",
        "Premium AI model access with 30-day trial"
      ],
      highlight: "Powered by Groq AI (llama-3.3-70b-versatile) • Location-specific insights"
    },
    {
      title: "Skills Development Tracking",
      description: "Monitor skill progression with learning resources and career advancement timelines",
      image: careerAiImage,
      alt: "Skills development interface showing progress bars and learning resources",
      features: [
        "Leadership and Management (6/10 → 9/10)",
        "Strategic Planning (5/10 → 8/10)",
        "6-12 month development timelines",
        "Curated learning resources and workshops"
      ],
      highlight: "6-12 month timeline • Online courses • Books • Workshops recommended"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const PlatformMockup = ({ slide }: { slide: typeof slides[0] }) => (
    <div className="relative">
      <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Screenshot Display */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Browser Header */}
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1 bg-white dark:bg-gray-600 rounded-md px-3 py-1 mx-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">autojobr.com</span>
              </div>
            </div>
            
            {/* Screenshot */}
            <div className="bg-gray-50 dark:bg-gray-800">
              <img 
                src={slide.image}
                alt={slide.alt}
                title={slide.title}
                className="w-full h-auto object-contain"
                style={{ maxHeight: '400px' }}
                loading="lazy"
                data-feature={slide.title.toLowerCase().replace(/\s+/g, '-')}
                data-category="platform-screenshot"
                data-description={slide.description}
                itemProp="image"
              />
            </div>
          </div>
        </div>

        {/* Feature Information Panel */}
        <div className="space-y-4">
          {/* Key Highlight */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4">
            <div className="text-white">
              <div className="text-sm font-medium mb-1">Key Metrics</div>
              <div className="text-xs opacity-90">{slide.highlight}</div>
            </div>
          </div>

          {/* Feature List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Key Features
            </h4>
            <ul className="space-y-2">
              {slide.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Button */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="text-center">
              <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Ready to experience this feature?
              </div>
              <Link href="/auth">
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Try It Now
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative max-w-7xl mx-auto">
      {/* Slider Container */}
      <div className="relative overflow-hidden">
        <motion.div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={index} className="w-full flex-shrink-0 px-4">
              <PlatformMockup slide={slide} />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-blue-600 scale-125'
                : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
      >
        <ChevronRight className="w-5 h-5 rotate-180 text-gray-600 dark:text-gray-400" />
      </button>
      
      <button
        onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
      >
        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Feature Title */}
      <motion.div
        key={currentSlide}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mt-8"
      >
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {slides[currentSlide].title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {slides[currentSlide].description}
        </p>
      </motion.div>
    </div>
  );
};

export default function Landing() {
  const { user } = useAuth();

  const handleLogin = () => {
    window.location.href = "/auth";
  };

  // SEO structured data for search engines
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AutoJobr",
    "description": "AI-powered job search platform with resume optimization, intelligent job matching, automated applications, and personalized career guidance",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "url": "https://autojobr.com",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free to start with premium features available"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "12500"
    },
    "image": [
      "https://autojobr.com/assets/image_1752591356271.png",
      "https://autojobr.com/assets/image_1752591359330.png",
      "https://autojobr.com/assets/image_1752591363466.png"
    ],
    "screenshot": [
      "https://autojobr.com/assets/image_1752591356271.png",
      "https://autojobr.com/assets/image_1752591359330.png",
      "https://autojobr.com/assets/image_1752591363466.png",
      "https://autojobr.com/assets/image_1752591366598.png",
      "https://autojobr.com/assets/image_1752591370293.png",
      "https://autojobr.com/assets/image_1752591375218.png",
      "https://autojobr.com/assets/image_1752591380889.png",
      "https://autojobr.com/assets/image_1752591387481.png",
      "https://autojobr.com/assets/image_1752591392801.png"
    ],
    "featureList": [
      "AI-powered resume optimization and ATS scoring",
      "Intelligent job matching with 94% accuracy",
      "Automated job applications with chrome extension",
      "Personal career AI assistant for guidance",
      "Real-time application tracking dashboard",
      "Interview preparation and scheduling",
      "Salary benchmarking and negotiation",
      "Comprehensive skills development tracking",
      "Recruiting tools for hiring managers",
      "Analytics and performance insights"
    ],
    "author": {
      "@type": "Organization",
      "name": "AutoJobr Team"
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Helmet>
        <title>AutoJobr - AI-Powered Job Search Platform | Land Your Dream Job 10x Faster</title>
        <meta name="description" content="AutoJobr combines AI-powered resume optimization, intelligent job matching, automated applications, and personalized career guidance to accelerate your job search success. Join 500K+ users who found their dream jobs faster with 94% match accuracy." />
        <meta name="keywords" content="AI job search, resume optimization, ATS scoring, job matching, career guidance, automated applications, job seeker platform, resume analysis, interview preparation, salary benchmarking, job search automation, career AI assistant" />
        <meta name="author" content="AutoJobr Team" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="canonical" href="https://autojobr.com" />
        
        {/* Open Graph tags for social media sharing */}
        <meta property="og:title" content="AutoJobr - AI-Powered Job Search Platform | Land Your Dream Job 10x Faster" />
        <meta property="og:description" content="Join 500K+ job seekers who found their dream jobs faster with AI-powered resume optimization, intelligent job matching, and automated applications. 94% match accuracy guaranteed." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://autojobr.com" />
        <meta property="og:image" content="https://autojobr.com/assets/image_1752591356271.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="AutoJobr dashboard showing job application tracking, AI-powered resume analysis, and career guidance features" />
        <meta property="og:site_name" content="AutoJobr" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AutoJobr" />
        <meta name="twitter:title" content="AutoJobr - AI-Powered Job Search Platform" />
        <meta name="twitter:description" content="Land your dream job 10x faster with AI-powered resume optimization, intelligent job matching, and automated applications. Join 500K+ successful job seekers." />
        <meta name="twitter:image" content="https://autojobr.com/assets/image_1752591356271.png" />
        <meta name="twitter:image:alt" content="AutoJobr dashboard showing job application tracking and AI-powered career features" />
        
        {/* Additional meta tags for better SEO */}
        <meta name="application-name" content="AutoJobr" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Structured data for search engines */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AutoJobr
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">Reviews</a>
              <Link href="/for-recruiters" className="text-gray-600 hover:text-blue-600 transition-colors">For Recruiters</Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button>
                    Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Button variant="ghost" onClick={handleLogin}>
                    Sign In
                  </Button>
                  <Button onClick={handleLogin} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Start Free
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered Job Search Revolution
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Land Your{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Dream Job
                </span>
                {' '}10x Faster
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                AutoJobr combines AI-powered resume optimization, intelligent job matching, automated applications, 
                and personalized career guidance to accelerate your job search success.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" onClick={handleLogin} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4">
                <Play className="mr-2 h-5 w-5" />
                Start Job Search
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                <Eye className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-16">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>500K+ users</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Platform Showcase Slider */}
      <section 
        className="py-20 bg-white dark:bg-gray-900"
        itemScope
        itemType="https://schema.org/ImageGallery"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
              itemProp="name"
            >
              See AutoJobr in Action
            </h2>
            <p 
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
              itemProp="description"
            >
              Explore how our AI-powered platform transforms your job search experience with real screenshots and detailed feature demonstrations
            </p>
          </motion.div>

          <div itemScope itemType="https://schema.org/ImageObject">
            <PlatformSlider />
          </div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-20"
          >
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">10x</div>
                <div className="text-gray-600 dark:text-gray-300">Faster Job Applications</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">94%</div>
                <div className="text-gray-600 dark:text-gray-300">Average Match Score</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">500K+</div>
                <div className="text-gray-600 dark:text-gray-300">Job Seekers Helped</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-20 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Land Your Dream Job
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              From AI-powered resume optimization to automated applications and career guidance - all in one platform.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Personal Career AI Assistant */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Personal Career AI Assistant</CardTitle>
                  <CardDescription>
                    Get personalized career guidance, skill gap analysis, and strategic job search advice powered by advanced AI.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Career path planning</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Skill gap analysis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Market insights</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Networking strategies</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Resume Optimizer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">AI Resume Optimizer</CardTitle>
                  <CardDescription>
                    Optimize your resume for ATS systems with AI-powered analysis and real-time scoring.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>ATS compatibility scoring</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Keyword optimization</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Format recommendations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Industry-specific tips</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Ranking Test System */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center mb-4">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Ranking Test System</CardTitle>
                  <CardDescription>
                    Prove your skills with comprehensive tests and stand out to recruiters with verified rankings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Coding challenges</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Skill assessments</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Anti-cheat system</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Verified rankings</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Chrome Extension */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Chrome Extension</CardTitle>
                  <CardDescription>
                    Auto-fill applications on 50+ job boards with intelligent form detection and data sync.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>50+ job boards supported</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Auto-fill applications</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Real-time sync</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Application tracking</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Job Matching */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Smart Job Matching</CardTitle>
                  <CardDescription>
                    AI analyzes your profile and recommends jobs with high match scores and success probability.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>AI-powered matching</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Success probability</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Personalized recommendations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Real-time updates</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Analytics Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Analytics Dashboard</CardTitle>
                  <CardDescription>
                    Track your application progress, response rates, and optimize your job search strategy.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Application tracking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Response rate analysis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Performance insights</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Success metrics</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* For Recruiters Section with Auto-Sliding Feature Showcase */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-blue-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Tools for Recruiters
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Find, assess, and hire the best candidates with our comprehensive recruitment platform.
            </p>
          </div>

          {/* Auto-Sliding Feature Showcase */}
          <div className="relative mb-16">
            <div className="flex overflow-hidden">
              <div className="flex animate-slideLoop">
                {/* Slide 1 - Premium Targeting */}
                <div className="flex-none w-full md:w-1/3 px-4">
                  <div className="bg-gradient-to-br from-blue-800/50 to-purple-800/50 backdrop-blur-sm rounded-2xl p-8 h-80 flex flex-col justify-center items-center text-center border border-blue-500/30">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Premium Targeting</h3>
                    <p className="text-gray-300 mb-6">
                      Target candidates by education, skills, experience, and more with our advanced filtering system.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-300">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      <span>$99-$300+ based on targeting precision</span>
                    </div>
                  </div>
                </div>

                {/* Slide 2 - Skill Testing */}
                <div className="flex-none w-full md:w-1/3 px-4">
                  <div className="bg-gradient-to-br from-green-800/50 to-emerald-800/50 backdrop-blur-sm rounded-2xl p-8 h-80 flex flex-col justify-center items-center text-center border border-green-500/30">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                      <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Skill Testing</h3>
                    <p className="text-gray-300 mb-6">
                      Comprehensive testing system with coding challenges, skill assessments, and anti-cheat protection.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-green-300">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>AI-powered scoring & violation detection</span>
                    </div>
                  </div>
                </div>

                {/* Slide 3 - Analytics */}
                <div className="flex-none w-full md:w-1/3 px-4">
                  <div className="bg-gradient-to-br from-orange-800/50 to-red-800/50 backdrop-blur-sm rounded-2xl p-8 h-80 flex flex-col justify-center items-center text-center border border-orange-500/30">
                    <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6">
                      <TrendingUp className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Analytics Dashboard</h3>
                    <p className="text-gray-300 mb-6">
                      Track hiring metrics, candidate pipeline, and optimize your recruitment process with detailed analytics.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-orange-300">
                      <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                      <span>Real-time hiring insights & metrics</span>
                    </div>
                  </div>
                </div>

                {/* Slide 4 - Job Management */}
                <div className="flex-none w-full md:w-1/3 px-4">
                  <div className="bg-gradient-to-br from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-8 h-80 flex flex-col justify-center items-center text-center border border-purple-500/30">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                      <Briefcase className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Job Management</h3>
                    <p className="text-gray-300 mb-6">
                      Post jobs, manage applications, and streamline your hiring process with our intuitive interface.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-purple-300">
                      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                      <span>Automated workflow & candidate tracking</span>
                    </div>
                  </div>
                </div>

                {/* Slide 5 - AI Screening */}
                <div className="flex-none w-full md:w-1/3 px-4">
                  <div className="bg-gradient-to-br from-indigo-800/50 to-blue-800/50 backdrop-blur-sm rounded-2xl p-8 h-80 flex flex-col justify-center items-center text-center border border-indigo-500/30">
                    <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                      <Brain className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">AI Screening</h3>
                    <p className="text-gray-300 mb-6">
                      Automate initial candidate screening with AI-powered resume analysis and skill matching.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-indigo-300">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                      <span>Smart candidate ranking & filtering</span>
                    </div>
                  </div>
                </div>

                {/* Slide 6 - Communication */}
                <div className="flex-none w-full md:w-1/3 px-4">
                  <div className="bg-gradient-to-br from-teal-800/50 to-cyan-800/50 backdrop-blur-sm rounded-2xl p-8 h-80 flex flex-col justify-center items-center text-center border border-teal-500/30">
                    <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6">
                      <MessageSquare className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Communication Hub</h3>
                    <p className="text-gray-300 mb-6">
                      Seamlessly communicate with candidates through our integrated messaging and interview scheduling system.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-teal-300">
                      <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                      <span>Integrated messaging & scheduling</span>
                    </div>
                  </div>
                </div>

                {/* Duplicate first few slides for seamless loop */}
                <div className="flex-none w-full md:w-1/3 px-4">
                  <div className="bg-gradient-to-br from-blue-800/50 to-purple-800/50 backdrop-blur-sm rounded-2xl p-8 h-80 flex flex-col justify-center items-center text-center border border-blue-500/30">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Premium Targeting</h3>
                    <p className="text-gray-300 mb-6">
                      Target candidates by education, skills, experience, and more with our advanced filtering system.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-300">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      <span>$99-$300+ based on targeting precision</span>
                    </div>
                  </div>
                </div>

                <div className="flex-none w-full md:w-1/3 px-4">
                  <div className="bg-gradient-to-br from-green-800/50 to-emerald-800/50 backdrop-blur-sm rounded-2xl p-8 h-80 flex flex-col justify-center items-center text-center border border-green-500/30">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                      <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Skill Testing</h3>
                    <p className="text-gray-300 mb-6">
                      Comprehensive testing system with coding challenges, skill assessments, and anti-cheat protection.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-green-300">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>AI-powered scoring & violation detection</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/for-recruiters">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-4">
                <Building className="mr-2 h-5 w-5" />
                Explore Recruiter Tools
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by 500K+ Professionals
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See how AutoJobr is transforming careers worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "AutoJobr's AI assistant helped me identify skill gaps and create a strategic career plan. 
                  I landed my dream job at Google in just 6 weeks!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">SA</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Sarah Anderson</p>
                    <p className="text-sm text-gray-500">Software Engineer at Google</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "The ranking test system helped me prove my skills to recruiters. 
                  I got 3x more interview calls after completing the assessments."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">MC</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Michael Chen</p>
                    <p className="text-sm text-gray-500">Data Scientist at Meta</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "As a recruiter, AutoJobr's premium targeting helped us find the perfect candidates. 
                  Our hiring time reduced by 60%."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">EJ</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Emily Johnson</p>
                    <p className="text-sm text-gray-500">Head of Talent at Microsoft</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Start free, upgrade when you're ready to accelerate your career
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <Card className="border-0 shadow-lg relative">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">Free</CardTitle>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mt-4">
                  $0
                </div>
                <p className="text-gray-600 dark:text-gray-300">Perfect for getting started</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>AI resume analysis</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Basic job matching</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>5 applications/day</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Application tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Basic career insights</span>
                  </li>
                </ul>
                <Button className="w-full mt-8" variant="outline" onClick={handleLogin}>
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-0 shadow-lg relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">Premium</CardTitle>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mt-4">
                  $10
                  <span className="text-lg text-gray-600 dark:text-gray-300">/month</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">For serious job seekers</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Personal AI Career Assistant</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Unlimited applications</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Advanced job matching</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Ranking test access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" onClick={handleLogin}>
                  <Rocket className="mr-2 h-4 w-4" />
                  Start Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join 500,000+ professionals who've already accelerated their job search with AutoJobr
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4" onClick={handleLogin}>
              <Rocket className="mr-2 h-5 w-5" />
              Start Free Today
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
              <MessageSquare className="mr-2 h-5 w-5" />
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">AutoJobr</span>
              </div>
              <p className="text-gray-400">
                AI-powered job search platform helping professionals land their dream jobs 10x faster.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Resume Optimizer</a></li>
                <li><a href="#" className="hover:text-white">Job Matching</a></li>
                <li><a href="#" className="hover:text-white">Career AI</a></li>
                <li><a href="#" className="hover:text-white">Ranking Tests</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Community</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AutoJobr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}