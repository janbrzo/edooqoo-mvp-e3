
// Enhanced deep fix for {text} objects and vocabulary structure
export const deepFixTextObjects = (obj: any, path: string = 'root'): any => {
  console.log(`🔧 Checking path: ${path}, type: ${typeof obj}`);
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // If it's a primitive, return as-is
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Special case: {text: "something"} object
  if (typeof obj === 'object' && obj.hasOwnProperty('text') && Object.keys(obj).length === 1) {
    console.log(`🔧 FIXED {text} object at ${path}:`, obj, '→', obj.text);
    return obj.text;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item, index) => deepFixTextObjects(item, `${path}[${index}]`));
  }
  
  // Handle regular objects
  const fixed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Handle warmup_questions array
    if (key === 'warmup_questions' && Array.isArray(value)) {
      console.log(`🔧 ${path}.${key}: Processing warmup questions array`);
      fixed[key] = value.map((question, index) => {
        if (typeof question === 'string') {
          return question;
        }
        if (typeof question === 'object' && question.text) {
          return question.text;
        }
        return `Question ${index + 1}`;
      });
      continue;
    }
    
    // Handle vocabulary_sheet structure conversion
    if (key === 'vocabulary_sheet') {
      console.log(`🔧 ${path}.${key}: Processing vocabulary sheet`);
      
      // Case 1: vocabulary_sheet is {title: "", words: [...]} - convert to flat array
      if (value && typeof value === 'object' && (value as any).words && Array.isArray((value as any).words)) {
        console.log(`🔧 CONVERTING vocabulary from nested structure to flat array`);
        fixed[key] = (value as any).words.map((item: any) => {
          // Convert {word, definition} or {phrase, meaning} to {term, meaning}
          if (item.word && item.definition) {
            return { term: item.word, meaning: item.definition };
          }
          if (item.phrase && item.meaning) {
            return { term: item.phrase, meaning: item.meaning };
          }
          if (item.term && item.meaning) {
            return { term: item.term, meaning: item.meaning };
          }
          return { term: 'Term', meaning: 'Definition' };
        });
        continue;
      }
      
      // Case 2: vocabulary_sheet is already array but with wrong structure
      if (Array.isArray(value)) {
        fixed[key] = value.map((item: any) => {
          if (item.word && item.definition) {
            return { term: item.word, meaning: item.definition };
          }
          if (item.phrase && item.meaning) {
            return { term: item.phrase, meaning: item.meaning };
          }
          if (item.term && item.meaning) {
            return { term: item.term, meaning: item.meaning };
          }
          return deepFixTextObjects(item, `${path}.${key}[item]`);
        });
        continue;
      }
    }
    
    fixed[key] = deepFixTextObjects(value, `${path}.${key}`);
  }
  
  return fixed;
};
