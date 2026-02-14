
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

export const generateFlooringVisualization = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  try {
    // Resize image before sending to API to avoid "Payload Too Large" or timeouts
    const resizedImage = await resizeImage(base64Image);
    
    // Clean base64 string
    const cleanBase64 = resizedImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    // Call our secure Cloudflare Pages Function
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: cleanBase64,
        prompt: `Edit this image. Replace the floor with ${prompt}. Ensure the perspective matches the original floor perfectly. Maintain the lighting and shadows of the room. Keep other objects, walls, and furniture unchanged. High photorealism.`,
        model: MODEL_NAME 
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).error || `Server error: ${response.status}`);
    }

    const data = await response.json() as any;
    const candidates = data.candidates;

    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      
      // 1. Check for Image part (inline_data in raw REST API response)
      for (const part of parts) {
        if (part.inline_data && part.inline_data.data) {
          return `data:image/png;base64,${part.inline_data.data}`;
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

  } catch (error: any) {
    console.error("Gemini Proxy Error:", error);
    throw new Error(error.message || "Failed to process image.");
  }
};
