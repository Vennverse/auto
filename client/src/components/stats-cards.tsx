import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Calendar, TrendingUp, Target } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    totalApplications: number;
    interviews: number;
    responseRate: number;
    avgMatchScore: number;
  };
  isLoading: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cardData = [
    {
      title: "Total Applications",
      value: stats?.totalApplications || 0,
      icon: Send,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Interviews",
      value: stats?.interviews || 0,
      icon: Calendar,
      bgColor: "bg-green-100 dark:bg-green-900/20",
      iconColor: "text-green-600",
    },
    {
      title: "Response Rate",
      value: `${stats?.responseRate || 0}%`,
      icon: TrendingUp,
      bgColor: "bg-amber-100 dark:bg-amber-900/20",
      iconColor: "text-amber-600",
    },
    {
      title: "Avg Match Score",
      value: `${stats?.avgMatchScore || 0}%`,
      icon: Target,
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cardData.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {card.value}
                  </p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
