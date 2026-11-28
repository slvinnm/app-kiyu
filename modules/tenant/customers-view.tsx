"use client"

import { useState } from "react"
import { useAsyncData } from "@/hooks/use-async-data"
import { useTenantContext } from "@/contexts/tenant/tenant-context"
import { useToastManager } from "@/components/ui/toast"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { browserApi } from "@/lib/api/browser-client"
import { AlertCircleIcon, PlusIcon, SearchIcon, UsersIcon } from "lucide-react"

interface CustomerItem {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

interface Paginated<T> {
  data: T[]
  total: number
}

export function CustomersView() {
  const { activeFacilityId } = useTenantContext()
  const toast = useToastManager()
  const [search, setSearch] = useState("")

  const [createOpen, setCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  const { data, isLoading, error, reload } = useAsyncData(async () => {
    void activeFacilityId
    const res = await browserApi<Paginated<CustomerItem>>(
      "tenant",
      "/customers",
      {
        params: { per_page: 50, ...(search ? { search } : {}) },
      }
    )
    return res.data ?? []
  }, [activeFacilityId, search])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setActionError("")
    try {
      await browserApi("tenant", "/customers", {
        method: "POST",
        body: {
          name,
          ...(phone ? { phone } : {}),
          ...(email ? { email } : {}),
        },
      })
      toast.add({ title: "Customer created", type: "success" })
      setCreateOpen(false)
      setName("")
      setPhone("")
      setEmail("")
      await reload()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create customer"
      setActionError(msg)
      toast.add({ title: "Error", description: msg, type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  const customers = data ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Tenant customer directory
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <PlusIcon data-icon="inline-start" />
            New Customer
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Customer</DialogTitle>
              <DialogDescription>
                Add a customer record to the organization directory.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              {actionError && (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertDescription>{actionError}</AlertDescription>
                </Alert>
              )}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="c_name">Full Name</FieldLabel>
                  <Input
                    id="c_name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="c_phone">Phone (optional)</FieldLabel>
                  <Input
                    id="c_phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="c_email">Email (optional)</FieldLabel>
                  <Input
                    id="c_email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting || !name}>
                  {isSubmitting && <Spinner data-icon="inline-start" />}
                  Save Customer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <InputGroup className="max-w-sm">
        <InputGroupInput
          placeholder="Search name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
      </InputGroup>

      {customers.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>No customers found</EmptyTitle>
            <EmptyDescription>
              Create a customer record to get started.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.address ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
