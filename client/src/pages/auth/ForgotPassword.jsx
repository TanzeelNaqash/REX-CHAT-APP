import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { FORGOT_PASSWORD_ROUTE } from "@/utils/constants";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    
    if (!email.trim()) {
      toast.error("Email is required!");
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post(FORGOT_PASSWORD_ROUTE, { email });

      toast.success(response.data.message || "Reset link sent to your email!");
      
      // 🚀 Automatically navigate to OTP verification after success
      navigate("/verify-otp", { state: { email } });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center px-4">
      <div className="bg-white border-2 border-white shadow-[0px_10px_30px_rgba(0,0,0,0.3)] w-[90vw] md:w-[60vw] lg:w-[40vw] rounded-3xl p-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Forgot Password?</h1>
        <p className="text-gray-600 mb-6">Enter your email to receive an OTP.</p>
        <Input
          type="email"
          placeholder="Enter your email"
          className="rounded-full p-4 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button
          className="rounded-full p-4 w-full bg-purple-500 text-white hover:bg-purple-600"
          onClick={handleForgotPassword}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send OTP"}
        </Button>
        <p className="mt-4 text-sm text-purple-500 hover:underline cursor-pointer" onClick={() => navigate("/login")}>
          Back to Login
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
