export type AppRole = 'admin' | 'teacher' | 'student'

// Roles that have their own tile in ENG Main.
export type PortalLoginRole = Extract<AppRole, 'admin' | 'teacher'>

export interface AuthUser {
    teacherId?: string | null
    studentCode?: string | null
    studyPlanId?: number | null
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
    study_plan_id: number | string | null
    iat: number | null
    exp: number | null
}

export interface PortalLoginResponse {
    token: string
    user: Omit<MeResponse, 'study_plan_id' | 'iat' | 'exp'>
}
