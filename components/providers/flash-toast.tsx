"use client"

import { useEffect } from "react"
import { toast } from "sonner"

import { useFlash } from "@/components/providers/flash-provider"

export function FlashToast() {
    const { flash } = useFlash()

    useEffect(() => {
        for (const value of Object.values(flash)) {
            if (typeof value === "string") {
                toast.success(value)
            }
        }
    }, [flash])

    return null
}