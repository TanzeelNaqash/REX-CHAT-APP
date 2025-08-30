// const mongoose = require('mongoose');

// const callSchema = new mongoose.Schema({
//   callId: { type: String, required: true, unique: true },
//   caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   type: { type: String, enum: ['audio', 'video'], required: true },
//   status: { 
//     type: String, 
//     enum: ['initiated', 'ringing', 'ongoing', 'completed', 'missed', 'rejected'], 
//     default: 'initiated' 
//   },
//   startedAt: { type: Date },
//   endedAt: { type: Date },
//   duration: { type: Number }, // in seconds
// }, { timestamps: true });

// const Call = mongoose.model('Call', callSchema);
// export default Call