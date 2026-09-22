import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type PatientType = "existing" | "new"

type PatientTypeSelectorProps = {
  value: PatientType
  onChange: (value: PatientType) => void
}

export function PatientTypeSelector({
  value,
  onChange,
}: PatientTypeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Jenis Pasien</CardTitle>

        <CardDescription>
          Tentukan apakah pasien sudah terdaftar sebelumnya.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChange("existing")}
            className={`rounded-lg border p-4 text-left transition-colors ${
              value === "existing"
                ? "border-primary bg-primary/5"
                : "hover:bg-muted"
            }`}
          >
            <p className="font-medium">Pasien Lama</p>

            <p className="mt-1 text-xs text-muted-foreground">
              Cari pasien yang sudah terdaftar.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onChange("new")}
            className={`rounded-lg border p-4 text-left transition-colors ${
              value === "new" ? "border-primary bg-primary/5" : "hover:bg-muted"
            }`}
          >
            <p className="font-medium">Pasien Baru</p>

            <p className="mt-1 text-xs text-muted-foreground">
              Buat data pasien baru.
            </p>
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
