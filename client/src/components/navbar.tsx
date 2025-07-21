import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Rocket, Moon, Sun, User, Settings, LogOut, BarChart3, FileText, Briefcase, Crown, Menu, X, Plus, MessageCircle, Search, Target, Brain, Users, Trophy, Code, Bell, Upload, Zap, HelpCircle, ChevronDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();
  const { user } = useAuth() as { user: any };
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Redirect to landing page after successful logout
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback: still redirect to landing page
      window.location.href = '/';
    }
  };

  // Define navigation items based on user type
  const getNavItems = () => {
    if (!user) {
      // For non-authenticated users
      return [
        { href: "/recruiter-features", label: "For Recruiters", icon: Users },
      ];
    } else if (user?.userType === 'recruiter' || user?.userType === 'company') {
      return [
        { href: "/", label: "Dashboard", icon: BarChart3 },
        { href: "/post-job", label: "Post Job", icon: Plus },
        { href: "/test-assignments", label: "Test Assignments", icon: FileText },
        { href: "/profile", label: "Profile", icon: User },
        { href: "/chat", label: "Messages", icon: MessageCircle },
        { href: "/recruiter-premium", label: "🚀 Upgrade", icon: Crown, premium: true },
      ];
    } else {
      return [
        { href: "/", label: "Dashboard", icon: BarChart3 },
        { href: "/applications", label: "Applications", icon: FileText },
        { href: "/jobs", label: "Jobs", icon: Briefcase },
        { href: "/job-seeker-tests", label: "Tests", icon: FileText },
        { href: "/ranking-tests", label: "Rankings", icon: Trophy },
        { href: "/mock-interview", label: "Practice", icon: Code },
        { href: "/profile", label: "Profile", icon: User },
        { href: "/job-seeker-premium", label: "🚀 Upgrade", icon: Crown, premium: true },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 w-full">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AutoJobr
              </span>
              {user?.planType === 'premium' && (
                <Crown className="w-4 h-4 text-yellow-500" />
              )}
            </Link>
            <div className="hidden md:flex space-x-4 lg:space-x-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      className={cn(
                        "flex items-center space-x-1 text-sm font-medium px-3 py-2 rounded-md transition-all",
                        item.premium 
                          ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold animate-pulse hover:from-yellow-500 hover:to-orange-600 shadow-lg" 
                          : isActive
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", item.premium && "animate-bounce")} />
                      <span>{item.label}</span>
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Search - only show on larger screens for job seekers */}
            {user && user?.userType !== 'recruiter' && (
              <div className="hidden lg:flex relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-1.5 w-64 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      window.location.href = `/jobs?search=${encodeURIComponent(searchQuery.trim())}`;
                    }
                  }}
                />
              </div>
            )}






            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden sm:flex"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
            
            {/* Login button for non-authenticated users */}
            {!user && (
              <Button 
                onClick={() => window.location.href = "/auth"} 
                className="bg-primary hover:bg-primary/90"
              >
                Sign In
              </Button>
            )}

            {/* User dropdown for authenticated users */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="hidden md:flex">
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user?.profileImageUrl || ""} 
                        alt={`${user?.firstName} ${user?.lastName}`} 
                      />
                      <AvatarFallback>
                        {user?.firstName?.[0] && user?.lastName?.[0] 
                          ? `${user.firstName[0]}${user.lastName[0]}` 
                          : user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                        }
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.name || user?.email?.split('@')[0] || 'User'
                      }
                    </p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/subscription">
                  <DropdownMenuItem>
                    <Crown className="mr-2 h-4 w-4" />
                    <span>Subscription</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1 max-h-screen overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors",
                        isActive
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  </Link>
                );
              })}
              
              {/* Mobile theme toggle */}
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="flex items-center space-x-3 w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
                <span>Toggle {theme === "light" ? "Dark" : "Light"} Mode</span>
              </button>
              
              {/* Mobile login button for non-authenticated users */}
              {!user && (
                <div className="border-t border-border pt-4 mt-4">
                  <Button 
                    onClick={() => window.location.href = "/auth"} 
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Sign In
                  </Button>
                </div>
              )}

              {/* Mobile user section */}
              {user && (
                <>
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-center px-3 py-2">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarImage 
                          src={user?.profileImageUrl || ""} 
                          alt={`${user?.firstName} ${user?.lastName}`} 
                        />
                        <AvatarFallback>
                          {user?.firstName?.[0] && user?.lastName?.[0] 
                            ? `${user.firstName[0]}${user.lastName[0]}` 
                            : user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user?.name || user?.email?.split('@')[0] || 'User'
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Log out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
