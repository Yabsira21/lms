"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Uploader } from "@/components/file-uploader/Uploader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  ImageIcon,
  VideoIcon,
  Download,
  Trash2,
  MoreVertical,
  Plus,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useContructUrl } from "@/hooks/use-construct-url";
import { UploaderAll } from "@/components/file-uploader/UploaderAll";

interface Resource {
  id: string;
  title: string;
  fileUrl: string; // This should be the S3 key
  fileType: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface ResourcesListProps {
  liveClassId: string;
  isInstructor: boolean;
}

const fileIcons: Record<string, React.ReactNode> = {
  image: <ImageIcon className="h-8 w-8 text-blue-500" />,
  video: <VideoIcon className="h-8 w-8 text-purple-500" />,
  pdf: <FileText className="h-8 w-8 text-red-500" />,
  default: <FileText className="h-8 w-8 text-gray-500" />,
};

function getFileIcon(fileUrl: string) {
  const extension = fileUrl.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
    return fileIcons.image;
  }
  if (["mp4", "webm", "mov"].includes(extension || "")) {
    return fileIcons.video;
  }
  if (extension === "pdf") {
    return fileIcons.pdf;
  }
  return fileIcons.default;
}

// Helper to get filename from key
function getFileNameFromKey(key: string) {
  return key.split("/").pop() || "download";
}

export function ResourcesList({
  liveClassId,
  isInstructor,
}: ResourcesListProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceFile, setNewResourceFile] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getFullUrl = useContructUrl("");

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/live-class/${liveClassId}/resources`);
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources);
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    } finally {
      setLoading(false);
    }
  }, [liveClassId]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleUpload = async () => {
    if (!selectedFile || !newResourceTitle.trim()) {
      toast.error("Please provide a title and select a file");
      return;
    }

    setUploading(true);
    try {
      // Get presigned URL
      const presignedResponse = await fetch(
        `/api/live-class/${liveClassId}/resources/upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: selectedFile.name,
            contentType: selectedFile.type,
            size: selectedFile.size,
          }),
        },
      );

      if (!presignedResponse.ok) {
        const error = await presignedResponse.json();
        throw new Error(error.error || "Failed to get upload URL");
      }

      const { presignedUrl, key } = await presignedResponse.json();

      // Upload to S3
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": selectedFile.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to S3");
      }

      // Save resource metadata
      const saveResponse = await fetch(
        `/api/live-class/${liveClassId}/resources`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newResourceTitle,
            fileUrl: key, // Save the S3 key
          }),
        },
      );

      if (!saveResponse.ok) {
        throw new Error("Failed to save resource");
      }

      toast.success("Resource uploaded successfully");
      setUploadDialogOpen(false);
      setNewResourceTitle("");
      setNewResourceFile("");
      setSelectedFile(null);
      fetchResources();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload resource",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    setDeletingId(resourceId);
    try {
      const res = await fetch(
        `/api/live-class/${liveClassId}/resources/${resourceId}`,
        {
          method: "DELETE",
        },
      );

      if (res.ok) {
        toast.success("Resource deleted successfully");
        fetchResources();
      } else {
        toast.error("Failed to delete resource");
      }
    } catch (error) {
      toast.error("Failed to delete resource");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (fileUrl: string, title: string) => {
    // Use the same URL format as your useContructUrl hook
    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
    const fullUrl = `https://${bucket}.fly.storage.tigris.dev/${fileUrl}`;

    console.log("Downloading from:", fullUrl); // Debug log

    // For images and PDFs, open in new tab (better for preview)
    const extension = fileUrl.split(".").pop()?.toLowerCase();
    const previewTypes = ["jpg", "jpeg", "png", "gif", "webp", "pdf"];

    if (previewTypes.includes(extension || "")) {
      window.open(fullUrl, "_blank");
    } else {
      // For other files, force download
      const link = document.createElement("a");
      link.href = fullUrl;
      link.download = title;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Button - Only for instructors */}
      {isInstructor && (
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Upload Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Resource</DialogTitle>
              <DialogDescription>
                Share a file with your students
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Lecture Slides - Week 1"
                  value={newResourceTitle}
                  onChange={(e) => setNewResourceTitle(e.target.value)}
                />
              </div>
              <div>
                <Label>File</Label>
                <UploaderAll
                  onChange={setNewResourceFile}
                  value={newResourceFile}
                  fileTypeAccepted="all"
                  onFileSelected={setSelectedFile}
                  maxSize={100} // 100MB max
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUploadDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Resources List */}
      {resources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No resources shared yet</p>
            {isInstructor && (
              <p className="text-sm text-muted-foreground mt-1">
                Upload files to share with your students
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <Card
              key={resource.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getFileIcon(resource.fileUrl)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {resource.title}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-muted-foreground">
                          Shared by {resource.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(resource.createdAt), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getFileNameFromKey(resource.fileUrl)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        handleDownload(resource.fileUrl, resource.title)
                      }
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    {isInstructor && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDelete(resource.id)}
                            disabled={deletingId === resource.id}
                            className="text-destructive focus:text-destructive"
                          >
                            {deletingId === resource.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
