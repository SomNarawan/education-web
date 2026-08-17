import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type {
    StudentEnrollmentData,
    StudentEnrollmentStatusesData,
    StudentGraphData,
} from '../types/StudentJsonData'

export async function getStudentEnrollment(
    studentCode: string,
): Promise<StudentEnrollmentData> {
    const response = await api.get<ApiResponse<StudentEnrollmentData>>(
        `/students/${encodeURIComponent(studentCode)}/enrollments`,
    )

    return response.data.data
}

export async function getStudentEnrollmentStatuses(
    studentCode: string,
): Promise<StudentEnrollmentStatusesData> {
    const response = await api.get<ApiResponse<StudentEnrollmentStatusesData>>(
        `/students/${encodeURIComponent(studentCode)}/enrollment-statuses`,
    )

    return response.data.data
}

export async function getStudentGraphs(
    studentCode: string,
): Promise<StudentGraphData> {
    const response = await api.get<ApiResponse<StudentGraphData>>(
        `/students/${encodeURIComponent(studentCode)}/performance-summary`,
    )

    return response.data.data
}
