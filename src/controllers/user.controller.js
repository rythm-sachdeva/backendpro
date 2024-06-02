import { asyncHandler } from "../utils/asyncHandler.js";
import { Apierror } from "../utils/Apierror.js";
import {User} from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const registerUser = asyncHandler( async (req,res)=> {
  
    const {fullname,email,username,password} = req.body
   
    if(
        [fullname,email,username,password].some((field) => field?.trim() === "" )
    )
    {
        throw new Apierror(400,"All Fields Are Compulsory")
    }

    const ExistedUser= await User.findOne({
        $or: [{ username },{ email }]
    })
    if(ExistedUser)
     {
        throw new Apierror(409,"User With Email Or User Already Exist")
     }

     const AvatarLocalPath=req.files?.avatar[0]?.path;
    //  const coverImageLocalPath= req.file?.coverImage[0].path;

    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0)
        {
            coverImageLocalPath= req.file.coverImage[0].path
        }

     if(!AvatarLocalPath)
     {
        throw new Apierror(400,"Avatar File Is Required");
     }

    const Avatar= await uploadOnCloudinary(AvatarLocalPath);
    const coverimage= await uploadOnCloudinary(coverImageLocalPath);
    if(!Avatar)
    {
        throw new Apierror(409,"Avatar File Is Required");
    }
    const user= await User.create({
        fullname,
        avatar: Avatar.url,
        coverImage: coverimage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

   const createduser= await User.findById(user._id).select("-password -refreshToken");
   if(!createduser){
    throw new Apierror(400,"Something Went Wrong While Registering the User");
   }

    return res.status(201).json(
        new Apiresponse(200,createduser,"User Registered Successfully")
    )

})

export {registerUser}