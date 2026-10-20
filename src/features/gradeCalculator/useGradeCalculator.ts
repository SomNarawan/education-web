import { Form, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { appMode } from '../../config/appMode'
import { useCurrentStudent } from '../../hooks/useCurrentStudent'
import {
    createGradeCalculation,
    getLatestGradeCalculation,
} from '../../services/gradeCalculationService'
import {
    getStudentAcademicOverview,
    getStudentUnattemptedCourses,
} from '../../services/studentAcademicOverviewService'
import {
    getStudentGraphs,
    isStudentGradeDataMissingError,
} from '../../services/studentJsonDataService'
import { getStudentDetailByCode, getStudents } from '../../services/studentService'
import type { StudentAcademicOverview } from '../../types/StudentAcademicOverview'
import type { StudentGraphData } from '../../types/StudentJsonData'
import type {
    GradeCalculationFormValues,
    GradeCalculationResult,
    PredictionCourse,
    StudentOption,
} from './gradeCalculator.types'
import {
    buildGradeCalculationRequest,
    buildPredictionCourses,
    calculateGradePrediction,
    formatTerm,
    getDefaultCourseIds,
    getSelectedCourses,
    restoreGradePrediction,
    updateOtherCourseSelection,
} from './gradeCalculatorUtils'

interface GradeCalculatorData {
    overview: StudentAcademicOverview
    courses: PredictionCourse[]
    missingSections: string[]
}

async function loadStudentOptions(
    isStudent: boolean,
    studentCode: string,
): Promise<StudentOption[]> {
    const student = isStudent ? await getStudentDetailByCode(studentCode) : null
    const students = isStudent ? (student ? [student] : []) : await getStudents()

    return students.map((item) => ({
        id: item.id,
        studentCode: item.student_code ?? (isStudent ? studentCode : '-'),
        fullName: item.full_name_th,
    }))
}

async function loadCourseGroupPerformance(
    studentCode: string,
): Promise<StudentGraphData['by_group']> {
    if (!/^\d+$/.test(studentCode.trim())) return {}

    try {
        const data = await getStudentGraphs(studentCode)
        return data.by_group
    } catch (error) {
        if (isStudentGradeDataMissingError(error)) return {}
        throw error
    }
}

async function loadCalculatorData(
    studentId: number,
    studentCode: string,
): Promise<GradeCalculatorData> {
    const [overview, unattempted, performanceByGroup] = await Promise.all([
        getStudentAcademicOverview(studentId),
        getStudentUnattemptedCourses(studentId),
        loadCourseGroupPerformance(studentCode),
    ])

    return {
        overview,
        courses: buildPredictionCourses(overview, unattempted, performanceByGroup),
        missingSections: [
            ...overview.missing_sections,
            ...unattempted.missing_sections,
        ],
    }
}

export function useGradeCalculator() {
    const { currentRole, studentCode } = useCurrentStudent()
    const isStudent = appMode === 'student' || currentRole === 'student'
    const [studentOptions, setStudentOptions] = useState<StudentOption[]>([])
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
    const [data, setData] = useState<GradeCalculatorData | null>(null)
    const [loadingStudents, setLoadingStudents] = useState(true)
    const [loadingOverview, setLoadingOverview] = useState(false)
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
    const [calculationResult, setCalculationResult] =
        useState<GradeCalculationResult | null>(null)
    const [savingCalculation, setSavingCalculation] = useState(false)
    const [loadingLatestCalculation, setLoadingLatestCalculation] = useState(false)
    const [calculationSaved, setCalculationSaved] = useState(false)
    const [resultOpen, setResultOpen] = useState(false)
    const [gradeForm] = Form.useForm<GradeCalculationFormValues>()
    const selectedStudent = studentOptions.find(({ id }) => id === selectedStudentId)
    const selectedStudentCode = selectedStudent?.studentCode ?? ''

    useEffect(() => {
        let cancelled = false

        const loadStudents = async () => {
            try {
                setLoadingStudents(true)
                const options = await loadStudentOptions(isStudent, studentCode)

                if (cancelled) return

                setStudentOptions(options)
                setSelectedStudentId((currentId) =>
                    !isStudent && options.some(({ id }) => id === currentId)
                        ? currentId
                        : (options[0]?.id ?? null),
                )
            } catch (error) {
                if (cancelled) return

                console.error('Unable to load grade calculator students', error)
                setStudentOptions([])
                setSelectedStudentId(null)
                message.error('โหลดรายชื่อนิสิตไม่สำเร็จ')
            } finally {
                if (!cancelled) setLoadingStudents(false)
            }
        }

        void loadStudents()

        return () => {
            cancelled = true
        }
    }, [isStudent, studentCode])

    useEffect(() => {
        if (!selectedStudentId || !selectedStudentCode) return

        let cancelled = false

        const loadOverview = async () => {
            try {
                setLoadingOverview(true)
                const calculatorData = await loadCalculatorData(
                    selectedStudentId,
                    selectedStudentCode,
                )

                if (cancelled) return

                setData(calculatorData)
                setSelectedCourseIds(getDefaultCourseIds(calculatorData.courses))
                gradeForm.resetFields()
                setCalculationResult(null)
            } catch (error) {
                if (cancelled) return

                console.error('Unable to load grade calculator data', error)
                setData(null)
                setSelectedCourseIds([])
                message.error('โหลดข้อมูลผลการเรียนไม่สำเร็จ')
            } finally {
                if (!cancelled) setLoadingOverview(false)
            }
        }

        void loadOverview()

        return () => {
            cancelled = true
        }
    }, [gradeForm, selectedStudentCode, selectedStudentId])

    const predictionCourses = data?.courses ?? []
    const selectedCourses = useMemo(
        () => getSelectedCourses(data?.courses ?? [], selectedCourseIds),
        [data, selectedCourseIds],
    )
    const overview = data?.overview ?? null
    const currentGpax = overview?.gpax ?? 0
    const predictionTerm = overview?.next_term ?? null
    const predictedTermLabel = predictionTerm
        ? formatTerm(predictionTerm.year, predictionTerm.semester)
        : 'ภาคการศึกษาถัดไป'
    const otherCourseIds = selectedCourses
        .filter(({ source }) => source === 'other')
        .map(({ id }) => id)

    const clearCalculation = () => {
        setCalculationResult(null)
        setCalculationSaved(false)
    }

    const selectStudent = (studentId: number) => {
        setSelectedStudentId(studentId)
        setData(null)
        setSelectedCourseIds([])
        clearCalculation()
    }

    const resetPrediction = () => {
        setSelectedCourseIds(getDefaultCourseIds(predictionCourses))
        gradeForm.resetFields()
        clearCalculation()
    }

    const toggleCourse = (courseId: string, checked: boolean) => {
        setSelectedCourseIds((ids) =>
            checked
                ? [...new Set([...ids, courseId])]
                : ids.filter((id) => id !== courseId),
        )

        if (!checked) {
            gradeForm.setFieldValue(['grades', courseId], undefined)
        }

        clearCalculation()
    }

    const changeOtherCourses = (courseIds: string[]) => {
        const availableOtherIds = new Set(
            predictionCourses
                .filter(({ source }) => source === 'other')
                .map(({ id }) => id),
        )
        setSelectedCourseIds((ids) =>
            updateOtherCourseSelection(ids, courseIds, availableOtherIds),
        )

        for (const id of availableOtherIds) {
            if (!courseIds.includes(id)) {
                gradeForm.setFieldValue(['grades', id], undefined)
            }
        }

        clearCalculation()
    }

    const loadLatestCalculation = async () => {
        if (!selectedStudentId || predictionCourses.length === 0) return

        try {
            setLoadingLatestCalculation(true)
            const latest = await getLatestGradeCalculation({
                student_id: selectedStudentId,
            })

            if (!latest) {
                message.warning('ยังไม่มีประวัติการคำนวณผลการเรียน')
                return
            }

            const restored = restoreGradePrediction(latest.courses, predictionCourses)

            if (restored.courseIds.length === 0) {
                message.warning('ไม่พบรายวิชาจากการคำนวณล่าสุดในข้อมูลรายวิชาปัจจุบัน')
                return
            }

            gradeForm.resetFields()
            // Mount new Form.Item fields before assigning grades (preserve=false).
            flushSync(() => setSelectedCourseIds(restored.courseIds))
            gradeForm.setFieldsValue({ grades: restored.grades })
            clearCalculation()

            if (restored.unavailableCourseCount > 0) {
                message.warning(
                    `ดึงข้อมูลล่าสุดแล้ว แต่ข้าม ${restored.unavailableCourseCount} วิชาที่ไม่มีในข้อมูลปัจจุบัน`,
                )
                return
            }

            message.success('ดึงข้อมูลการคำนวณล่าสุดแล้ว สามารถแก้ไขและคำนวณใหม่ได้')
        } catch (error) {
            console.error('Unable to load latest grade calculation', error)
            message.error('ดึงข้อมูลการคำนวณล่าสุดไม่สำเร็จ')
        } finally {
            setLoadingLatestCalculation(false)
        }
    }

    const calculate = async () => {
        if (selectedCourses.length === 0) {
            message.warning('กรุณาเลือกอย่างน้อย 1 รายวิชา')
            return
        }

        let values: GradeCalculationFormValues
        try {
            values = await gradeForm.validateFields(
                selectedCourses.map(({ id }) => ['grades', id]),
            )
        } catch {
            return
        }

        const result = calculateGradePrediction(
            selectedCourses,
            values.grades ?? {},
            currentGpax,
            overview?.cumulative_credits ?? 0,
        )

        if (!result) {
            message.warning('รายวิชาที่เลือกไม่มีหน่วยกิตสำหรับคำนวณ')
            return
        }

        setCalculationResult(result)
        gradeForm.resetFields()
        setCalculationSaved(false)

        if (currentRole !== 'student' || !predictionTerm) {
            setResultOpen(true)
            return
        }

        try {
            setSavingCalculation(true)
            const request = buildGradeCalculationRequest(
                result,
                predictionTerm,
            )
            await createGradeCalculation(request)
            setCalculationSaved(true)
        } catch (error) {
            console.error('Unable to save grade calculation', error)
            message.error('คำนวณสำเร็จ แต่บันทึกประวัติไม่สำเร็จ')
        } finally {
            setSavingCalculation(false)
            setResultOpen(true)
        }
    }

    return {
        isStudent,
        studentOptions,
        selectedStudentId,
        selectedStudent,
        overview,
        predictionCourses,
        selectedCourses,
        selectedCourseIds,
        otherCourseIds,
        predictionTerm,
        predictedTermLabel,
        currentGpax,
        hasMissingSections: (data?.missingSections.length ?? 0) > 0,
        loadingStudents,
        loadingOverview,
        loadingLatestCalculation,
        savingCalculation,
        gradeForm,
        calculationResult,
        calculationSaved,
        resultOpen,
        canLoadLatest:
            Boolean(selectedStudentId) && !loadingOverview && predictionCourses.length > 0,
        selectStudent,
        resetPrediction,
        toggleCourse,
        changeOtherCourses,
        loadLatestCalculation,
        calculate,
        clearCalculation,
        closeResult: () => setResultOpen(false),
    }
}
