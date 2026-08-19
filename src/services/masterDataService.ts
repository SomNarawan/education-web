import axios from 'axios'
import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type { CurriculumCategory } from '../types/CurriculumDetail'
import type {
    AdmissionChannel,
    District,
    GuardianRelationship,
    HighSchool,
    HighSchoolPayload,
    ManagedMasterDataPayload,
    ManagedMasterDataRecord,
    ManagedMasterDataResource,
    MasterDataStatus,
    Province,
    StudentStatusOption,
    StudyPlan,
    SystemDepartment,
    Subdistrict,
    Teacher,
    Title,
} from '../types/MasterData'

export async function getManagedMasterDataList(
    resource: ManagedMasterDataResource,
): Promise<ManagedMasterDataRecord[]> {
    const response = await api.get<ApiResponse<ManagedMasterDataRecord[]>>(
        `/${resource}`,
    )
    return response.data.data
}

export async function getManagedMasterData(
    resource: ManagedMasterDataResource,
    id: number,
): Promise<ManagedMasterDataRecord> {
    const response = await api.get<ApiResponse<ManagedMasterDataRecord>>(
        `/${resource}/${id}`,
    )
    return response.data.data
}

export async function createManagedMasterData(
    resource: ManagedMasterDataResource,
    data: ManagedMasterDataPayload,
): Promise<ManagedMasterDataRecord> {
    const response = await api.post<ApiResponse<ManagedMasterDataRecord>>(
        `/${resource}`,
        data,
    )
    return response.data.data
}

export async function updateManagedMasterData(
    resource: ManagedMasterDataResource,
    id: number,
    data: ManagedMasterDataPayload,
): Promise<ManagedMasterDataRecord> {
    const response = await api.put<ApiResponse<ManagedMasterDataRecord>>(
        `/${resource}/${id}`,
        data,
    )
    return response.data.data
}

export async function updateManagedMasterDataStatus(
    resource: ManagedMasterDataResource,
    id: number,
    status: MasterDataStatus,
): Promise<ManagedMasterDataRecord> {
    const response = await api.patch<ApiResponse<ManagedMasterDataRecord>>(
        `/${resource}/${id}/status`,
        { status },
    )
    return response.data.data
}

export async function deleteManagedMasterData(
    resource: ManagedMasterDataResource,
    id: number,
): Promise<void> {
    await api.delete(`/${resource}/${id}`)
}

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
    const response = await api.get<ApiResponse<StudyPlan[]>>('/study-plans')
    return response.data.data
}

export async function getHighSchool(id: number): Promise<HighSchool> {
    const response = await api.get<ApiResponse<HighSchool>>(
        `/high-schools/${id}`,
    )
    return response.data.data
}

export async function createHighSchool(
    data: HighSchoolPayload,
): Promise<HighSchool> {
    const response = await api.post<ApiResponse<HighSchool>>(
        '/high-schools',
        data,
    )
    return response.data.data
}

export async function updateHighSchool(
    id: number,
    data: HighSchoolPayload,
): Promise<HighSchool> {
    const response = await api.put<ApiResponse<HighSchool>>(
        `/high-schools/${id}`,
        data,
    )
    return response.data.data
}

export async function updateHighSchoolStatus(
    id: number,
    status: HighSchool['status'],
): Promise<HighSchool> {
    const response = await api.patch<ApiResponse<HighSchool>>(
        `/high-schools/${id}/status`,
        { status },
    )
    return response.data.data
}

export async function getProvinces(): Promise<Province[]> {
    const response = await api.get<ApiResponse<Province[]>>('/provinces')
    return response.data.data
}

export async function getDistricts(provinceId: number): Promise<District[]> {
    const response = await api.get<ApiResponse<District[]>>('/districts', {
        params: { province_id: provinceId },
    })
    return response.data.data
}

export async function getSubdistricts(
    districtId: number,
): Promise<Subdistrict[]> {
    const response = await api.get<ApiResponse<Subdistrict[]>>(
        '/subdistricts',
        {
            params: { district_id: districtId },
        },
    )
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

export async function getCurriculumCategories(
    studyPlanId: number,
): Promise<CurriculumCategory[]> {
    try {
        const response = await api.get<ApiResponse<CurriculumCategory[]>>(
            '/curriculum-categories',
            {
                params: { study_plan_id: studyPlanId },
            },
        )

        if (!response.data.success) {
            throw new Error(response.data.message)
        }

        return response.data.data
    } catch (error) {
        if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
            if (error.response?.status === 422) {
                throw new Error(
                    'แผนการเรียนไม่ถูกต้องหรือยังไม่ได้เลือก',
                    { cause: error },
                )
            }

            throw new Error(
                error.response?.data.message ||
                    error.message ||
                    'โหลดหมวดหมู่หลักสูตรไม่สำเร็จ',
                { cause: error },
            )
        }

        throw error
    }
}
