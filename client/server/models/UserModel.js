import mongoose from 'mongoose';
import { genSalt, hash } from 'bcrypt';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is Required!"],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Password is Required!"], 
    },
    firstName: {
        type: String,
        required: false,
    },
    lastName: {
        type: String,
        required: false,
    },
    image: {
        type: String,
        required: false,
    },
    color: {
        type: Number,
        required: false,
    },
    profileSetup: {
        type: Boolean,
        default: false,
    },
    backgroundImage: {  
        type: String,
        default: null,
    },
});

userSchema.pre("save", async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await genSalt();
        this.password = await hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const User = mongoose.model("Users", userSchema);
export default User;
