# LMS Project - Face Recognition & Detection System

Complete documentation of the Learning Management System project structure, with detailed focus on the Face Recognition and Detection implementation.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Face Recognition System Architecture](#face-recognition-system-architecture)
3. [Project Structure](#project-structure)
4. [Face Detection & Recognition Components](#face-detection--recognition-components)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Configuration Files](#configuration-files)
8. [Dependencies](#dependencies)
9. [Workflow & Data Flow](#workflow--data-flow)
10. [Setup & Installation](#setup--installation)

---

## Project Overview

This LMS (Learning Management System) is built with **Next.js 16** and features a comprehensive **Face Recognition System** for attendance tracking. The system uses client-side face detection and server-side recognition to provide secure, accurate attendance management.

### Key Technologies

- **Frontend**: Next.js 16.0.6 (App Router, Turbopack)
- **Face Detection**: face-api.js (TinyFaceDetector + FaceNet)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth
- **Storage**: Tigris (S3-compatible)

---

## Face Recognition System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client-Side (Browser)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Camera     │───▶│  face-api.js │───▶│  Embedding  │ │
│  │  (getUserMedia)│   │  (Detection) │   │  (128-dim)   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP POST (JSON)
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  Server-Side (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │  API Route   │───▶│ Recognition  │───▶│  PostgreSQL  │ │
│  │  /register   │    │   Service    │    │  Database    │ │
│  │  /recognize  │    │  (Euclidean  │    │  (Embeddings)│ │
│  └──────────────┘    │   Distance)   │    └──────────────┘ │
│                      └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### Face Detection Flow

1. **Camera Access**: User grants camera permission via `getUserMedia()`
2. **Frame Capture**: Video stream is captured to HTML5 Canvas
3. **Face Detection**: face-api.js TinyFaceDetector detects face(s) in frame
4. **Landmark Detection**: 68 facial landmarks are extracted
5. **Embedding Generation**: FaceNet model generates 128-dimensional embedding vector
6. **API Transmission**: Embedding sent to server via POST request

### Face Recognition Flow

1. **Query Embedding**: Client generates embedding from current camera frame
2. **Database Query**: Server retrieves all stored embeddings from database
3. **Distance Calculation**: Euclidean distance computed between query and each stored embedding
4. **Threshold Matching**: If distance ≤ threshold (default: 0.5), face is recognized
5. **Confidence Score**: Confidence = 1 / (1 + distance)
6. **Result Return**: User ID and confidence returned to client

---

## Project Structure

```
lms/
├── app/                                    # Next.js App Router
│   ├── api/                                # API Routes
│   │   ├── auth/                          # Authentication endpoints
│   │   │   └── [...all]/
│   │   │       └── route.ts               # Better Auth handler
│   │   ├── face-recognition/              # Face Recognition API ⭐
│   │   │   ├── register/
│   │   │   │   └── route.ts              # POST: Register face embedding
│   │   │   ├── recognize/
│   │   │   │   └── route.ts              # POST: Recognize face
│   │   │   └── embedding/
│   │   │       └── route.ts              # GET/DELETE: Manage embeddings
│   │   └── s3/                            # File upload endpoints
│   │       ├── upload/
│   │       └── delete/
│   ├── (auth)/                            # Auth pages (login, signup)
│   └── (public-facing)/                   # Public pages
│
├── components/                             # React Components
│   ├── face-recognition/                   # Face Recognition Components ⭐
│   │   ├── RegisterFace.tsx              # Face registration UI
│   │   └── FaceRecognition.tsx            # Face recognition UI
│   ├── file-uploader/                     # File upload components
│   ├── rich-text-editor/                  # Tiptap editor
│   └── ui/                                # shadcn/ui components
│
├── lib/                                    # Utility Libraries
│   ├── face-detection-client.ts           # Client-side face detection ⭐
│   ├── face-recognition.ts                # Server-side recognition service ⭐
│   ├── auth.ts                            # Better Auth configuration
│   ├── auth-client.ts                     # Client-side auth
│   ├── db.ts                              # Prisma client
│   ├── env.ts                             # Environment validation
│   ├── arcjet.ts                          # Security configuration
│   └── resend.ts                          # Email service
│
├── prisma/                                 # Database
│   ├── schema.prisma                      # Database schema ⭐
│   └── migrations/                        # Database migrations
│
├── public/                                 # Static Files
│   └── models/                            # face-api.js model files ⭐
│       ├── tiny_face_detector_model-weights_manifest.json
│       ├── tiny_face_detector_model-shard1
│       ├── face_landmark_68_model-weights_manifest.json
│       ├── face_landmark_68_model-shard1
│       ├── face_recognition_model-weights_manifest.json
│       ├── face_recognition_model-shard1
│       └── face_recognition_model-shard2
│
├── scripts/                                # Utility Scripts
│   └── download-face-api-models.mjs       # Download face-api.js models
│
├── next.config.ts                          # Next.js configuration
├── package.json                           # Dependencies
├── tsconfig.json                          # TypeScript configuration
└── .env                                    # Environment variables
```

---

## Face Detection & Recognition Components

### 1. Client-Side Face Detection (`lib/face-detection-client.ts`)

**Purpose**: Handles all client-side face detection and embedding generation using face-api.js.

**Key Functions**:

```typescript
// Initialize and load face-api.js models
async function loadFaceApiModels(): Promise<any>

// Detect all faces in an image/video frame
export async function detectFaces(
  image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<any[]>

// Generate 128-dimensional FaceNet embedding
export async function generateEmbedding(
  image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<number[]>

// Detect face and generate embedding in one call
export async function detectAndEmbed(
  image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<{ face: any; embedding: number[] }>

// Preload models for faster subsequent calls
export async function preloadModels(): Promise<void>
```

**Models Used**:
- **TinyFaceDetector**: Fast face detection (optimized for real-time)
- **FaceLandmark68Net**: 68-point facial landmark detection
- **FaceRecognitionNet**: FaceNet model for 128-dimensional embeddings

**Technical Details**:
- Uses dynamic import to prevent SSR bundling issues
- Models loaded from `/public/models/` directory
- Embeddings are normalized 128-dimensional float arrays
- Browser-only execution (checks for `window` object)

---

### 2. Server-Side Recognition Service (`lib/face-recognition.ts`)

**Purpose**: Handles face recognition logic, embedding storage, and database operations.

**Key Classes & Methods**:

```typescript
class FaceRecognitionService {
  // Calculate cosine similarity between two embeddings
  calculateSimilarity(embedding1: number[], embedding2: number[]): number

  // Calculate Euclidean distance between two embeddings
  calculateDistance(embedding1: number[], embedding2: number[]): number

  // Recognize a face by comparing with stored embeddings
  async recognizeFace(
    queryEmbedding: number[],
    options?: RecognitionOptions
  ): Promise<RecognitionResult | null>

  // Save face embedding to database
  async saveEmbedding(
    userId: string,
    embedding: number[],
    imageUrl?: string
  ): Promise<FaceEmbedding>

  // Get embedding for a user
  async getEmbedding(userId: string): Promise<FaceEmbedding | null>

  // Delete embedding for a user
  async deleteEmbedding(userId: string): Promise<void>
}
```

**Recognition Algorithm**:
1. Retrieve all stored embeddings from database
2. Calculate Euclidean distance: `√Σ(embedding1[i] - embedding2[i])²`
3. Convert distance to confidence: `1 / (1 + distance)`
4. Match if distance ≤ threshold (default: 0.5)
5. Return best match with confidence score

**Interfaces**:

```typescript
interface FaceEmbedding {
  id: string;
  userId: string;
  embedding: number[];  // 128-dimensional array
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RecognitionResult {
  userId: string;
  confidence: number;   // 0-1, higher is better
  distance: number;      // Lower is better
  matched: boolean;
}

interface RecognitionOptions {
  threshold?: number;    // Distance threshold (default: 0.5)
  topK?: number;         // Number of top matches (default: 1)
}
```

---

### 3. RegisterFace Component (`components/face-recognition/RegisterFace.tsx`)

**Purpose**: UI component for registering a user's face.

**Features**:
- Camera access and video stream
- Real-time face detection feedback
- Face capture and embedding generation
- API integration for saving embeddings
- Success/error handling with toast notifications

**Props**:
```typescript
interface RegisterFaceProps {
  onSuccess?: () => void;    // Callback after successful registration
  onCancel?: () => void;     // Callback for cancellation
}
```

**User Flow**:
1. User clicks "Start Camera"
2. Camera stream starts, user positions face
3. User clicks "Capture & Register"
4. Component calls `detectAndEmbed()` from `face-detection-client.ts`
5. Embedding sent to `/api/face-recognition/register`
6. Success message displayed, camera stops

---

### 4. FaceRecognition Component (`components/face-recognition/FaceRecognition.tsx`)

**Purpose**: UI component for real-time face recognition.

**Features**:
- Continuous camera stream
- Automatic recognition at intervals (default: 2 seconds)
- Real-time recognition status display
- Confidence score visualization
- Callback for recognized users

**Props**:
```typescript
interface FaceRecognitionProps {
  classId?: string;                    // Optional class ID for attendance
  onRecognized?: (userId: string, confidence: number) => void;
  recognitionInterval?: number;         // Milliseconds between attempts (default: 2000)
  autoStart?: boolean;                 // Auto-start recognition (default: false)
}
```

**User Flow**:
1. User clicks "Start Recognition"
2. Camera stream starts
3. Every 2 seconds (configurable):
   - Frame captured to canvas
   - `detectAndEmbed()` called
   - Embedding sent to `/api/face-recognition/recognize`
   - Result displayed with confidence
4. If recognized, `onRecognized` callback fired
5. User can stop recognition anytime

---

## API Endpoints

### 1. Register Face Embedding

**Endpoint**: `POST /api/face-recognition/register`

**Authentication**: Required (Better Auth session)

**Request Body** (FormData):
```
embedding: string (JSON array of 128 numbers)
```

**Response**:
```json
{
  "success": true,
  "embedding": {
    "id": "uuid",
    "userId": "user-id",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Implementation**: `app/api/face-recognition/register/route.ts`

---

### 2. Recognize Face

**Endpoint**: `POST /api/face-recognition/recognize`

**Authentication**: Not required (public endpoint)

**Request Body** (FormData):
```
embedding: string (JSON array of 128 numbers)
threshold: string (optional, default: "0.5")
```

**Response** (Recognized):
```json
{
  "success": true,
  "recognized": true,
  "result": {
    "userId": "user-id",
    "confidence": 0.85,
    "distance": 0.18
  }
}
```

**Response** (Not Recognized):
```json
{
  "success": false,
  "recognized": false,
  "message": "No matching face found"
}
```

**Implementation**: `app/api/face-recognition/recognize/route.ts`

---

### 3. Get User Embedding

**Endpoint**: `GET /api/face-recognition/embedding`

**Authentication**: Required (Better Auth session)

**Response**:
```json
{
  "success": true,
  "hasEmbedding": true,
  "embedding": {
    "id": "uuid",
    "userId": "user-id",
    "imageUrl": "https://...",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Implementation**: `app/api/face-recognition/embedding/route.ts`

---

### 4. Delete User Embedding

**Endpoint**: `DELETE /api/face-recognition/embedding`

**Authentication**: Required (Better Auth session)

**Response**:
```json
{
  "success": true,
  "message": "Face embedding deleted successfully"
}
```

**Implementation**: `app/api/face-recognition/embedding/route.ts`

---

## Database Schema

### FaceEmbedding Model

**Location**: `prisma/schema.prisma`

```prisma
model FaceEmbedding {
  id        String   @id @default(uuid())
  userId    String   @unique
  embedding String   // JSON string of 128-dimensional number array
  imageUrl  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("FaceEmbedding")
}
```

**Relations**:
- One-to-one with `User` model
- Cascade delete when user is deleted

**Storage**:
- Embeddings stored as JSON strings in PostgreSQL `TEXT` field
- Parsed to `number[]` when retrieved
- Each user can have only one embedding (enforced by `@unique`)

---

## Configuration Files

### 1. Next.js Configuration (`next.config.ts`)

**Face Recognition Related**:
```typescript
const nextConfig: NextConfig = {
  // Externalize face-api.js to prevent SSR bundling issues
  serverExternalPackages: [
    'face-api.js',
    '@tensorflow/tfjs',
    '@tensorflow/tfjs-backend-webgl',
  ],
  images: {
    remotePatterns: [
      {
        hostname: "lms-yabsira-senior.fly.storage.tigris.dev",
        protocol: "https",
      },
    ],
  },
};
```

**Key Points**:
- `face-api.js` externalized to prevent SSR issues
- TensorFlow.js packages externalized
- Image remote patterns for storage bucket

---

### 2. Environment Variables (`.env`)

**Face Recognition Requirements**:
- All standard LMS variables (database, auth, etc.)
- Storage configuration for model files (if using CDN)
- No specific face recognition environment variables needed

---

### 3. TypeScript Configuration (`tsconfig.json`)

**Relevant Settings**:
- `"moduleResolution": "bundler"` - For Next.js/Turbopack
- `"jsx": "react-jsx"` - React JSX support
- Path aliases: `"@/*": ["./*"]` - For imports

---

## Dependencies

### Face Recognition Dependencies

**Core Libraries**:
```json
{
  "face-api.js": "^0.22.2",              // Face detection & recognition
  "@tensorflow/tfjs": "^4.22.0",          // TensorFlow.js runtime
  "@tensorflow/tfjs-backend-webgl": "^4.22.0"  // WebGL backend
}
```

**Other Key Dependencies**:
```json
{
  "next": "16.0.6",                       // Next.js framework
  "@prisma/client": "^6.19.0",            // Database ORM
  "better-auth": "...",                   // Authentication
  "@aws-sdk/client-s3": "^3.956.0",      // Storage (Tigris compatible)
  "@radix-ui/react-*": "...",             // UI components
  "sonner": "...",                        // Toast notifications
  "lucide-react": "...",                  // Icons
}
```

---

## Workflow & Data Flow (http://localhost:3000/test-face) to test Face Register and recognition.

### Face Registration Workflow

``` 
1. User opens RegisterFace component
   ↓
2. User clicks "Start Camera"
   ↓
3. Browser requests camera permission
   ↓
4. Video stream displayed in <video> element
   ↓
5. User clicks "Capture & Register"
   ↓
6. Video frame drawn to <canvas>
   ↓
7. detectAndEmbed(canvas) called
   ↓
8. face-api.js models loaded (if not already)
   ↓
9. TinyFaceDetector detects face
   ↓
10. FaceLandmark68Net extracts landmarks
    ↓
11. FaceRecognitionNet generates 128-dim embedding
    ↓
12. Embedding sent to POST /api/face-recognition/register
    ↓
13. Server validates session, saves to database
    ↓
14. Success response, camera stopped, toast shown
```

### Face Recognition Workflow

```
1. User opens FaceRecognition component
   ↓
2. User clicks "Start Recognition"
   ↓
3. Camera stream starts
   ↓
4. setInterval triggers every 2 seconds
   ↓
5. Video frame captured to canvas
   ↓
6. detectAndEmbed(canvas) generates embedding
   ↓
7. Embedding sent to POST /api/face-recognition/recognize
   ↓
8. Server queries all embeddings from database
   ↓
9. Euclidean distance calculated for each stored embedding
   ↓
10. Best match found (lowest distance)
    ↓
11. If distance ≤ threshold:
    - Return userId, confidence, distance
    - Display recognition result
    - Fire onRecognized callback
    ↓
12. If distance > threshold:
    - Return "No match found"
    - Continue recognition loop
```

---

## Setup & Installation

### 1. Install Dependencies

```bash
yarn install
```

### 2. Download Face Recognition Models

**Option A: Using Script** (if available):
```bash
node scripts/download-face-api-models.mjs
```

**Option B: Manual Download**:
1. Visit: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
2. Download these files to `public/models/`:
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`
   - `face_recognition_model-weights_manifest.json`
   - `face_recognition_model-shard1`
   - `face_recognition_model-shard2`

### 3. Set Up Database

```bash
# Generate Prisma client
yarn prisma generate

# Push schema to database
yarn prisma db push
```

### 4. Configure Environment Variables

See [ENV_SETUP.md](./ENV_SETUP.md) for detailed instructions.

### 5. Start Development Server

```bash
# Ensure Node.js 20+ is active
nvm use 20

# Start dev server
yarn dev
```

### 6. Test Face Recognition

1. Navigate to page with `RegisterFace` component
2. Register your face
3. Navigate to page with `FaceRecognition` component
4. Test recognition

---

## Technical Notes

### Model Loading Strategy

- Models are loaded lazily on first use
- Cached in memory after first load
- Stored in `window.faceapi` for reuse
- Prevents multiple simultaneous loads with `isModelsLoading` flag

### Embedding Format

- **Dimension**: 128 numbers (FaceNet standard)
- **Type**: `Float32Array` converted to `number[]`
- **Normalization**: Embeddings are L2-normalized by FaceNet
- **Storage**: JSON string in database, parsed on retrieval

### Distance Metrics

**Euclidean Distance** (Currently Used):
```
distance = √Σ(embedding1[i] - embedding2[i])²
```
- Lower distance = more similar
- Threshold: 0.5 (configurable)
- Range: 0 to ~2.0 (for normalized embeddings)

**Cosine Similarity** (Available but not used):
```
similarity = (embedding1 · embedding2) / (||embedding1|| × ||embedding2||)
```
- Higher similarity = more similar
- Range: -1 to 1

### Performance Considerations

- **Client-Side**: Face detection runs on user's device (no server load)
- **Model Size**: ~2-3MB total (TinyFaceDetector is optimized)
- **Recognition Speed**: ~100-200ms per recognition (depends on database size)
- **Concurrent Users**: No limit (each user processes on their device)

### Security Considerations

- Embeddings are not reversible (cannot reconstruct face from embedding)
- HTTPS required for camera access (mobile browsers)
- Session-based authentication for registration
- Public recognition endpoint (by design for attendance)

---

## Troubleshooting

### Models Not Loading

**Issue**: `Failed to load face-api.js models`

**Solutions**:
1. Verify models exist in `public/models/`
2. Check browser console for 404 errors
3. Ensure models are served correctly (check `/models/` path)
4. Clear browser cache

### Face Not Detected

**Issue**: `No face detected in image`

**Solutions**:
1. Ensure good lighting
2. Face camera directly
3. Remove obstructions (glasses, masks)
4. Check camera permissions
5. Try different camera (front/back)

### Recognition Not Working

**Issue**: Face not recognized even after registration

**Solutions**:
1. Check threshold value (try lowering to 0.4)
2. Verify embedding was saved (check database)
3. Ensure same person, similar lighting/angle
4. Check distance value in response
5. Re-register face if needed

### SSR/Import Errors

**Issue**: `Module not found: Can't resolve 'face-api.js'`

**Solutions**:
1. Ensure `'use client'` directive in component
2. Check `next.config.ts` has `serverExternalPackages`
3. Verify package is installed: `yarn list face-api.js`
4. Restart dev server

---

## Future Enhancements

### Potential Improvements

1. **Multiple Face Detection**: Support detecting multiple faces simultaneously
2. **Face Verification**: Add verification step after recognition
3. **Confidence Thresholds**: Per-user or per-class thresholds
4. **Face Updates**: Allow users to update their registered face
5. **Batch Recognition**: Process multiple frames for better accuracy
6. **Model Optimization**: Use quantized models for faster inference
7. **Offline Support**: Cache models in IndexedDB
8. **Analytics**: Track recognition accuracy and performance

---

## References

- [face-api.js Documentation](https://github.com/justadudewhohacks/face-api.js)
- [FaceNet Paper](https://arxiv.org/abs/1503.03832)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

## License

[Your License Here]

---

**Last Updated**: December 2024
**Version**: 1.0.0
