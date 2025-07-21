import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [, params] = useRoute("/verify-email");
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing');
      return;
    }

    // Call the verification API
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(response => {
        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been verified successfully! Redirecting to job posting...');
          // Redirect to post job page after a delay
          setTimeout(() => {
            window.location.href = '/post-job';
          }, 3000);
        } else {
          return response.json().then(data => {
            throw new Error(data.message || 'Verification failed');
          });
        }
      })
      .catch(error => {
        setStatus('error');
        setMessage(error.message || 'Failed to verify email');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
              <p className="text-gray-600">Verifying your email...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
              <p className="text-green-700 font-medium">{message}</p>
              <p className="text-sm text-gray-500">
                Redirecting you to sign in...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 mx-auto text-red-500" />
              <p className="text-red-700 font-medium">{message}</p>
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="mt-4"
              >
                Go to Sign In
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}