
// Enhanced deep fix for {text} objects
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

  // Special case: {phrase: "something", meaning: "something"} object
  if (typeof obj === 'object' && obj.hasOwnProperty('phrase') && obj.hasOwnProperty('meaning')) {
    console.log(`🔧 FIXED {phrase, meaning} object at ${path}:`, obj, '→', obj.phrase);
    return obj.phrase;
  }

  // Special case: {term: "something", meaning: "something"} object
  if (typeof obj === 'object' && obj.hasOwnProperty('term') && obj.hasOwnProperty('meaning')) {
    console.log(`🔧 FIXED {term, meaning} object at ${path}:`, obj, '→', obj.term);
    return obj.term;
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
    
    fixed[key] = deepFixTextObjects(value, `${path}.${key}`);
  }
  
  return fixed;
};
