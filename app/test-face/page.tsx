'use client';

import RegisterFace from '@/components/face-recognition/RegisterFace';
import FaceRecognition from '@/components/face-recognition/FaceRecognition';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function TestFacePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Face Registration & Recognition Test</h1>
        <p className="text-muted-foreground">
          Step 1: Register your face. Step 2: Test recognition using your camera.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step 1: Register Your Face</CardTitle>
          <CardDescription>
            Use your camera to capture a photo. The server will detect your face and store an embedding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterFace />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 2: Face Recognition</CardTitle>
          <CardDescription>
            Start the camera and click &quot;Recognize Now&quot; to compare with stored faces.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FaceRecognition />
        </CardContent>
      </Card>
    </div>
  );
}

