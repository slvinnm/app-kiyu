import type { Department, KioskState } from "@/types/kiosk"

import { DepartmentLoading } from "@/components/kiosk/department-loading"
import { DepartmentError } from "@/components/kiosk/department-error"
import { EmptyDepartments } from "@/components/kiosk/empty-departments"
import { DepartmentCard } from "@/components/kiosk/department-card"

export function DepartmentGrid({
  departments,
  loading,
  error,
  state,
  onRetry,
  onSelect,
}: {
  departments: Department[]
  loading: boolean
  error: string | null
  state: KioskState
  onRetry: () => void
  onSelect: (department: Department) => void
}) {
  return (
    <div className="w-full">
      <div className="mb-7 text-center">
        <p className="mb-2 text-base font-medium text-muted-foreground">
          Silakan pilih tujuan pelayanan Anda
        </p>

        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Pilih Poliklinik
        </h2>
      </div>

      {loading ? (
        <DepartmentLoading />
      ) : error ? (
        <DepartmentError message={error} onRetry={onRetry} />
      ) : departments.length === 0 ? (
        <EmptyDepartments />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => {
            const isLoading =
              state.type === "loading" &&
              state.departmentCode === department.code

            const anotherLoading =
              state.type === "loading" &&
              state.departmentCode !== department.code

            return (
              <DepartmentCard
                key={department.id}
                department={department}
                loading={isLoading}
                disabled={anotherLoading}
                onClick={() => onSelect(department)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
