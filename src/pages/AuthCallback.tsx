import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spin } from 'antd'

export default function AuthCallback() {
    const navigate = useNavigate()
    const { search } = useLocation()
    const { loginWithToken } = useAuth()

    useEffect(() => {
        const params = new URLSearchParams(search)
        const token = params.get('token')

        if (!token) {
            navigate('/', { replace: true })
            return
        }

        ;(async () => {
            await loginWithToken(token)
            navigate('/', { replace: true })
        })()
    }, [search, loginWithToken, navigate])

    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spin size="large" />
        </div>
    )
}
