'use client'
import { CookiesProvider } from 'react-cookie'
import NotationForm from './NotationForm'

function NotationPage() {
    return (
        <CookiesProvider defaultSetOptions={{ path: '/' }}>
            <NotationForm />
        </CookiesProvider>
    )
}

export default NotationPage
