import { adminGetLiveClass } from "@/app/data/admin/admin-get-live-class";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { EditLiveClassForm } from "./_components/EditLiveClassForm";
// import { ClassSchedule } from "./_components/ClassSchedule";
import { EditLiveClassForm } from "./_components/EditLiveClassForm";
import { ClassSchedule } from "./_components/ClassSchedule";

type Params = Promise<{ liveClassId: string }>;

export default async function EditLiveClassRoute({
  params,
}: {
  params: Params;
}) {
  const { liveClassId } = await params;
  const data = await adminGetLiveClass(liveClassId);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Edit Live Class:{" "}
        <span className="text-primary underline">{data.title}</span>
      </h1>

      <Tabs defaultValue="basic-info" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
          <TabsTrigger value="schedule">Class Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="basic-info">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the basic information about your live class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditLiveClassForm data={data} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Class Schedule</CardTitle>
              <CardDescription>
                View and manage all scheduled classes for this live course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClassSchedule data={data} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
