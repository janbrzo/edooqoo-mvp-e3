
export const getExpectedExerciseCount = (lessonTime: string): number => {
  if (lessonTime.includes('45')) {
    return 6;
  }
  // Always expect 8 exercises from backend for 60/90 min lessons
  return 8;
};

export const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Check if worksheet has an image
export const hasImage = (worksheet: any): boolean => {
  return !!(worksheet?.form_data?.selectedImage && 
            worksheet.form_data.selectedImage !== null &&
            typeof worksheet.form_data.selectedImage === 'object');
};

// Check if worksheet has audio
export const hasAudio = (worksheet: any): boolean => {
  return !!(worksheet?.form_data?.selectedAudio && 
            worksheet.form_data.selectedAudio !== null &&
            typeof worksheet.form_data.selectedAudio === 'object');
};

export const createSampleVocabulary = (count: number) => {
  const terms = [
    'Abundant', 'Benevolent', 'Concurrent', 'Diligent', 'Ephemeral', 
    'Fastidious', 'Gregarious', 'Haphazard', 'Impeccable', 'Juxtapose', 
    'Kinetic', 'Luminous', 'Meticulous', 'Nostalgia', 'Omnipotent'
  ];
  const meanings = [
    'Existing in large quantities', 'Kind and generous', 'Occurring at the same time', 
    'Hardworking', 'Lasting for a very short time', 'Paying attention to detail', 
    'Sociable', 'Random or lacking organization', 'Perfect, flawless', 
    'To place side by side', 'Related to motion', 'Full of light', 
    'Showing great attention to detail', 'Sentimental longing for the past', 
    'Having unlimited power'
  ];
  
  return Array(Math.min(count, terms.length)).fill(null).map((_, i) => ({
    term: terms[i],
    meaning: meanings[i]
  }));
};

export const validateWorksheet = (worksheetData: any, expectedCount: number): boolean => {
  console.log('🔍 Frontend validation - Expected exercises:', expectedCount);
  console.log('🔍 Frontend validation - Received exercises:', worksheetData?.exercises?.length || 0);
  console.log('🔍 Frontend validation - Worksheet data structure:', {
    hasWorksheet: !!worksheetData,
    hasExercises: !!worksheetData?.exercises,
    isArray: Array.isArray(worksheetData?.exercises),
    exerciseCount: worksheetData?.exercises?.length || 0
  });
  
  if (!worksheetData || !worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
    console.log('❌ Frontend validation - FAILED: Missing or invalid exercises array');
    return false;
  }
  
  const result = worksheetData.exercises.length >= 6; // Accept 6, 7, or 8 exercises
  console.log('🔍 Frontend validation - Result:', result);
  return result;
};
