import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type { CurriculumDivision } from '../types/CurriculumDetail'
import type {
    AdmissionChannel,
    GuardianRelationship,
    HighSchool,
    StudentStatusOption,
    StudyPlan,
    SystemDepartment,
    Teacher,
    Title,
} from '../types/MasterData'

export async function getTitles(): Promise<Title[]> {
    const response = await api.get<ApiResponse<Title[]>>('/titles')
    return response.data.data
}

export async function getTeachers(): Promise<Teacher[]> {
    const response = await api.get<ApiResponse<Teacher[]>>('/teachers')
    return response.data.data
}

export async function getStudentStatuses(): Promise<StudentStatusOption[]> {
    const response =
        await api.get<ApiResponse<StudentStatusOption[]>>('/student-statuses')
    return response.data.data
}

export async function getAdmissionChannels(): Promise<AdmissionChannel[]> {
    const response =
        await api.get<ApiResponse<AdmissionChannel[]>>('/admission-channels')
    return response.data.data
}

export async function getHighSchools(): Promise<HighSchool[]> {
    const response =
        await api.get<ApiResponse<HighSchool[]>>('/high-schools')
    return response.data.data
}

export async function getStudyPlans(): Promise<StudyPlan[]> {
    const response =
        await api.get<ApiResponse<StudyPlan[]>>('/study-plan-tracks')
    return response.data.data
}

export async function getGuardianRelationships(): Promise<
    GuardianRelationship[]
> {
    const response =
        await api.get<ApiResponse<GuardianRelationship[]>>('/relationships')
    return response.data.data
}

export async function getSystemDepartments(): Promise<SystemDepartment[]> {
    const response =
        await api.get<ApiResponse<SystemDepartment[]>>('/system-departments')
    return response.data.data
}

export async function getCurriculumDivisions(): Promise<CurriculumDivision[]> {
    const response = await api.get<ApiResponse<CurriculumDivision[]>>(
        '/curriculum-divisions',
    )

    return response.data.data
}
