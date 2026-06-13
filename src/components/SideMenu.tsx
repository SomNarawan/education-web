import {
    DatabaseOutlined,
    TeamOutlined,
} from '@ant-design/icons'
import { Menu } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'

interface SideMenuProps {
    collapsed: boolean
}

export default function SideMenu({ collapsed }: SideMenuProps) {
    const navigate = useNavigate()
    const location = useLocation()

    return (
        <>
            <div className="sidebar-logo">
                <DatabaseOutlined />
                {!collapsed && <span>ฐานข้อมูลนิสิต</span>}
            </div>

            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[location.pathname]}
                onClick={({ key }) => navigate(key)}
                items={[
                    {
                        key: '/students/advisor',
                        icon: <TeamOutlined />,
                        label: 'รายชื่อนิสิตในที่ปรึกษา',
                    },
                    {
                        key: '/students/department',
                        icon: <TeamOutlined />,
                        label: 'รายชื่อนิสิตภาควิชา',
                    },
                    {
                        key: '/students/faculty',
                        icon: <TeamOutlined />,
                        label: 'รายชื่อนิสิตในคณะ',
                    },
                    {
                        key: '/students/advisor/graduated',
                        icon: <TeamOutlined />,
                        label: 'รายชื่อนิสิตที่ปรึกษาที่จบ',
                    },
                    {
                        key: '/students/department/graduated',
                        icon: <TeamOutlined />,
                        label: 'รายชื่อนิสิตภาควิชาที่จบ',
                    },
                ]}
            />
        </>
    )
}