import { useState } from 'react';
import Background from '@/assets/login1.avif'

import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {apiClient} from '@/lib/api-client'
import { LOGIN_ROUTE, SIGNUP_ROUTE } from '@/utils/constants';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { Eye, EyeOff } from 'lucide-react';
import { FaSpinner } from 'react-icons/fa';

const Auth = () => {

    const navigate = useNavigate();
    const {setUserInfo} = useAppStore()
    const [email, setemail] = useState('')
    const [password, setpassword] = useState('')
    const [confirmPassword, setconfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);
    

   

    const validateLogin = () => {
        const emailRegex = /^(?!.*(\.\.|--|__))[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const toastStyle = { background: "#fff", color: "#000", boxShadow: "0px 10px 30px rgba(0,0,0,0.3)" };
      
        if (!email.trim()) {
          toast.error("Email is required!", { style: toastStyle });
          return false;
        }
      
        if (!emailRegex.test(email)) {
          toast.error("Invalid email format! example: email@example.com", { style: toastStyle });
          return false;
        }
      
        if (!password.trim()) {
          toast.error("Password is required!", { style: toastStyle });
          return false;
        }
      
        return true;
      };
      
      const handleLogin = async () => {
        setIsLoading(true);
        if (validateLogin()) {
          try {
            const response = await apiClient.post(LOGIN_ROUTE, { email, password }, { withCredentials: true });
      
            if (response.data.user.id) {
              setUserInfo(response.data.user);
              if (response.data.user.profileSetup) navigate('/chat');
              else navigate('/profile');
            }
          } catch (error) {
            toast.error("Incorrect email or password!", {
              style: { background: "#fff", color: "#000", boxShadow: "0px 10px 30px rgba(0,0,0,0.3)" }
            });
            console.log(error);
            
          } finally{
            setIsLoading(false);
          }
        } else{
            setIsLoading(false)
        }
      };
      


    const validateSignup = () => {
        const emailRegex = /^(?!.*(\.\.|--|__))[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        const passwordRegex = /^(?!.*['"=<>`])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

        const toastStyle = { background: "#fff", color: "#000", boxShadow: "0px 10px 30px rgba(0,0,0,0.3)" };
      
        if (!email.length) {
            toast.error("Email is required!", { style: toastStyle });
            return false;
        }
    
        if (!emailRegex.test(email)) {
            toast.error("Invalid email format! Example: email@example.com ", { style: toastStyle });
            return false;
        }
    
        if (!password.length) {
            toast.error("Password is required!", { style: toastStyle });
            return false;
        }
    
        if (password.length < 12) {
            toast.error("Password must be at least 12 characters long!", { style: toastStyle });
            return false;
        }
    
        if (!passwordRegex.test(password)) {
            toast.error("Password must include 1 uppercase, 1 number, 1 special character, and no quotes or script symbols!", { style: toastStyle });
            return false;
        }
    
        if (password !== confirmPassword) {
            toast.error("Passwords do not match!", { style: toastStyle });
            return false;
        }
    
        return true;
    };
      

    const handleSignup = async () => { 
        setIsLoading(true);
        if (validateSignup()) {
            try {
                const response = await apiClient.post(SIGNUP_ROUTE, { email, password }, { withCredentials: true });
    
                if (response.status === 201) {
                    setUserInfo(response.data.user);
                    navigate("/profile");
                }
            } catch (error) {
                if (error.response && error.response.status === 409) {
                    toast.error("Email is already in use!", { 
                        style: { background: "#fff", color: "#000", boxShadow: "0px 10px 30px rgba(0,0,0,0.3)" } 
                    });
                } else {
                    toast.error("Something went wrong. Try again!", { 
                        style: { background: "#fff", color: "#000", boxShadow: "0px 10px 30px rgba(0,0,0,0.3)" } 
                    });
                }
            } finally{
                setIsLoading(false);
            }
        } else{
            setIsLoading(false)
        }
    };
    
   
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-6 bg-gray-50">
        <div className="w-full max-w-7xl bg-white border border-white shadow-[0px_10px_30px_rgba(0,0,0,0.3)] rounded-3xl grid grid-cols-1 xl:grid-cols-2 overflow-hidden">
          
          {/* Left Side */}
          <div className="flex flex-col gap-10 items-center justify-center px-6 py-10 text-center">
            <div className="flex flex-col items-center justify-center space-y-2">
  <div className="relative flex items-center justify-center">
    <h1 className="text-purple-600 text-4xl md:text-5xl lg:text-6xl font-bold">
      Welcome
    </h1>
    {/* <div className="absolute right-[-10rem] md:right-[-4rem] lg:right-[-5rem]  w-16 h-16 md:w-20 md:h-20">
      <img
        src={rex}
        alt="Rex"
        className="w-full h-full object-contain"
      />
    </div> */}
  </div>
  <p className="text-base sm:text-lg font-medium mt-3">
    Hi, welcome to <span className="text-purple-500 font-semibold">Rex</span>!
  </p>
  <p className="text-base sm:text-lg font-medium">
    Fill in the details to get started with the best chat app!
  </p>
</div>

                    <div className="flex items-center justify-center w-full ">
                        <Tabs className='w-3/4 ' defaultValue='login'>
                            <TabsList className='bg-transparent rounded-none w-full '>
                                <TabsTrigger value="login" className='data-[state=active]:bg-transparent capitalize text-black text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-purple-500 p-3 transition-all duration-300'>login</TabsTrigger>
                                <TabsTrigger value='signup' className='data-[state=active]:bg-transparent capitalize text-black text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-purple-500 p-3 transition-all duration-300 '>signup</TabsTrigger>
                            </TabsList>
                            <TabsContent value='login' className='flex flex-col gap-5 mt-10' >
                                <Input placeholder='Email' className='rounded-full p6' type='email' value={email} onChange={(e) => setemail(e.target.value)} />
                                <div className='relative'>
                                <Input placeholder='Password' className='rounded-full p6' type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setpassword(e.target.value)} /> 
                                <button type='button' className='absolute right-3 top-3' onClick={togglePasswordVisibility}>
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />} </button>
                                </div>
                                <p 
        className="text-sm text-purple-500 hover:underline cursor-pointer self-end" 
        onClick={() => navigate('/forgot-password')}
    >
        Forgot Password?
    </p>
    <Button
            className="rounded-full p-6 bg-purple-500 text-white hover:bg-purple-600"
            onClick={handleLogin}
            disabled={isLoading} 
        >
            {isLoading ? (
                <div className="flex items-center justify-center">
                    <FaSpinner className="animate-spin text-white" size={24} />
                </div>
            ) : (
                "Login"
            )}
        </Button>
                            </TabsContent>
                            <TabsContent value='signup' className='flex flex-col gap-5' >
                                <Input placeholder='Email' className='rounded-full p6' type='email' value={email} onChange={(e) => setemail(e.target.value)} />
                                <div className='relative'>
                                <Input placeholder='Password' className='rounded-full p6' type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setpassword(e.target.value)} /> 
                                <button type='button' className='absolute right-3 top-3' onClick={togglePasswordVisibility}>
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />} </button>
                                </div>
                                <div className='relative'>
                                <Input placeholder='Confirm password' className='rounded-full p6' type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setconfirmPassword(e.target.value)} /> 
                                <button type='button' className='absolute right-3 top-3' onClick={toggleConfirmPasswordVisibility}>
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />} </button>
                                </div>
                                <Button
            className="rounded-full p-6 bg-purple-500 text-white hover:bg-purple-600"
            onClick={handleSignup}
            disabled={isLoading} 
        >
            {isLoading ? (
                <div className="flex items-center justify-center">
                    <FaSpinner className="animate-spin text-white" size={24} />
                </div>
            ) : (
                "Signup"
            )}
        </Button>
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