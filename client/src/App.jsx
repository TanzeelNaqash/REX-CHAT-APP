import  {  useEffect, useState } from 'react'
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
const PrivateRoute = ({ children }) => {
  const { userInfo } = useAppStore()
  const isAuthenticated = !!userInfo;
  return isAuthenticated ? children : <Navigate to='/auth' />
}
const AuthRoute = ({ children }) => {
  const { userInfo } = useAppStore()
  const isAuthenticated = !!userInfo;
  return isAuthenticated ?  <Navigate to='/chat' /> : children
}

const App = () => {
  const { userInfo, setUserInfo } = useAppStore()
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const getUserData = async () => {
      try {
        const response = await apiClient.get(GET_USER_INFO, { withCredentials: true })
        if (response.status === 200 && response.data.id) {
          setUserInfo(response.data)
        } else {
          setUserInfo(undefined)
        }
        console.log({ response });

      } catch (error) {
        setUserInfo(undefined)
        console.log(error);
        
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
  if (loading) {
    return <div>loading....</div>
  }
  return (
    <BrowserRouter>
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
