import { InferSchemaType, model, Schema } from "mongoose";

const statusSchema = new Schema({
  statusid: { type: Number, required: true, unique: true },
  statusname: { type: String, required: true },
  delflg: {type: Number, required: true}
}, { timestamps: true });

type Status = InferSchemaType<typeof statusSchema>;

export default model<Status>("Status", statusSchema);