import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const messageAttachmentSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
  },
}, { _id: false });

const messageSchema = new Schema({
  conversationId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  gig: {
    type: Schema.Types.ObjectId,
    ref: 'Gig',
    default: null,
  },
  content: {
    type: String,
    trim: true,
    default: '',
  },
  attachments: {
    type: [messageAttachmentSchema],
    default: [],
  },
  readAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
