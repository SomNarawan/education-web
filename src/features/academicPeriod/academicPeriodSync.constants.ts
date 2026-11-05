import type {
    AcademicPeriodSummaryStatus,
    AcademicPeriodSyncStatus,
} from '../../types/StudentAcademicPeriodSync'

interface StatusDisplay {
    color: string
    label: string
}

export const academicPeriodSummaryStatusDisplay: Record<
    AcademicPeriodSummaryStatus,
    StatusDisplay
> = {
    ready: { color: 'success', label: 'พร้อม Sync' },
    missing_calendar: { color: 'error', label: 'ไม่มีปฏิทินการศึกษา' },
    calendar_conflict: { color: 'error', label: 'ปฏิทินไม่ตรงกัน' },
    invalid_entry_year: { color: 'warning', label: 'ปีเข้าไม่ถูกต้อง' },
}

export const academicPeriodHistoryStatusDisplay: Record<
    AcademicPeriodSyncStatus,
    StatusDisplay
> = {
    running: { color: 'processing', label: 'กำลัง Sync' },
    success: { color: 'success', label: 'สำเร็จ' },
    partial: { color: 'warning', label: 'สำเร็จบางส่วน' },
    failed: { color: 'error', label: 'ไม่สำเร็จ' },
}
