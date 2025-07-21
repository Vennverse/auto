import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Briefcase, DollarSign, Bookmark, ExternalLink, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobCardProps {
  job: {
    id: number;
    jobTitle: string;
    company: string;
    location?: string;
    jobUrl?: string;
    salary?: string;
    jobType?: string;
    workMode?: string;
    matchScore?: number;
    matchingSkills?: string[];
    missingSkills?: string[];
    jobDescription?: string;
    isBookmarked?: boolean;
    isApplied?: boolean;
  };
}

export function JobCard({ job }: JobCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBookmarked, setIsBookmarked] = useState(job.isBookmarked || false);

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/recommendations/${job.id}/bookmark`);
    },
    onSuccess: () => {
      setIsBookmarked(!isBookmarked);
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    },
  });

  const getMatchScoreColor = (score?: number) => {
    if (!score) return "match-score-poor";
    if (score >= 90) return "match-score-excellent";
    if (score >= 75) return "match-score-good";
    if (score >= 60) return "match-score-fair";
    return "match-score-poor";
  };

  const getMatchScoreText = (score?: number) => {
    if (!score) return "No Match";
    return `${score}% Match`;
  };

  const handleBookmark = () => {
    bookmarkMutation.mutate();
  };

  const handleApply = () => {
    if (job.jobUrl) {
      window.open(job.jobUrl, "_blank");
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{job.company}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center">
                {job.location && (
                  <>
                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className={cn(
            "text-xs sm:text-sm font-semibold px-2 py-1 rounded whitespace-nowrap ml-2",
            getMatchScoreColor(job.matchScore)
          )}>
            {getMatchScoreText(job.matchScore)}
          </div>
        </div>
        
        <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {job.jobTitle}
        </h4>
        
        {job.jobDescription && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {job.jobDescription}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          {job.jobType && (
            <span className="flex items-center">
              <Briefcase className="w-3 h-3 mr-1" />
              {job.jobType}
            </span>
          )}
          {job.workMode && (
            <span className="flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {job.workMode}
            </span>
          )}
          {job.salary && (
            <span className="flex items-center">
              <DollarSign className="w-3 h-3 mr-1" />
              {job.salary}
            </span>
          )}
        </div>
        
        {(job.matchingSkills?.length || job.missingSkills?.length) && (
          <div className="space-y-2 mb-4">
            {job.matchingSkills && job.matchingSkills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {job.matchingSkills.slice(0, 3).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="skill-tag text-xs">
                    {skill}
                  </Badge>
                ))}
                {job.matchingSkills.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{job.matchingSkills.length - 3} more
                  </Badge>
                )}
              </div>
            )}
            {job.missingSkills && job.missingSkills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {job.missingSkills.slice(0, 2).map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs text-amber-600 border-amber-200">
                    {skill}
                  </Badge>
                ))}
                {job.missingSkills.length > 2 && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                    +{job.missingSkills.length - 2} missing
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button 
            className="flex-1 text-sm sm:text-base" 
            onClick={handleApply}
            disabled={job.isApplied}
            size="sm"
          >
            {job.isApplied ? (
              <>
                <Clock className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Applied</span>
                <span className="sm:hidden">Done</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Apply Now</span>
                <span className="sm:hidden">Apply</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBookmark}
            disabled={bookmarkMutation.isPending}
            className={cn(
              isBookmarked && "bg-primary/10 border-primary text-primary"
            )}
          >
            <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
