import api from '../config/axios'
import type { ApiResponse } from '../types/ApiResponse'
import type { ListOfValue, ListOfValueType } from '../types/ListOfValue'

interface ListOfValueParams {
    province_id?: number
    district_id?: number
    department_id?: number
}

const valueCache = new Map<string, ListOfValue[]>()
const pendingRequests = new Map<string, Promise<ListOfValue[]>>()

function getCacheKey(type: ListOfValueType, params: ListOfValueParams) {
    const query = Object.entries(params)
        .filter((entry): entry is [string, number] => entry[1] !== undefined)
        .sort(([first], [second]) => first.localeCompare(second))
        .map(([key, value]) => `${key}=${value}`)
        .join('&')

    return query ? `${type}?${query}` : type
}

async function getListOfValues(
    type: ListOfValueType,
    params: ListOfValueParams = {},
): Promise<ListOfValue[]> {
    const cacheKey = getCacheKey(type, params)
    const cachedValues = valueCache.get(cacheKey)

    if (cachedValues) return cachedValues

    const pendingRequest = pendingRequests.get(cacheKey)

    if (pendingRequest) return pendingRequest

    const request = api
        .get<ApiResponse<ListOfValue[]>>(`/list-of-values/${type}`, { params })
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
export const getSystemDepartments = () =>
    getListOfValues('system-departments')
export const getSystemFaculties = () =>
    getListOfValues('system-faculties')
