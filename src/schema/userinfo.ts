import { InferSchemaType, model, Schema } from "mongoose";

const userinfoSchema = new Schema({
    userid: { type: String, required: true, unique: true },
    recompoint: { type: String },
    totalexp: { type: String },
    jpexp: { type: String },
    japanese: { type: String },
    jpexamname: { type: String },
    jppassedlevel: { type: String },
    english: { type: String },
    otherlanglevel: { type: String },
    techskill: { type: String },
    appeal: { type: String},
    hourlywages: {type: String},
    statusid : {type: Number},
    delflg: { type: Number, required: true }
}, { timestamps: true });

type UserInfo = InferSchemaType<typeof userinfoSchema>;

export default model<UserInfo>("UserInfo", userinfoSchema);