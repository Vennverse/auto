import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Plus, X, Upload, MapPin, Shield, Briefcase, GraduationCap, Phone } from "lucide-react";

const profileSchema = z.object({
  // Basic Information (Required for most applications)
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone number is required"),
  professionalTitle: z.string().min(1, "Professional title is required"),
  
  // Contact & Location (Always asked)
  currentAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default("United States"),
  
  // Professional Links (Common fields)
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  
  // Personal Details (Frequently requested)
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  
  // Work Authorization (Always required for US jobs)
  workAuthorization: z.string().min(1, "Work authorization status is required"),
  visaStatus: z.string().optional(),
  requiresSponsorship: z.boolean().default(false),
  
  // Work Preferences (Standard questions)
  preferredWorkMode: z.string().optional(),
  desiredSalaryMin: z.number().optional(),
  desiredSalaryMax: z.number().optional(),
  salaryCurrency: z.string().default("USD"),
  noticePeriod: z.string().optional(),
  willingToRelocate: z.boolean().default(false),
  
  // Education Summary (Always asked)
  highestDegree: z.string().optional(),
  majorFieldOfStudy: z.string().optional(),
  graduationYear: z.number().optional(),
  
  // Professional Summary
  summary: z.string().optional(),
  yearsExperience: z.number().min(0).optional(),
  
  // Emergency Contact (Sometimes required)
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  
  // Background & Legal (Common compliance questions)
  veteranStatus: z.string().optional(),
  ethnicity: z.string().optional(),
  disabilityStatus: z.string().optional(),
  backgroundCheckConsent: z.boolean().default(false),
  drugTestConsent: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [newSkill, setNewSkill] = useState("");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    retry: false,
  });

  const { data: skills } = useQuery({
    queryKey: ["/api/skills"],
    retry: false,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.fullName || "",
      phone: profile?.phone || "",
      professionalTitle: profile?.professionalTitle || "",
      currentAddress: profile?.currentAddress || "",
      city: profile?.city || "",
      state: profile?.state || "",
      zipCode: profile?.zipCode || "",
      country: profile?.country || "United States",
      linkedinUrl: profile?.linkedinUrl || "",
      githubUrl: profile?.githubUrl || "",
      portfolioUrl: profile?.portfolioUrl || "",
      dateOfBirth: profile?.dateOfBirth || "",
      gender: profile?.gender || "",
      nationality: profile?.nationality || "",
      workAuthorization: profile?.workAuthorization || "",
      visaStatus: profile?.visaStatus || "",
      requiresSponsorship: profile?.requiresSponsorship || false,
      preferredWorkMode: profile?.preferredWorkMode || "",
      desiredSalaryMin: profile?.desiredSalaryMin || undefined,
      desiredSalaryMax: profile?.desiredSalaryMax || undefined,
      salaryCurrency: profile?.salaryCurrency || "USD",
      noticePeriod: profile?.noticePeriod || "",
      willingToRelocate: profile?.willingToRelocate || false,
      highestDegree: profile?.highestDegree || "",
      majorFieldOfStudy: profile?.majorFieldOfStudy || "",
      graduationYear: profile?.graduationYear || undefined,
      summary: profile?.summary || "",
      yearsExperience: profile?.yearsExperience || 0,
      emergencyContactName: profile?.emergencyContactName || "",
      emergencyContactPhone: profile?.emergencyContactPhone || "",
      emergencyContactRelation: profile?.emergencyContactRelation || "",
      veteranStatus: profile?.veteranStatus || "",
      ethnicity: profile?.ethnicity || "",
      disabilityStatus: profile?.disabilityStatus || "",
      backgroundCheckConsent: profile?.backgroundCheckConsent || false,
      drugTestConsent: profile?.drugTestConsent || false,
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        professionalTitle: profile.professionalTitle || "",
        currentAddress: profile.currentAddress || "",
        city: profile.city || "",
        state: profile.state || "",
        zipCode: profile.zipCode || "",
        country: profile.country || "United States",
        linkedinUrl: profile.linkedinUrl || "",
        githubUrl: profile.githubUrl || "",
        portfolioUrl: profile.portfolioUrl || "",
        dateOfBirth: profile.dateOfBirth || "",
        gender: profile.gender || "",
        nationality: profile.nationality || "",
        workAuthorization: profile.workAuthorization || "",
        visaStatus: profile.visaStatus || "",
        requiresSponsorship: profile.requiresSponsorship || false,
        preferredWorkMode: profile.preferredWorkMode || "",
        desiredSalaryMin: profile.desiredSalaryMin || undefined,
        desiredSalaryMax: profile.desiredSalaryMax || undefined,
        salaryCurrency: profile.salaryCurrency || "USD",
        noticePeriod: profile.noticePeriod || "",
        willingToRelocate: profile.willingToRelocate || false,
        highestDegree: profile.highestDegree || "",
        majorFieldOfStudy: profile.majorFieldOfStudy || "",
        graduationYear: profile.graduationYear || undefined,
        summary: profile.summary || "",
        yearsExperience: profile.yearsExperience || 0,
        emergencyContactName: profile.emergencyContactName || "",
        emergencyContactPhone: profile.emergencyContactPhone || "",
        emergencyContactRelation: profile.emergencyContactRelation || "",
        veteranStatus: profile.veteranStatus || "",
        ethnicity: profile.ethnicity || "",
        disabilityStatus: profile.disabilityStatus || "",
        backgroundCheckConsent: profile.backgroundCheckConsent || false,
        drugTestConsent: profile.drugTestConsent || false,
      });
    }
  }, [profile, form]);

  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      await apiRequest("POST", "/api/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: (error: any) => {
      console.error("Profile update error:", error);
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      let errorMessage = "Failed to update profile";
      
      // Try to extract more specific error information
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      }
      
      toast({
        title: "Profile Update Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Log validation errors if available
      if (error.response?.data?.validationErrors) {
        console.log("Validation errors:", error.response.data.validationErrors);
      }
    },
  });

  const addSkillMutation = useMutation({
    mutationFn: async (skillName: string) => {
      await apiRequest("POST", "/api/skills", { skillName });
    },
    onSuccess: () => {
      setNewSkill("");
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add skill",
        variant: "destructive",
      });
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      await apiRequest("DELETE", `/api/skills/${skillId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete skill",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    profileMutation.mutate(data);
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newSkill.trim()) {
      e.preventDefault();
      addSkillMutation.mutate(newSkill.trim());
    }
  };

  const handleDeleteSkill = (skillId: number) => {
    deleteSkillMutation.mutate(skillId);
  };

  // Calculate comprehensive profile completion
  const calculateCompletion = () => {
    // Essential fields (required for most job applications)
    const essentialFields = [
      profile?.fullName,
      profile?.phone,
      profile?.professionalTitle,
      profile?.workAuthorization,
      user?.email,
    ];
    
    // Important fields (commonly requested)
    const importantFields = [
      profile?.currentAddress,
      profile?.city,
      profile?.state,
      profile?.country,
      profile?.linkedinUrl,
      profile?.summary,
      profile?.yearsExperience,
      profile?.preferredWorkMode,
      profile?.highestDegree,
      skills?.length > 0,
    ];
    
    // Optional fields (nice to have)
    const optionalFields = [
      profile?.dateOfBirth,
      profile?.nationality,
      profile?.githubUrl,
      profile?.portfolioUrl,
      profile?.desiredSalaryMin,
      profile?.noticePeriod,
      profile?.majorFieldOfStudy,
      profile?.emergencyContactName,
    ];
    
    const essentialCompleted = essentialFields.filter(Boolean).length;
    const importantCompleted = importantFields.filter(Boolean).length;
    const optionalCompleted = optionalFields.filter(Boolean).length;
    
    // Weighted calculation: Essential (50%), Important (35%), Optional (15%)
    const essentialPercentage = (essentialCompleted / essentialFields.length) * 50;
    const importantPercentage = (importantCompleted / importantFields.length) * 35;
    const optionalPercentage = (optionalCompleted / optionalFields.length) * 15;
    
    return Math.round(essentialPercentage + importantPercentage + optionalPercentage);
  };

  const completionPercentage = calculateCompletion();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-foreground mb-4">Manage Your Profile</h1>
            <p className="text-muted-foreground">
              Keep your information up-to-date for accurate auto-filling
            </p>
          </div>
          
          <Card>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Overview */}
                <div className="lg:col-span-1">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      {user?.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt="Profile"
                          className="w-32 h-32 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-16 h-16 text-primary" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      {profile?.professionalTitle || "Add your professional title"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {profile?.city && profile?.state ? `${profile.city}, ${profile.state}` : "Add your location"}
                    </p>
                    <div className="mt-4">
                      <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-2">
                        <span>Profile Completion:</span>
                        <span className="font-medium">{completionPercentage}%</span>
                      </div>
                      <Progress value={completionPercentage} className="w-full" />
                    </div>
                  </div>
                </div>
                
                {/* Comprehensive Profile Form */}
                <div className="lg:col-span-2">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                          <TabsTrigger value="basic" className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Basic
                          </TabsTrigger>
                          <TabsTrigger value="location" className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Location
                          </TabsTrigger>
                          <TabsTrigger value="work" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Work
                          </TabsTrigger>
                          <TabsTrigger value="education" className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            Education
                          </TabsTrigger>
                          <TabsTrigger value="legal" className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Legal
                          </TabsTrigger>
                        </TabsList>

                        {/* Basic Information Tab */}
                        <TabsContent value="basic" className="space-y-6">
                          <div className="text-sm text-muted-foreground mb-4">
                            Essential information required by most job applications
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="fullName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="+1 (555) 123-4567" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="professionalTitle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Professional Title *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Senior Software Engineer" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="dateOfBirth"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Date of Birth</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="gender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gender</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="male">Male</SelectItem>
                                      <SelectItem value="female">Female</SelectItem>
                                      <SelectItem value="non-binary">Non-binary</SelectItem>
                                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                              control={form.control}
                              name="linkedinUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>LinkedIn URL</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://linkedin.com/in/username" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="githubUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>GitHub URL</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://github.com/username" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="portfolioUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Portfolio URL</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://yourportfolio.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="summary"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Professional Summary</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Brief description of your professional background and goals..."
                                    rows={4}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>

                        {/* Location Information Tab */}
                        <TabsContent value="location" className="space-y-6">
                          <div className="text-sm text-muted-foreground mb-4">
                            Address and location preferences for job applications
                          </div>

                          <FormField
                            control={form.control}
                            name="currentAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="123 Main Street, Apt 4B" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                              control={form.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input placeholder="San Francisco" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State/Province</FormLabel>
                                  <FormControl>
                                    <Input placeholder="California" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="zipCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ZIP/Postal Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="94102" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Country</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select country" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="United States">United States</SelectItem>
                                      <SelectItem value="Canada">Canada</SelectItem>
                                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                      <SelectItem value="Australia">Australia</SelectItem>
                                      <SelectItem value="India">India</SelectItem>
                                      <SelectItem value="Germany">Germany</SelectItem>
                                      <SelectItem value="France">France</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="nationality"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nationality</FormLabel>
                                  <FormControl>
                                    <Input placeholder="American" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="willingToRelocate"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Willing to relocate for work
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        </TabsContent>

                        {/* Work Preferences Tab */}
                        <TabsContent value="work" className="space-y-6">
                          <div className="text-sm text-muted-foreground mb-4">
                            Work authorization, preferences, and experience details
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="workAuthorization"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Work Authorization Status *</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="citizen">US Citizen</SelectItem>
                                      <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
                                      <SelectItem value="visa_holder">Visa Holder</SelectItem>
                                      <SelectItem value="visa_required">Visa Required</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="visaStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Visa Status</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select visa type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="H1B">H1B</SelectItem>
                                      <SelectItem value="L1">L1</SelectItem>
                                      <SelectItem value="F1-OPT">F1-OPT</SelectItem>
                                      <SelectItem value="F1-CPT">F1-CPT</SelectItem>
                                      <SelectItem value="TN">TN</SelectItem>
                                      <SelectItem value="O1">O1</SelectItem>
                                      <SelectItem value="EAD">EAD</SelectItem>
                                      <SelectItem value="None">None</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="requiresSponsorship"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Requires visa sponsorship for employment
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="preferredWorkMode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Preferred Work Mode</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select work mode" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="remote">Remote</SelectItem>
                                      <SelectItem value="hybrid">Hybrid</SelectItem>
                                      <SelectItem value="onsite">On-site</SelectItem>
                                      <SelectItem value="flexible">Flexible</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="noticePeriod"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notice Period</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select notice period" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="immediate">Immediate</SelectItem>
                                      <SelectItem value="2_weeks">2 weeks</SelectItem>
                                      <SelectItem value="1_month">1 month</SelectItem>
                                      <SelectItem value="2_months">2 months</SelectItem>
                                      <SelectItem value="3_months">3 months</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                              control={form.control}
                              name="desiredSalaryMin"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Minimum Salary</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="50000"
                                      {...field}
                                      onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="desiredSalaryMax"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Maximum Salary</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="150000"
                                      {...field}
                                      onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="yearsExperience"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Years of Experience</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0"
                                      placeholder="5"
                                      {...field}
                                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>

                        {/* Education Tab */}
                        <TabsContent value="education" className="space-y-6">
                          <div className="text-sm text-muted-foreground mb-4">
                            Educational background and qualifications
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="highestDegree"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Highest Degree</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select degree" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="High School">High School</SelectItem>
                                      <SelectItem value="Associate">Associate Degree</SelectItem>
                                      <SelectItem value="Bachelor">Bachelor's Degree</SelectItem>
                                      <SelectItem value="Master">Master's Degree</SelectItem>
                                      <SelectItem value="PhD">PhD</SelectItem>
                                      <SelectItem value="Professional">Professional Degree</SelectItem>
                                      <SelectItem value="Certification">Certification</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="graduationYear"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Graduation Year</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number"
                                      min="1950"
                                      max="2030"
                                      placeholder="2020"
                                      {...field}
                                      onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="majorFieldOfStudy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Major/Field of Study</FormLabel>
                                <FormControl>
                                  <Input placeholder="Computer Science" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="border-t pt-6">
                            <h4 className="text-lg font-medium mb-4">Emergency Contact</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <FormField
                                control={form.control}
                                name="emergencyContactName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Emergency Contact Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Jane Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="emergencyContactPhone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Emergency Contact Phone</FormLabel>
                                    <FormControl>
                                      <Input placeholder="+1 (555) 987-6543" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="emergencyContactRelation"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Relationship</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select relationship" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="spouse">Spouse</SelectItem>
                                        <SelectItem value="parent">Parent</SelectItem>
                                        <SelectItem value="sibling">Sibling</SelectItem>
                                        <SelectItem value="friend">Friend</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </TabsContent>

                        {/* Legal & Compliance Tab */}
                        <TabsContent value="legal" className="space-y-6">
                          <div className="text-sm text-muted-foreground mb-4">
                            Legal compliance and diversity questions often asked by employers
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="veteranStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Veteran Status</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="not_veteran">Not a veteran</SelectItem>
                                      <SelectItem value="veteran">Veteran</SelectItem>
                                      <SelectItem value="disabled_veteran">Disabled veteran</SelectItem>
                                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="disabilityStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Disability Status</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="no_disability">No disability</SelectItem>
                                      <SelectItem value="has_disability">Yes, I have a disability</SelectItem>
                                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="ethnicity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ethnicity (Optional - for diversity tracking)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select ethnicity" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="american_indian">American Indian or Alaska Native</SelectItem>
                                    <SelectItem value="asian">Asian</SelectItem>
                                    <SelectItem value="black">Black or African American</SelectItem>
                                    <SelectItem value="hispanic">Hispanic or Latino</SelectItem>
                                    <SelectItem value="pacific_islander">Native Hawaiian or Pacific Islander</SelectItem>
                                    <SelectItem value="white">White</SelectItem>
                                    <SelectItem value="two_or_more">Two or more races</SelectItem>
                                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-4 border-t pt-6">
                            <h4 className="text-lg font-medium">Background Check Consents</h4>
                            
                            <FormField
                              control={form.control}
                              name="backgroundCheckConsent"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>
                                      I consent to background check if required for employment
                                    </FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                      Many employers require background checks for certain positions
                                    </div>
                                  </div>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="drugTestConsent"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>
                                      I consent to drug testing if required for employment
                                    </FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                      Some positions may require drug testing as part of the hiring process
                                    </div>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>

                      <div className="flex justify-end pt-6 border-t">
                        <Button
                          type="submit"
                          disabled={profileMutation.isPending}
                          className="w-full md:w-auto"
                        >
                          {profileMutation.isPending ? "Updating..." : "Update Profile"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
              
              {/* Skills Section */}
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills & Experience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium text-foreground mb-2 block">Skills</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {skills?.map((skill) => (
                            <Badge key={skill.id} variant="secondary" className="skill-tag">
                              {skill.skillName}
                              <button
                                type="button"
                                onClick={() => handleDeleteSkill(skill.id)}
                                className="ml-2 text-muted-foreground hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={handleAddSkill}
                          placeholder="Add a skill and press Enter"
                          className="w-full"
                        />
                      </div>
                      
                      {/* Resume Upload */}
                      <div>
                        <Label className="text-sm font-medium text-foreground mb-2 block">Resume</Label>
                        <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-primary transition-colors">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground mb-2">Drop your resume here or click to upload</p>
                          <p className="text-sm text-muted-foreground">PDF or DOCX format, max 5MB</p>
                          <input
                            type="file"
                            accept=".pdf,.docx"
                            className="hidden"
                            onChange={(e) => {
                              // TODO: Implement file upload
                              console.log("File selected:", e.target.files?.[0]);
                            }}
                          />
                        </div>
                      </div>
                      
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
