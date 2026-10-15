import type {
    CurriculumCategory,
    CurriculumCourseRow,
} from '../../../types/CurriculumDetail'

function normalizeCategoryValue(value: string | null | undefined) {
    return value?.trim().toLowerCase() ?? ''
}

export function getCurriculumCategoryRows(
    category: CurriculumCategory,
    rows: CurriculumCourseRow[],
): CurriculumCourseRow[] {
    const names = new Set(
        [
            category.name_th,
            category.name_short_th,
            category.name_en,
            category.name_short_en,
        ]
            .map(normalizeCategoryValue)
            .filter(Boolean),
    )

    return rows.filter((row) =>
        [
            row.course_category?.trim() || row.curriculum_division,
            row.course_sub_category,
            row.course_group,
            row.course_requirement,
        ].some((value) => names.has(normalizeCategoryValue(value))),
    )
}
