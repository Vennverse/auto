import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Briefcase, Mail, Building, CheckCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function UserTypeSelection() {
  const [selectedType, setSelectedType] = useState<string>("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Validate corporate email (no Gmail, Yahoo, etc.)
  const isValidCorporateEmail = (emailAddress: string) => {
    const publicDomains = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
      'aol.com', 'protonmail.com', 'icloud.com', 'mail.com', 'zoho.com'
    ];
    const domain = emailAddress.split('@')[1]?.toLowerCase();
    return domain && !publicDomains.includes(domain);
  };

  const sendVerificationMutation = useMutation({
    mutationFn: async (data: { email: string; companyName: string; companyWebsite: string }) => {
      return await apiRequest("POST", "/api/auth/send-verification", data);
    },
    onSuccess: () => {
      setVerificationSent(true);
      toast({
        title: "Verification Email Sent",
        description: "Please check your email and click the verification link to complete your registration.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to send verification email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleJobSeekerSelect = () => {
    setLocation("/auth");
  };

  const handleRecruiterSelect = () => {
    if (!email || !companyName) {
      toast({
        title: "Missing Information",
        description: "Please provide your company email and company name.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidCorporateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please use your company email address. Personal email domains are not allowed for recruiters.",
        variant: "destructive",
      });
      return;
    }

    sendVerificationMutation.mutate({
      email,
      companyName,
      companyWebsite: companyWebsite || "",
    });
  };

  const handleResendVerification = () => {
    sendVerificationMutation.mutate({
      email,
      companyName,
      companyWebsite: companyWebsite || "",
    });
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Click the link in your email to verify your company account and complete your registration.
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleResendVerification}
              disabled={sendVerificationMutation.isPending}
            >
              Resend Verification Email
            </Button>
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => setLocation("/")}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to AutoJobr</h1>
          <p className="text-muted-foreground">Choose your account type to get started</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Seeker Option */}
          <Card className={`cursor-pointer transition-all hover:shadow-lg ${selectedType === "job_seeker" ? "ring-2 ring-blue-500" : ""}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Job Seeker</CardTitle>
                  <CardDescription>Find your dream job with AI-powered automation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">AI-powered job matching</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Automated application filling</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Resume optimization & ATS scoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Application tracking</span>
                </div>
              </div>
              
              <Separator />
              
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleJobSeekerSelect}
              >
                Continue as Job Seeker
              </Button>
            </CardContent>
          </Card>

          {/* Recruiter Option */}
          <Card className={`cursor-pointer transition-all hover:shadow-lg ${selectedType === "recruiter" ? "ring-2 ring-blue-500" : ""}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Recruiter
                    <Badge variant="secondary" className="text-xs">✓ Verified</Badge>
                  </CardTitle>
                  <CardDescription>Post jobs and find the perfect candidates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Post unlimited job openings</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">AI-powered candidate matching</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Direct chat with candidates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Application management dashboard</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Company email verification required</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recruiter-email">Company Email *</Label>
                  <Input
                    id="recruiter-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name *</Label>
                  <Input
                    id="company-name"
                    placeholder="Your Company Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-website">Company Website</Label>
                  <Input
                    id="company-website"
                    placeholder="https://company.com"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                className="w-full"
                onClick={handleRecruiterSelect}
                disabled={sendVerificationMutation.isPending}
              >
                {sendVerificationMutation.isPending ? "Sending..." : "Continue as Recruiter"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}