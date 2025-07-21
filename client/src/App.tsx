import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Applications from "@/pages/applications";
import Jobs from "@/pages/jobs";
import Subscription from "@/pages/subscription";
import JobSeekerPremium from "@/pages/JobSeekerPremium";
import RecruiterPremium from "@/pages/RecruiterPremium";
import RecruiterSubscription from "@/pages/recruiter-subscription";
import Onboarding from "@/pages/onboarding";
import Landing from "@/pages/landing";
import UserTypeSelection from "@/pages/user-type-selection";
import UnifiedRecruiterDashboard from "@/pages/unified-recruiter-dashboard";
import PostJob from "@/pages/post-job";
import VerifyEmail from "@/pages/verify-email";
import EmailVerificationPage from "@/pages/email-verification";
import ViewJob from "@/pages/view-job";
import EditJob from "@/pages/edit-job";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import ChatPage from "@/pages/chat";
import MessagingPage from "@/pages/messaging";
import ResumesPage from "@/pages/resumes";
import JobDiscoveryPage from "@/pages/job-discovery-simple";
import PremiumTargetingPage from "@/pages/premium-targeting";
import JobPromotionPayment from "@/pages/job-promotion-payment";
import TestManagement from "@/pages/test-management";
import TestAssignments from "@/pages/test-assignments";
import TestTaking from "@/pages/test-taking";
import JobSeekerTests from "@/pages/job-seeker-tests";
import TestRetakePayment from "@/pages/test-retake-payment";
import PremiumTargetingPayment from "@/pages/premium-targeting-payment";
import QuestionBuilder from "@/pages/question-builder";
import RecruiterFeatures from "@/pages/recruiter-features";
import QuestionBank from "@/pages/question-bank";
import QuestionBankAdmin from "@/pages/admin/question-bank";

import CareerAIAssistant from "@/pages/career-ai-assistant";
import RankingTests from "@/pages/ranking-tests";
import MockInterview from "@/pages/mock-interview";
import MockInterviewSession from "@/pages/mock-interview-session";
import VirtualInterviewStart from "@/pages/VirtualInterviewStart";
import VirtualInterview from "@/pages/VirtualInterview";
import VirtualInterviewFeedback from "@/pages/VirtualInterviewFeedback";
import InterviewAssignments from "@/pages/InterviewAssignments";
import PipelineManagement from "@/pages/PipelineManagement";
import SubscriptionSuccess from "@/pages/subscription/Success";
import SubscriptionCancel from "@/pages/subscription/Cancel";


function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      
      {/* Subscription success/cancel routes */}
      <Route path="/subscription/success" component={SubscriptionSuccess} />
      <Route path="/subscription/cancel" component={SubscriptionCancel} />
      
      {/* Post Job route - accessible to everyone, handles verification internally */}
      <Route path="/post-job" component={PostJob} />
      
      {isAuthenticated ? (
        <>
          {/* Handle different user types */}
          {user?.userType === 'recruiter' ? (
            <>
              <Route path="/" component={UnifiedRecruiterDashboard} />
              <Route path="/recruiter-dashboard" component={UnifiedRecruiterDashboard} />
              <Route path="/enhanced-dashboard" component={UnifiedRecruiterDashboard} />
              <Route path="/advanced-dashboard" component={UnifiedRecruiterDashboard} />
              <Route path="/recruiter/post-job" component={PostJob} />
              <Route path="/recruiter/edit-job/:id" component={EditJob} />
              <Route path="/premium-targeting" component={PremiumTargetingPage} />
              <Route path="/premium-targeting-payment" component={PremiumTargetingPayment} />
              <Route path="/job-promotion-payment/:id" component={JobPromotionPayment} />
              <Route path="/recruiter/premium" component={RecruiterPremium} />
              <Route path="/test-assignments" component={TestAssignments} />
              <Route path="/recruiter/test-management" component={TestManagement} />
              <Route path="/recruiter/test-assignments" component={TestAssignments} />
              <Route path="/recruiter/question-builder/:templateId">
                {(params) => <QuestionBuilder templateId={parseInt(params.templateId)} />}
              </Route>
              <Route path="/recruiter/question-bank" component={QuestionBank} />
              <Route path="/admin/question-bank" component={QuestionBankAdmin} />
              <Route path="/recruiter/interview-assignments" component={InterviewAssignments} />
              <Route path="/recruiter/pipeline" component={PipelineManagement} />
              <Route path="/jobs/:id" component={ViewJob} />
              <Route path="/profile" component={Profile} />
              <Route path="/subscription" component={RecruiterSubscription} />
              <Route path="/recruiter-premium" component={RecruiterPremium} />
              <Route path="/chat" component={MessagingPage} />
            </>
          ) : user?.userType === 'job_seeker' ? (
            <>
              {/* Job seeker routes - check onboarding status */}
              {user?.onboardingCompleted === false ? (
                <>
                  <Route path="/onboarding" component={Onboarding} />
                  <Route path="/" component={Onboarding} />
                </>
              ) : (
                <>
                  {/* Main dashboard routes for completed job seekers */}
                  <Route path="/" component={Dashboard} />
                  <Route path="/onboarding" component={Onboarding} />
                  <Route path="/profile" component={Profile} />
                  <Route path="/resumes" component={ResumesPage} />
                  <Route path="/applications" component={Applications} />
                  <Route path="/jobs" component={Jobs} />

                  <Route path="/discover" component={JobDiscoveryPage} />
                  <Route path="/job-seeker-tests" component={JobSeekerTests} />
                  <Route path="/job-seeker/tests" component={JobSeekerTests} />
                  <Route path="/ranking-tests" component={RankingTests} />
                  <Route path="/test/:id" component={TestTaking} />
                  <Route path="/test/:id/retake-payment">
                    {(params) => <TestRetakePayment />}
                  </Route>
                  <Route path="/mock-interview" component={MockInterview} />
                  <Route path="/mock-interview/session/:sessionId" component={MockInterviewSession} />
                  <Route path="/mock-interview/:sessionId" component={MockInterviewSession} />
                  <Route path="/virtual-interview/new" component={VirtualInterviewStart} />
                  <Route path="/virtual-interview/:sessionId" component={VirtualInterview} />
                  <Route path="/virtual-interview/:sessionId/feedback" component={VirtualInterviewFeedback} />
                  <Route path="/jobs/:id" component={ViewJob} />
                  <Route path="/career-ai-assistant" component={CareerAIAssistant} />
                  <Route path="/subscription" component={Subscription} />
                  <Route path="/job-seeker-premium" component={JobSeekerPremium} />
                  <Route path="/chat" component={MessagingPage} />
                </>
              )}
            </>
          ) : (
            <>
              {/* Default routes for users without explicit type (treat as job seekers) */}
              <Route path="/" component={Dashboard} />
              <Route path="/onboarding" component={Onboarding} />
              <Route path="/profile" component={Profile} />
              <Route path="/applications" component={Applications} />
              <Route path="/jobs" component={Jobs} />
              <Route path="/jobs/:id" component={ViewJob} />
              <Route path="/mock-interview" component={MockInterview} />
              <Route path="/mock-interview/session/:sessionId" component={MockInterviewSession} />
              <Route path="/mock-interview/:sessionId" component={MockInterviewSession} />
              <Route path="/virtual-interview/new" component={VirtualInterviewStart} />
              <Route path="/virtual-interview/:sessionId" component={VirtualInterview} />
              <Route path="/virtual-interview/:sessionId/feedback" component={VirtualInterviewFeedback} />
              <Route path="/subscription" component={Subscription} />
              <Route path="/chat" component={MessagingPage} />
            </>
          )}
        </>
      ) : (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/email-verification" component={() => <EmailVerificationPage />} />
          <Route path="/for-recruiters" component={RecruiterFeatures} />
          <Route path="/recruiters" component={RecruiterFeatures} />
          <Route path="/recruiter-features" component={RecruiterFeatures} />
          <Route path="/test/:id" component={TestTaking} />
          {/* Redirect unauthenticated users trying to access interviews to login with redirect */}
          <Route path="/virtual-interview/:sessionId">
            {(params) => {
              const redirectUrl = encodeURIComponent(`/virtual-interview/${params.sessionId}`);
              window.location.href = `/auth?redirect=${redirectUrl}`;
              return null;
            }}
          </Route>
          <Route path="/mock-interview/:sessionId">
            {(params) => {
              const redirectUrl = encodeURIComponent(`/mock-interview/${params.sessionId}`);
              window.location.href = `/auth?redirect=${redirectUrl}`;
              return null;
            }}
          </Route>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
