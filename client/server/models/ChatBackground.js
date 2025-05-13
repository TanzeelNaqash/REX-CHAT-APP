import mongoose from "mongoose";

const chatBackgroundSchema = new mongoose.Schema({
    senderId: { 
        type: String,
        default: null
    },
    recieverId: { 
        type: String,
        default: null
    },
    backgroundImage: {
        type: String, 
        required: true,
    },
});


const ChatBackground = mongoose.model("ChatBackground", chatBackgroundSchema);
export default ChatBackground;
