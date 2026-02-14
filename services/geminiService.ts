
// We use the secure backend proxy now, so no direct SDK import is needed.
// This keeps the client bundle smaller and the API key secure.

const MODEL_NAME = 'gemini-2.5-flash-image';

const resizeImage = (base64Str: string, maxDimension = 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height *= maxDimension / width;
          width = maxDimension;
        } else {
          width *= maxDimension / height;
          height = maxDimension;
        }
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG 0.8 to ensure manageable payload size
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      console.warn("Image resize failed, using original.");
      resolve(base64Str);
    };
  });
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateFlooringVisualization = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  try {
    // Resize image before sending to API to avoid "Payload Too Large" or timeouts
    const resizedImage = await resizeImage(base64Image);
    
    // Clean base64 string
    const cleanBase64 = resizedImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    let attempts = 0;
    const MAX_RETRIES = 3;

    while (attempts < MAX_RETRIES) {
      try {
        // Call our secure Cloudflare Pages Function
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: cleanBase64,
            prompt: `Task: Floor Replacement.
Edit the input image. Replace the existing garage floor with this texture: "${prompt}".
Requirements:
1. Maintain perfect perspective and vanishing points.
2. Keep all walls, objects, and shadows exactly as they are.
3. Apply the new flooring texture realistically with correct lighting and reflection.
4. Output ONLY the edited image.`,
            model: MODEL_NAME 
          })
        });

        // Handle Rate Limiting (429)
        if (response.status === 429) {
          console.warn(`Rate limit hit. Attempt ${attempts + 1} of ${MAX_RETRIES}`);
          const errorData = await response.json().catch(() => ({}));
          // Try to extract wait time from details if possible, or use exponential backoff
          const waitTime = 2000 * Math.pow(2, attempts); // 2s, 4s, 8s
          await delay(waitTime);
          attempts++;
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          // Throw a combined error message including details if available
          const mainError = (errorData as any).error || `Server error: ${response.status}`;
          const details = (errorData as any).details ? ` (${(errorData as any).details})` : '';
          throw new Error(mainError + details);
        }

        const data = await response.json() as any;
        const candidates = data.candidates;

        if (candidates && candidates.length > 0) {
          const parts = candidates[0].content.parts;
          
          // 1. Check for Image part (inlineData in standard REST API response)
          for (const part of parts) {
            // API may return camelCase 'inlineData' or snake_case 'inline_data'
            const inlineData = part.inlineData || part.inline_data;
            if (inlineData && inlineData.data) {
              return `data:image/png;base64,${inlineData.data}`;
            }
          }

          // 2. If no image, check for Text part (refusals/explanations)
          for (const part of parts) {
            if (part.text) {
              throw new Error(part.text);
            }
          }
        }

        throw new Error("The model returned an empty response.");

      } catch (innerError: any) {
        // If we exhausted retries or it's not a rate limit error, rethrow
        if (attempts >= MAX_RETRIES - 1 || !innerError.message.includes('429')) {
          throw innerError;
        }
        attempts++;
      }
    }
    
    throw new Error("Service busy. Please try again in a moment.");

  } catch (error: any) {
    console.error("Gemini Proxy Error:", error);
    // User friendly message for quota errors
    if (error.message.includes("quota") || error.message.includes("429")) {
      throw new Error("High traffic volume. Please wait 1 minute and try again.");
    }
    throw new Error(error.message || "Failed to process image.");
  }
};