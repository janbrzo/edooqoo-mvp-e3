
// Enhanced deep fix for {text} objects and nano_skill structures
export const deepFixTextObjects = (obj: any, path: string = 'root'): any => {
  console.log(`🔧 Checking path: ${path}, type: ${typeof obj}`);
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // If it's a primitive, return as-is
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Special case: {text: "something"} object with ONLY text key - convert to string
  if (typeof obj === 'object' && obj.hasOwnProperty('text') && Object.keys(obj).length === 1) {
    console.log(`🔧 FIXED {text} object at ${path}:`, obj, '→', obj.text);
    return obj.text;
  }
  
  // NEW: Handle objects with text + nano_skill (keep structure but ensure text is string)
  if (typeof obj === 'object' && obj.hasOwnProperty('text') && obj.hasOwnProperty('nano_skill')) {
    // This is an item like {text: "...", nano_skill: {...}} - keep it as object
    // but ensure nested text is flattened if needed
    if (typeof obj.text === 'object' && obj.text?.text) {
      console.log(`🔧 FLATTENED nested text at ${path}:`, obj.text, '→', obj.text.text);
      return { ...obj, text: obj.text.text };
    }
    // Keep the object as-is - it has valid structure
    return obj;
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

// NEW: Helper to safely extract text from potentially wrapped objects
// Use this in rendering components to get displayable text
export const safeGetText = (item: any): string => {
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item !== null) {
    if (typeof item.text === 'string') return item.text;
    if (typeof item.text === 'object') return safeGetText(item.text);
  }
  return String(item || '');
};

// NEW: Helper to safely extract nano_skill from an item
export const safeGetNanoSkill = (item: any): { name: string; confidence: number; reason: string } | null => {
  if (typeof item === 'object' && item !== null && item.nano_skill) {
    return item.nano_skill;
  }
  return null;
};
