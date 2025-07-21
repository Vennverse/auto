import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building, MapPin, DollarSign, Users, Clock, Briefcase, Eye, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function ViewJob() {
  const params = useParams();
  const jobId = params.id;
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: job, isLoading } = useQuery({
    queryKey: [`/api/jobs/postings/${jobId}`],
    enabled: !!jobId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Job Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The job posting you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation('/')}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(user?.userType === 'recruiter' ? '/recruiter-dashboard' : '/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-8 h-8 text-blue-600" />
                {job.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {job.companyName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <CardDescription className="text-base mt-1">{job.companyName}</CardDescription>
                    </div>
                    <Badge variant={job.isActive ? "default" : "secondary"}>
                      {job.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    {job.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                    )}
                    {job.workMode && (
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {job.workMode}
                      </div>
                    )}
                    {job.jobType && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.jobType}
                      </div>
                    )}
                    {(job.minSalary || job.maxSalary) && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {job.minSalary && job.maxSalary 
                          ? `${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()} ${job.currency || 'USD'}`
                          : job.minSalary 
                          ? `${job.minSalary.toLocaleString()}+ ${job.currency || 'USD'}`
                          : `Up to ${job.maxSalary?.toLocaleString()} ${job.currency || 'USD'}`
                        }
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold mb-3">Job Description</h3>
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {job.description}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements */}
              {job.requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {job.requirements}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Responsibilities */}
              {job.responsibilities && (
                <Card>
                  <CardHeader>
                    <CardTitle>Responsibilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {job.responsibilities}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Benefits */}
              {job.benefits && (
                <Card>
                  <CardHeader>
                    <CardTitle>Benefits & Perks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {job.benefits}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Required Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Job Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Applications</span>
                    </div>
                    <span className="font-semibold">{job.applicationsCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Views</span>
                    </div>
                    <span className="font-semibold">{job.viewsCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Posted</span>
                    </div>
                    <span className="font-semibold text-sm">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {job.experienceLevel && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Experience</span>
                      </div>
                      <span className="font-semibold text-sm">{job.experienceLevel}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {user?.userType === 'recruiter' ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Job</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full" 
                      onClick={() => setLocation(`/recruiter/edit-job/${job.id}`)}
                    >
                      Edit Job
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setLocation('/recruiter-dashboard')}
                    >
                      View Applications
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Apply to this Job</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        // Apply to job functionality
                        if (job.id) {
                          fetch(`/api/jobs/postings/${job.id}/apply`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                          })
                          .then(response => response.json())
                          .then(data => {
                            if (data.id) {
                              toast({
                                title: "Application Submitted",
                                description: "Your application has been submitted successfully!",
                              });
                            } else {
                              toast({
                                title: "Application Failed",
                                description: data.message || "Failed to submit application",
                                variant: "destructive",
                              });
                            }
                          })
                          .catch(error => {
                            toast({
                              title: "Application Failed",
                              description: "An error occurred while submitting your application",
                              variant: "destructive",
                            });
                          });
                        }
                      }}
                    >
                      Apply Now
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setLocation('/')}
                    >
                      Back to Dashboard
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}