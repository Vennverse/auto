import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building, MapPin, MoreHorizontal, ExternalLink, Edit, Trash2, Zap, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  status: string;
  matchScore?: number;
  appliedDate: string;
  jobType?: string;
  workMode?: string;
  salaryRange?: string;
  jobUrl?: string;
  source?: 'internal' | 'extension';
  jobPostingId?: number;
}

interface ApplicationsTableProps {
  applications: Application[];
  isLoading: boolean;
  showActions?: boolean;
  onEdit?: (application: Application) => void;
  onDelete?: (application: Application) => void;
}

export function ApplicationsTable({ applications, isLoading, showActions = false, onEdit, onDelete }: ApplicationsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="ml-auto">
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-foreground mb-2">No applications yet</h3>
        <p className="text-muted-foreground">Start applying to jobs to see them here.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      applied: { label: "Applied", className: "status-applied" },
      under_review: { label: "Under Review", className: "status-under-review" },
      interview: { label: "Interview", className: "status-interview" },
      offer: { label: "Offer", className: "status-offer" },
      rejected: { label: "Rejected", className: "status-rejected" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      className: "bg-secondary text-secondary-foreground" 
    };

    return (
      <Badge className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", config.className)}>
        {config.label}
      </Badge>
    );
  };

  const getMatchScoreColor = (score?: number) => {
    if (!score) return "bg-muted";
    if (score >= 90) return "bg-green-500";
    if (score >= 75) return "bg-blue-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const getSourceBadge = (source?: 'internal' | 'extension') => {
    if (source === 'internal') {
      return (
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
          <Zap className="w-3 h-3 mr-1" />
          Platform
        </Badge>
      );
    }
    if (source === 'extension') {
      return (
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
          <Globe className="w-3 h-3 mr-1" />
          Extension
        </Badge>
      );
    }
    return null;
  };

  return (
    <>
      {/* Mobile Card Layout */}
      <div className="block md:hidden space-y-4">
        {applications.map((application) => (
          <div key={application.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm">{application.jobTitle}</h3>
                <div className="flex items-center text-muted-foreground text-xs mt-1">
                  <Building className="w-3 h-3 mr-1" />
                  <span>{application.company}</span>
                  {application.location && (
                    <>
                      <span className="mx-1">•</span>
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>{application.location}</span>
                    </>
                  )}
                </div>
              </div>
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {application.jobUrl && (
                      <DropdownMenuItem asChild>
                        <a href={application.jobUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Job
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-wrap">
                {getStatusBadge(application.status)}
                {getSourceBadge(application.source)}
                {application.matchScore && (
                  <div className="flex items-center space-x-1">
                    <div className="w-12 bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getMatchScoreColor(application.matchScore)}`}
                        style={{ width: `${application.matchScore}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{application.matchScore}%</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(application.appliedDate), { addSuffix: true })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Company
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Position
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Match
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Status
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Source
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Applied
              </th>
              {showActions && (
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                  Actions
                </th>
              )}
            </tr>
          </thead>
        <tbody className="divide-y divide-border">
          {applications.map((application) => (
            <tr key={application.id} className="hover:bg-muted/50 transition-colors">
              <td className="py-4 px-6 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <Building className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {application.company}
                    </div>
                    {application.location && (
                      <div className="text-sm text-muted-foreground flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {application.location}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-4 px-6 whitespace-nowrap">
                <div className="text-sm font-medium text-foreground">
                  {application.jobTitle}
                </div>
                <div className="text-sm text-muted-foreground">
                  {application.jobType && `${application.jobType} • `}
                  {application.workMode}
                </div>
              </td>
              <td className="py-4 px-6 whitespace-nowrap">
                {application.matchScore ? (
                  <div className="flex items-center">
                    <div className="w-16 bg-muted rounded-full h-2 mr-2">
                      <div 
                        className={`h-2 rounded-full ${getMatchScoreColor(application.matchScore)}`}
                        style={{ width: `${application.matchScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {application.matchScore}%
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </td>
              <td className="py-4 px-6 whitespace-nowrap">
                {getStatusBadge(application.status)}
              </td>
              <td className="py-4 px-6 whitespace-nowrap">
                {getSourceBadge(application.source)}
              </td>
              <td className="py-4 px-6 whitespace-nowrap text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(application.appliedDate), { addSuffix: true })}
              </td>
              {showActions && (
                <td className="py-4 px-6 whitespace-nowrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {application.jobUrl && (
                        <DropdownMenuItem>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Job
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit?.(application)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => onDelete?.(application)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              )}
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </>
  );
}
