import { InferSchemaType, model, Schema } from "mongoose";

const userTagSchema = new Schema({
    userid: { type: String, required: true },
    lbltgid: { type: Number, required: true }
}, {timestamps: { createdAt: true, updatedAt: false }});

type UserTag = InferSchemaType<typeof userTagSchema>;

export default model<UserTag>("UserTag", userTagSchema);			