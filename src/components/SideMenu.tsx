import React from 'react'
import {
    BankOutlined,
    CalculatorOutlined,
    DatabaseOutlined,
    FileExcelOutlined,
    FileTextOutlined,
    IdcardOutlined,
    LoginOutlined,
    SolutionOutlined,
    SyncOutlined,
    TeamOutlined,
    UserSwitchOutlined,
} from '@ant-design/icons'
import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { AppRole } from '../types/Auth'

interface SideMenuProps {
    collapsed: boolean
}

interface LocationState {
    from?: string
}

type AppMenuItem = {
    key: string
    icon?: React.ReactNode
    label: string
    allowedRoles: AppRole[]
    children?: AppMenuItem[]
}

export default function SideMenu({ collapsed }: SideMenuProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const { currentRole } = useAuth()

    const state = location.state as LocationState | null

    const selectedKey = location.pathname.includes('/detail/')
        ? state?.from ?? '/students/advisor'
        : location.pathname

    const menuItems: AppMenuItem[] = [
        {
            key: '/students/advisor',
            icon: <TeamOutlined />,
            label: 'รายชื่อนิสิตในที่ปรึกษา',
            allowedRoles: ['teacher'],
        },
        {
            key: '/students/department',
            icon: <TeamOutlined />,
            label: 'รายชื่อนิสิตภาควิชา',
            allowedRoles: ['teacher', 'admin'],
        },
        {
            key: '/students/faculty',
            icon: <TeamOutlined />,
            label: 'รายชื่อนิสิตในคณะ',
            allowedRoles: ['teacher', 'admin'],
        },
        {
            key: '/advisor-assignments',
            icon: <SolutionOutlined />,
            label: 'กำหนดอาจารย์ที่ปรึกษา',
            allowedRoles: ['admin'],
        },
        {
            key: '/grade-calculator',
            icon: <CalculatorOutlined />,
            label: 'คำนวณผลการเรียน',
            allowedRoles: ['teacher', 'admin'],
        },
        {
            key: '/student-imports',
            icon: <FileExcelOutlined />,
            label: 'นำเข้านิสิต',
            allowedRoles: ['admin'],
        },
        {
            key: '/sync',
            icon: <SyncOutlined />,
            label: 'ซิงค์ข้อมูล',
            allowedRoles: ['admin'],
        },
        {
            key: '/master-data',
            icon: <TeamOutlined />,
            label: 'จัดการข้อมูลพื้นฐาน',
            allowedRoles: ['admin'],
            children: [
                {
                    key: '/master-data/high-schools',
                    icon: <BankOutlined />,
                    label: 'โรงเรียนมัธยมปลาย',
                    allowedRoles: ['admin'],
                },
                {
                    key: '/master-data/titles',
                    icon: <IdcardOutlined />,
                    label: 'คำนำหน้าชื่อ',
                    allowedRoles: ['admin'],
                },
                {
                    key: '/master-data/student-statuses',
                    icon: <UserSwitchOutlined />,
                    label: 'สถานภาพนิสิต',
                    allowedRoles: ['admin'],
                },
                {
                    key: '/master-data/admission-channels',
                    icon: <LoginOutlined />,
                    label: 'ช่องทางการรับเข้า',
                    allowedRoles: ['admin'],
                },
                {
                    key: '/master-data/relationships',
                    icon: <TeamOutlined />,
                    label: 'ความสัมพันธ์ผู้ปกครอง',
                    allowedRoles: ['admin'],
                },
                {
                    key: '/master-data/note-types',
                    icon: <FileTextOutlined />,
                    label: 'ประเภท Note',
                    allowedRoles: ['admin'],
                },
            ],
        },
    ]

    const items: MenuProps['items'] = menuItems
        .filter((item) => {
            if (!currentRole) return false
            return item.allowedRoles.includes(currentRole)
        })
        .map(({ key, icon, label, children }) => ({
            key,
            icon,
            label,
            children: children
                ?.filter(
                    (item) =>
                        Boolean(currentRole) &&
                        item.allowedRoles.includes(currentRole as AppRole),
                )
                .map((item) => ({
                    key: item.key,
                    icon: item.icon,
                    label: item.label,
                })),
        }))

    return (
        <>
            <div className="sidebar-logo">
                <DatabaseOutlined />
                {!collapsed && <span>ฐานข้อมูลนิสิต</span>}
            </div>

            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[selectedKey]}
                defaultOpenKeys={
                    location.pathname.startsWith('/master-data')
                        ? ['/master-data']
                        : []
                }
                onClick={({ key }) => navigate(key)}
                items={items}
            />
        </>
    )
}
