import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();



const transporter = nodemailer.createTransport({
    service: "Gmail", 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendMail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
        });
        console.log("✅ Email sent successfully!");
        return true;
    } catch (error) {
        console.error("❌ Error sending email:", error);
        return false;
    }
};
