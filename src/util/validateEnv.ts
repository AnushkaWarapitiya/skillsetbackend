import { cleanEnv } from "envalid";
import { port, str } from "envalid/dist/validators";

export default cleanEnv(process.env, {
    MONGO_CONNECTION_STRING: str(),
    PORT: port(),
    SESSION_EXPIRES_IN: str(),
    SESSION_TBL: str(),
    SESSION_COOKIE_NAME: str(),
    SESSION_SECRET: str()
});