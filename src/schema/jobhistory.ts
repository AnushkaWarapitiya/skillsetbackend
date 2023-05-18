import { InferSchemaType, model, Schema } from "mongoose";

const jobHistorySchema = new Schema({
    userid: { type: String, required: true },
    content: { type: String, required: true },
    tech: { type: String, required: true }, 
    roleandscale: { type: String, required: true },
    delflg: { type: Number, required: true }
}, { timestamps: true });

type JobHistory = InferSchemaType<typeof jobHistorySchema>;

export default model<JobHistory>("JobHistory", jobHistorySchema);