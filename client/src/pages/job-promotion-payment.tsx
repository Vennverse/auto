import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Zap, CheckCircle, Star, TrendingUp, Users, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import OneTimePaymentGateway from "@/components/OneTimePaymentGateway";

export default function JobPromotionPayment() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch job posting details
  const { data: job, isLoading } = useQuery({
    queryKey: [`/api/recruiter/jobs/${params.id}`],
    enabled: !!params.id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading job details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-red-400">
              <Zap className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Job Not Found</h3>
            <p className="text-gray-600 mb-4">
              The job posting you're trying to promote doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => setLocation('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (job.isPromoted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-green-400">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Job Already Promoted</h3>
            <p className="text-gray-600 mb-4">
              This job posting is already promoted until {new Date(job.promotedUntil).toLocaleDateString()}.
            </p>
            <Button onClick={() => setLocation('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap className="h-8 w-8 text-green-600" />
              <h1 className="text-3xl font-bold">Promote Job Posting</h1>
            </div>
            <p className="text-muted-foreground">
              Boost your job posting visibility with premium promotion for just $10
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Job Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Job Summary
                </CardTitle>
                <CardDescription>
                  Review your job posting details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{job.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {job.companyName} • {job.location}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {job.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Job Type:</span>
                    <Badge variant="secondary">{job.jobType}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Work Mode:</span>
                    <Badge variant="secondary">{job.workMode}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Experience Level:</span>
                    <Badge variant="secondary">{job.experienceLevel || 'Any'}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Status:</span>
                    <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                      Standard Listing
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-500" />
                  Premium Promotion Benefits
                </CardTitle>
                <CardDescription>
                  Get maximum visibility for your job posting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Benefits */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg">
                  <h4 className="font-semibold mb-4 text-green-800 dark:text-green-200">
                    What You Get for $10:
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium">Highlighted in Search Results</div>
                        <div className="text-muted-foreground">Stand out with premium styling and badges</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium">Notifications to Top Job Seekers</div>
                        <div className="text-muted-foreground">Direct notifications sent to qualified candidates</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium">30 Days of Increased Visibility</div>
                        <div className="text-muted-foreground">Extended promotion period for maximum reach</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Eye className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium">Priority Placement</div>
                        <div className="text-muted-foreground">Appear first in job recommendations and searches</div>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* One-Time Payment Gateway */}
                <OneTimePaymentGateway
                  amount={10}
                  currency="USD"
                  purpose="job_promotion"
                  itemId={job.id.toString()}
                  itemName={job.title}
                  description="One-time payment for 30 days of premium job promotion"
                  onPaymentSuccess={(data) => {
                    toast({
                      title: "Job Promoted Successfully!",
                      description: `"${job.title}" is now promoted and will receive increased visibility for 30 days.`,
                    });
                    setLocation('/dashboard');
                  }}
                  onPaymentError={(error) => {
                    toast({
                      title: "Promotion Failed",
                      description: error.message || "Payment could not be processed. Please try again.",
                      variant: "destructive",
                    });
                  }}
                  disabled={isProcessing}
                />
              </CardContent>
            </Card>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => setLocation('/dashboard')}
              className="inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}