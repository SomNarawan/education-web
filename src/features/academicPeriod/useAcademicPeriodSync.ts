import { message } from 'antd'
import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import {
    getStudentAcademicPeriodPreview,
    getStudentAcademicPeriodSyncHistory,
    syncStudentAcademicPeriods,
} from '../../services/studentAcademicPeriodSyncService'
import type { ApiResponse } from '../../types/ApiResponse'
import type {
    StudentAcademicPeriodPreview,
    StudentAcademicPeriodSyncHistory,
} from '../../types/StudentAcademicPeriodSync'

function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
        return error.response?.data.message ?? error.message
    }
    return error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
}

export function useAcademicPeriodSync() {
    const [preview, setPreview] = useState<StudentAcademicPeriodPreview | null>(null)
    const [history, setHistory] = useState<StudentAcademicPeriodSyncHistory[]>([])
    const [selectedHistory, setSelectedHistory] = useState<StudentAcademicPeriodSyncHistory | null>(null)
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const [previewData, historyData] = await Promise.all([
                getStudentAcademicPeriodPreview(),
                getStudentAcademicPeriodSyncHistory(),
            ])
            setPreview(previewData)
            setHistory(historyData)
        } catch (loadError) {
            console.error('Unable to load student academic period sync', loadError)
            setError(getErrorMessage(loadError))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadData()
    }, [loadData])

    const syncAcademicPeriods = useCallback(async () => {
        setSyncing(true)
        try {
            const results = await syncStudentAcademicPeriods()
            setConfirmOpen(false)
            const successful = results.filter((item) => item.status === 'success')
            const partial = results.filter((item) => item.status === 'partial')
            const updated = results.reduce((sum, item) => sum + item.updated_count, 0)

            if (successful.length === results.length) {
                message.success(`Sync สำเร็จ ${results.length} กลุ่ม อัปเดตนิสิต ${updated.toLocaleString()} คน`)
            } else if (successful.length > 0 || partial.length > 0) {
                message.warning(`Sync สำเร็จบางส่วน (${successful.length + partial.length}/${results.length} กลุ่ม) กรุณาตรวจสอบประวัติ`)
            } else {
                message.error('Sync ไม่สำเร็จ กรุณาตรวจสอบประวัติ')
            }
            await loadData()
        } catch (syncError) {
            console.error('Unable to sync student academic periods', syncError)
            message.error(getErrorMessage(syncError))
        } finally {
            setSyncing(false)
        }
    }, [loadData])

    return {
        preview,
        history,
        selectedHistory,
        loading,
        syncing,
        confirmOpen,
        error,
        loadData,
        syncAcademicPeriods,
        setConfirmOpen,
        setSelectedHistory,
    }
}
