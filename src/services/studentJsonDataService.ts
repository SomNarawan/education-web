import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type {
    StudentEnrollmentData,
    StudentEnrollmentStatusesData,
    StudentGraphData,
} from '../types/StudentJsonData'

function getStudentDataPath(studentCode: string, resource: string) {
    const normalizedStudentCode = studentCode.trim()

    if (!/^\d+$/.test(normalizedStudentCode)) {
        throw new Error('Student code must contain digits only')
    }

    return `/students/${encodeURIComponent(normalizedStudentCode)}/${resource}`
}

export async function getStudentEnrollment(
    studentCode: string,
): Promise<StudentEnrollmentData> {
    const response = await api.get<ApiResponse<StudentEnrollmentData>>(
        getStudentDataPath(studentCode, 'enrollments'),
    )

    return response.data.data
}

export async function getStudentEnrollmentStatuses(
    studentCode: string,
): Promise<StudentEnrollmentStatusesData> {
    const response = await api.get<ApiResponse<StudentEnrollmentStatusesData>>(
        getStudentDataPath(studentCode, 'enrollment-statuses'),
    )

    return response.data.data
}

export async function getStudentGraphs(
    studentCode: string,
): Promise<StudentGraphData> {
    const response = await api.get<ApiResponse<StudentGraphData>>(
        getStudentDataPath(studentCode, 'performance-summary'),
    )

    return response.data.data
}
