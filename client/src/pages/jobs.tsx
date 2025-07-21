import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MapPin, 
  Building2, 
  Clock, 
  DollarSign,
  Eye,
  Send,
  Briefcase,
  Filter,
  Star,
  Heart,
  ExternalLink,
  Bookmark,
  TrendingUp,
  Users,
  Zap,
  Calendar,
  Award,
  ChevronRight,
  Layers,
  BarChart3,
  CheckCircle,
  User,
  FileText,
  Settings,
  Grid3X3,
  List,
  SortDesc,
  MapIcon,
  Sparkles,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface JobPosting {
  id: number;
  title: string;
  companyName: string;
  location: string;
  description: string;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  createdAt: string;
  jobType?: string;
  workMode?: string;
  experienceLevel?: string;
  requiredSkills?: string[];
  benefits?: string[];
  isActive: boolean;
  recruiterName?: string;
  applicationsCount?: number;
}

export default function Jobs() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [filterPreferences, setFilterPreferences] = useState({
    location: "",
    jobType: "",
    workMode: "",
    experienceLevel: "",
    salaryRange: "",
    company: "",
    skills: [] as string[],
    category: ""
  });

  // Fetch job postings
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/jobs/postings", searchQuery, filterPreferences],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      Object.entries(filterPreferences).forEach(([key, value]) => {
        if (value && typeof value === 'string') params.append(key, value);
      });
      
      const response = await fetch(`/api/jobs/postings?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
    enabled: isAuthenticated
  });

  // Check applied jobs
  const { data: applications = [] } = useQuery({
    queryKey: ["/api/applications"],
    enabled: isAuthenticated
  });

  // Save job mutation
  const saveJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await fetch(`/api/jobs/${jobId}/save`, {
        method: "POST",
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to save job');
      return response.json();
    },
    onSuccess: (_, jobId) => {
      setSavedJobs(prev => new Set([...prev, jobId]));
      toast({ title: "Job Saved", description: "Job added to your saved list!" });
    }
  });

  // Apply to job mutation
  const applyMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await fetch(`/api/jobs/postings/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ resumeId: null, coverLetter: "" })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to apply to job');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted", 
        description: "Your application has been sent to the recruiter!"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/postings"] });
    },
    onError: (error) => {
      toast({
        title: "Application Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const appliedJobIds = applications ? applications.map((app: any) => app.jobPostingId) : [];
  
  const handleApply = (jobId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to apply for jobs."
      });
      return;
    }
    applyMutation.mutate(jobId);
  };

  const handleSaveJob = (jobId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save jobs."
      });
      return;
    }
    saveJobMutation.mutate(jobId);
  };

  const handleViewJob = (jobId: number) => {
    setLocation(`/jobs/${jobId}`);
  };

  const resetFilters = () => {
    setFilterPreferences({
      location: "",
      jobType: "",
      workMode: "",
      experienceLevel: "",
      salaryRange: "",
      company: "",
      skills: [],
      category: ""
    });
  };

  // Sort jobs
  const sortedJobs = [...jobs].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "salary":
        return (b.maxSalary || 0) - (a.maxSalary || 0);
      case "company":
        return a.companyName.localeCompare(b.companyName);
      default:
        return 0;
    }
  });

  // Enhanced Job Card Component
  const JobCard = ({ job, viewMode }: { job: any; viewMode: "grid" | "list" }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card className={`border-0 shadow-md hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/20 dark:from-gray-900 dark:via-gray-800/50 dark:to-blue-900/10 backdrop-blur-sm overflow-hidden ${
        viewMode === "list" ? "flex" : ""
      }`}>
        <CardContent className={`p-6 ${viewMode === "list" ? "flex items-center w-full" : ""}`}>
          <div className={`space-y-4 ${viewMode === "list" ? "flex items-center justify-between w-full space-y-0" : ""}`}>
            {/* Header */}
            <div className={`flex items-start justify-between ${viewMode === "list" ? "flex-1" : ""}`}>
              <div className={`space-y-2 flex-1 ${viewMode === "list" ? "space-y-1" : ""}`}>
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${
                    viewMode === "list" ? "text-base" : "text-lg"
                  }`}>
                    {job.title}
                  </h3>
                  {job.isBookmarked && (
                    <Badge className="text-xs bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 dark:from-yellow-900/20 dark:to-orange-900/20">
                      <Bookmark className="w-3 h-3 mr-1" />
                      Saved
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium">{job.companyName}</span>
                  {job.location && (
                    <>
                      <span>•</span>
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </>
                  )}
                </div>
              </div>
              
              {viewMode === "grid" && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveJob(job.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={savedJobs.has(job.id)}
                  >
                    <Heart className={`w-4 h-4 ${savedJobs.has(job.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleViewJob(job.id)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Job Details */}
            <div className={`flex flex-wrap gap-2 ${viewMode === "list" ? "flex-1 justify-center" : ""}`}>
              {job.workMode && (
                <Badge variant="secondary" className="text-xs">
                  <Briefcase className="w-3 h-3 mr-1" />
                  {job.workMode}
                </Badge>
              )}
              {job.jobType && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {job.jobType}
                </Badge>
              )}
              {(job.minSalary || job.maxSalary) && (
                <Badge variant="secondary" className="text-xs">
                  <DollarSign className="w-3 h-3 mr-1" />
                  ${job.minSalary || 0}k - ${job.maxSalary || 0}k
                </Badge>
              )}
              {job.experienceLevel && (
                <Badge variant="outline" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  {job.experienceLevel}
                </Badge>
              )}
            </div>

            {/* Description */}
            {viewMode === "grid" && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {job.description}
              </p>
            )}

            {/* Skills */}
            {job.requiredSkills && job.requiredSkills.length > 0 && viewMode === "grid" && (
              <div className="flex flex-wrap gap-1">
                {job.requiredSkills.slice(0, 3).map((skill: string) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {job.requiredSkills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{job.requiredSkills.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Actions */}
            <div className={`flex items-center gap-3 ${viewMode === "list" ? "flex-shrink-0" : ""}`}>
              <span className="text-xs text-muted-foreground">
                {new Date(job.createdAt).toLocaleDateString()}
              </span>
              {viewMode === "list" && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveJob(job.id)}
                    disabled={savedJobs.has(job.id)}
                  >
                    <Heart className={`w-4 h-4 ${savedJobs.has(job.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleViewJob(job.id)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <Button
                size="sm"
                onClick={() => handleApply(job.id)}
                disabled={appliedJobIds.includes(job.id) || applyMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {appliedJobIds.includes(job.id) ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Applied
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Apply
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Please log in to view jobs</h1>
            <Button onClick={() => window.location.href = "/api/login"}>
              Log In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
            Find Your Dream Job
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover opportunities from top companies and take the next step in your career
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs, companies, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-lg border-0 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-12 px-6"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Advanced Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                      <Select value={filterPreferences.location} onValueChange={(value) => setFilterPreferences(prev => ({ ...prev, location: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="new-york">New York</SelectItem>
                          <SelectItem value="san-francisco">San Francisco</SelectItem>
                          <SelectItem value="london">London</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterPreferences.jobType} onValueChange={(value) => setFilterPreferences(prev => ({ ...prev, jobType: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Job Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterPreferences.workMode} onValueChange={(value) => setFilterPreferences(prev => ({ ...prev, workMode: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Work Mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Modes</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="on-site">On-site</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterPreferences.experienceLevel} onValueChange={(value) => setFilterPreferences(prev => ({ ...prev, experienceLevel: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          <SelectItem value="entry">Entry Level</SelectItem>
                          <SelectItem value="mid">Mid Level</SelectItem>
                          <SelectItem value="senior">Senior Level</SelectItem>
                          <SelectItem value="lead">Lead/Principal</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterPreferences.category} onValueChange={(value) => setFilterPreferences(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="tech">Technology</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relevance">Most Relevant</SelectItem>
                          <SelectItem value="recent">Most Recent</SelectItem>
                          <SelectItem value="salary">Highest Salary</SelectItem>
                          <SelectItem value="company">Company A-Z</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button variant="outline" onClick={resetFilters} className="w-full">
                      Clear All Filters
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h2 className="text-2xl font-bold">
              {jobsLoading ? "Loading..." : `${sortedJobs.length} jobs found`}
            </h2>
            <p className="text-muted-foreground">
              {searchQuery && `Results for "${searchQuery}"`}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Job Alerts
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Saved Jobs
            </Button>
          </div>
        </motion.div>

        {/* Jobs Grid/List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
          }`}
        >
          {jobsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-20 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : sortedJobs.length > 0 ? (
            sortedJobs.map((job) => (
              <JobCard key={job.id} job={job} viewMode={viewMode} />
            ))
          ) : (
            <div className="col-span-full">
              <Card className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
                <CardContent className="p-12 text-center">
                  <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Jobs Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or check back later for new opportunities
                  </p>
                  <Button onClick={resetFilters} variant="outline">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>

        {/* Load More Button */}
        {sortedJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12"
          >
            <Button variant="outline" size="lg" className="px-8">
              Load More Jobs
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}