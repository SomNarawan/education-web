import { useCallback, useEffect, useRef, useState } from 'react'
import { getAdvisorSummary } from '../../services/advisorSummaryService'
import type { AdvisorSummary } from '../../types/AdvisorSummary'

export function useAdvisorSummary() {
    const requestSequence = useRef(0)
    const [summary, setSummary] = useState<AdvisorSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)

    const load = useCallback(async () => {
        const sequence = ++requestSequence.current
        setLoading(true)
        setLoadError(null)

        try {
            const result = await getAdvisorSummary()
            if (sequence === requestSequence.current) setSummary(result)
        } catch (error) {
            console.error('Unable to load advisor summary', error)
            if (sequence === requestSequence.current) setLoadError('โหลดข้อมูลภาพรวมนิสิตในที่ปรึกษาไม่สำเร็จ')
        } finally {
            if (sequence === requestSequence.current) setLoading(false)
        }
    }, [])

    useEffect(() => {
        // Initial API load is intentionally triggered when the page mounts.
        /* eslint-disable react-hooks/set-state-in-effect */
        void load()
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [load])

    return { summary, loading, loadError, load }
}
