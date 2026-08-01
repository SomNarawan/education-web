import React from 'react'
import {
    DatabaseOutlined,
    SyncOutlined,
    TeamOutlined,
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
    icon: React.ReactNode
    label: string
    allowedRoles: AppRole[]
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
            key: '/sync',
            icon: <SyncOutlined />,
            label: 'ซิงค์ข้อมูล',
            allowedRoles: ['admin'],
        },
    ]

    const items: MenuProps['items'] = menuItems
        .filter((item) => {
            if (!currentRole) return false
            return item.allowedRoles.includes(currentRole)
        })
        .map(({ key, icon, label }) => ({ key, icon, label }))

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
                onClick={({ key }) => navigate(key)}
                items={items}
            />
        </>
    )
}
