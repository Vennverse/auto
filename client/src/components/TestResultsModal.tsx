import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  RefreshCw, 
  Trophy, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Star,
  Target,
  Brain,
  Users,
  Clock,
  DollarSign
} from "lucide-react";

interface TestResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetakePayment: () => void;
  score: number;
  passingScore: number;
  timeSpent?: number;
  violations?: number;
  testTitle: string;
  recruiterName: string;
}

export function TestResultsModal({
  isOpen,
  onClose,
  onRetakePayment,
  score,
  passingScore,
  timeSpent,
  violations = 0,
  testTitle,
  recruiterName
}: TestResultsModalProps) {
  const hasPassed = score >= passingScore;
  const scoreGap = passingScore - score;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasPassed ? (
              <>
                <Trophy className="w-6 h-6 text-green-600" />
                Congratulations! Test Passed
              </>
            ) : (
              <>
                <TrendingUp className="w-6 h-6 text-blue-600" />
                Test Complete - Retake Available
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {testTitle} • {recruiterName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score Display */}
          <Card className={`${hasPassed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className={`text-3xl font-bold ${hasPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {score}%
                  </div>
                  <div className="text-sm text-gray-600">Your Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-700">{passingScore}%</div>
                  <div className="text-sm text-gray-600">Passing Score</div>
                </div>
                <div>
                  <div className={`text-3xl font-bold ${hasPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {hasPassed ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {hasPassed ? 'PASSED' : 'FAILED'}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <Progress 
                  value={score} 
                  className="h-3"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>{passingScore}% (required)</span>
                  <span>100%</span>
                </div>
              </div>
              
              {timeSpent && (
                <div className="mt-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    Completed in {Math.round(timeSpent / 60)} minutes
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Violations Warning */}
          {violations > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium text-sm">
                  {violations} violation(s) detected
                </span>
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                Score may have been reduced due to potential cheating behavior
              </p>
            </div>
          )}

          {/* Success Message for Passed Tests */}
          {hasPassed && (
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Excellent Work!
              </h3>
              <p className="text-green-700 mb-3">
                You've successfully passed this assessment. The recruiter will be notified of your results.
              </p>
              <p className="text-blue-700 text-sm">
                Want to achieve an even higher score? You can retake the test to showcase your best abilities.
              </p>
            </div>
          )}

          {/* Retake Motivation - For All Tests */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                {hasPassed ? "Want to Achieve Even More?" : "Don't Give Up - You're Almost There!"}
              </h3>
              <p className="text-blue-700">
                {hasPassed 
                  ? `Great score of ${score}%! Consider a retake to showcase your maximum potential and stand out even more.`
                  : `You were only ${scoreGap} points away from passing. Many candidates improve significantly on their second attempt.`
                }
              </p>
            </div>

            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Why Take a Retake?
                </h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-blue-900 text-sm">Fresh Questions</h5>
                      <p className="text-xs text-blue-700">Different questions, same skills tested</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-blue-900 text-sm">Show Excellence</h5>
                      <p className="text-xs text-blue-700">Demonstrate your commitment to perfection</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-blue-900 text-sm">
                        {hasPassed ? "95% Improve" : "73% Pass Rate"}
                      </h5>
                      <p className="text-xs text-blue-700">
                        {hasPassed ? "Even high scorers improve on retakes" : "Most candidates pass on retake"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-blue-900 text-sm">Stand Out</h5>
                      <p className="text-xs text-blue-700">Few candidates take initiative to improve</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium text-center">
                    💡 <strong>Success Story:</strong> "I scored {score}% first, {hasPassed ? '97%' : '89%'} on retake. Got the job!" - Sarah K.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Card */}
            <Card className="border-2 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">Retake Package</h4>
                    <p className="text-sm text-gray-600">One-time payment, unlimited improvement</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">$5</div>
                    <div className="text-xs text-gray-500">One-time</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Fresh questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Same time limit</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Instant access</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Best score counts</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              View All Tests
            </Button>
            
            <Button 
              onClick={onRetakePayment}
              className={`flex-1 ${hasPassed ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              size="lg"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              {hasPassed ? 'Improve Score - $5' : 'Retake for $5'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}