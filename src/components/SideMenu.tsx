import {
    DashboardOutlined,
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
                {!collapsed && <span>DSS Education</span>}
            </div>

            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[location.pathname]}
                onClick={({ key }) => navigate(key)}
                items={[
                    {
                        key: '/dashboard',
                        icon: <DashboardOutlined />,
                        label: 'Dashboard',
                    },
                    {
                        key: '/students',
                        icon: <TeamOutlined />,
                        label: 'ฐานข้อมูลนิสิต',
                    },
                ]}
            />
        </>
    )
}