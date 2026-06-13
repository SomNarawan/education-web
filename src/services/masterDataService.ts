import api from '../config/axios'

export async function getTitles() {
    const response = await api.get('/titles')
    return response.data.data
}

export async function getTeachers() {
    const response = await api.get('/teachers')
    return response.data.data
}

export async function getStudentStatuses() {
    const response = await api.get('/student-statuses')
    return response.data.data
}

export async function getAdmissionChannels() {
    const response = await api.get('/admission-channels')
    return response.data.data
}

export async function getHighSchools() {
    const response = await api.get('/high-schools')
    return response.data.data
}

export async function getAffiliations() {
    const response = await api.get('/affiliations')
    return response.data.data
}

export async function getStudyPlans() {
    const response = await api.get('/study-plans')
    return response.data.data
}

export async function getCurriculums() {
    const response = await api.get('/curriculums')
    return response.data.data
}

export async function getDepartments() {
    const response = await api.get('/departments')
    return response.data.data
}

export async function getFaculties() {
    const response = await api.get('/faculties')
    return response.data.data
}

export async function getCampuses() {
    const response = await api.get('/campuses')
    return response.data.data
}

export async function getGuardianRelationships() {
    const response = await api.get('/guardian-relationships')
    return response.data.data
}