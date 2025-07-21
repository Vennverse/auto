import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CompanyEmailVerificationProps {
  user: any;
  onVerificationSuccess?: () => void;
}

export function CompanyEmailVerification({ user, onVerificationSuccess }: CompanyEmailVerificationProps) {
  const { toast } = useToast();
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  // Check if user already has verified company email
  const { data: verificationStatus } = useQuery({
    queryKey: ['/api/user/company-verification-status'],
    enabled: !!user?.id
  });

  const verifyCompanyEmailMutation = useMutation({
    mutationFn: async (data: { companyEmail: string; companyName: string; companyWebsite?: string }) => {
      const response = await fetch('/api/auth/verify-company-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send verification email');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Verification Email Sent",
        description: data.message,
        variant: "default",
      });
      setCompanyEmail("");
      setCompanyName("");
      setCompanyWebsite("");
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to send verification email",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyEmail || !companyName) {
      toast({
        title: "Missing Information",
        description: "Please provide both company email and company name",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    if (!companyEmail.includes('@') || companyEmail.includes('gmail.com') || companyEmail.includes('yahoo.com')) {
      toast({
        title: "Invalid Company Email",
        description: "Please use a company email address (not Gmail, Yahoo, etc.)",
        variant: "destructive",
      });
      return;
    }

    verifyCompanyEmailMutation.mutate({
      companyEmail,
      companyName,
      companyWebsite: companyWebsite || undefined
    });
  };

  // If user is already a recruiter, show current status
  if (user?.userType === 'recruiter') {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle className="w-5 h-5" />
            Recruiter Account Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-4 h-4 text-green-600" />
            <span className="font-medium">{user.companyName || 'Company Account'}</span>
            <Badge variant="outline" className="bg-green-100 text-green-700">
              Verified
            </Badge>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400">
            You have full access to recruiter features and both dashboards.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          Verify Company Email for Recruiter Access
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Verify your company email to get recruiter access and post jobs
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="companyEmail" className="block text-sm font-medium mb-1">
              Company Email Address
            </label>
            <Input
              id="companyEmail"
              type="email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              placeholder="john@yourcompany.com"
              className="w-full"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be a company email (not Gmail, Yahoo, etc.)
            </p>
          </div>
          
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium mb-1">
              Company Name
            </label>
            <Input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your Company Inc."
              className="w-full"
              required
            />
          </div>
          
          <div>
            <label htmlFor="companyWebsite" className="block text-sm font-medium mb-1">
              Company Website (Optional)
            </label>
            <Input
              id="companyWebsite"
              type="url"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              placeholder="https://yourcompany.com"
              className="w-full"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={verifyCompanyEmailMutation.isPending}
          >
            {verifyCompanyEmailMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Verification Email...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Verification Email
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                What happens after verification?
              </p>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                <li>• You'll get recruiter access to post jobs</li>
                <li>• Access to both recruiter and user dashboards</li>
                <li>• Advanced candidate management tools</li>
                <li>• Interview and test assignment features</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}