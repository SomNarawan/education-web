import { useState } from 'react'
import { ArrowRightOutlined, DownOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Modal, Select, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Link } from 'react-router-dom'
import type { AdvisorHistoryStudent, AdvisorPendingCourse } from '../../types/AdvisorSummary'

const groupLabels: Record<string, string> = {
    on_plan: 'ตามแผน', off_plan: 'ไม่ตามแผน', retired: 'พ้นสภาพนิสิต', unknown: 'รอข้อมูล',
    studying: 'กำลังศึกษา', graduated: 'จบการศึกษา', other: 'สถานะอื่น',
    range_3_25_4_00: '3.25 – 4.00', range_2_00_3_24: '2.00 – 3.24',
    range_1_75_1_99: '1.75 – 1.99', range_0_00_1_74: '0.00 – 1.74', no_gpax: 'ไม่มีค่า GPAX',
}
const number = (value: number) => value.toLocaleString('th-TH')
const grade = (value: number | null | undefined) => value == null ? '—' : value.toFixed(2)
const group = (student: AdvisorHistoryStudent) => student.plan_status ?? student.range ?? student.status ?? 'unknown'

function PendingCourseTable({ courses, termLabel }: { courses: AdvisorPendingCourse[] | null; termLabel?: string }) {
    if (courses === null) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ยังไม่มีรายละเอียดรายวิชาเพียงพอสำหรับประเมินรายการค้างในภาคนี้" />
    return <div className="advisor-pending-detail">
        <p>รายการที่ยังค้างตามแผน ณ {termLabel ?? 'ภาคล่าสุดที่มีข้อมูลเกรด'}</p>
        <Table<AdvisorPendingCourse>
            rowKey={(course, index) => `${course.course_code}-${index}`}
            size="small"
            pagination={false}
            dataSource={courses}
            scroll={{ x: 700 }}
            columns={[
                { title: 'รหัสวิชา', dataIndex: 'course_code', width: 120, render: (value: string | null) => value && value !== '-' ? value : 'วิชาเลือก/เงื่อนไข' },
                { title: 'รายวิชา / เงื่อนไขที่ยังขาด', dataIndex: 'course_name' },
                { title: 'ภาคเรียนอ้างอิง', key: 'term', width: 160, render: (_, course) => <span>{course.study_period ?? '—'}{course.semester_year_be && <small className="advisor-reference-year">ปีการศึกษา {course.semester_year_be}</small>}</span> },
                { title: 'หน่วยกิต / ชั่วโมง', key: 'credit', align: 'right', width: 125, render: (_, course) => course.credit == null ? '—' : `${number(course.credit)}${course.enrollment_type === 'hour' ? ' ชม.' : ''}` },
                { title: 'ผลล่าสุด', key: 'grade', width: 100, render: (_, course) => {
                    const latest = course.grade_letter?.split(',').at(-1)?.trim()
                    return latest ? <Tag color="red">{latest}</Tag> : 'ยังไม่มีผล'
                } },
                { title: 'รายการค้าง', key: 'reason', width: 145, render: (_, course) => <Tag color={course.grade_letter ? 'red' : 'orange'}>{course.grade_letter ? 'ยังไม่ผ่าน' : course.course_code && course.course_code !== '-' ? 'ยังไม่พบผลการเรียน' : 'หน่วยกิตยังไม่ครบ'}</Tag> },
            ]}
        />
    </div>
}

interface AdvisorStudentModalProps {
    title: string
    students: AdvisorHistoryStudent[] | null
    onClose: () => void
    gradeContext?: 'current' | 'annual' | 'term'
    showPending?: boolean
    pendingTermLabel?: string
}

export default function AdvisorStudentModal({ title, students, onClose, gradeContext = 'current', showPending = false, pendingTermLabel }: AdvisorStudentModalProps) {
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const query = search.trim().toLocaleLowerCase('th-TH')
    const rows = (students ?? []).filter((student) => (filter === 'all' || group(student) === filter)
        && (!query || `${student.student_code} ${student.full_name_th}`.toLocaleLowerCase('th-TH').includes(query)))
    const groups = [...new Set((students ?? []).map(group))]
    const historicalPending = showPending && gradeContext === 'term'
    const unknownPending = rows.filter((student) => student.pending_count == null).length
    const allPendingUnknown = rows.length > 0 && unknownPending === rows.length
    const columns: ColumnsType<AdvisorHistoryStudent> = [
        { title: 'รหัสนิสิต', dataIndex: 'student_code', width: 145, render: (code: string, row) => <Link to={`/students/advisor/detail/${row.id}`} state={{ from: '/advisor-dashboard' }}>{code}</Link> },
        { title: 'ชื่อ–นามสกุล', dataIndex: 'full_name_th', width: 230, render: (name: string) => <strong className="advisor-student-name">{name || '—'}</strong> },
        { title: 'ชั้นปี', key: 'study_year', width: 85, align: 'center', render: (_, student) => {
            const year = historicalPending ? student.term_study_year : student.study_year
            return year == null ? '—' : `ปี ${year}`
        } },
        { title: historicalPending ? 'GPAX ณ ภาคที่เลือก' : 'GPAX', key: 'current_gpax', width: historicalPending ? 155 : 90, align: 'right', render: (_, student) => grade(historicalPending ? student.gpax : student.current_gpax), sorter: (a, b) => historicalPending ? (a.gpax ?? -1) - (b.gpax ?? -1) : (a.current_gpax ?? -1) - (b.current_gpax ?? -1) },
    ]
    if (gradeContext === 'annual') columns.push({ title: 'GPA ปีที่เลือก', dataIndex: 'gpa', width: 125, align: 'right', render: grade })
    if (gradeContext === 'term' && !historicalPending) columns.push({ title: 'GPAX ณ ภาคที่เลือก', dataIndex: 'gpax', width: 155, align: 'right', render: grade })
    if (showPending) {
        columns.push(
            { title: 'รายการค้าง', dataIndex: 'pending_count', width: 110, align: 'right', render: (count: number | null | undefined) => count == null ? <Tag>รอข้อมูล</Tag> : <Tag color="red">{number(count)} รายการ</Tag>, sorter: (a, b) => (a.pending_count ?? -1) - (b.pending_count ?? -1) },
            { title: 'หน่วยกิตค้าง', dataIndex: 'pending_credits', width: 115, align: 'right', render: (credit: number | null | undefined) => credit == null ? '—' : number(credit) },
        )
    } else {
        columns.push({ title: 'กลุ่ม', key: 'group', width: 155, render: (_, student) => <Tag>{groupLabels[group(student)] ?? group(student)}</Tag> })
    }
    columns.push({ title: '', key: 'detail', width: 160, render: (_, row) => <Link to={`/students/advisor/detail/${row.id}`} state={{ from: '/advisor-dashboard' }}>ดูรายละเอียด <ArrowRightOutlined /></Link> })

    return <Modal title={title} open={students !== null} onCancel={onClose} footer={null} width="min(1240px, calc(100vw - 32px))" destroyOnHidden className="advisor-student-modal">
        {showPending && <>
            <div className="advisor-report-summary">
                <div><span>{historicalPending ? 'นิสิตไม่ตามแผน ณ ภาคที่เลือก' : 'นิสิตที่ยังไม่ตามแผน'}</span><strong>{number(rows.length)} <small>คน</small></strong></div>
                <div><span>รายการที่ยังค้าง</span><strong>{allPendingUnknown ? '—' : number(rows.reduce((sum, row) => sum + (row.pending_count ?? 0), 0))} <small>รายการ</small></strong></div>
                <div><span>หน่วยกิตที่ยังค้าง</span><strong>{allPendingUnknown ? '—' : number(rows.reduce((sum, row) => sum + (row.pending_credits ?? 0), 0))} <small>หน่วยกิต</small></strong></div>
            </div>
            <p className="advisor-report-rule">{historicalPending ? `แสดงรายการที่ยังค้าง ณ ${pendingTermLabel ?? 'ภาคที่เลือก'} วิชาที่ผ่านแล้วภายในภาคนี้ไม่แสดง ส่วนผลที่ผ่านในภาคหลังจะไม่เปลี่ยนรายงานภาคเก่า` : 'แสดงเฉพาะนิสิตกำลังศึกษาที่ยังมีรายการค้างถึงภาคล่าสุดที่มีเกรด วิชาที่เคยตกและผ่านแล้วจะไม่แสดง'}</p>
            {unknownPending > 0 && <p className="advisor-footnote">นิสิต {number(unknownPending)} คนยังไม่มีรายละเอียดค้างเพียงพอ ยอดรายการและหน่วยกิตรวมเฉพาะผู้ที่มีรายละเอียดแล้ว</p>}
        </>}
        <div className="advisor-student-toolbar">
            <Input aria-label="ค้นหานิสิตในตาราง" placeholder="ค้นหารหัสนิสิต หรือชื่อ–นามสกุล" prefix={<SearchOutlined />} allowClear value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
            {!showPending && groups.length > 1 && <Select aria-label="กรองกลุ่มนิสิต" value={filter} onChange={(value) => { setFilter(value); setPage(1) }} options={[{ label: 'ทุกกลุ่ม', value: 'all' }, ...groups.map((value) => ({ value, label: groupLabels[value] ?? value }))]} />}
            <span>แสดง {number(rows.length)} / {number(students?.length ?? 0)} คน</span>
        </div>
        <Table<AdvisorHistoryStudent> className="advisor-student-table" rowKey="id" dataSource={rows} columns={columns} size="middle"
            locale={{ emptyText: search ? 'ไม่พบนิสิตที่ตรงกับคำค้นหา' : showPending ? 'ไม่มีนิสิตที่ยังเรียนไม่ตามแผน' : 'ไม่มีนิสิตในกลุ่มนี้' }}
            pagination={{ current: page, onChange: setPage, pageSize: 8, showSizeChanger: false }} scroll={{ x: showPending ? 1100 : 1000 }}
            expandable={showPending ? {
                expandedRowRender: (student) => <PendingCourseTable courses={student.pending_courses ?? null} termLabel={pendingTermLabel} />,
                rowExpandable: (student) => student.pending_count == null || student.pending_count > 0,
                expandIcon: ({ expanded, record, onExpand }) => <Button size="small" type="text" icon={expanded ? <UpOutlined /> : <DownOutlined />} aria-label={`${expanded ? 'ซ่อน' : 'ดู'}รายการค้างของ ${record.full_name_th}`} aria-expanded={expanded} onClick={(event) => onExpand(record, event)} />,
            } : undefined}
        />
        <p className="advisor-footnote">{showPending ? 'กดลูกศรหน้ารหัสนิสิตเพื่อดูรายการที่ยังค้าง • รายการวิชาเลือกที่ขาดหน่วยกิตอาจต้องเรียนมากกว่าหนึ่งวิชา' : 'ชั้นปีและ GPAX แสดงจากข้อมูลปัจจุบันของนิสิต'}{gradeContext === 'annual' ? ' • GPA ปีที่เลือกแสดงแยกจาก GPAX ปัจจุบัน' : gradeContext === 'term' ? historicalPending ? ' • ชั้นปีและ GPAX แสดง ณ ภาคที่เลือก' : ' • GPAX ณ ภาคที่เลือกใช้ผลถึงภาคนั้นเท่านั้น' : ''}</p>
    </Modal>
}
