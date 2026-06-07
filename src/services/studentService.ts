import api from '../config/axios'
import type { Student, StudentApiResponse } from '../types/student'

export async function getStudentDetail(): Promise<Student[]> {
    const response = await api.get<StudentApiResponse>('/students/detail')
    return response.data.data
}