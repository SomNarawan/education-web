import { useMemo, useState } from 'react'
import { Button, Empty, Modal, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Link } from 'react-router-dom'
import type { AdvisorHistory, AdvisorHistoryStudent, AdvisorSummary } from '../../types/AdvisorSummary'

const reasons = { F: 'สอบไม่ผ่าน', W: 'ถอนรายวิชา', N: 'ยังไม่เคยลงทะเบียน' }
type Reason = keyof typeof reasons
interface Member {
    student: AdvisorHistoryStudent
    year?: number
    reasons: Set<Reason>
}
interface Course {
    key: string
    code: string
    name: string
    members: Map<number, Member>
}

function collectCourses(summary: AdvisorSummary) {
    const years = new Map<number, number>()
    for (const cohort of summary.by_entry_year) {
        for (const student of cohort.students) years.set(student.id, cohort.entry_year)
    }
    const courses = new Map<string, Course>()
    let missingLists = 0
    for (const student of summary.off_plan_students) {
        if (!student.pending_courses) missingLists++
        for (const item of student.pending_courses ?? []) {
            const code = item.course_code?.trim() ?? ''
            const isGroup = !code || code === '-' || code.toUpperCase() === 'FREE' || /x/i.test(code)
            const name = item.course_name?.trim()
            const groupName = [name, item.course_group, item.course_sub_category, item.course_category]
                .map(label => label?.trim()).find(label => label && label !== '-')
                ?? (code.toUpperCase() === 'FREE' ? 'วิชาเลือกเสรี' : /x/i.test(code) ? `กลุ่มวิชา ${code}` : 'ไม่ระบุชื่อกลุ่มวิชา')
            const key = isGroup ? `group:${groupName}` : code
            const course = courses.get(key) ?? { key, code: isGroup ? '' : code, name: isGroup ? groupName : '', members: new Map<number, Member>() }
            if (!course.name && name && name !== '-') course.name = name
            const member = course.members.get(student.id) ?? { student, year: years.get(student.id), reasons: new Set<Reason>() }
            for (const grade of (item.grade_letter ?? '').toUpperCase().split(',')) {
                const value = grade.trim()
                if (value === 'F' || value === 'W' || value === 'N') member.reasons.add(value)
            }
            course.members.set(student.id, member)
            courses.set(key, course)
        }
    }
    return { courses: [...courses.values()].sort((a, b) => b.members.size - a.members.size || a.key.localeCompare(b.key, 'th')), missingLists }
}

function breakdown(members: Member[]) {
    if (!members.length) return '-'
    const counts = { F: 0, W: 0, N: 0 }
    let unknown = 0
    for (const member of members) {
        for (const reason of member.reasons) counts[reason]++
        if (!member.reasons.size) unknown++
    }
    const labels = Object.entries(counts).filter(([, count]) => count).map(([reason, count]) => `${reason} ${count}`)
    if (unknown) labels.push(`ไม่ระบุ ${unknown}`)
    return labels.join(' + ')
}

export default function CourseBacklog({ summary, history }: { summary: AdvisorSummary; history: AdvisorHistory | null }) {
    const [selected, setSelected] = useState<string | null>(null)
    const { courses, missingLists } = useMemo(() => collectCourses(summary), [summary])
    const latestYear = Math.max(0, ...(history?.academic_terms ?? []).map(term => term.academic_year),
        ...summary.off_plan_students.map(student => student.latest_grade_term?.academic_year ?? 0))
    const hasUnplaced = courses.some(course => [...course.members.values()].some(member => !member.year || member.year > latestYear))
    const cohortColumn = (title: string, contains: (year?: number) => boolean): ColumnsType<Course>[number] => ({
        title, key: title, align: 'center', render: (_, course) => breakdown([...course.members.values()].filter(member => contains(member.year))),
    })
    const columns: ColumnsType<Course> = [
        { title: 'รายวิชา / กลุ่มวิชา', key: 'course', width: '26%', render: (_, course) => course.code
            ? <><strong>{course.code}</strong><br />{course.name || 'ไม่ระบุชื่อวิชา'}</> : <strong>{course.name}</strong> },
        ...(latestYear > 0 ? Array.from({ length: 4 }, (_, offset) => {
            const year = latestYear - offset
            return cohortColumn(`ปี ${offset + 1} (รุ่น ${String(year + 543).slice(-2)})`, value => value === year)
        }) : []),
        ...(latestYear > 0 ? [cohortColumn('ปี 4+', value => !!value && value < latestYear - 3)] : []),
        ...(hasUnplaced ? [cohortColumn('ยังจัดรุ่นไม่ได้', value => !value || value > latestYear)] : []),
        { title: 'รวม F / W / N', key: 'reasons', width: '15%', align: 'center', render: (_, course) => breakdown([...course.members.values()]) },
        { title: 'รวม (คน)', key: 'people', align: 'right', width: 88, render: (_, course) =>
            <Button type="link" aria-label={`ดูรายชื่อนิสิตตกค้าง ${course.code || course.name}`} onClick={() => setSelected(course.key)}>{course.members.size} คน</Button> },
    ]
    const detail = courses.find(course => course.key === selected)
    return <>
        {latestYear > 0 && <p>ข้อมูลถึงปีการศึกษา {latestYear + 543} · 4+ คือรุ่น {latestYear + 539} และก่อนหน้า</p>}
        <Table<Course> className="advisor-backlog-table" rowKey="key" columns={columns} dataSource={courses}
            size="small" tableLayout="fixed" scroll={{ x: latestYear > 0 ? (hasUnplaced ? 1090 : 940) : 620 }}
            pagination={{ pageSize: 10, hideOnSinglePage: true, showSizeChanger: false }}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={summary.blocks.plan_status.available ? 'ไม่พบรายวิชาหรือกลุ่มวิชาที่ยังค้าง' : 'ยังไม่มีข้อมูลเพียงพอสำหรับตรวจวิชาค้าง'} /> }} />
        <p className="advisor-footnote">F = สอบไม่ผ่าน · W = ถอนรายวิชา · N = ยังไม่เคยลงทะเบียน · ไม่ระบุ = ข้อมูลยังแยก F, W หรือ N ไม่ได้<br />
            ในแต่ละวิชา นิสิตหนึ่งคนอาจมีทั้ง F และ W แต่ยอดรวมจะนับคนละครั้ง กดจำนวนคนเพื่อดูรายชื่อ</p>
        {missingLists > 0 && <p className="advisor-footnote">ยังไม่มีรายละเอียดวิชาค้างของนิสิต {missingLists} คน</p>}
        {!!summary.unit_review_students?.length && <details className="advisor-course-history">
            <summary>ยังประเมินไม่ได้ ({summary.unit_review_students.length} คน)</summary>
            <p className="advisor-footnote">ข้อมูลหน่วยหรือจำนวนที่ใช้เทียบแผนยังไม่เพียงพอ รายการเหล่านี้แยกไว้จากยอดวิชาค้าง</p>
            <ul>{summary.unit_review_students.map(student => <li key={student.id}>
                <Link to={`/students/advisor/detail/${student.id}`} state={{ from: '/advisor-dashboard' }}>{student.full_name_th || student.student_code}</Link>
                {' · '}{student.unassessed_courses?.map(course => course.course_name || course.course_code || 'ไม่ระบุชื่อวิชา').join(', ')}
            </li>)}</ul>
        </details>}
        <Modal open={!!detail} title={detail ? `นิสิตตกค้าง · ${[detail.code, detail.name].filter(Boolean).join(' ')}` : ''} onCancel={() => setSelected(null)} footer={null} width={720}>
            <Table<Member> rowKey={member => member.student.id} size="small" dataSource={detail ? [...detail.members.values()] : []}
                pagination={{ pageSize: 8, hideOnSinglePage: true }} columns={[
                    { title: 'นิสิต', render: (_, member) => <Link to={`/students/advisor/detail/${member.student.id}`} state={{ from: '/advisor-dashboard' }}>{member.student.full_name_th} ({member.student.student_code})</Link> },
                    { title: 'ปีที่เข้าศึกษา', render: (_, member) => member.year ? member.year + 543 : '-' },
                    { title: 'สถานะ', render: (_, member) => [...member.reasons].map(key => `${key} (${reasons[key]})`).join(' + ') || 'ยังระบุไม่ได้' },
                ]} />
        </Modal>
    </>
}
