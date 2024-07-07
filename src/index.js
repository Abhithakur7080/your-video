import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
//environment setup
dotenv.config({ path: "./.env" });

//database and server start setup
connectDB()
.then(()=> {
    app.listen(process.env.PORT || 7000, ()=> {
        console.log(`Server is running on PORT : ${process.env.PORT || 7000}`);
    })
})
.catch((err)=>{
    console.log("MONGDB connection failed!!!", err);
})