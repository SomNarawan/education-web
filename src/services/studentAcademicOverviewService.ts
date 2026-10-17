import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type {
    StudentAcademicOverview,
    StudentUnattemptedCoursesData,
} from '../types/StudentAcademicOverview'

function validateStudentId(studentId: number) {
    if (!Number.isInteger(studentId) || studentId < 1) {
        throw new Error('Student id must be a positive integer')
    }
}

export async function getStudentAcademicOverview(
    studentId: number,
): Promise<StudentAcademicOverview> {
    validateStudentId(studentId)

    const response = await api.get<ApiResponse<StudentAcademicOverview>>(
        `/students/${studentId}/academic-overview`,
    )

    return response.data.data
}

export async function getStudentUnattemptedCourses(
    studentId: number,
): Promise<StudentUnattemptedCoursesData> {
    validateStudentId(studentId)

    const response = await api.get<ApiResponse<StudentUnattemptedCoursesData>>(
        `/students/${studentId}/unattempted-courses`,
    )

    return response.data.data
}
