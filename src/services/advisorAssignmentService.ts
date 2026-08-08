import api from '../config/axios'
import type {
    AdvisorAssignmentStudent,
    AdvisorUpdateResult,
} from '../types/AdvisorAssignment'
import type { ApiResponse } from '../types/ApiResponse'

export async function getStudyingStudentsWithoutAdvisor(
    departmentId: number,
): Promise<AdvisorAssignmentStudent[]> {
    const response = await api.get<ApiResponse<AdvisorAssignmentStudent[]>>(
        '/students/studying/without-advisor',
        {
            params: { department_id: departmentId },
        },
    )

    return response.data.data
}

export async function getStudyingStudentsByTeacher(
    teacherId: number,
): Promise<AdvisorAssignmentStudent[]> {
    const response = await api.get<ApiResponse<AdvisorAssignmentStudent[]>>(
        '/students/studying',
        {
            params: { teacher_id: teacherId },
        },
    )

    return response.data.data
}

export async function updateStudentAdvisors(
    teacherId: number,
    assignStudentIds: number[],
    removeStudentIds: number[],
): Promise<AdvisorUpdateResult> {
    const response = await api.patch<ApiResponse<AdvisorUpdateResult>>(
        '/students/advisor',
        {
            teacher_id: teacherId,
            assign_student_ids: assignStudentIds,
            remove_student_ids: removeStudentIds,
        },
    )

    return response.data.data
}
