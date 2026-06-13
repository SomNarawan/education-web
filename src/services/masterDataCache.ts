import type {
    AdmissionChannel,
    Affiliation,
    Campus,
    Curriculum,
    Department,
    Faculty,
    GuardianRelationship,
    HighSchool,
    StudentStatus,
    StudyPlan,
    Teacher,
    Title,
} from '../types/student'
import {
    getAdmissionChannels,
    getAffiliations,
    getCampuses,
    getCurriculums,
    getDepartments,
    getFaculties,
    getGuardianRelationships,
    getHighSchools,
    getStudentStatuses,
    getStudyPlans,
    getTeachers,
    getTitles,
} from './masterDataService'

const CACHE_KEY = 'education_master_data_cache'
const CACHE_EXPIRE_MS = 24 * 60 * 60 * 1000

export interface MasterData {
    titles: Title[]
    teachers: Teacher[]
    studentStatuses: StudentStatus[]
    admissionChannels: AdmissionChannel[]
    highSchools: HighSchool[]
    affiliations: Affiliation[]
    studyPlans: StudyPlan[]
    curriculums: Curriculum[]
    departments: Department[]
    faculties: Faculty[]
    campuses: Campus[]
    guardianRelationships: GuardianRelationship[]
}

interface MasterDataCache {
    expiredAt: number
    data: MasterData
}

export async function getMasterData(): Promise<MasterData> {
    const cached = localStorage.getItem(CACHE_KEY)

    if (cached) {
        try {
            const parsed: MasterDataCache = JSON.parse(cached)

            if (Date.now() < parsed.expiredAt) {
                return parsed.data
            }
        } catch {
            localStorage.removeItem(CACHE_KEY)
        }
    }

    const [
        titles,
        teachers,
        studentStatuses,
        admissionChannels,
        highSchools,
        affiliations,
        studyPlans,
        curriculums,
        departments,
        faculties,
        campuses,
        guardianRelationships,
    ] = await Promise.all([
        getTitles(),
        getTeachers(),
        getStudentStatuses(),
        getAdmissionChannels(),
        getHighSchools(),
        getAffiliations(),
        getStudyPlans(),
        getCurriculums(),
        getDepartments(),
        getFaculties(),
        getCampuses(),
        getGuardianRelationships(),
    ])

    const data: MasterData = {
        titles,
        teachers,
        studentStatuses,
        admissionChannels,
        highSchools,
        affiliations,
        studyPlans,
        curriculums,
        departments,
        faculties,
        campuses,
        guardianRelationships,
    }

    localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
            expiredAt: Date.now() + CACHE_EXPIRE_MS,
            data,
        }),
    )

    return data
}

export function clearMasterDataCache() {
    localStorage.removeItem(CACHE_KEY)
}