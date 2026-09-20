import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type { ListOfValue, ListOfValueType } from '../types/ListOfValue'
import type { Curriculum } from '../types/MasterData'

interface ListOfValueParams {
    province_id?: number
    district_id?: number
    department_id?: number
    study_plan_id?: number
    curriculum_id?: number
    include_ids?: Array<number | string>
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

export const getTitles = (includeIds?: number[]) =>
    getListOfValues('titles', { include_ids: includeIds })
export const getAdmissionChannels = (includeIds?: number[]) =>
    getListOfValues('admission-channels', { include_ids: includeIds })
export const getGuardianRelationships = (includeIds?: number[]) =>
    getListOfValues('relationships', { include_ids: includeIds })
export const getStudentStatuses = (includeIds?: number[]) =>
    getListOfValues('student-statuses', { include_ids: includeIds })
export const getNoteTypes = (includeIds?: number[]) =>
    getListOfValues('note-types', { include_ids: includeIds })
export const getImportTypes = (includeIds?: number[]) =>
    getListOfValues('import-types', { include_ids: includeIds })
export const getHighSchoolOptions = (includeIds?: number[]) =>
    getListOfValues('high-schools', { include_ids: includeIds })
export const getProvinces = (includeIds?: number[]) =>
    getListOfValues('provinces', { include_ids: includeIds })
export const getDistricts = (provinceId: number, includeIds?: number[]) =>
    getListOfValues('districts', {
        province_id: provinceId,
        include_ids: includeIds,
    })
export const getSubdistricts = (districtId: number, includeIds?: number[]) =>
    getListOfValues('subdistricts', {
        district_id: districtId,
        include_ids: includeIds,
    })
export const getCurriculumPersonnel = (
    curriculumId: number,
    includeIds?: Array<number | string>,
) =>
    getListOfValues('curriculum-personnel', {
        curriculum_id: curriculumId,
        include_ids: includeIds,
    })
export const getSystemDepartments = (includeIds?: number[]) =>
    getListOfValues('system-departments', { include_ids: includeIds })
export const getSystemFaculties = (includeIds?: number[]) =>
    getListOfValues('system-faculties', { include_ids: includeIds })
export const getCurriculums = (includeIds?: number[]): Promise<Curriculum[]> =>
    getListOfValues<Curriculum>('curriculums', { include_ids: includeIds })
