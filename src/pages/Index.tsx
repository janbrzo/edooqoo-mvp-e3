import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthFlow } from "@/hooks/useAuthFlow";
import { useWorksheetState } from "@/hooks/useWorksheetState";
import { useWorksheetGeneration } from "@/hooks/useWorksheetGeneration";
import { useTokenSystem } from "@/hooks/useTokenSystem";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";
import { TokenPaywallModal } from "@/components/TokenPaywallModal";
import { PricingSection } from "@/components/PricingSection";
import { FreeWeekBanner } from "@/components/FreeWeekBanner";
import { deepFixTextObjects } from "@/utils/textObjectFixer";
import { User, GraduationCap, DollarSign } from "lucide-react";
import { HomeworkNotificationBadge } from "@/components/homework/HomeworkNotificationBadge";
import { 
  DemoModeBadge, 
  SignupProgressBar, 
  PulsingSignupButton,
  WelcomeBackModal,
  ExitIntentModal,
  UpgradeTeachingBanner
} from "@/components/LoginIncentives";

/**
 * Main Index page component that handles worksheet generation and display
 */
const Index = () => {
  const { user, loading: authLoading, isRegisteredUser, isAnonymous } = useAuthFlow();
  const worksheetState = useWorksheetState(authLoading);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [preSelectedStudent, setPreSelectedStudent] = useState<{id: string, name: string} | null>(null);
  const { toast } = useToast();
  const { 
    isGenerating, 
    generateWorksheetHandler, 
    streamProgress,
    mediaGenerating,
    cancelGeneration 
  } = useWorksheetGeneration(user?.id || null, worksheetState, selectedStudentId);
  const { tokenLeft, hasTokens, isDemo, profile } = useTokenSystem(user?.id || null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  
  // LOGIN INCENTIVES: Modal states
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false);
  const [showExitIntentModal, setShowExitIntentModal] = useState(false);
  const exitIntentShown = useRef(false);
  const worksheetGeneratedToastShown = useRef(false);

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

  // INCENTIVE #5: Welcome Back Modal - show when returning user
  useEffect(() => {
    if (isRegisteredUser || authLoading) return;
    
    const hasVisited = localStorage.getItem('worksheetAppVisited');
    if (hasVisited) {
      const lastVisit = parseInt(hasVisited);
      const hoursSinceLastVisit = (Date.now() - lastVisit) / (1000 * 60 * 60);
      // Show modal if last visit was more than 1 hour ago
      if (hoursSinceLastVisit > 1) {
        // Small delay to not overwhelm user immediately
        const timer = setTimeout(() => {
          setShowWelcomeBackModal(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
    localStorage.setItem('worksheetAppVisited', Date.now().toString());
  }, [isRegisteredUser, authLoading]);

  // INCENTIVE #9: Exit Intent Modal - show when cursor leaves viewport
  useEffect(() => {
    if (isRegisteredUser) return;
    
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when cursor moves to top of page (exiting)
      if (e.clientY < 10 && !exitIntentShown.current) {
        exitIntentShown.current = true;
        setShowExitIntentModal(true);
      }
    };
    
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [isRegisteredUser]);

  const bothWorksheetsReady = worksheetState.generatedWorksheet && worksheetState.editableWorksheet;

  // INCENTIVE #3: Toast after worksheet generation for anonymous users
  useEffect(() => {
    if (bothWorksheetsReady && !isRegisteredUser && !worksheetGeneratedToastShown.current) {
      worksheetGeneratedToastShown.current = true;
      // Delayed toast so user can first see the worksheet
      const timer = setTimeout(() => {
        toast({
          title: "⚠️ This worksheet won't be saved",
          description: (
            <span>
              Create a free account to keep all your work!{' '}
              <Link to="/signup" className="underline font-medium hover:text-primary">
                Sign up free →
              </Link>
            </span>
          ),
          duration: 10000,
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [bothWorksheetsReady, isRegisteredUser, toast]);

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
    <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
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
    </div>
  );

  // INCENTIVE #1 & #8: Navigation for anonymous users with DemoModeBadge and PulsingSignupButton
  const AnonymousNav = () => (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
      {/* INCENTIVE #1: Demo Mode Badge */}
      <DemoModeBadge />
      <Button onClick={scrollToPricing} variant="outline" size="sm">
        <DollarSign className="h-4 w-4 mr-2" />
        Pricing
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link to="/login">Login</Link>
      </Button>
      {/* INCENTIVE #8: Pulsing Sign Up Button with "2 FREE" badge */}
      <PulsingSignupButton />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* FREE DEMO WEEK Banner */}
      <FreeWeekBanner />
      
      {/* Navigation based on auth status */}
      {isRegisteredUser ? <AuthenticatedNav /> : <AnonymousNav />}
      
      {!bothWorksheetsReady ? (
        <>
          <FormView 
            onSubmit={handleGenerateWorksheet} 
            userId={user?.id || null} 
            onStudentChange={setSelectedStudentId}
            preSelectedStudent={preSelectedStudent}
            isRegisteredUser={!!isRegisteredUser}
          />
          
          {/* INCENTIVE #2: Signup Progress Bar for anonymous users */}
          {!isRegisteredUser && <SignupProgressBar />}
          
          {/* Add pricing section below the form for anonymous users */}
          {!isRegisteredUser && (
            <div id="pricing-section">
              <PricingSection />
            </div>
          )}
        </>
      ) : (
        <>
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
          
          {/* INCENTIVE #7: Upgrade Teaching Banner for anonymous users */}
          {!isRegisteredUser && <UpgradeTeachingBanner />}
        </>
      )}
      
      <GeneratingModal 
        isOpen={isGenerating} 
        requiresAudio={!!worksheetState.inputParams?.requiresAudio}
        requiresImage={!!worksheetState.inputParams?.requiresImage}
        hasGrammar={!!worksheetState.inputParams?.hasGrammar}
        streamProgress={streamProgress}
        mediaGenerating={mediaGenerating}
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
      
      {/* INCENTIVE #5: Welcome Back Modal */}
      <WelcomeBackModal 
        open={showWelcomeBackModal} 
        onOpenChange={setShowWelcomeBackModal} 
      />
      
      {/* INCENTIVE #9: Exit Intent Modal */}
      <ExitIntentModal 
        open={showExitIntentModal} 
        onOpenChange={setShowExitIntentModal} 
      />
    </div>
  );
};

export default Index;
