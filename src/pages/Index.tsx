import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthFlow } from "@/hooks/useAuthFlow";
import { useWorksheetState } from "@/hooks/useWorksheetState";
import { useWorksheetGeneration } from "@/hooks/useWorksheetGeneration";
import { useTokenSystem } from "@/hooks/useTokenSystem";
import { Button } from "@/components/ui/button";
import GeneratingModal from "@/components/GeneratingModal";
import FormView from "@/components/worksheet/FormView";
import GenerationView from "@/components/worksheet/GenerationView";
import { TokenPaywallModal } from "@/components/TokenPaywallModal";
import { PricingSection } from "@/components/PricingSection";
import { FreeWeekBanner } from "@/components/FreeWeekBanner";
import { deepFixTextObjects } from "@/utils/textObjectFixer";
import { CheckCircle } from "lucide-react";
import StickyNav from "@/components/landing/StickyNav";
import HeroHeadline from "@/components/landing/HeroHeadline";
import StatsBar from "@/components/landing/StatsBar";
import ValueCards from "@/components/landing/ValueCards";
import EcosystemSection from "@/components/landing/EcosystemSection";
import TestimonialsRow from "@/components/landing/TestimonialsRow";
import FinalCTA from "@/components/landing/FinalCTA";
import GlobalFooter from "@/components/GlobalFooter";
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
      if (hoursSinceLastVisit > 1) {
        setShowWelcomeBackModal(true);
      }
    }
    
    localStorage.setItem('worksheetAppLastVisit', Date.now().toString());
  }, [authLoading, isRegisteredUser, user]);

  // Handle ?forceNew=true query param from Profile page
  useEffect(() => {
    if (searchParams.get('forceNew') === 'true') {
      sessionStorage.setItem('forceNewWorksheet', 'true');
      setSearchParams({}, { replace: true });
      worksheetState.forceNewWorksheet();
    }
  }, [searchParams, setSearchParams, worksheetState]);

  // Function to scroll to pricing section
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-section');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
              selectedAudio: worksheet.selected_audio
            };
            worksheetState.setInputParams(inputParamsWithStudent);
          }
          
          worksheetState.setWorksheetId(worksheet.id);
          worksheetState.setGenerationTime(worksheet.generation_time_seconds || 5);
          worksheetState.setSourceCount(75);
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

  const bothWorksheetsReady = worksheetState.generatedWorksheet && worksheetState.editableWorksheet;

  useEffect(() => {
    if (bothWorksheetsReady && !isRegisteredUser) {
      localStorage.setItem('worksheetAppHasGenerated', 'true');
    }
  }, [bothWorksheetsReady, isRegisteredUser]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
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

    const shouldShowPopup = isRegisteredUser && !hasTokens;

    if (shouldShowPopup) {
      setShowTokenModal(true);
      return;
    }
    
    generateWorksheetHandler(data);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <FreeWeekBanner />
      
      {!bothWorksheetsReady && (
        <StickyNav
          isRegisteredUser={!!isRegisteredUser}
          tokenLeft={tokenLeft}
          user={user}
          scrollToPricing={scrollToPricing}
        />
      )}
      
      {!bothWorksheetsReady ? (
        <>
          {!isRegisteredUser ? (
            <>
              <HeroHeadline />
              <div id="worksheet-form" className="scroll-mt-16 bg-gradient-to-b from-background to-secondary/30 pb-16">
                <FormView 
                  onSubmit={handleGenerateWorksheet} 
                  userId={user?.id || null} 
                  onStudentChange={setSelectedStudentId}
                  preSelectedStudent={preSelectedStudent}
                  isRegisteredUser={false}
                  variant="landing"
                />
              </div>
              <StatsBar />
              <ValueCards />
              <EcosystemSection />
              <TestimonialsRow />
              <div id="pricing-section">
                <PricingSection />
              </div>
              <FinalCTA />
              <GlobalFooter />
            </>
          ) : (
            <div className="max-w-5xl mx-auto px-4 pt-8 pb-16">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-foreground">
                  Create a new worksheet
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Describe your lesson and AI will generate exercises
                </p>
              </div>
              <FormView 
                onSubmit={handleGenerateWorksheet} 
                userId={user?.id || null} 
                onStudentChange={setSelectedStudentId}
                preSelectedStudent={preSelectedStudent}
                isRegisteredUser={true}
                variant="dashboard"
              />
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
