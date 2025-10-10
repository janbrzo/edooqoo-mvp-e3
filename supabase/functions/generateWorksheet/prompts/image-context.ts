/**
 * Image Context - provides AI with detailed information about selected image
 * This ensures picture-based exercises are tailored to the actual image content
 */

export interface SelectedImage {
  id: string;
  url: string;
  description: string;
  photographer: string;
  photographerUrl: string;
}

export const getImageContext = (selectedImage: SelectedImage | null): string => {
  if (!selectedImage) {
    return '';
  }

  return `

=== IMAGE CONTEXT ===

CRITICAL: A specific image has been selected for this worksheet. You MUST use this exact image in all picture-based exercises (describe-picture, answer-questions with image).

IMAGE DETAILS:
- Image URL: ${selectedImage.url}
- Image Description: ${selectedImage.description}
- Image ID: ${selectedImage.id}
- Photographer: ${selectedImage.photographer}
- Photographer URL: ${selectedImage.photographerUrl}

INSTRUCTIONS FOR PICTURE EXERCISES:
1. For "describe-picture" exercises:
   - Set "image_url" to: ${selectedImage.url}
   - Set "image_description" to describe what is visible in THIS specific image
   - Create prompts that reference specific elements visible in the image described as: "${selectedImage.description}"
   - Include photographer credit: "${selectedImage.photographer}" with URL: "${selectedImage.photographerUrl}"

2. For "answer-questions" exercises in picture mode:
   - Set "image_url" to: ${selectedImage.url}
   - Create questions about specific visible elements in the image described as: "${selectedImage.description}"
   - Questions should encourage students to observe and describe details from THIS image
   - Include photographer credit: "${selectedImage.photographer}" with URL: "${selectedImage.photographerUrl}"

3. DO NOT generate generic picture content. ALL picture-based content must be directly related to the image described as: "${selectedImage.description}"

=== END IMAGE CONTEXT ===
`;
};
