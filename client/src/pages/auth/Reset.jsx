import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { RESET_PASSWORD_ROUTE } from "@/utils/constants";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from 'lucide-react';
const ResetPassword = () => {
  const { state } = useLocation();
  const email = state?.email || ""; // Get email from navigation state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);
  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      toast.error("All fields are required!");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long!");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post(RESET_PASSWORD_ROUTE, { email, newPassword: password });


      toast.success(response.data.message || "Password reset successful!");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center px-4">
      <div className="bg-white border-2 border-white shadow-[0px_10px_30px_rgba(0,0,0,0.3)] w-[90vw] md:w-[60vw] lg:w-[40vw] rounded-3xl p-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
        <p className="text-gray-600 mb-6">Enter your new password.</p>
        <div className="relative">
        <Input
         type={showPassword ? 'text' : 'password'} 
          placeholder="New Password"
          className="rounded-full p-4 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type='button' className='absolute right-3 top-3' onClick={togglePasswordVisibility}>
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />} </button>
                                </div>
         <div className="relative">                       
        <Input
        type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Confirm Password"
          className="rounded-full p-4 mb-4"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        /> 
         <button type='button' className='absolute right-3 top-3' onClick={toggleConfirmPasswordVisibility}>
         {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />} </button>
        </div>
        <Button
          className="rounded-full p-4 w-full bg-purple-500 text-white hover:bg-purple-600"
          onClick={handleResetPassword}
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
        <p className="mt-4 text-sm text-purple-500 hover:underline cursor-pointer" onClick={() => navigate("/forgot-password")}>
          Back 
        </p>
      </div>
      
    </div>
  );
};

export default ResetPassword;
