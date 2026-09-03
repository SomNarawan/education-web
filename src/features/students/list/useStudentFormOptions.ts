import { message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import {
    getAdmissionChannels,
    getGuardianRelationships,
    getHighSchoolOptions,
    getStudentStatuses,
    getSystemTeachersByStudyPlan,
    getTitles,
} from '../../../services/listOfValueService'
import {
    getCurriculums,
    getStudyPlans,
} from '../../../services/masterDataService'
import type { ListOfValue } from '../../../types/ListOfValue'
import type { Curriculum, StudyPlan } from '../../../types/MasterData'

interface StudentFormOptions {
    titles: ListOfValue[]
    curriculums: Curriculum[]
    systemTeachers: ListOfValue[]
    studentStatuses: ListOfValue[]
    admissionChannels: ListOfValue[]
    highSchools: ListOfValue[]
    guardianRelationships: ListOfValue[]
    studyPlans: StudyPlan[]
}

const emptyOptions: StudentFormOptions = {
    titles: [],
    curriculums: [],
    systemTeachers: [],
    studentStatuses: [],
    admissionChannels: [],
    highSchools: [],
    guardianRelationships: [],
    studyPlans: [],
}

export function useStudentFormOptions(
    enabled: boolean,
    curriculumId?: number,
    studyPlanId?: number,
) {
    const [options, setOptions] = useState<StudentFormOptions>(emptyOptions)
    const [loading, setLoading] = useState(false)
    const [studyPlansLoading, setStudyPlansLoading] = useState(false)
    const [systemTeachersLoading, setSystemTeachersLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!enabled) {
            return
        }

        let cancelled = false

        const loadOptions = async () => {
            try {
                setLoading(true)
                setError(null)
                const [
                    titles,
                    curriculums,
                    studentStatuses,
                    admissionChannels,
                    highSchools,
                    guardianRelationships,
                ] = await Promise.all([
                    getTitles(),
                    getCurriculums(),
                    getStudentStatuses(),
                    getAdmissionChannels(),
                    getHighSchoolOptions(),
                    getGuardianRelationships(),
                ])

                if (!cancelled) {
                    setOptions((current) => ({
                        ...current,
                        titles,
                        curriculums,
                        studentStatuses,
                        admissionChannels,
                        highSchools,
                        guardianRelationships,
                    }))
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(error)
                    const errorMessage =
                        'โหลดข้อมูลตัวเลือกสำหรับแบบฟอร์มไม่สำเร็จ'
                    setError(errorMessage)
                    message.error(errorMessage)
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

    useEffect(() => {
        if (!enabled || !curriculumId) {
            return
        }

        let cancelled = false

        const loadStudyPlans = async () => {
            try {
                setStudyPlansLoading(true)
                const studyPlans = await getStudyPlans(curriculumId)

                if (!cancelled) {
                    setOptions((current) => ({ ...current, studyPlans }))
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(error)
                    message.error('โหลดข้อมูลแผนการเรียนไม่สำเร็จ')
                }
            } finally {
                if (!cancelled) {
                    setStudyPlansLoading(false)
                }
            }
        }

        void loadStudyPlans()

        return () => {
            cancelled = true
        }
    }, [curriculumId, enabled])

    useEffect(() => {
        if (!enabled || !studyPlanId) {
            return
        }

        let cancelled = false

        const loadSystemTeachers = async () => {
            try {
                setSystemTeachersLoading(true)
                const systemTeachers =
                    await getSystemTeachersByStudyPlan(studyPlanId)

                if (!cancelled) {
                    setOptions((current) => ({
                        ...current,
                        systemTeachers,
                    }))
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(error)
                    message.error('โหลดข้อมูลอาจารย์ที่ปรึกษาไม่สำเร็จ')
                }
            } finally {
                if (!cancelled) {
                    setSystemTeachersLoading(false)
                }
            }
        }

        void loadSystemTeachers()

        return () => {
            cancelled = true
        }
    }, [enabled, studyPlanId])

    const clearStudyPlans = useCallback(() => {
        setOptions((current) => ({
            ...current,
            studyPlans: [],
            systemTeachers: [],
        }))
    }, [])

    const clearSystemTeachers = useCallback(() => {
        setOptions((current) => ({ ...current, systemTeachers: [] }))
    }, [])

    return {
        options,
        loading,
        studyPlansLoading,
        systemTeachersLoading,
        error,
        clearStudyPlans,
        clearSystemTeachers,
    }
}
