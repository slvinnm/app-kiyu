import { DepartmentDisplay } from "@/components/display/department-display"
import { DisplayGate } from "@/components/display/display-gate"

export const metadata = {
  title: "Antrian Departemen · Kiyu",
}

export default async function DepartmentDisplayPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  return (
    <DisplayGate>
      <DepartmentDisplay departmentCode={code} />
    </DisplayGate>
  )
}
