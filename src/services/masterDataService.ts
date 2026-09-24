import axios from 'axios'
import api from '../config/axios'
import type { ApiErrorResponse, ApiResponse } from '../types/ApiResponse'
import type {
    CurriculumCategory,
    CurriculumCategoryApiNode,
    CurriculumCategoryType,
} from '../types/CurriculumDetail'
import { invalidateListOfValueCache } from './listOfValueService'
import type {
    HighSchool,
    HighSchoolListItem,
    HighSchoolPayload,
    ManagedMasterDataPayload,
    ManagedMasterDataRecord,
    ManagedMasterDataResource,
    MasterDataStatus,
    StudyPlan,
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
    invalidateListOfValueCache(resource)
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
    invalidateListOfValueCache(resource)
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
    invalidateListOfValueCache(resource)
    return response.data.data
}

export async function getHighSchools(): Promise<HighSchoolListItem[]> {
    const response =
        await api.get<ApiResponse<HighSchoolListItem[]>>('/high-schools')
    return response.data.data
}

export async function getStudyPlans(
    curriculumId: number,
    includeIds?: number[],
): Promise<StudyPlan[]> {
    const response = await api.get<ApiResponse<StudyPlan[]>>(
        '/list-of-values/study-plans',
        {
            params: {
                curriculum_id: curriculumId,
                include_ids: includeIds,
            },
        },
    )
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
    invalidateListOfValueCache('high-schools')
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
    invalidateListOfValueCache('high-schools')
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
    invalidateListOfValueCache('high-schools')
    return response.data.data
}

export async function getCurriculumCategories(
    studyPlanId: number,
): Promise<CurriculumCategory[]> {
    try {
        const response = await api.get<ApiResponse<CurriculumCategoryApiNode[]>>(
            '/curriculum-categories',
            {
                params: { study_plan_id: studyPlanId },
            },
        )

        const categoryTypes: CurriculumCategoryType[] = [
            'category',
            'subcategory',
            'group',
        ]
        const mapCategory = (
            node: CurriculumCategoryApiNode,
        ): CurriculumCategory | null => {
            if (!categoryTypes.includes(node.category_type as CurriculumCategoryType)) {
                return null
            }

            const categoryType = node.category_type as CurriculumCategoryType

            return {
                id: node.id,
                category_type: categoryType,
                code: node.code,
                name_th: node.name_th,
                name_en: node.name_en,
                course_source_type: node.course_source_type ?? null,
                children:
                    categoryType === 'group'
                        ? []
                        : node.children
                              .map(mapCategory)
                              .filter(
                                  (
                                      category,
                                  ): category is CurriculumCategory =>
                                      category !== null,
                              ),
            }
        }

        return response.data.data
            .map(mapCategory)
            .filter(
                (category): category is CurriculumCategory =>
                    category !== null,
            )
    } catch (error) {
        if (axios.isAxiosError<ApiErrorResponse>(error)) {
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
