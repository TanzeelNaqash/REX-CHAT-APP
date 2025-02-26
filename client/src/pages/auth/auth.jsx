import { useState } from 'react';
import Background from '@/assets/login1.avif'
import victory from '@/assets/victory.svg'
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {apiClient} from '@/lib/api-client'
import { LOGIN_ROUTE, SIGNUP_ROUTE } from '@/utils/constants';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';

const Auth = () => {

    const navigate = useNavigate();
    const {setUserInfo} = useAppStore()
    const [email, setemail] = useState('')
    const [password, setpassword] = useState('')
    const [confirmPassword, setconfirmPassword] = useState('')

    const  validateLogin = () =>{
        if(!email.length){
            toast.error("Email is Required!")
            return false;
        }
        if(!password.length){
            toast.error("Password is required!")
            return false
        }
        return true
    }
    const handleLogin = async () => { if(validateLogin()){
        const  response = await apiClient.post(LOGIN_ROUTE, {email, password}, {withCredentials:true});
        if(response.data.user.id){
            setUserInfo(response.data.user)
            if(response.data.user.profileSetup) navigate('/chat')
                else navigate('/profile')
        }
        console.log({response});
        
    }}


    const validateSignup = () =>{
        if(!email.length){
            toast.error("Email is Required!")
            return false;
        }
        if(!password.length){
            toast.error("Password is required!")
            return false
        }
        if(password !== confirmPassword){
            toast.error("Password and confirm passworn aren't same!")
            return false
        }
        return true
    }

    const handleSignup = async () => { 
        if(validateSignup()){
            const  response = await apiClient.post(SIGNUP_ROUTE, {email, password}, {withCredentials:true})
            if(response.status===201){
                setUserInfo(response.data.user)
                navigate("/profile")
            }
            console.log({response});
            
        }
    }

   
    return (
        <div className="h-[100vw] flex items-center justify-center">
            <div className="h-[80vh] bg-white border-2 border-white text-opacity-90 shadow-2xl w-[80vw] md:w-[90vw] lg:w-[70vw] xl:w-[60vw] rounded-3xl grid xl:grid-cols-2">
                <div className="flex flex-col gap-10 items-center justify-center">
                    <div className="flex items-center justify-center flex-col">
                        <div className="flex items-center justify-center">
                            <h1 className="text-5xl font-bold md:text-6xl">welcome</h1>
                            <img src={victory} alt="victory emoji" className='h-[100px]' />
                        </div>
                        <p className='font-medium text-center'>Hi welcome to Rex!</p>
                        <p className='font-medium text-center'>fill the details to get started with the best chat-app!</p>
                    </div>
                    <div className="flex items-center justify-center w-full">
                        <Tabs className='w-3/4' defaultValue='login'>
                            <TabsList className='bg-transparent rounded-none w-full'>
                                <TabsTrigger value="login" className='data-[state=active]:bg-transparent text-black text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-purple-500 p-3 transition-all duration-300'>login</TabsTrigger>
                                <TabsTrigger value='signup' className='data-[state=active]:bg-transparent text-black text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-purple-500 p-3 transition-all duration-300 '>signup</TabsTrigger>
                            </TabsList>
                            <TabsContent value='login' className='flex flex-col gap-5 mt-10' >
                                <Input placeholder='Email' className='rounded-full p6' type='email' value={email} onChange={(e) => setemail(e.target.value)} />
                                <Input placeholder='Password' className='rounded-full p6' type='password' value={password} onChange={(e) => setpassword(e.target.value)} />
                                <Button className='rounded-full p-6 bg-purple-500 text-white hover:bg-purple-600' onClick={handleLogin}>Login</Button>
                            </TabsContent>
                            <TabsContent value='signup' className='flex flex-col gap-5' >
                                <Input placeholder='Email' className='rounded-full p6' type='email' value={email} onChange={(e) => setemail(e.target.value)} />
                                <Input placeholder='Password' className='rounded-full p6' type='password' value={password} onChange={(e) => setpassword(e.target.value)} />
                                <Input placeholder='Confirm password' className='rounded-full p6' type='password' value={confirmPassword} onChange={(e) => setconfirmPassword(e.target.value)} />
                                <Button className='rounded-full p-6 bg-purple-500 text-white hover:bg-purple-600' onClick={handleSignup}>Signup</Button>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
                <div className="hidden xl:flex justify-center items-center">
                    <img src={Background} alt="" />
                </div>
            </div>
        </div>
    )
}

export default Auth;