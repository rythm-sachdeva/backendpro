import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`process is running at port : ${process.env.PORT}`)
    })
})
.catch((err)=> {
    console.log("Mongoose Connection Failed!!",err)
})
