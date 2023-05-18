import mongoose from "mongoose";

declare module "express-session" {
    interface SessionData {
        user: { userid:string, name:string, roleflg:number };
    }
}