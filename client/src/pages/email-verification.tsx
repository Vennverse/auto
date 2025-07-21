import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Mail, RefreshCw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmailVerificationPageProps {
  email?: string;
}

export default function EmailVerificationPage({ email: propEmail }: EmailVerificationPageProps) {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState(propEmail || "");
  const { toast } = useToast();

  // Extract email from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam && !propEmail) {
      setEmail(emailParam);
    }
  }, [propEmail]);

  const resendMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/auth/resend-verification", { email });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification email sent",
        description: "Please check your inbox for the verification email.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to resend verification email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleResend = () => {
    if (email) {
      resendMutation.mutate(email);
    }
  };

  const handleBackToLogin = () => {
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-4">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification email to your inbox. Please click the link in the email to verify your account.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Email Display */}
            {email && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email sent to:
                  </span>
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{email}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Check your email inbox
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Look for an email from AutoJobr with the subject "Verify your AutoJobr account"
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Click the verification link
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    The link will automatically log you in and redirect you to the app
                  </p>
                </div>
              </div>
            </div>

            {/* Resend Email Section */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Didn't receive the email? Check your spam folder or resend it.
                </p>
                
                {!propEmail && (
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                )}
                
                <Button
                  onClick={handleResend}
                  disabled={!email || resendMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {resendMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Spam Notice */}
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>Note:</strong> Sometimes emails can end up in your spam or junk folder. 
                    Please check there if you don't see our email in your inbox.
                  </p>
                </div>
              </div>
            </div>

            {/* Back to Login */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleBackToLogin}
                variant="ghost"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}