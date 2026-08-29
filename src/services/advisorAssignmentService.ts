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

export async function getStudyingStudentsBySystemTeacher(
    systemTeacherId: number,
): Promise<AdvisorAssignmentStudent[]> {
    const response = await api.get<ApiResponse<AdvisorAssignmentStudent[]>>(
        '/students/studying',
        {
            params: { teacher_id: systemTeacherId },
        },
    )

    return response.data.data
}

export async function updateStudentAdvisors(
    systemTeacherId: number,
    assignStudentIds: number[],
    removeStudentIds: number[],
): Promise<AdvisorUpdateResult> {
    const response = await api.patch<ApiResponse<AdvisorUpdateResult>>(
        '/students/advisor',
        {
            teacher_id: systemTeacherId,
            assign_student_ids: assignStudentIds,
            remove_student_ids: removeStudentIds,
        },
    )

    return response.data.data
}
