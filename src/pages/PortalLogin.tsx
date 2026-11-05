import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { Button, Result, Spin } from 'antd'
import { useAuth } from '../hooks/useAuth'
import { portalLoginUrl } from '../config/auth'
import { portalLogin } from '../services/authService'
import type { ApiErrorResponse } from '../types/ApiResponse'
import type { PortalLoginRole } from '../types/Auth'

interface PortalTokens {
    exchangeToken: string
    intranetToken: string
}

interface PortalLoginError {
    status: number | null
    message: string
}

const tokenParams = ['exchangeToken', 'intranetToken'] as const

function parseRole(value: string | undefined): PortalLoginRole | null {
    return value === 'admin' || value === 'teacher' ? value : null
}

function readPortalTokens(): PortalTokens | null {
    const params = new URLSearchParams(window.location.search)
    const exchangeToken = params.get('exchangeToken')?.trim()
    const intranetToken = params.get('intranetToken')?.trim()

    return exchangeToken && intranetToken
        ? { exchangeToken, intranetToken }
        : null
}

function toLoginError(err: unknown): PortalLoginError {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
        if (err.response) {
            return {
                status: err.response.status,
                message:
                    err.response.data?.message ?? 'เข้าสู่ระบบไม่สำเร็จ',
            }
        }

        return { status: null, message: 'ไม่สามารถเชื่อมต่อกับระบบได้' }
    }

    return { status: null, message: 'เข้าสู่ระบบไม่สำเร็จ' }
}

// ENG Main sends staff here as /auth/portal/{admin|teacher}?exchangeToken=…&intranetToken=…
export default function PortalLogin() {
    const navigate = useNavigate()
    const { role: roleParam } = useParams()
    const { loginWithToken } = useAuth()
    const role = parseRole(roleParam)
    // Read once: the effect below removes the tokens from the URL.
    const [tokens] = useState(readPortalTokens)
    const [loginError, setLoginError] = useState<PortalLoginError | null>(
        null,
    )
    // exchangeToken works only once, and StrictMode runs effects twice in dev.
    const startedRef = useRef(false)

    useEffect(() => {
        const url = new URL(window.location.href)
        tokenParams.forEach((param) => url.searchParams.delete(param))
        window.history.replaceState(window.history.state, '', url)

        if (!role || !tokens || startedRef.current) return

        startedRef.current = true

        portalLogin(tokens.exchangeToken, tokens.intranetToken, role)
            .then(async ({ token }) => {
                await loginWithToken(token)
                // RoleRedirect waits for /me, then opens the home page of
                // current_role, which is the role clicked in ENG Main.
                navigate('/', { replace: true })
            })
            .catch((err: unknown) => {
                const error = toLoginError(err)

                // The request carried the tokens: log the outcome only.
                console.error('Portal login failed', error.status)
                setLoginError(error)
            })
    }, [role, tokens, loginWithToken, navigate])

    const error: PortalLoginError | null = !role
        ? { status: 404, message: 'ลิงก์เข้าสู่ระบบไม่ถูกต้อง' }
        : !tokens
          ? { status: null, message: 'ไม่พบข้อมูลการเข้าสู่ระบบจาก Portal' }
          : loginError

    if (!error) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <Spin size="large" />
            </div>
        )
    }

    // No automatic redirect: if the portal sends the user straight back, it
    // would loop.
    return (
        <Result
            status={error.status === 403 ? '403' : 'error'}
            title="เข้าสู่ระบบไม่สำเร็จ"
            subTitle={error.message}
            extra={
                <Button
                    type="primary"
                    onClick={() => window.location.assign(portalLoginUrl)}
                >
                    กลับไปที่ Portal
                </Button>
            }
        />
    )
}
