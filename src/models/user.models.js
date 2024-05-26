import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt"
import { Jwt } from "jsonwebtoken";

const userSchema = new Schema(
    {
       username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim : true,
        index : true
       } ,
       email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim : true
       },
       fullname: {
        type: String,
        required: true,
        trim : true,
        index: true
       },
      avatar: {
        type: String,//This is an imageurl that takes us to cloud db(Cloudinary) where media files are stored
        required:true
      },
      watchhistory: [
        {
            type: Schema.Types.ObjectId,
            ref:"Video"
        }
      ],
      password: {
        type: String,
        required: [true, 'Password is Required']
      },
      refreshToken: {
        type: String
      }
    },{
        timestamps:true
    })

 userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next()
    this.password = bcrypt.hash(this.password,10)
    next()
 })
 userSchema.methods.isPasswordCorrect = async function(password){
  return await  bcrypt.compare(password,this.password)
 }
 userSchema.methods.generateAccessToken = function(){
 return jwt.sign({
  _id: this._id,
  email: this.email,
  fullname:this.fullname
 },
 process.env.ACCESS_TOKEN_SECRET,
 {
  expiresIN: process.env.ACCESS_TOKEN_EXPIRY
 }

 )
 }
 userSchema.methods.generateRefreshToken = function(){
  return jwt.sign({
    _id: this._id,
   },
   process.env.REFRESH_TOKEN_SECRET,
   {
    expiresIN: process.env.REFRESH_TOKEN_EXPIRY
   })
 }


export const User = mongoose.model('User',userSchema);