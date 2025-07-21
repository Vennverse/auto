import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Heart, 
  ExternalLink, 
  MapPin, 
  Clock, 
  DollarSign, 
  Building2,
  Search,
  Filter,
  Bookmark,
  Users
} from "lucide-react";
import { motion } from "framer-motion";

export default function JobDiscoveryPage() {
  const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    workMode: "",
    experienceLevel: ""
  });

  // Fetch job playlists
  const { data: playlists = [], isLoading: playlistsLoading } = useQuery({
    queryKey: ["/api/job-playlists"],
  });

  // Fetch jobs in selected playlist
  const { data: playlistJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/job-playlists", selectedPlaylist, "jobs"],
    enabled: !!selectedPlaylist,
  });

  // Fetch scraped jobs with filters
  const { data: scrapedJobs = [], isLoading: scrapedJobsLoading } = useQuery({
    queryKey: ["/api/scraped-jobs", filters],
  });

  const handleSaveJob = async (jobId: number, type: 'scraped' | 'posting') => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      
      if (response.ok) {
        // Show success feedback
        console.log('Job saved successfully');
      }
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto py-8 px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🎵 Job Discovery
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
              Discover opportunities like you discover music - curated playlists for every career path
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search jobs, companies, or skills..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="tech">Technology</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.workMode} onValueChange={(value) => setFilters({...filters, workMode: value})}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Work Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modes</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="onsite">On-site</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Tabs defaultValue="playlists" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="playlists">📋 Job Playlists</TabsTrigger>
              <TabsTrigger value="browse">🔍 Browse All Jobs</TabsTrigger>
            </TabsList>

            {/* Playlists Tab */}
            <TabsContent value="playlists" className="space-y-6">
              {!selectedPlaylist ? (
                // Playlist Grid
                <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {playlistsLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded mb-4"></div>
                          <div className="h-8 bg-gray-200 rounded"></div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    playlists?.map((playlist: any) => (
                      <motion.div key={playlist.id} variants={itemVariants}>
                        <Card 
                          className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all cursor-pointer group"
                          onClick={() => setSelectedPlaylist(playlist.id)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                  {playlist.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {playlist.description}
                                </p>
                              </div>
                              <Play className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-4 w-4" />
                                  {playlist.jobsCount} jobs
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {playlist.followersCount} followers
                                </span>
                              </div>
                              {playlist.isFeatured && (
                                <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              ) : (
                // Playlist Jobs View
                <motion.div variants={containerVariants} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedPlaylist(null)}
                      className="flex items-center gap-2"
                    >
                      ← Back to Playlists
                    </Button>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {playlists?.find((p: any) => p.id === selectedPlaylist)?.name}
                    </h2>
                  </div>

                  <div className="grid gap-4">
                    {jobsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i} className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm animate-pulse">
                          <CardContent className="p-6">
                            <div className="h-6 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded mb-4"></div>
                            <div className="flex gap-2">
                              <div className="h-6 w-16 bg-gray-200 rounded"></div>
                              <div className="h-6 w-20 bg-gray-200 rounded"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      playlistJobs?.map((job: any) => (
                        <motion.div key={job.id} variants={itemVariants}>
                          <JobCard job={job} onSave={() => handleSaveJob(job.id, 'scraped')} />
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </TabsContent>

            {/* Browse Tab */}
            <TabsContent value="browse" className="space-y-6">
              <motion.div variants={containerVariants} className="grid gap-4">
                {scrapedJobsLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <Card key={i} className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-6 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded mb-4"></div>
                        <div className="flex gap-2">
                          <div className="h-6 w-16 bg-gray-200 rounded"></div>
                          <div className="h-6 w-20 bg-gray-200 rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  scrapedJobs?.map((job: any) => (
                    <motion.div key={job.id} variants={itemVariants}>
                      <JobCard job={job} onSave={() => handleSaveJob(job.id, 'scraped')} />
                    </motion.div>
                  ))
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

// Job Card Component
function JobCard({ job, onSave }: { job: any; onSave: () => void }) {
  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              {job.title}
            </h3>
            <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">
              {job.company}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              className="flex items-center gap-1"
            >
              <Bookmark className="h-4 w-4" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(job.sourceUrl, '_blank')}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              Apply
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300 mb-4">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
          )}
          {job.workMode && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {job.workMode}
            </span>
          )}
          {job.salaryRange && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {job.salaryRange}
            </span>
          )}
        </div>

        {job.description && (
          <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
            {job.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {job.skills?.slice(0, 5).map((skill: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {job.tags?.slice(0, 3).map((tag: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <span className="text-xs text-gray-500">
            From {job.sourcePlatform}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(job.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}