import { DepartmentDisplay } from "@/components/display/department-display"

export const metadata = {
  title: "Antrian Departemen · Kiyu",
}

export default async function DepartmentDisplayPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  return <DepartmentDisplay departmentCode={code} />
}
