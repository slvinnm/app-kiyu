import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

import type { Department } from "@/types/reception"

type DepartmentSelectProps = {
  value: string
  departments: Department[]
  loading: boolean
  onChange: (value: string) => void
}

export function DepartmentSelect({
  value,
  departments,
  loading,
  onChange,
}: DepartmentSelectProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kunjungan</CardTitle>

        <CardDescription>
          Tentukan poli atau department tujuan pasien.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          <Label>Poli / Department</Label>

          <Select value={value} onValueChange={onChange} disabled={loading}>
            <SelectTrigger className="w-full">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Spinner className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Memuat department...
                  </span>
                </div>
              ) : (
                <SelectValue placeholder="Pilih poli" />
              )}
            </SelectTrigger>

            <SelectContent>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.code}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
