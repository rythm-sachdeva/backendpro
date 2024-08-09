import { type } from "express/lib/response";
import mongoose,{Schema} from "mongoose";

const likeSchema = new Schema({
    video:{
        type : Schema.Types.ObjectId,
        ref: "Video"
       },
       comment:
       {
        type: Schema.Types.ObjectId,
        ref: "Comment"
       }
})