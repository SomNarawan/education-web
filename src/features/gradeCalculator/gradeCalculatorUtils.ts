import type {
    CreateGradeCalculationRequest,
    GradeCalculationCourse,
} from '../../types/GradeCalculation'
import type {
    StudentAcademicOverview,
    StudentAcademicTerm,
    StudentNextTermCourse,
    StudentUnattemptedCoursesData,
} from '../../types/StudentAcademicOverview'
import type { StudentGraphData } from '../../types/StudentJsonData'
import type {
    CourseSource,
    GradeCalculationResult,
    PredictionCourse,
    RestoredGradePrediction,
} from './gradeCalculator.types'
import { gradeOptions } from './gradeOptions'

function findCourseGroupPerformance(
    course: StudentNextTermCourse,
    performanceByGroup: StudentGraphData['by_group'],
): Pick<PredictionCourse, 'courseGroup' | 'courseGroupGpa'> {
    const labels = [
        course.course_group,
        course.course_sub_category,
        course.course_category,
    ].filter((label): label is string => Boolean(label?.trim()))
    const datasets = Object.values(performanceByGroup)
    const categoryDataset = course.course_category
        ? datasets.find(
              (records) => records[0]?.course_group === course.course_category,
          )
        : undefined

    // Prefer the course's main category when different categories share a label.
    for (const records of [categoryDataset ?? [], datasets.flat()]) {
        for (const label of labels) {
            const record = records.find((item) => item.course_group === label)

            if (record) {
                return {
                    courseGroup: record.course_group,
                    courseGroupGpa: record.gpa,
                }
            }
        }
    }

    return { courseGroup: labels[0] ?? null, courseGroupGpa: null }
}

function toPredictionCourse(
    course: StudentNextTermCourse,
    index: number,
    source: CourseSource,
    reason: string,
    performanceByGroup: StudentGraphData['by_group'],
): PredictionCourse {
    return {
        id: `${source}-${course.course_code ?? 'course'}-${index}`,
        code: course.course_code ?? '-',
        name: course.course_name_th ?? '-',
        credits: course.credit ?? 0,
        source,
        reason,
        ...findCourseGroupPerformance(course, performanceByGroup),
    }
}

function getCourseCategory(course: StudentNextTermCourse): string | null {
    return (
        course.course_group ?? course.course_sub_category ?? course.course_category
    )
}

export function buildPredictionCourses(
    overview: StudentAcademicOverview,
    unattempted: StudentUnattemptedCoursesData,
    performanceByGroup: StudentGraphData['by_group'],
): PredictionCourse[] {
    return [
        ...overview.pending_courses.map((course, index) =>
            toPredictionCourse(
                course,
                index,
                'backlog',
                course.previous_grade
                    ? `ผลการเรียนเดิม ${course.previous_grade}`
                    : 'ยังไม่มีผลการเรียน',
                performanceByGroup,
            ),
        ),
        ...overview.next_term.courses.map((course, index) =>
            toPredictionCourse(
                course,
                index,
                'next-semester',
                getCourseCategory(course) ?? 'รายวิชาตามแผนการเรียน',
                performanceByGroup,
            ),
        ),
        ...unattempted.courses.map((course, index) =>
            toPredictionCourse(
                course,
                index,
                'other',
                getCourseCategory(course) ?? 'รายวิชาในแผนการเรียน',
                performanceByGroup,
            ),
        ),
    ]
}

export function getDefaultCourseIds(courses: PredictionCourse[]): string[] {
    return courses
        .filter((course) => course.source !== 'other')
        .map(({ id }) => id)
}

export function getSelectedCourses(
    courses: PredictionCourse[],
    selectedCourseIds: string[],
): PredictionCourse[] {
    const coursesById = new Map(courses.map((course) => [course.id, course]))

    return selectedCourseIds
        .map((id) => coursesById.get(id))
        .filter((course): course is PredictionCourse => course !== undefined)
}

export function updateOtherCourseSelection(
    currentIds: string[],
    nextOtherIds: string[],
    availableOtherIds: ReadonlySet<string>,
): string[] {
    const nextSelection = new Set(nextOtherIds)
    const retainedIds = currentIds.filter(
        (id) => !availableOtherIds.has(id) || nextSelection.has(id),
    )
    const addedIds = [...nextSelection].filter(
        (id) => availableOtherIds.has(id) && !currentIds.includes(id),
    )

    return [...retainedIds, ...addedIds]
}

function normalizeCourseCode(code: string): string {
    return code.trim().toUpperCase()
}

export function restoreGradePrediction(
    savedCourses: GradeCalculationCourse[],
    currentCourses: PredictionCourse[],
): RestoredGradePrediction {
    const coursesBySourceAndCode = new Map(
        currentCourses.map((course) => [
            `${course.source}:${normalizeCourseCode(course.code)}`,
            course,
        ]),
    )
    const coursesByCode = new Map(
        currentCourses.map((course) => [normalizeCourseCode(course.code), course]),
    )
    const courseIds: string[] = []
    const grades: Record<string, string> = {}
    let unavailableCourseCount = 0

    for (const savedCourse of savedCourses) {
        const code = normalizeCourseCode(savedCourse.code)
        const course =
            coursesBySourceAndCode.get(`${savedCourse.source}:${code}`) ??
            coursesByCode.get(code)

        if (!course || courseIds.includes(course.id)) {
            unavailableCourseCount += 1
            continue
        }

        courseIds.push(course.id)
        grades[course.id] = savedCourse.grade
    }

    return { courseIds, grades, unavailableCourseCount }
}

export function calculateGradePrediction(
    selectedCourses: PredictionCourse[],
    grades: Record<string, string>,
    currentGpax: number,
    currentCredits: number,
): GradeCalculationResult | null {
    const courses = selectedCourses.map((course) => {
        const grade = grades[course.id]
        const points =
            gradeOptions.find((option) => option.value === grade)?.points ?? 0

        return { ...course, grade, gradePoints: points * course.credits }
    })
    const termCredits = courses.reduce((total, course) => total + course.credits, 0)

    if (termCredits <= 0) return null

    const termQualityPoints = courses.reduce(
        (total, course) => total + course.gradePoints,
        0,
    )
    const cumulativeCredits = currentCredits + termCredits

    return {
        termGpa: termQualityPoints / termCredits,
        cumulativeCredits,
        cumulativeGpa:
            cumulativeCredits > 0
                ? (currentGpax * currentCredits + termQualityPoints) / cumulativeCredits
                : 0,
        courses,
    }
}

export function buildGradeCalculationRequest(
    result: GradeCalculationResult,
    term: StudentAcademicTerm,
): CreateGradeCalculationRequest {
    return {
        study_year: term.year,
        semester: term.semester,
        semester_order: term.semester_order,
        courses: result.courses.map((course) => ({
            code: course.code,
            name: course.name,
            credits: course.credits,
            source: course.source,
            course_group: course.courseGroup,
            course_group_gpa: course.courseGroupGpa,
            grade: course.grade,
        })),
    }
}

export function formatTerm(year: number, semester: string): string {
    return `ชั้นปี ${year} ${semester}`
}
