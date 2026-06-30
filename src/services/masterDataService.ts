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

export async function getStudyPlans() {
    const response = await api.get('/study-plan-tracks')
    return response.data.data
}

export async function getGuardianRelationships() {
    const response = await api.get('/relationships')
    return response.data.data
}

export async function getSystemDepartments() {
    const response = await api.get('/system-departments')
    return response.data.data
}