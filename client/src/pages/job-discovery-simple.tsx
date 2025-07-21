import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Building, 
  Search,
  Filter,
  Bookmark,
  ExternalLink,
  Star,
  Users,
  Briefcase
} from "lucide-react";
import { motion } from "framer-motion";

export default function JobDiscoveryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    location: "",
    workMode: "",
    experienceLevel: "",
    category: ""
  });

  // Fetch all job postings (existing jobs from companies)
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["/api/jobs/postings"],
  });

  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter((job: any) => {
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = !filters.location || 
      job.location?.toLowerCase().includes(filters.location.toLowerCase());
    
    const matchesWorkMode = !filters.workMode || job.workMode === filters.workMode;
    
    const matchesExperience = !filters.experienceLevel || 
      job.experienceLevel === filters.experienceLevel;

    return matchesSearch && matchesLocation && matchesWorkMode && matchesExperience;
  });

  const handleSaveJob = async (jobId: number) => {
    try {
      // API call to save job (bookmark functionality)
      console.log('Saving job:', jobId);
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const getWorkModeColor = (workMode: string) => {
    switch (workMode) {
      case 'Remote': return 'bg-green-100 text-green-800';
      case 'Hybrid': return 'bg-blue-100 text-blue-800';
      case 'On-site': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceLevelColor = (level: string) => {
    switch (level) {
      case 'Entry-level': return 'bg-yellow-100 text-yellow-800';
      case 'Mid-level': return 'bg-blue-100 text-blue-800';
      case 'Senior': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Discover Your Next Opportunity</h1>
        <p className="text-xl text-muted-foreground">
          Find jobs from top companies actively hiring right now
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by job title, company, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Input
                placeholder="Enter location..."
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Work Mode</label>
              <Select value={filters.workMode} onValueChange={(value) => setFilters(prev => ({ ...prev, workMode: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                  <SelectItem value="On-site">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Experience Level</label>
              <Select value={filters.experienceLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceLevel: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="Entry-level">Entry-level</SelectItem>
                  <SelectItem value="Mid-level">Mid-level</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setFilters({ location: "", workMode: "", experienceLevel: "", category: "" });
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Found {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm">Sort by: Most Recent</span>
        </div>
      </div>

      {/* Job Listings */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No jobs found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job: any, index: number) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          <span className="font-medium">{job.companyName}</span>
                        </div>
                        {job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveJob(job.id)}
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <CardDescription className="text-base">
                    {job.description?.substring(0, 200)}...
                  </CardDescription>

                  {/* Job Details */}
                  <div className="flex flex-wrap items-center gap-2">
                    {job.workMode && (
                      <Badge className={getWorkModeColor(job.workMode)}>
                        {job.workMode}
                      </Badge>
                    )}
                    {job.experienceLevel && (
                      <Badge className={getExperienceLevelColor(job.experienceLevel)}>
                        {job.experienceLevel}
                      </Badge>
                    )}
                    {job.jobType && (
                      <Badge variant="outline">
                        {job.jobType}
                      </Badge>
                    )}
                    {job.salaryRange && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {job.salaryRange}
                      </Badge>
                    )}
                  </div>

                  {/* Skills */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Skills Required:</p>
                      <div className="flex flex-wrap gap-1">
                        {job.skills.slice(0, 6).map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {job.skills.length > 6 && (
                          <Badge variant="secondary" className="text-xs">
                            +{job.skills.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Posted by {job.companyName}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm">
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Load More */}
      {filteredJobs.length > 0 && (
        <div className="text-center">
          <Button variant="outline" size="lg">
            Load More Jobs
          </Button>
        </div>
      )}
    </div>
  );
}