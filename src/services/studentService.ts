import api from '../config/axios'
import type { Student, StudentApiResponse } from '../types/student'

export async function getStudentsByPage(
    studentGroup?: string,
    studentStatus?: string,
    teacherId?: number,
    departmentId?: number,
    facultyId?: number,
): Promise<Student[]> {
    let url = '/students/advisor'

    switch (studentGroup) {
        case 'department':
            url =
                studentStatus === 'graduated'
                    ? '/students/departmentGraduated'
                    : '/students/department'
            break

        case 'faculty':
            url =
                studentStatus === 'graduated'
                    ? '/students/facultyGraduated'
                    : '/students/faculty'
            break

        default:
            url =
                studentStatus === 'graduated'
                    ? '/students/advisorGraduated'
                    : '/students/advisor'
            break
    }

    const params: Record<string, number> = {}

    if (studentGroup === 'advisor' && teacherId) {
        params.teacher_id = teacherId
    }

    if (studentGroup === 'department' && departmentId) {
        params.department_id = departmentId
    }

    if (studentGroup === 'faculty' && facultyId) {
        params.faculty_id = facultyId
    }

    const response = await api.get<StudentApiResponse>(url, {
        params: Object.keys(params).length ? params : undefined,
    })

    return response.data.data
}

export async function getStudentDetail(
    id: number,
): Promise<Student> {
    const response = await api.get<{
        success: boolean
        message: string
        data: Student
    }>(`/students/${id}`)

    return response.data.data
}