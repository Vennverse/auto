import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Target, 
  Users, 
  GraduationCap,
  Building,
  MapPin,
  DollarSign,
  Calendar,
  Trophy,
  Zap,
  CheckCircle,
  AlertCircle,
  Star
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface TargetingCriteria {
  education: {
    degrees: string[];
    schools: string[];
    graduationYears: string[];
    gpaBracket: string;
  };
  experience: {
    yearsRange: string;
    industries: string[];
    companies: string[];
    seniorityLevel: string[];
  };
  skills: {
    required: string[];
    preferred: string[];
    certifications: string[];
  };
  demographics: {
    locations: string[];
    workAuthorization: string[];
    remotePreference: string[];
  };
  activities: {
    clubs: string[];
    volunteering: string[];
    projects: string[];
  };
}

export default function PremiumTargetingPage() {
  const { user } = useAuth() as { user: any };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [targetingCriteria, setTargetingCriteria] = useState<TargetingCriteria>({
    education: { degrees: [], schools: [], graduationYears: [], gpaBracket: "" },
    experience: { yearsRange: "", industries: [], companies: [], seniorityLevel: [] },
    skills: { required: [], preferred: [], certifications: [] },
    demographics: { locations: [], workAuthorization: [], remotePreference: [] },
    activities: { clubs: [], volunteering: [], projects: [] }
  });

  const [estimatedReach, setEstimatedReach] = useState(0);
  const [pricingTier, setPricingTier] = useState("basic");

  // Fetch candidate pool statistics
  const { data: candidateStats } = useQuery({
    queryKey: ["/api/candidates/stats"],
  });

  // Calculate estimated reach based on targeting criteria
  const calculateReach = () => {
    // Simplified calculation - in reality this would query the database
    let baseReach = candidateStats?.totalCandidates || 1000;
    let reachMultiplier = 1;

    // Apply filters to estimate reach
    if (targetingCriteria.education.degrees.length > 0) reachMultiplier *= 0.7;
    if (targetingCriteria.education.schools.length > 0) reachMultiplier *= 0.4;
    if (targetingCriteria.skills.required.length > 0) reachMultiplier *= 0.6;
    if (targetingCriteria.experience.yearsRange) reachMultiplier *= 0.8;
    if (targetingCriteria.demographics.locations.length > 0) reachMultiplier *= 0.5;

    const estimated = Math.floor(baseReach * reachMultiplier);
    setEstimatedReach(estimated);
  };

  // Calculate pricing based on targeting precision
  const calculatePricing = () => {
    let basePrice = 99; // Basic job posting
    let targetingMultiplier = 1;

    // More precise targeting = higher cost
    if (targetingCriteria.education.schools.length > 0) targetingMultiplier += 0.5;
    if (targetingCriteria.education.gpaBracket) targetingMultiplier += 0.3;
    if (targetingCriteria.skills.required.length > 2) targetingMultiplier += 0.4;
    if (targetingCriteria.activities.clubs.length > 0) targetingMultiplier += 0.6;
    if (targetingCriteria.experience.companies.length > 0) targetingMultiplier += 0.3;

    return Math.floor(basePrice * targetingMultiplier);
  };

  const createTargetedJobMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/jobs/targeted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create targeted job');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Targeted job posting created successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
    onError: () => {
      toast({ title: "Failed to create targeted job posting", variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    if (!jobTitle || !jobDescription) {
      toast({ title: "Please fill in job title and description", variant: "destructive" });
      return;
    }

    // Navigate to subscription page with targeting data stored
    localStorage.setItem('pendingTargetingJob', JSON.stringify({
      title: jobTitle,
      description: jobDescription,
      targetingCriteria,
      estimatedReach,
      pricingTier,
      cost: calculatePricing()
    }));

    // Redirect to subscription page to complete payment
    window.location.href = '/subscription?upgrade=premium&feature=targeting';
  };

  const addToArray = (category: keyof TargetingCriteria, field: string, value: string) => {
    if (!value.trim()) return;
    
    setTargetingCriteria(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: [...(prev[category][field] as string[]), value.trim()]
      }
    }));
  };

  const removeFromArray = (category: keyof TargetingCriteria, field: string, index: number) => {
    setTargetingCriteria(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: (prev[category][field] as string[]).filter((_, i) => i !== index)
      }
    }));
  };

  const pricing = calculatePricing();

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Target className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Premium Candidate Targeting</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Reach exactly the right candidates with precision targeting. Pay only for highly qualified matches based on education, experience, skills, and activities.
        </p>
        <Badge className="bg-primary/10 text-primary text-lg px-4 py-2">
          <Star className="h-4 w-4 mr-2" />
          Premium Feature
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Detailed job description..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Education Targeting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education Targeting
              </CardTitle>
              <CardDescription>
                Target candidates based on their educational background
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Degree Types</Label>
                  <Select onValueChange={(value) => addToArray('education', 'degrees', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select degree types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bachelor's">Bachelor's Degree</SelectItem>
                      <SelectItem value="Master's">Master's Degree</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                      <SelectItem value="Associate">Associate Degree</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {targetingCriteria.education.degrees.map((degree, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" 
                             onClick={() => removeFromArray('education', 'degrees', index)}>
                        {degree} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Target Schools</Label>
                  <Input 
                    placeholder="Add prestigious schools..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('education', 'schools', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {targetingCriteria.education.schools.map((school, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer"
                             onClick={() => removeFromArray('education', 'schools', index)}>
                        {school} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>GPA Requirement</Label>
                <Select onValueChange={(value) => setTargetingCriteria(prev => ({
                  ...prev,
                  education: { ...prev.education, gpaBracket: value }
                }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Minimum GPA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3.0+">3.0 and above</SelectItem>
                    <SelectItem value="3.5+">3.5 and above</SelectItem>
                    <SelectItem value="3.7+">3.7 and above (Top performers)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Skills Targeting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Skills & Experience Targeting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Required Skills</Label>
                  <Input 
                    placeholder="Add required skills..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('skills', 'required', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {targetingCriteria.skills.required.map((skill, index) => (
                      <Badge key={index} variant="destructive" className="cursor-pointer"
                             onClick={() => removeFromArray('skills', 'required', index)}>
                        {skill} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Years of Experience</Label>
                  <Select onValueChange={(value) => setTargetingCriteria(prev => ({
                    ...prev,
                    experience: { ...prev.experience, yearsRange: value }
                  }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-2">0-2 years (Entry level)</SelectItem>
                      <SelectItem value="3-5">3-5 years (Mid level)</SelectItem>
                      <SelectItem value="6-10">6-10 years (Senior level)</SelectItem>
                      <SelectItem value="10+">10+ years (Expert level)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Target Companies (Previous Experience)</Label>
                <Input 
                  placeholder="Add prestigious companies..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('experience', 'companies', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {targetingCriteria.experience.companies.map((company, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer"
                           onClick={() => removeFromArray('experience', 'companies', index)}>
                      {company} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activities & Involvement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Activities & Involvement
              </CardTitle>
              <CardDescription>
                Target high-achieving candidates based on extracurricular activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Club Memberships & Organizations</Label>
                <Input 
                  placeholder="e.g., Honor societies, professional organizations..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('activities', 'clubs', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {targetingCriteria.activities.clubs.map((club, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer"
                           onClick={() => removeFromArray('activities', 'clubs', index)}>
                      {club} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Location Preferences</Label>
                <Input 
                  placeholder="Add target locations..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('demographics', 'locations', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {targetingCriteria.demographics.locations.map((location, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer"
                           onClick={() => removeFromArray('demographics', 'locations', index)}>
                      {location} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Pricing & Analytics */}
        <div className="space-y-6">
          {/* Estimated Reach */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Estimated Reach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">{estimatedReach.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">qualified candidates</p>
                <Button variant="outline" size="sm" onClick={calculateReach}>
                  Recalculate
                </Button>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Match Quality:</span>
                  <Badge variant={estimatedReach < 100 ? "destructive" : estimatedReach < 500 ? "default" : "secondary"}>
                    {estimatedReach < 100 ? "Very High" : estimatedReach < 500 ? "High" : "Medium"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Competition Level:</span>
                  <Badge variant="outline">Low</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Premium Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">${pricing}</div>
                  <p className="text-sm text-muted-foreground">per targeted job posting</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base posting:</span>
                    <span>$99</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Targeting premium:</span>
                    <span>${pricing - 99}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${pricing}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Guaranteed high-quality matches</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Priority placement</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Advanced analytics</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleSubmit}
                disabled={!jobTitle || !jobDescription || createTargetedJobMutation.isPending}
              >
                {createTargetedJobMutation.isPending ? "Creating..." : `Post Job - $${pricing}`}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                30-day money-back guarantee
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}