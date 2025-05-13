import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { VERIFY_OTP_ROUTE } from "@/utils/constants";
import { useNavigate, useLocation } from "react-router-dom";
import { clsx } from "clsx";

const VerifyOtp = () => {
  const { state } = useLocation();
  const email = state?.email || "";
  const navigate = useNavigate();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    const otpValue = otp.join("");
    if (otpValue.length === 6) {
      handleVerifyOtp(otpValue);
    }
  }, [otp]);

  const handleVerifyOtp = async (otpValue) => {
    if (!email.trim() || otpValue.length !== 6) {
      return;
    }
  
    try {
      setLoading(true);
      setError(false);
      setSuccess(false);
      const response = await apiClient.post(VERIFY_OTP_ROUTE, { email, otp: otpValue });
  
      toast.custom(() => (
        <div className="flex items-center gap-2 p-3 bg-white shadow-lg rounded-lg border border-green-500">
          <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-500 text-white">
            ✓
          </div>
          <span>{response.data.message || "OTP Verified!"}</span>
        </div>
      ));
  
      setSuccess(true);
      
      // Navigate to reset-password page
      navigate("/reset-password", { state: { email } });
  
    } catch (error) {
      setError(true);
      setOtp(["", "", "", "", "", ""]); // Clear OTP inputs
      inputRefs.current[0]?.focus(); // Focus back to the first input
      toast.error(error.response?.data?.message || "Invalid OTP!");
      triggerVibration();
    } finally {
      setLoading(false);
    }
  };
  
  const triggerVibration = () => {
    if (navigator.vibrate) {
      navigator.vibrate(200); // Vibrate for 200ms
    }
    setTimeout(() => setError(false), 600); // Reset border color after animation
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="h-screen flex items-center justify-center px-4">
      <div className="bg-white border-2 border-white shadow-[0px_10px_30px_rgba(0,0,0,0.3)] w-full max-w-lg rounded-3xl p-6 md:p-10 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">Verify OTP</h1>
        <p className="text-gray-600 mb-6 text-sm md:text-base">Enter the OTP sent to your email.</p>

        {/* OTP Input Fields */}
        <div className={clsx("flex justify-center gap-2 mb-4", { "animate-shake": error })}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={clsx(
                "w-10 h-10 md:w-12 md:h-12 text-lg md:text-xl border rounded-lg text-center focus:outline-none transition",
                {
                  "border-red-500": error, // Red border for incorrect OTP
                  "border-green-500": success, // Green border for correct OTP
                  "border-gray-300": !error && !success, // Default border
                },
                "focus:ring-2 focus:ring-purple-500"
              )}
            />
          ))}
        </div>

        {/* Loading Indicator */}
        {loading && <p className="text-gray-500">Verifying...</p>}

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded-lg transition w-full md:w-auto"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default VerifyOtp;
