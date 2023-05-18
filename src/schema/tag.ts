import { InferSchemaType, model, Schema } from "mongoose";

const tagSchema = new Schema({
    lbltgid: { type: Number, required: true, unique: true },
    lbltgname: { type: String, required: true },
    delflg: { type: Number, required: true }
}, {timestamps: { createdAt: true, updatedAt: false }});

type Tag = InferSchemaType<typeof tagSchema>;

export default model<Tag>("Tag", tagSchema);				