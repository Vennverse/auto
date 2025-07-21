import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building,
  Users,
  Briefcase,
  FileText,
  Target,
  BarChart3,
  Settings,
  Crown,
  Menu,
  X,
  Zap,
  Star,
  Bell,
  GitBranch,
  Video
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  planType: string;
  subscriptionStatus: string;
}

interface RecruiterNavbarProps {
  user?: User;
}

export function RecruiterNavbar({ user }: RecruiterNavbarProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getPlanBadge = (planType: string) => {
    switch (planType) {
      case 'premium':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Crown className="w-3 h-3 mr-1" />Premium</Badge>;
      case 'enterprise':
        return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"><Star className="w-3 h-3 mr-1" />Enterprise</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/recruiter/dashboard",
      icon: BarChart3,
      current: location === "/recruiter/dashboard"
    },
    {
      name: "Job Postings",
      href: "/recruiter/jobs",
      icon: Briefcase,
      current: location === "/recruiter/jobs"
    },
    {
      name: "Applications",
      href: "/recruiter/applications",
      icon: Users,
      current: location === "/recruiter/applications"
    },
    {
      name: "Pipeline",
      href: "/recruiter/pipeline",
      icon: GitBranch,
      current: location === "/recruiter/pipeline"
    },
    {
      name: "Interview Assignments",
      href: "/recruiter/interview-assignments",
      icon: Video,
      current: location === "/recruiter/interview-assignments"
    },
    {
      name: "Test Center",
      href: "/recruiter/tests",
      icon: FileText,
      current: location === "/recruiter/tests"
    },
    {
      name: "Premium Targeting",
      href: "/premium-targeting",
      icon: Target,
      current: location === "/premium-targeting",
      premium: true
    },
    {
      name: "Analytics",
      href: "/recruiter/analytics",
      icon: BarChart3,
      current: location === "/recruiter/analytics",
      premium: true
    }
  ];

  const canAccessFeature = (isPremium: boolean) => {
    if (!isPremium) return true;
    return user?.planType === 'premium' || user?.planType === 'enterprise';
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/recruiter/dashboard">
                  <div className="flex items-center space-x-2 cursor-pointer">
                    <Building className="h-8 w-8 text-blue-600" />
                    <span className="font-bold text-xl text-gray-900 dark:text-white">AutoJobr</span>
                  </div>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const canAccess = canAccessFeature(item.premium || false);
                  
                  return (
                    <Link
                      key={item.name}
                      href={canAccess ? item.href : "/recruiter/premium"}
                      className={`${
                        item.current
                          ? "border-blue-500 text-gray-900 dark:text-white"
                          : "border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                        !canAccess ? "opacity-50" : ""
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                      {item.premium && !canAccess && (
                        <Crown className="w-3 h-3 ml-1 text-amber-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              {/* Plan Badge */}
              {user && getPlanBadge(user.planType)}
              
              {/* Upgrade Button for Free Users */}
              {user?.planType === 'free' && (
                <Link href="/recruiter/premium">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade
                  </Button>
                </Link>
              )}

              {/* Company Info */}
              {user?.companyName && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {user.companyName}
                </div>
              )}

              {/* Settings */}
              <Link href="/recruiter/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const canAccess = canAccessFeature(item.premium || false);
                
                return (
                  <Link
                    key={item.name}
                    href={canAccess ? item.href : "/recruiter/premium"}
                    className={`${
                      item.current
                        ? "bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-200"
                        : "border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                      !canAccess ? "opacity-50" : ""
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Icon className="w-4 h-4 mr-3" />
                      {item.name}
                      {item.premium && !canAccess && (
                        <Crown className="w-3 h-3 ml-2 text-amber-500" />
                      )}
                    </div>
                  </Link>
                );
              })}
              
              {/* Mobile Plan Info */}
              <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Current Plan:</span>
                  {user && getPlanBadge(user.planType)}
                </div>
                {user?.planType === 'free' && (
                  <Link href="/recruiter/premium">
                    <Button className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                      <Zap className="w-4 h-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}