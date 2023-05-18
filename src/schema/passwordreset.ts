import { InferSchemaType, model, Schema } from "mongoose";

const passwordresetSchema = new Schema({
    userid: { type: String, required: true },
    resetflg: { type: Number, required: true }
}, { timestamps: { createdAt: 'requestAt', updatedAt: 'resetAt' }});

type PasswordReset = InferSchemaType<typeof passwordresetSchema>;
export default model<PasswordReset>("PasswordReset", passwordresetSchema);