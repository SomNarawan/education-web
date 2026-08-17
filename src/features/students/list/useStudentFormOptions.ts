import { message } from 'antd'
import { useEffect, useState } from 'react'
import {
    getAdmissionChannels,
    getGuardianRelationships,
    getHighSchools,
    getStudentStatuses,
    getStudyPlans,
    getTeachers,
    getTitles,
} from '../../../services/masterDataService'
import type {
    AdmissionChannel,
    GuardianRelationship,
    HighSchool,
    StudentStatusOption,
    StudyPlan,
    Teacher,
    Title,
} from '../../../types/MasterData'

interface StudentFormOptions {
    titles: Title[]
    teachers: Teacher[]
    studentStatuses: StudentStatusOption[]
    admissionChannels: AdmissionChannel[]
    highSchools: HighSchool[]
    guardianRelationships: GuardianRelationship[]
    studyPlans: StudyPlan[]
}

const emptyOptions: StudentFormOptions = {
    titles: [],
    teachers: [],
    studentStatuses: [],
    admissionChannels: [],
    highSchools: [],
    guardianRelationships: [],
    studyPlans: [],
}

export function useStudentFormOptions(enabled: boolean) {
    const [options, setOptions] = useState<StudentFormOptions>(emptyOptions)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!enabled) {
            return
        }

        let cancelled = false

        const loadOptions = async () => {
            try {
                setLoading(true)
                const [
                    titles,
                    teachers,
                    studentStatuses,
                    admissionChannels,
                    highSchools,
                    guardianRelationships,
                    studyPlans,
                ] = await Promise.all([
                    getTitles(),
                    getTeachers(),
                    getStudentStatuses(),
                    getAdmissionChannels(),
                    getHighSchools(),
                    getGuardianRelationships(),
                    getStudyPlans(),
                ])

                if (!cancelled) {
                    setOptions({
                        titles,
                        teachers,
                        studentStatuses,
                        admissionChannels,
                        highSchools,
                        guardianRelationships,
                        studyPlans,
                    })
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(error)
                    message.error('โหลดข้อมูลตัวเลือกสำหรับแบบฟอร์มไม่สำเร็จ')
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        loadOptions()

        return () => {
            cancelled = true
        }
    }, [enabled])

    return { options, loading }
}
