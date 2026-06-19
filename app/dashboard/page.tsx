import React from "react";
import { getAllCourses } from "../data/course/get-all-courses";
import { getEnrolledCourses } from "../data/user/get-enrolled-courses";
// import { getEnrolledLiveClasses } from "../data/user/get-enrolled-live-classes";
import { EmptyState } from "@/components/general/EmptyState";
import { PublicCourseCard } from "../(public-facing)/_components/PublicCourseCard";
import { CourseProgressCard } from "./_components/CourseProgressCard";
import { LiveClassProgressCard } from "./_components/LiveClassProgressCard";
import { getEnrolledLiveClasses } from "../data/user/get-enrolled-liveclasses";

export default async function DashboardPage() {
  const [courses, enrolledCourses, enrolledLiveClasses] = await Promise.all([
    getAllCourses(),
    getEnrolledCourses(),
    getEnrolledLiveClasses(),
  ]);

  const availableCourses = courses.filter(
    (course) =>
      !enrolledCourses.some(
        ({ Course: enrolled }) => enrolled.id === course.id,
      ),
  );

  return (
    <div className="@container/main flex flex-1 flex-col items-center px-4 lg:px-8">
      <div className="w-full max-w-6xl flex flex-col gap-4 py-6 md:gap-8 md:py-8">
        <section className="mt-10">
          <div className="flex flex-col gap-2 mb-5">
            <h1 className="text-3xl font-bold">Your Courses</h1>
            <p className="text-muted-foreground">
              Self-paced courses you've purchased
            </p>
          </div>

          {enrolledCourses.length === 0 ? (
            <EmptyState
              title="No courses purchased"
              description="You have not purchased any courses yet"
              buttonText="Browse Courses"
              href="/courses"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledCourses.map((course) => (
                <CourseProgressCard key={course.Course.id} data={course} />
              ))}
            </div>
          )}
        </section>

        {/* Enrolled Live Classes Section */}
        <section>
          <div className="flex flex-col gap-2 mb-5">
            <h1 className="text-3xl font-bold">Your Live Classes</h1>
            <p className="text-muted-foreground">
              Interactive sessions with live instructors
            </p>
          </div>

          {enrolledLiveClasses.length === 0 ? (
            <EmptyState
              title="No live classes enrolled"
              description="You haven't enrolled in any live classes yet"
              buttonText="Browse Live Classes"
              href="/live-class"
            />
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {enrolledLiveClasses.map((liveClass) => (
                <LiveClassProgressCard
                  key={liveClass.liveClass.id}
                  data={liveClass}
                />
              ))}
            </div>
          )}
        </section>

        {/* Enrolled Courses Section */}

        {/* Available Courses Section */}
        {/* {availableCourses.length > 0 && (
          <section className="mt-10">
            <div className="flex flex-col gap-2 mb-5">
              <h1 className="text-3xl font-bold">Available Courses</h1>
              <p className="text-muted-foreground">
                Courses you can purchase to expand your knowledge
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableCourses.map((course) => (
                <PublicCourseCard key={course.id} data={course} />
              ))}
            </div>
          </section>
        )} */}
      </div>
    </div>
  );
}
