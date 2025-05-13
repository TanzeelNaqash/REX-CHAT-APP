import mongoose from 'mongoose';

const callLogSchema = new mongoose.Schema({
  caller: { type: String, required: true },
  recipient: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number }, // in milliseconds
  isVideo: { type: Boolean, default: true },
  status: { type: String, enum: ['ringing', 'ongoing', 'ended', 'missed'], required: true },
}, { timestamps: true });

const CallLog = mongoose.model('CallLog', callLogSchema);

export default CallLog;