import { message } from 'antd'
import { useEffect, useState } from 'react'
import { getStudentGraphs } from '../services/studentJsonDataService'
import type { CourseGroupDataset } from '../types/StudentCourseGroupPerformance'

export function useStudentCourseGroupPerformance(studentCode: string) {
    const [datasets, setDatasets] = useState<CourseGroupDataset[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadDatasets = async () => {
            try {
                setLoading(true)
                const data = await getStudentGraphs(studentCode)
                setDatasets(
                    Object.entries(data.by_group)
                        .filter(([, records]) => records.length > 0)
                        .map(([group, records]) => ({
                            id: group,
                            rows: records.map((record, index) => ({
                                ...record,
                                key: `${group}-${index}`,
                            })),
                        })),
                )
            } catch (error) {
                console.error(error)
                message.error(
                    'โหลดผลการเรียนแยกตามหมวดวิชาไม่สำเร็จ',
                )
                setDatasets([])
            } finally {
                setLoading(false)
            }
        }

        loadDatasets()
    }, [studentCode])

    return { datasets, loading }
}
