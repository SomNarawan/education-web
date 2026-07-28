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
        `/students/json-data/enrollment/${encodeURIComponent(studentCode)}`,
    )

    return response.data.data
}

export async function getStudentEnrollmentStatuses(
    studentCode: string,
): Promise<StudentEnrollmentStatusesData> {
    const response = await api.get<ApiResponse<StudentEnrollmentStatusesData>>(
        `/students/json-data/enrollment-statuses/${encodeURIComponent(studentCode)}`,
    )

    return response.data.data
}

export async function getStudentGraphs(
    studentCode: string,
): Promise<StudentGraphData> {
    const response = await api.get<ApiResponse<StudentGraphData>>(
        `/students/json-data/graphs/${encodeURIComponent(studentCode)}`,
    )

    return response.data.data
}
