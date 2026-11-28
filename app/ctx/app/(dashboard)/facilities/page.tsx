"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { browserApi } from "@/lib/api/browser-client"
import {
  PlusIcon,
  Building2Icon,
  SearchIcon,
  MapPinIcon,
  PhoneIcon,
  LockIcon,
} from "lucide-react"

interface Facility {
  id: number
  name: string
  code: string
  address: string | null
  phone: string | null
  timezone: string | null
  is_active: boolean
  departments_count?: number
}

interface EntitlementEntry {
  released: boolean
  available: boolean
  entitled: boolean
  type: string
  limit?: number | null
  used?: number
  remaining?: number | null
}

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [maxFacilities, setMaxFacilities] = useState<EntitlementEntry | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const fetchFacilitiesAndCapacity = async () => {
    const [list, entitlements] = await Promise.all([
      browserApi<Facility[]>("app", "/facilities"),
      browserApi<Record<string, EntitlementEntry>>(
        "app",
        "/billing/entitlements"
      ).catch(() => null),
    ])
    return { list, maxFac: entitlements?.max_facilities ?? null }
  }

  async function retry() {
    setIsLoading(true)
    setError("")
    try {
      const res = await fetchFacilitiesAndCapacity()
      setFacilities(res.list)
      setMaxFacilities(res.maxFac)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load facilities")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    fetchFacilitiesAndCapacity()
      .then((res) => {
        if (cancelled) return
        setFacilities(res.list)
        setMaxFacilities(res.maxFac)
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load facilities"
          )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const canCreateFacility =
    maxFacilities === null ||
    (maxFacilities.available &&
      (maxFacilities.remaining === null ||
        maxFacilities.remaining === undefined ||
        maxFacilities.remaining > 0))

  const filtered = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2Icon />
            </EmptyMedia>
            <EmptyTitle>Could not load facilities</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => void retry()}>
            Retry
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facilities</h1>
          <p className="text-sm text-muted-foreground">
            Each facility has its own departments, stations, and workflows
          </p>
        </div>
        {canCreateFacility ? (
          <Button render={<Link href="/facilities/new" />} nativeButton={false}>
            <PlusIcon data-icon="inline-start" />
            Add Facility
          </Button>
        ) : (
          <Button
            variant="outline"
            render={<Link href="/billing" />}
            nativeButton={false}
          >
            <LockIcon data-icon="inline-start" />
            Upgrade Plan
          </Button>
        )}
      </div>

      {!canCreateFacility && maxFacilities && (
        <Alert>
          <LockIcon />
          <AlertTitle>Facility capacity reached</AlertTitle>
          <AlertDescription>
            You are using {maxFacilities.used ?? facilities.length} of{" "}
            {maxFacilities.limit ?? facilities.length} facilities allowed on
            your current plan.{" "}
            <Link href="/billing" className="font-medium underline">
              Manage billing and plan limits
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      <InputGroup className="max-w-sm">
        <InputGroupInput
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
      </InputGroup>

      {filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2Icon />
            </EmptyMedia>
            <EmptyTitle>
              {search ? "No matching facilities" : "No facilities yet"}
            </EmptyTitle>
            <EmptyDescription>
              {search
                ? "No facilities match your search."
                : "Create your first facility to start configuring departments and stations."}
            </EmptyDescription>
          </EmptyHeader>
          {!search && canCreateFacility && (
            <Button
              render={<Link href="/facilities/new" />}
              nativeButton={false}
            >
              <PlusIcon data-icon="inline-start" />
              Create Facility
            </Button>
          )}
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => (
            <Card key={f.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-lg">{f.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {f.code}
                    </CardDescription>
                  </div>
                  <Badge variant={f.is_active ? "secondary" : "outline"}>
                    {f.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-2">
                {f.address && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPinIcon className="size-3.5 shrink-0" />
                    <span className="truncate">{f.address}</span>
                  </p>
                )}
                {f.phone && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <PhoneIcon className="size-3.5 shrink-0" />
                    {f.phone}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Timezone: {f.timezone ?? "UTC"}
                </p>
                <Button
                  variant="outline"
                  className="mt-auto w-full"
                  render={<Link href={`/facilities/${f.id}`} />}
                  nativeButton={false}
                >
                  Manage
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
