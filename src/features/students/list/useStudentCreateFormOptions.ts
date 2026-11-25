import { useEffect, useRef, useState } from 'react'
import { getStudentCreateFormOptions } from '../../../services/studentService'
import type { StudentCreateFormOptions } from '../../../types/StudentCreateFormOptions'

type OptionsResult =
    | { options: StudentCreateFormOptions; error: null }
    | { options: null; error: string }

export interface StudentCreateFormOptionsState {
    options: StudentCreateFormOptions | null
    loading: boolean
    error: string | null
    retry: () => void
}

export function useStudentCreateFormOptions(
    enabled: boolean,
): StudentCreateFormOptionsState {
    const [result, setResult] = useState<OptionsResult | null>(null)
    const [attempt, setAttempt] = useState(0)
    const pendingRequest = useRef<Promise<StudentCreateFormOptions> | null>(null)

    useEffect(() => {
        if (!enabled) return

        let active = true
        const request = pendingRequest.current ?? getStudentCreateFormOptions()
        pendingRequest.current = request

        const loadOptions = async () => {
            try {
                const options = await request
                if (active) setResult({ options, error: null })
            } catch (error) {
                if (active) {
                    console.error(
                        'Unable to preload student form options',
                        error instanceof Error ? error.message : undefined,
                    )
                    setResult({
                        options: null,
                        error: 'โหลดข้อมูลตัวเลือกสำหรับแบบฟอร์มไม่สำเร็จ',
                    })
                }
            } finally {
                if (pendingRequest.current === request) {
                    pendingRequest.current = null
                }
            }
        }

        void loadOptions()
        return () => {
            active = false
        }
    }, [attempt, enabled])

    return {
        options: enabled ? result?.options ?? null : null,
        loading: enabled && result === null,
        error: enabled ? result?.error ?? null : null,
        retry: () => {
            setResult(null)
            setAttempt((current) => current + 1)
        },
    }
}
