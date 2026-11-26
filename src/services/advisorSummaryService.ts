import api from '../config/axios'
import type { AdvisorHistory, AdvisorHistoryStudent, AdvisorSummary, GpaxRanges } from '../types/AdvisorSummary'
import type { ApiResponse } from '../types/ApiResponse'

// The API reads the advisor from the signed-in teacher's token.
export async function getAdvisorSummary(): Promise<AdvisorSummary> {
    const response = await api.get<ApiResponse<AdvisorSummary>>(
        '/students/advisor-summary',
    )

    return response.data.data
}

export async function getAdvisorHistory(): Promise<AdvisorHistory> {
    const response = await api.get<ApiResponse<AdvisorHistory>>(
        '/students/advisor-summary/history',
    )

    return response.data.data
}

export async function getAdvisorGpaxStudents(range: keyof GpaxRanges): Promise<AdvisorHistoryStudent[]> {
    const response = await api.get<ApiResponse<{ students: AdvisorHistoryStudent[] }>>(
        `/students/advisor-summary/gpax/${range}`,
    )
    return response.data.data.students
}

export async function getAdvisorTermStudents(academicYear: number, semester: number): Promise<AdvisorHistoryStudent[]> {
    const response = await api.get<ApiResponse<{ students: AdvisorHistoryStudent[] }>>(
        `/students/advisor-summary/history/${academicYear}/${semester}`,
    )

    return response.data.data.students
}
