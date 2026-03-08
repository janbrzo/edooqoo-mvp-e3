import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthFlow } from "@/hooks/useAuthFlow";
import { useWorksheetState } from "@/hooks/useWorksheetState";
import { useWorksheetGeneration } from "@/hooks/useWorksheetGeneration";
import { useTokenSystem } from "@/hooks/useTokenSystem";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";
import { TokenPaywallModal } from "@/components/TokenPaywallModal";
import { PricingSection } from "@/components/PricingSection";
import { FreeWeekBanner } from "@/components/FreeWeekBanner";
import { deepFixTextObjects } from "@/utils/textObjectFixer";
import { User, GraduationCap, DollarSign, Bell, Lock, CheckCircle } from "lucide-react";
import { GCalStatusButton } from "@/components/calendar/GCalStatusButton";
import { HomeworkNotificationBadge } from "@/components/homework/HomeworkNotificationBadge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

/**
 * Main Index page component that handles worksheet generation and display
 */
const Index = () => {
  const { user, loading: authLoading, isRegisteredUser, isAnonymous } = useAuthFlow();
  const worksheetState = useWorksheetState(authLoading);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [preSelectedStudent, setPreSelectedStudent] = useState<{id: string, name: string} | null>(null);
  const { 
    isGenerating, 
    generateWorksheetHandler, 
    streamProgress,
    mediaGenerating,
    cancelGeneration 
  } = useWorksheetGeneration(user?.id || null, worksheetState, selectedStudentId);
  const { tokenLeft, hasTokens, isDemo, profile } = useTokenSystem(user?.id || null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false);

  // Welcome Back Modal - show for returning anonymous users who have visited before
  useEffect(() => {
    if (authLoading || isRegisteredUser || user) return;
    
    const lastVisit = localStorage.getItem('worksheetAppLastVisit');
    const hasGeneratedBefore = localStorage.getItem('worksheetAppHasGenerated');
    
    if (lastVisit && hasGeneratedBefore === 'true') {
      const hoursSinceLastVisit = (Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60);
      // Show modal if more than 1 hour has passed since last visit AND they generated a worksheet before
      if (hoursSinceLastVisit > 1) {
        setShowWelcomeBackModal(true);
      }
    }
    
    // Update last visit timestamp
    localStorage.setItem('worksheetAppLastVisit', Date.now().toString());
  }, [authLoading, isRegisteredUser, user]);


  // Handle ?forceNew=true query param from Profile page (enables middle-click to open in new tab)
  useEffect(() => {
    if (searchParams.get('forceNew') === 'true') {
      sessionStorage.setItem('forceNewWorksheet', 'true');
      // Remove the param from URL without causing a reload
      setSearchParams({}, { replace: true });
      worksheetState.forceNewWorksheet();
    }
  }, [searchParams, setSearchParams, worksheetState]);

  // Function to scroll to pricing section
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-section');
    if (pricingSection) {
      pricingSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Check for pre-selected student from student page
  useEffect(() => {
    const preSelected = sessionStorage.getItem('preSelectedStudent');
    if (preSelected) {
      try {
        const studentData = JSON.parse(preSelected);
        setPreSelectedStudent(studentData);
        setSelectedStudentId(studentData.id);
        sessionStorage.removeItem('preSelectedStudent');
      } catch (error) {
        console.error('Error parsing pre-selected student:', error);
      }
    }
  }, []);

  // Check for restored worksheet from dashboard
  useEffect(() => {
    const restoredWorksheet = sessionStorage.getItem('restoredWorksheet');
    const studentName = sessionStorage.getItem('worksheetStudentName');
    
    if (restoredWorksheet) {
      try {
        const worksheet = JSON.parse(restoredWorksheet);
        console.log('🔄 Restoring worksheet from dashboard:', worksheet);
        
        let parsedWorksheet = null;
        if (worksheet.ai_response) {
          try {
            parsedWorksheet = JSON.parse(worksheet.ai_response);
            console.log('✅ Successfully parsed ai_response:', parsedWorksheet);
            
            parsedWorksheet = deepFixTextObjects(parsedWorksheet, 'restoredWorksheet');
            console.log('✅ Successfully fixed {text} objects in restored worksheet');
            
          } catch (parseError) {
            console.error('❌ Failed to parse ai_response:', parseError);
          }
        }
        
        if (parsedWorksheet) {
          parsedWorksheet.id = worksheet.id;
          
          // ✅ FIX: Add audio and image fields from database to editableWorksheet
          parsedWorksheet.audio_url = worksheet.audio_url;
          parsedWorksheet.audio_transcript = worksheet.audio_transcript;
          parsedWorksheet.audio_duration = worksheet.audio_duration;
          parsedWorksheet.audio_voice = worksheet.audio_voice;
          parsedWorksheet.selected_audio = worksheet.selected_audio;
          parsedWorksheet.selected_image = worksheet.selected_image;
          
          worksheetState.setGeneratedWorksheet(parsedWorksheet);
          worksheetState.setEditableWorksheet(parsedWorksheet);
          
          if (worksheet.form_data) {
            const inputParamsWithStudent = {
              ...worksheet.form_data,
              studentId: worksheet.student_id,
              studentName: studentName || worksheet.studentName,
              selectedImage: worksheet.selected_image,
              selectedAudio: worksheet.selected_audio  // ✅ FIX: Add audio mapping
            };
            worksheetState.setInputParams(inputParamsWithStudent);
            console.log('✅ Successfully mapped form_data with student info, selectedImage and selectedAudio:', inputParamsWithStudent);
          }
          
          worksheetState.setWorksheetId(worksheet.id);
          worksheetState.setGenerationTime(worksheet.generation_time_seconds || 5);
          worksheetState.setSourceCount(75);
          
          console.log('🎉 Worksheet fully restored with student information');
        }
        
        sessionStorage.removeItem('restoredWorksheet');
        sessionStorage.removeItem('worksheetStudentName');
      } catch (error) {
        console.error('💥 Error restoring worksheet:', error);
        sessionStorage.removeItem('restoredWorksheet');
        sessionStorage.removeItem('worksheetStudentName');
      }
    }
  }, []);

  // IMPORTANT: This must be BEFORE any early returns to satisfy React hooks rules
  const bothWorksheetsReady = worksheetState.generatedWorksheet && worksheetState.editableWorksheet;

  // Mark that user has generated a worksheet (for Welcome Back Modal logic)
  useEffect(() => {
    if (bothWorksheetsReady && !isRegisteredUser) {
      localStorage.setItem('worksheetAppHasGenerated', 'true');
    }
  }, [bothWorksheetsReady, isRegisteredUser]);

  // Show loading indicator while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-worksheet-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }


  const handleGenerateWorksheet = (data: any) => {
    console.log('🔍 POPUP DECISION DEBUG:', {
      userId: user?.id,
      isAnonymous,
      isRegisteredUser,
      isDemo,
      hasTokens,
      tokenLeft,
      userEmail: user?.email || '',
      userIsAnonymous: user?.is_anonymous
    });

    // FIXED: Only show popup for registered (non-anonymous) users who don't have tokens
    const shouldShowPopup = isRegisteredUser && !hasTokens;
    
    console.log('🔍 POPUP DECISION:', {
      shouldShowPopup,
      reason: shouldShowPopup 
        ? "Registered user without tokens" 
        : isDemo 
          ? "Demo user - can generate" 
          : "Anonymous user - can generate demo"
    });

    if (shouldShowPopup) {
      console.log('❌ Showing token popup');
      setShowTokenModal(true);
      return;
    }
    
    console.log('✅ Proceeding with worksheet generation');
    generateWorksheetHandler(data);
  };

  // Navigation component for authenticated users
  const AuthenticatedNav = () => (
    <div className="absolute top-4 right-4 z-50 flex flex-wrap items-center gap-3 justify-end">
      <Badge variant="outline" className="text-sm">
        Token Left: {tokenLeft}
      </Badge>
      <HomeworkNotificationBadge />
      <Button asChild variant="outline" size="sm">
        <Link to="/dashboard">
          <GraduationCap className="h-4 w-4 mr-2" />
          Dashboard
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link to="/profile">
          <User className="h-4 w-4 mr-2" />
          Profile
        </Link>
      </Button>
      <GCalStatusButton />
    </div>
  );

  // Navigation component for anonymous users with pulsing "2 FREE" badge
  const AnonymousNav = () => (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
      <Button onClick={scrollToPricing} variant="outline" size="sm">
        <DollarSign className="h-4 w-4 mr-2" />
        Pricing
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link to="/login">Login</Link>
      </Button>
      <Button asChild size="sm" className="relative">
        <Link to="/signup">
          Get Started Free
          <Badge className="absolute -top-2 -right-2 bg-green-500 text-white animate-pulse text-[10px] px-1.5 py-0.5 border-0">
            2 FREE
          </Badge>
        </Link>
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* FREE DEMO WEEK Banner */}
      <FreeWeekBanner />
      
      {/* Navigation based on auth status - hide when worksheet is displayed (WorksheetHeader has its own nav) */}
      {!bothWorksheetsReady && (isRegisteredUser ? <AuthenticatedNav /> : <AnonymousNav />)}
      
      {!bothWorksheetsReady ? (
        <>
          <FormView 
            onSubmit={handleGenerateWorksheet} 
            userId={user?.id || null} 
            onStudentChange={setSelectedStudentId}
            preSelectedStudent={preSelectedStudent}
            isRegisteredUser={!!isRegisteredUser}
          />
          
          {/* Progress Bar for anonymous users - shows journey path */}
          {!isRegisteredUser && (
            <TooltipProvider>
              <div className="w-full max-w-4xl mx-auto px-4 py-4">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <span className="font-medium text-primary">Demo</span>
                  </div>
                  
                  <div className="w-8 h-0.5 bg-muted-foreground/30" />
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 cursor-help opacity-60 hover:opacity-100 transition-opacity">
                        <Lock className="h-4 w-4" />
                        <span>Free Account</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">2 tokens</Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create free account to save worksheets & get 2 tokens!</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <div className="w-8 h-0.5 bg-muted-foreground/20" />
                  
                  <div className="flex items-center gap-1.5 opacity-40">
                    <span>Side-Gig</span>
                  </div>
                  
                  <div className="w-8 h-0.5 bg-muted-foreground/20" />
                  
                  <div className="flex items-center gap-1.5 opacity-40">
                    <span>Full-Time</span>
                  </div>
                </div>
              </div>
            </TooltipProvider>
          )}
          
          {/* Add pricing section below the form for anonymous users */}
          {!isRegisteredUser && (
            <div id="pricing-section">
              <PricingSection />
            </div>
          )}
        </>
      ) : (
        <GenerationView 
          worksheetId={worksheetState.worksheetId}
          generatedWorksheet={worksheetState.generatedWorksheet}
          editableWorksheet={worksheetState.editableWorksheet}
          setEditableWorksheet={worksheetState.setEditableWorksheet}
          inputParams={worksheetState.inputParams}
          generationTime={worksheetState.generationTime}
          sourceCount={worksheetState.sourceCount}
          onBack={worksheetState.resetWorksheetState}
          userId={isRegisteredUser ? user?.id || null : null}
        />
      )}
      
      <GeneratingModal 
        isOpen={isGenerating} 
        requiresAudio={!!worksheetState.inputParams?.requiresAudio}
        requiresImage={!!worksheetState.inputParams?.requiresImage}
        hasGrammar={!!worksheetState.inputParams?.hasGrammar}
        streamProgress={streamProgress}
        mediaGenerating={mediaGenerating}
        selectedExercises={worksheetState.inputParams?.selectedExercises}
      />
      
      <TokenPaywallModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        availableTokens={tokenLeft}
        profile={profile}
        onUpgrade={() => {
          console.log('Upgrade plan clicked');
          setShowTokenModal(false);
        }}
      />

      {/* Welcome Back Modal for returning anonymous users */}
      <Dialog open={showWelcomeBackModal} onOpenChange={setShowWelcomeBackModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Welcome back! 👋</DialogTitle>
            <DialogDescription className="text-base pt-2">
              Great to see you again! Log in to access your previous worksheets and continue your work.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>2 free worksheet tokens on signup</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>Save all your worksheets forever</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>Manage unlimited students</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowWelcomeBackModal(false)} className="flex-1">
              Continue as guest
            </Button>
            <Button asChild className="flex-1">
              <Link to="/signup" onClick={() => setShowWelcomeBackModal(false)}>
                Create Free Account
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
