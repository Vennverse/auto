import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Github, Mail, Linkedin, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get redirect URL from query params or current path
  const getRedirectUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    if (redirect) {
      return decodeURIComponent(redirect);
    }
    // If no redirect param, check if we came from an interview URL
    const currentPath = window.location.pathname;
    if (currentPath.includes('/virtual-interview/') || currentPath.includes('/mock-interview/')) {
      return currentPath;
    }
    return '/';
  };
  const [availableProviders, setAvailableProviders] = useState({
    google: false,
    github: false,
    linkedin: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    // Check which OAuth providers are configured
    const checkProviders = async () => {
      try {
        const response = await fetch('/api/auth/providers');
        const data = await response.json();
        // Handle the nested response format from the backend
        setAvailableProviders(data.providers || data);
      } catch (error) {
        console.error('Failed to check provider availability:', error);
      }
    };
    
    checkProviders();
  }, []);

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      
      const data = await response.json();
      
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        console.error('Auth failed:', data.message);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setIsLoading(false);
    }
  };



  const handleEmailLogin = async () => {
    if (!formData.email || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/email/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        window.location.href = getRedirectUrl();
      } else if (response.status === 403 && data.requiresVerification) {
        // Email verification required
        setLocation(`/email-verification?email=${encodeURIComponent(formData.email)}`);
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.firstName || !formData.lastName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/email/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to email verification page
        setLocation(`/email-verification?email=${encodeURIComponent(formData.email)}`);
      } else {
        toast({
          title: "Signup Failed",
          description: data.message || "Failed to create account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Signup Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 max-w-6xl w-full gap-8">
        {/* Left side - Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome to AutoJobr</CardTitle>
            <CardDescription className="text-center">
              Choose your preferred way to sign in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Email Login/Signup Tabs */}
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleEmailLogin}
                  disabled={isLoading}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Sign in with Email
                </Button>
                
                <div className="text-center">
                  <Button 
                    variant="link"
                    className="text-sm text-muted-foreground p-0 h-auto"
                    onClick={() => setLocation('/forgot-password')}
                  >
                    Forgot your password?
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                      id="first-name"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                      id="last-name"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleEmailSignup}
                  disabled={isLoading}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Create Account
                </Button>
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading || !availableProviders.google}
              >
                <FcGoogle className="w-4 h-4 mr-2" />
                Continue with Google
                {!availableProviders.google && (
                  <span className="ml-auto text-xs text-muted-foreground">Setup Required</span>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin('github')}
                disabled={isLoading || !availableProviders.github}
              >
                <Github className="w-4 h-4 mr-2" />
                Continue with GitHub
                {!availableProviders.github && (
                  <span className="ml-auto text-xs text-muted-foreground">Setup Required</span>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin('linkedin')}
                disabled={isLoading || !availableProviders.linkedin}
              >
                <Linkedin className="w-4 h-4 mr-2" />
                Continue with LinkedIn
                {!availableProviders.linkedin && (
                  <span className="ml-auto text-xs text-muted-foreground">Setup Required</span>
                )}
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </div>
          </CardContent>
        </Card>

        {/* Right side - Hero Section */}
        <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Automate Your Job Search with{" "}
              <span className="text-primary">AI-Powered</span> Precision
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Join thousands of job seekers who have automated their applications, 
              tracked their progress, and landed their dream jobs with AutoJobr.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="space-y-2">
              <h3 className="font-semibold">🎯 Smart Form Filling</h3>
              <p className="text-sm text-muted-foreground">
                Automatically fill job applications across 40+ major job sites
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">📊 Application Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your applications and get insights on your job search
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">🤖 AI Job Matching</h3>
              <p className="text-sm text-muted-foreground">
                Get AI-powered job recommendations based on your profile
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">🚀 Chrome Extension</h3>
              <p className="text-sm text-muted-foreground">
                Seamless browser integration with stealth auto-filling
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}