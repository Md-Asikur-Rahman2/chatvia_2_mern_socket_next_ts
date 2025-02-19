import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
    {
        conversationId: { type: String },
        sender: { type: String },
        text: { type: String },
        deletedBy: [
            {
                userId: {
                    type: String
                },
                deletedAt: {
                    type: Date
                }
            }
        ],
        isPin: {
            type: Boolean,
            default: false
        },
        status: { type: String, default: 'unseen' }
    },

    { timestamps: true }
);

module.exports = mongoose.model('Message', MessageSchema);
