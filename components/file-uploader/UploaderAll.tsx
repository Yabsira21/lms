"use client";
import { useCallback, useEffect, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";
import {
  RenderEmptyState,
  RenderErrorState,
  RenderUploadedState,
  RenderUploadingState,
} from "./RenderState";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useContructUrl } from "@/hooks/use-construct-url";

interface UploaderState {
  id: string | null;
  file: File | null;
  uploading: boolean;
  progress: number;
  key?: string;
  isDeleting: boolean;
  error: boolean;
  objectUrl?: string;
  fileType: "all";
}

interface iAppProps {
  value?: string;
  onChange?: (value: string) => void;
  fileTypeAccepted: "all"; // Specifically for all file types
  onFileSelected?: (file: File) => void;
  maxSize?: number; // Optional custom max size in MB
}

export function UploaderAll({
  onChange,
  value,
  fileTypeAccepted,
  onFileSelected,
  maxSize = 100, // Default 100MB
}: iAppProps) {
  const fileUrl = useContructUrl(value || "");
  const [fileState, setFileState] = useState<UploaderState>({
    error: false,
    file: null,
    id: null,
    uploading: false,
    progress: 0,
    isDeleting: false,
    fileType: "all",
    key: value,
    objectUrl: value ? fileUrl : undefined,
  });

  const uploadFile = useCallback(
    async (file: File) => {
      setFileState((prev) => ({ ...prev, uploading: true, progress: 0 }));

      try {
        // Get presigned URL from the server
        const presignedResponse = await fetch("/api/s3/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            size: file.size,
            isImage: false, // Not an image
          }),
        });

        if (!presignedResponse.ok) {
          toast.error("Failed to get presigned URL");
          setFileState((prev) => ({
            ...prev,
            uploading: false,
            error: true,
            progress: 0,
          }));
          return;
        }

        const { presignedUrl, key } = await presignedResponse.json();

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentageCompleted = (event.loaded / event.total) * 100;
              setFileState((prev) => ({
                ...prev,
                progress: Math.round(percentageCompleted),
              }));
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 204) {
              setFileState((prev) => ({
                ...prev,
                progress: 100,
                uploading: false,
                key: key,
              }));

              onChange?.(key);

              toast.success("File uploaded successfully");

              resolve();
            } else {
              reject(new Error("Upload failed."));
            }
          };

          xhr.onerror = () => {
            reject(new Error("Upload failed."));
          };

          xhr.open("PUT", presignedUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });
      } catch {
        toast.error("File upload failed");
        setFileState((prev) => ({
          ...prev,
          uploading: false,
          error: true,
          progress: 0,
        }));
      }
    },
    [onChange],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        onFileSelected?.(file);

        if (fileState.objectUrl && !fileState.objectUrl?.startsWith("http")) {
          URL.revokeObjectURL(fileState.objectUrl);
        }

        setFileState({
          file: file,
          uploading: false,
          progress: 0,
          objectUrl: URL.createObjectURL(file),
          error: false,
          id: uuidv4(),
          isDeleting: false,
          fileType: "all",
        });

        uploadFile(file);
      }
    },
    [fileState.objectUrl, uploadFile, onFileSelected],
  );

  async function handleRemoveFile() {
    if (fileState.isDeleting || !fileState.objectUrl) return;

    try {
      setFileState((prev) => ({ ...prev, isDeleting: true }));

      const response = await fetch("/api/s3/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: fileState.key,
        }),
      });

      if (!response.ok) {
        toast.error("Failed to delete file");
        setFileState((prev) => ({ ...prev, isDeleting: false, error: true }));
        return;
      }

      if (fileState.objectUrl && !fileState.objectUrl?.startsWith("http")) {
        URL.revokeObjectURL(fileState.objectUrl);
      }

      onChange?.("");

      setFileState(() => ({
        file: null,
        error: false,
        objectUrl: undefined,
        key: undefined,
        isDeleting: false,
        progress: 0,
        uploading: false,
        id: null,
        fileType: "all",
      }));

      toast.success("File removed successfully");
    } catch {
      toast.error("Failed to remove file");
      setFileState((prev) => ({
        ...prev,
        isDeleting: false,
        error: false,
      }));
    }
  }

  function rejectFiles(fileRejection: FileRejection[]) {
    if (fileRejection.length) {
      const tooManyFiles = fileRejection.find(
        (rejection) => rejection.errors[0].code === "too-many-files",
      );

      const fileSizeTooBig = fileRejection.find(
        (rejection) => rejection.errors[0].code === "file-too-large",
      );

      if (tooManyFiles) {
        toast.error("Too many files selected, max is 1");
      }
      if (fileSizeTooBig) {
        toast.error(`File size too big. Max ${maxSize}MB`);
      }
    }
  }

  function renderContent() {
    if (fileState.uploading) {
      return (
        <RenderUploadingState
          progress={fileState.progress}
          file={fileState.file as File}
        />
      );
    }

    if (fileState.error) {
      return <RenderErrorState />;
    }

    if (fileState.objectUrl) {
      return (
        <RenderUploadedState
          previewUrl={fileState.objectUrl}
          handleRemoveFile={handleRemoveFile}
          isDeleting={fileState.isDeleting}
          fileType="image" // Use image preview for uploaded files
        />
      );
    }

    return <RenderEmptyState isDragActive={isDragActive} />;
  }

  useEffect(() => {
    return () => {
      if (fileState.objectUrl && !fileState.objectUrl?.startsWith("http")) {
        URL.revokeObjectURL(fileState.objectUrl);
      }
    };
  }, [fileState.objectUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: undefined, // Accept all file types
    maxFiles: 1,
    multiple: false,
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    onDropRejected: rejectFiles,
    disabled: fileState.uploading || !!fileState.objectUrl,
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed transition-colors duration-200 ease-in-out w-full h-64",
        isDragActive
          ? "border-primary bg-primary/10 border-solid"
          : "border-border hover:border-primary",
      )}
    >
      <CardContent className="flex items-center justify-center h-full w-full p-4">
        <input {...getInputProps()} />
        {renderContent()}
      </CardContent>
    </Card>
  );
}
