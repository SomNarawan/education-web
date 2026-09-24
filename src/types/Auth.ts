export type AppRole = 'admin' | 'teacher'

export interface AuthUser {
    teacherId?: string | null
    name?: string
    roles: AppRole[]
    departmentId?: number | null
    facultyId?: number | null
}

export interface MeResponse {
    nontri_id: string | null
    name: string | null
    role: AppRole[]
    current_role: AppRole | null
    department_id: number | string | null
    faculty_id: number | string | null
    iat: number | null
    exp: number | null
}
