'use client';

/**
 * Client-side face detection and recognition using face-api.js
 * 
 * Architecture:
 * - face-api.js TinyFaceDetector for fast face detection
 * - face-api.js FaceNet model for 128-dimensional embeddings
 * 
 * This approach is more reliable than MediaPipe in browser environments
 * and provides excellent accuracy with FaceNet embeddings.
 */

let faceApi: any = null;
let isModelsLoading = false;
let importPromise: Promise<any> | null = null;

/**
 * Lazy import function that only executes in browser
 * Uses direct dynamic import - the 'use client' directive should prevent SSR analysis
 */
async function lazyImportFaceApi(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Face detection can only run in the browser');
  }
  
  // Check if already loaded in window
  // @ts-expect-error - face-api might be on window
  if (window.faceapi) {
    // @ts-expect-error
    return window.faceapi;
  }
  
  // Direct dynamic import
  // With 'use client' and window check, this should only execute in browser
  // @ts-expect-error - face-api.js doesn't have TypeScript definitions
  const module = await import('face-api.js');
  const faceApiModule = module.default || module;
  
  // Store in window for future use
  // @ts-expect-error
  window.faceapi = faceApiModule;
  
  return faceApiModule;
}

/**
 * Initialize face-api.js models (detection and FaceNet for embeddings)
 */
async function loadFaceApiModels(): Promise<any> {
  // Early return if not in browser
  if (typeof window === 'undefined') {
    throw new Error('Face detection can only run in the browser');
  }

  if (faceApi) {
    return faceApi;
  }

  if (isModelsLoading && importPromise) {
    await importPromise;
    if (faceApi) return faceApi;
  }

  isModelsLoading = true;
  try {
    // Ensure we're definitely in browser before importing
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('Browser APIs not available');
    }

    // Lazy import - only executed in browser runtime
    importPromise = lazyImportFaceApi();
    const faceApiModule = await importPromise;
    faceApi = faceApiModule;
    
    // Load required models from public/models directory
    const modelsPath = '/models';
    
    console.log('Loading face-api.js models...');
    
    await Promise.all([
      faceApi.nets.tinyFaceDetector.loadFromUri(modelsPath),
      faceApi.nets.faceLandmark68Net.loadFromUri(modelsPath),
      faceApi.nets.faceRecognitionNet.loadFromUri(modelsPath), // FaceNet model for 128-dim embeddings
    ]);

    console.log('Face-api.js models loaded successfully');
    isModelsLoading = false;
    return faceApi;
  } catch (error) {
    isModelsLoading = false;
    console.error('Error loading face-api.js models:', error);
    throw new Error(`Failed to load face-api.js models: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Detect faces using face-api.js
 */
export async function detectFaces(
  image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<any[]> {
  await loadFaceApiModels();

  // Convert to canvas if needed
  let canvas: HTMLCanvasElement;
  if (image instanceof HTMLCanvasElement) {
    canvas = image;
  } else {
    canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    if (image instanceof HTMLVideoElement) {
      canvas.width = image.videoWidth;
      canvas.height = image.videoHeight;
      ctx.drawImage(image, 0, 0);
    } else {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.drawImage(image, 0, 0);
    }
  }

  // Use face-api.js to detect faces with landmarks
  const detections = await faceApi
    .detectAllFaces(canvas, new faceApi.TinyFaceDetectorOptions())
    .withFaceLandmarks();

  return detections.map((detection: any) => ({
    detection: detection.detection,
    landmarks: detection.landmarks,
    boundingBox: detection.detection.box,
  }));
}

/**
 * Generate 128-dimensional FaceNet embedding using face-api.js
 */
export async function generateEmbedding(
  image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<number[]> {
  await loadFaceApiModels();

  // Convert to canvas if needed
  let canvas: HTMLCanvasElement;
  if (image instanceof HTMLCanvasElement) {
    canvas = image;
  } else {
    canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    if (image instanceof HTMLVideoElement) {
      canvas.width = image.videoWidth;
      canvas.height = image.videoHeight;
      ctx.drawImage(image, 0, 0);
    } else {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.drawImage(image, 0, 0);
    }
  }

  // Use face-api.js to detect face and compute FaceNet descriptor (128 dimensions)
  const detection = await faceApi
    .detectSingleFace(canvas, new faceApi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    throw new Error('No face detected or failed to generate embedding');
  }

  // Return 128-dimensional FaceNet embedding
  const descriptor = detection.descriptor as Float32Array | number[];
  return Array.from(descriptor);
}

/**
 * Detect a single face and generate its FaceNet embedding
 */
export async function detectAndEmbed(
  image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<{ face: any; embedding: number[] }> {
  await loadFaceApiModels();

  // Convert to canvas if needed
  let canvas: HTMLCanvasElement;
  if (image instanceof HTMLCanvasElement) {
    canvas = image;
  } else {
    canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    if (image instanceof HTMLVideoElement) {
      canvas.width = image.videoWidth;
      canvas.height = image.videoHeight;
      ctx.drawImage(image, 0, 0);
    } else {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.drawImage(image, 0, 0);
    }
  }

  // Use detectSingleFace for getting descriptor (works better than detectAllFaces)
  const detection = await faceApi
    .detectSingleFace(canvas, new faceApi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    throw new Error('No face detected in image');
  }

  // Extract embedding and face info
  const descriptor = detection.descriptor as Float32Array | number[];
  const embedding = Array.from(descriptor);
  const face = {
    detection: detection.detection,
    landmarks: detection.landmarks,
    boundingBox: detection.detection.box,
  };

  return {
    face,
    embedding, // 128-dimensional FaceNet embedding
  };
}

/**
 * Preload all models (useful for faster subsequent calls)
 */
export async function preloadModels(): Promise<void> {
  await loadFaceApiModels();
}
