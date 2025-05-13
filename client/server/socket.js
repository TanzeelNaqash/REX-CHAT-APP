import { Server as SocketIOServer } from "socket.io";
import Message from "./models/MessagesModel.js";
import Group from "./models/GroupModel.js";
import CallLog from "./models/CallLogs.js";

const setupSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Range', 'X-Content-Range']
    },
  });

  const userSocketMap = new Map();
  const activeCalls = new Map();
  const lastSeenMap = new Map(); // Track last seen time for each user
  
  // Function to broadcast online users to all connected clients
  const broadcastOnlineUsers = () => {
    const onlineUsers = Array.from(userSocketMap.keys());
    io.emit("online-users", onlineUsers);
  };

  // Function to format last seen time
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return null;
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diff = now - lastSeen;
    
    // Less than a minute
    if (diff < 60000) return 'Just now';
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    // Less than a week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
    
    // More than a week, show date
    return lastSeen.toLocaleDateString();
  };
  
  const disconnect = (socket) => {
    console.log(`User disconnected: ${socket.id}`);
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        console.log(`Setting last seen for user ${userId}`);
        userSocketMap.delete(userId);
        const lastSeenTime = new Date().toISOString();
        console.log(`Last seen time: ${lastSeenTime}`);
        lastSeenMap.set(userId, lastSeenTime);
        
        // Broadcast updated online users list
        broadcastOnlineUsers();
        
        // End any active calls for this user
        for (const [callId, call] of activeCalls.entries()) {
          if (call.caller === userId || call.recipient === userId) {
            const otherUserId = call.caller === userId ? call.recipient : call.caller;
            const otherUserSocketId = userSocketMap.get(otherUserId);
            
            if (otherUserSocketId) {
              io.to(otherUserSocketId).emit('call-ended', { callId });
            }
            
            // Save call log with disconnected status
            call.endTime = new Date();
            call.duration = call.endTime - call.startTime;
            call.status = 'disconnected';
            saveCallLog(call);
            
            activeCalls.delete(callId);
          }
        }
        
        break;
      }
    }
  };

  const sendMessage = async (message) => {
    const senderSocketId = userSocketMap.get(message.sender);
    const recipientSocketId = userSocketMap.get(message.recipient);

    const createdMessage = await Message.create(message);

    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .populate("recipient", "id email firstName lastName image color");

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("recieveMessage", messageData);
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("recieveMessage", messageData);
    }
  };

  const sendGroupMessage = async (message) => {
    const { groupId, sender, messageType, fileUrl, content } = message;

    const createdMessage = await Message.create({
      sender,
      recipient: null,
      content,
      messageType,
      timestamp: new Date(),
      fileUrl,
    });

    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .exec();

    await Group.findByIdAndUpdate(groupId, {
      $push: { messages: createdMessage._id },
    });

    const group = await Group.findById(groupId).populate("members");

    const lastData = { ...messageData._doc, groupId: group._id };

    if (group && group.members) {
      group.members.forEach((member) => {
        const memberSocketId = userSocketMap.get(member._id.toString());
        if (memberSocketId) {
          io.to(memberSocketId).emit("recieve-group-message", lastData);
        }
      });
      const adminSocketId = userSocketMap.get(group.admin._id.toString());
      if (adminSocketId) {
        io.to(adminSocketId).emit("recieve-group-message", lastData);
      }
    }
  };

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
      
      // Broadcast updated online users list when someone connects
      broadcastOnlineUsers();
      
      socket.on("get-last-seen", ({ userId: targetUserId }) => {
        console.log('Getting last seen for user:', targetUserId);
        if (userSocketMap.has(targetUserId)) {
          console.log('User is online, not returning last seen');
          socket.emit("last-seen", { 
            userId: targetUserId, 
            lastSeen: null
          });
          return;
        }
        const lastSeen = lastSeenMap.get(targetUserId);
        console.log('Last seen value:', lastSeen);
        const formattedLastSeen = formatLastSeen(lastSeen);
        console.log('Formatted last seen:', formattedLastSeen);
        socket.emit("last-seen", { 
          userId: targetUserId, 
          lastSeen: formattedLastSeen
        });
      });
      
      socket.on("typing", ({ recipient }) => {
        const recipientSocketId = userSocketMap.get(recipient);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("typing", { sender: userId });
        }
      });

      socket.on("stopTyping", ({ recipient }) => {
        const recipientSocketId = userSocketMap.get(recipient);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("stopTyping", { sender: userId });
        }
      });
     
      // Initialize call
      socket.on('call-user', ({ to, from, signal, name, isVideo, callId }) => {
        console.log(`Call initiation from ${from} to ${to} (Call ID: ${callId})`);
        const targetSocketId = userSocketMap.get(to);
        
        if (targetSocketId) {
          activeCalls.set(callId, {
            caller: from,
            recipient: to,
            startTime: new Date(),
            isVideo,
            status: 'ringing'
          });
          
          io.to(targetSocketId).emit('incoming-call', { 
            from, 
            name, 
            signal, 
            isVideo,
            callId 
          });
        } else {
          // If user is not online, send missed call event back to caller
          const callerSocketId = userSocketMap.get(from);
          if (callerSocketId) {
            io.to(callerSocketId).emit('call-missed', { 
              to,
              callId,
              reason: 'user-offline'
            });
          }
        }
      });

      // Answer call
      socket.on('answer-call', ({ to, signal, callId }) => {
        console.log(`Call answered: ${callId}`);
        const callerSocketId = userSocketMap.get(to);
        
        if (callerSocketId) {
          const call = activeCalls.get(callId);
          if (call) {
            call.status = 'ongoing';
            call.answerTime = new Date();
            activeCalls.set(callId, call);
          }
          
          io.to(callerSocketId).emit('call-accepted', { 
            signal, 
            from: userId,
            callId 
          });
        }
      });

      // End call
      socket.on('end-call', ({ to, callId }) => {
        console.log(`Call ended: ${callId}`);
        const targetSocketId = userSocketMap.get(to);
        const call = activeCalls.get(callId);
        
        if (call) {
          call.endTime = new Date();
          call.duration = call.endTime - (call.answerTime || call.startTime);
          call.status = 'ended';
          
          // Save call log to MongoDB
          saveCallLog(call);
          activeCalls.delete(callId);
          
          if (targetSocketId) {
            io.to(targetSocketId).emit('call-ended', { 
              from: userId,
              callId 
            });
          }
        }
      });

    } else {
      console.log("User ID not provided during connection.");
    }
    
    socket.on("sendMessage", sendMessage);
    socket.on("send-group-message", sendGroupMessage);
    socket.on("disconnect", () => disconnect(socket));
  });

  return io;
};

async function saveCallLog(call) {
  try {
    const callLog = new CallLog({
      caller: call.caller,
      recipient: call.recipient,
      startTime: call.startTime,
      answerTime: call.answerTime,
      endTime: call.endTime,
      duration: call.duration,
      isVideo: call.isVideo,
      status: call.status
    });
    
    await callLog.save();
    console.log('Call log saved:', callLog);
  } catch (error) {
    console.error('Error saving call log:', error);
  }
}

export default setupSocket;