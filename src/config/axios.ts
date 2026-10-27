import axios from 'axios'
import { authProvider, clearStoredAuth, portalLoginUrl } from './auth'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token')

    if (config.data instanceof FormData) {
        delete config.headers['Content-Type']
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    } else {
        delete config.headers.Authorization
    }

    return config
})

// A 401 on these does not mean the session is over.
const authEndpoints = ['/auth/portal-login', '/auth/logout']

let redirectingToLogin = false

// A 401 for a request that carried a token: the session ended (logged out,
// expired, or withdrawn in the portal). Start over at the login page.
api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (
            axios.isAxiosError(error) &&
            error.response?.status === 401 &&
            error.config?.headers?.Authorization &&
            !authEndpoints.some((path) => error.config?.url?.endsWith(path))
        ) {
            clearStoredAuth()

            if (!redirectingToLogin) {
                redirectingToLogin = true
                window.location.assign(
                    authProvider === 'portal'
                        ? portalLoginUrl
                        : import.meta.env.BASE_URL,
                )
            }
        }

        return Promise.reject(error)
    },
)

export default api
