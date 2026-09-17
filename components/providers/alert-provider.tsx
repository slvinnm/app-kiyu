"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { ReactNode } from "react"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type AlertType = "neutral" | "success" | "warning" | "danger" | "info"

type AlertPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

type AlertOptions = {
  title: string
  description?: string
  duration?: number
  position?: AlertPosition
  viewportId?: string
}

type AlertItem = {
  id: number
  type: AlertType
  title: string
  description?: string
  duration?: number
  position: AlertPosition
  viewportId?: string
}

type AlertContextType = {
  alerts: AlertItem[]

  show: (type: AlertType, options: AlertOptions) => void
  close: (id: number) => void
  closeAll: () => void

  neutral: (options: AlertOptions) => void
  success: (options: AlertOptions) => void
  warning: (options: AlertOptions) => void
  danger: (options: AlertOptions) => void
  info: (options: AlertOptions) => void
}

const AlertContext = createContext<AlertContextType | null>(null)

const alertStyles: Record<
  AlertType,
  {
    icon: typeof InfoIcon
    className: string
    iconClassName: string
  }
> = {
  neutral: {
    icon: InfoIcon,
    className: "border-border bg-background text-foreground",
    iconClassName: "text-muted-foreground",
  },

  success: {
    icon: CheckCircle2Icon,
    className: "border-emerald-500/30 bg-emerald-500/5 text-foreground",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },

  warning: {
    icon: TriangleAlertIcon,
    className: "border-amber-500/30 bg-amber-500/5 text-foreground",
    iconClassName: "text-amber-600 dark:text-amber-400",
  },

  danger: {
    icon: AlertCircleIcon,
    className: "border-destructive/30 bg-destructive/5 text-foreground",
    iconClassName: "text-destructive",
  },

  info: {
    icon: InfoIcon,
    className: "border-blue-500/30 bg-blue-500/5 text-foreground",
    iconClassName: "text-blue-600 dark:text-blue-400",
  },
}

const positionClasses: Record<AlertPosition, string> = {
  "top-left": "fixed top-4 left-4",

  "top-center": "fixed top-4 left-1/2 -translate-x-1/2",

  "top-right": "fixed top-4 right-4",

  "bottom-left": "fixed bottom-4 left-4",

  "bottom-center": "fixed bottom-4 left-1/2 -translate-x-1/2",

  "bottom-right": "fixed right-4 bottom-4",
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const idRef = useRef(0)

  const show = useCallback((type: AlertType, options: AlertOptions) => {
    const id = ++idRef.current

    setAlerts((current) => [
      ...current,
      {
        id,
        type,
        title: options.title,
        description: options.description,
        duration: options.duration ?? 5000,
        position: options.position ?? "top-right",
        viewportId: options.viewportId,
      },
    ])
  }, [])

  const close = useCallback((id: number) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id))
  }, [])

  const closeAll = useCallback(() => {
    setAlerts([])
  }, [])

  const neutral = useCallback(
    (options: AlertOptions) => {
      show("neutral", options)
    },
    [show]
  )

  const success = useCallback(
    (options: AlertOptions) => {
      show("success", options)
    },
    [show]
  )

  const warning = useCallback(
    (options: AlertOptions) => {
      show("warning", options)
    },
    [show]
  )

  const danger = useCallback(
    (options: AlertOptions) => {
      show("danger", options)
    },
    [show]
  )

  const info = useCallback(
    (options: AlertOptions) => {
      show("info", options)
    },
    [show]
  )

  const value = useMemo(
    () => ({
      alerts,
      show,
      close,
      closeAll,
      neutral,
      success,
      warning,
      danger,
      info,
    }),
    [alerts, show, close, closeAll, neutral, success, warning, danger, info]
  )

  return (
    <AlertContext.Provider value={value}>
      {children}

      <GlobalAlertView />
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const context = useContext(AlertContext)

  if (!context) {
    throw new Error("useAlert must be used inside AlertProvider")
  }

  return context
}

function GlobalAlertView() {
  const { alerts, close } = useAlert()

  const globalAlerts = alerts.filter((alert) => !alert.viewportId)

  if (globalAlerts.length === 0) {
    return null
  }

  const positions: AlertPosition[] = [
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ]

  return (
    <>
      {positions.map((position) => {
        const positionAlerts = globalAlerts.filter(
          (alert) => alert.position === position
        )

        if (positionAlerts.length === 0) {
          return null
        }

        return (
          <div
            key={position}
            className={cn(
              "pointer-events-none z-50 flex w-[calc(100vw-2rem)] max-w-md flex-col gap-3",
              positionClasses[position]
            )}
          >
            {positionAlerts.map((alert) => (
              <AlertItemView key={alert.id} alert={alert} onClose={close} />
            ))}
          </div>
        )
      })}
    </>
  )
}

export function AlertViewport({
  id,
  className,
}: {
  id: string
  className?: string
}) {
  const { alerts, close } = useAlert()

  const viewportAlerts = alerts.filter((alert) => alert.viewportId === id)

  if (viewportAlerts.length === 0) {
    return null
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {viewportAlerts.map((alert) => (
        <AlertItemView key={alert.id} alert={alert} onClose={close} />
      ))}
    </div>
  )
}

function AlertItemView({
  alert,
  onClose,
}: {
  alert: AlertItem
  onClose: (id: number) => void
}) {
  const style = alertStyles[alert.type]
  const Icon = style.icon

  useEffect(() => {
    if (!alert.duration) {
      return
    }

    const timeout = setTimeout(() => {
      onClose(alert.id)
    }, alert.duration)

    return () => clearTimeout(timeout)
  }, [alert.duration, alert.id, onClose])

  return (
    <Alert className={cn("relative pr-10 shadow-sm", style.className)}>
      <Icon className={style.iconClassName} />

      <AlertTitle>{alert.title}</AlertTitle>

      {alert.description && (
        <AlertDescription>{alert.description}</AlertDescription>
      )}

      <button
        type="button"
        onClick={() => onClose(alert.id)}
        className={cn(
          "absolute top-3 right-3 rounded-sm p-1",
          "text-muted-foreground",
          "transition-colors",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        )}
        aria-label="Close alert"
      >
        <XIcon className="size-4" />
      </button>
    </Alert>
  )
}
