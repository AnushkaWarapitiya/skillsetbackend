import "dotenv/config";
import express from "express";
import session from "express-session";
import cms from 'connect-mongodb-session'
import mongoose from "mongoose";
import env from "./util/validateEnv";
import account from "./controller/accountController";
import jm from "./controller/skillController";
import main from "./controller/mainController";
import cors from 'cors';

const app = express();
const MongoDBStore = cms(session);

// Connecting to Database
mongoose.connect(env.MONGO_CONNECTION_STRING)
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log(err));

// setting up connect-mongodb-session store
const mongoDBstore = new MongoDBStore({
  uri: env.MONGO_CONNECTION_STRING,
  collection: env.SESSION_TBL,
  expires: 1000 * 60 * Number(env.SESSION_EXPIRES_IN),
});

app.use(
  cors({
    allowedHeaders: ['Content-Type','Authorization'],
    origin: "http://localhost:3000",
    methods: ["GET","POST","PUT","DELETE","OPTIONS","HEAD"],
    credentials: true
  })
);

// Express Bodyparser
 app.use(express.urlencoded({ extended: false }));
 app.use(express.json());
 app.set('trust proxy', 1);

 
// Express-Session
app.use(
  session({
    name: env.SESSION_COOKIE_NAME,
    secret: env.SESSION_SECRET,
    rolling: true,
    resave: true,
    saveUninitialized: false,
    store: mongoDBstore,
    cookie: {
      path:'/',
      maxAge: 1000 * 60 * Number(env.SESSION_EXPIRES_IN),
      sameSite: true,
      secure: false,
      httpOnly: true
    }
  })
);

app.listen(env.PORT, () => console.log("Server running on port: " + env.PORT));
app.use('/api/account', account);
app.use('/api/skill', jm);
app.use('/api', main);