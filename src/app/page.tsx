import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";

export default async function Page(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await auth();
  if (!session) redirect("/sign-in");

  const searchParams = await props.searchParams;
  const activeSubjectId = (searchParams?.subject as string) || "1";

  return <DashboardClient initialActiveSubjectId={activeSubjectId} />;
}
