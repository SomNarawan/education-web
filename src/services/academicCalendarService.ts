import api from '../config/axios'
import type {
    AcademicCalendarData,
    SyncAcademicCalendarsRequest,
} from '../types/AcademicCalendar'
import type { ApiResponse } from '../types/ApiResponse'
import type { SyncResult } from '../types/SyncData'

export async function getAcademicCalendar(
    academicYear?: number,
): Promise<AcademicCalendarData> {
    const response = await api.get<ApiResponse<AcademicCalendarData>>(
        '/academic-calendars',
        {
            params: academicYear === undefined
                ? undefined
                : { academicYear },
        },
    )

    return response.data.data
}

export async function syncAcademicCalendars(
    academicYears: number[],
): Promise<SyncResult> {
    const payload: SyncAcademicCalendarsRequest = {
        academic_years: academicYears,
    }
    const response = await api.post<ApiResponse<SyncResult>>(
        '/academic-calendars/sync',
        payload,
    )

    return response.data.data
}
