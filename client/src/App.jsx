import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Auth from './pages/auth/auth'
import Chat from './pages/chat/chat'
import Profile from './pages/profile/profile'
import { useAppStore } from './store'
import { apiClient } from './lib/api-client'
import { GET_USER_INFO } from './utils/constants'
import "./App.css"
import ForgotPassword from './pages/auth/forgotpassword'
import VerifyOtp from './pages/auth/VerifyOtp'
import ResetPassword from './pages/auth/Reset'
import CallHandler from './components/CallHandler/CallHandler'


const PrivateRoute = ({ children }) => {
  const { userInfo } = useAppStore()
  const isAuthenticated = !!userInfo;
  return isAuthenticated ? children : <Navigate to='/auth' />
}

const AuthRoute = ({ children }) => {
  const { userInfo } = useAppStore()
  const isAuthenticated = !!userInfo;
  return isAuthenticated ? <Navigate to='/chat' /> : children
}

const App = () => {
  const { userInfo, setUserInfo } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const getUserData = async () => {
      try {
        const response = await apiClient.get(GET_USER_INFO, { withCredentials: true })
        if (response.status === 200 && response.data.id) {
          setUserInfo(response.data)
        } else {
          setUserInfo(undefined)
        }
      } catch (error) {
        setUserInfo(undefined)
        console.error(error);
      } finally {
        setLoading(false)
      }
    }
    
    if (!userInfo) {
      getUserData()
    } else {
      setLoading(false)
    }
  }, [userInfo, setUserInfo])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (loading) {
     return <div id="preloader"><div className="loader"></div></div>;
  }

  return (
    <BrowserRouter>
     {!isOnline && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-xl font-bold mt-4 text-gray-800">No Internet Connection</h2>
              <p className="mt-2 text-gray-600">
                Please check your network connection and try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
      {userInfo && <CallHandler />}
  
      <Routes>
        <Route path='/auth' element={<AuthRoute><Auth /></AuthRoute>} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/verify-otp' element={<VerifyOtp />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/chat' element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path='/profile' element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path='*' element={<Navigate to='/auth' />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App