import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type { ListOfValue, ListOfValueType } from '../types/ListOfValue'
import type { Curriculum } from '../types/MasterData'

interface ListOfValueParams {
    province_id?: number
    district_id?: number
    department_id?: number
    study_plan_id?: number
    include_ids?: number[]
}

const valueCache = new Map<string, unknown[]>()
const pendingRequests = new Map<string, Promise<unknown[]>>()

function getCacheKey(type: ListOfValueType, params: ListOfValueParams) {
    const query = Object.entries(params)
        .filter((entry) => entry[1] !== undefined)
        .sort(([first], [second]) => first.localeCompare(second))
        .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(',') : value}`)
        .join('&')

    return query ? `${type}?${query}` : type
}

async function getListOfValues<
    T extends { id: number; name_th: string } = ListOfValue,
>(
    type: ListOfValueType,
    params: ListOfValueParams = {},
): Promise<T[]> {
    const cacheKey = getCacheKey(type, params)
    const cachedValues = valueCache.get(cacheKey) as T[] | undefined

    if (cachedValues) return cachedValues

    const pendingRequest = pendingRequests.get(cacheKey)

    if (pendingRequest) return pendingRequest as Promise<T[]>

    const request = api
        .get<ApiResponse<T[]>>(`/list-of-values/${type}`, { params })
        .then((response) => {
            const values = response.data.data
            valueCache.set(cacheKey, values)
            return values
        })
        .finally(() => {
            pendingRequests.delete(cacheKey)
        })

    pendingRequests.set(cacheKey, request)
    return request
}

export function invalidateListOfValueCache(type?: ListOfValueType) {
    if (!type) {
        valueCache.clear()
        return
    }

    for (const key of valueCache.keys()) {
        if (key === type || key.startsWith(`${type}?`)) {
            valueCache.delete(key)
        }
    }
}

export const getTitles = () => getListOfValues('titles')
export const getAdmissionChannels = () =>
    getListOfValues('admission-channels')
export const getGuardianRelationships = () =>
    getListOfValues('relationships')
export const getStudentStatuses = () =>
    getListOfValues('student-statuses')
export const getNoteTypes = () => getListOfValues('note-types')
export const getImportTypes = () => getListOfValues('import-types')
export const getHighSchoolOptions = () => getListOfValues('high-schools')
export const getProvinces = () => getListOfValues('provinces')
export const getDistricts = (provinceId: number) =>
    getListOfValues('districts', { province_id: provinceId })
export const getSubdistricts = (districtId: number) =>
    getListOfValues('subdistricts', { district_id: districtId })
export const getSystemTeachers = (departmentId?: number) =>
    getListOfValues('system-teachers', { department_id: departmentId })
export const getSystemTeachersByStudyPlan = (studyPlanId: number) =>
    getListOfValues('system-teachers', { study_plan_id: studyPlanId })
export const getSystemDepartments = () =>
    getListOfValues('system-departments')
export const getSystemFaculties = () =>
    getListOfValues('system-faculties')
export const getCurriculums = (includeIds?: number[]): Promise<Curriculum[]> =>
    getListOfValues<Curriculum>(
        'curriculums',
        includeIds ? { include_ids: includeIds } : {},
    )
