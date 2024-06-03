import { asyncHandler } from "../utils/asyncHandler.js";
import { Apierror } from "../utils/Apierror.js";
import {User} from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken"

const generateAccessTokenAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findOne(userId)
        const refreshToken = await user.generateRefreshToken()
        // console.log(refreshToken)
        const accessToken = await user.generateAccessToken()
        user.refreshToken = refreshToken
        
        await user.save({validateBeforeSave: false})
        return {accessToken,refreshToken}
        
    } catch (error) {
        throw new Apierror(500,"Something Went Wrong While generating Refresh and Access Token")
    }
}

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
            coverImageLocalPath= req.file?.coverImage[0].path || ""
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

const loginUser = asyncHandler(
    async (req,res) => {
        const {email,username,password} = req.body

        if (!username && !email)
            {
                throw new Apierror(400,"Username Or Email Is Required");
            }

       const user= await User.findOne({
            $or: [{username},{email}]
         })

         if(!user)
             {
                throw new Apierror(404,"User Does Not Exist")
             }
             const isPasswordValid = user.isPasswordCorrect(password)

             if(!isPasswordValid)
                {
                   throw new Apierror(400,"PassWord is Not Correct");

                }
               const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

               const loggedInUser = await User.findOne(user._id).select("-password -refreshToken")

               const options = {
                httpOnly: true,
                secure: true
               }

               return res.status(200)
               .cookie("accessToken",accessToken,options)
               .cookie("refreshToken",refreshToken,options)
               .json( 
                new Apiresponse(200,{user: loggedInUser,accessToken,refreshToken},"User Logged In Successfully"))




    }

)
const logoutUser = asyncHandler(async (req,res) =>{
  await User.findByIdAndUpdate(
    req.user._id,{
        $set:{
            refreshToken:undefined
        }
    },
    {
        new:true
    }
 )
 const options = {
    httpOnly: true,
    secure: true
   }
   return res.status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(
    new Apiresponse(200,{},"User Logged Out SuccessFully")
   )

})

const refreshAccessToken = asyncHandler(async (req,res)=> {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken 
    if(!incomingRefreshToken)
        {
            throw new Apierror(401,"UnAuthorized Request")
        }
     
       try {
        const decodedRefreshToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 
        const user = await User.findById(decodedRefreshToken?._id)
        if(!user){
         throw Apierror(401,"Invalid Refresh Token");
        }
        if(incomingRefreshToken !== user.refreshToken)
         {
             throw new Apierror(401,"Refresh Token Is Expired Or Used")
         }
 
         const {accessToken,newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id)
 
         const options = {
             httpOnly: true,
             secure: true
            }
 
            return res.status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",newRefreshToken,options)
            .json( 
             new Apiresponse(200,{accessToken,refreshToken:newRefreshToken},"AccessToken Refreshed"))
 
       } catch (error) {
        
        throw new Apierror(500,"Error Occured While Refreshing Access Token")
       }
        


}) 

export {registerUser,loginUser,logoutUser,refreshAccessToken}