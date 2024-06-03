import { asyncHandler } from "../utils/asyncHandler.js";
import { Apierror } from "../utils/Apierror.js";
import {User} from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import mongoose, { syncIndexes } from "mongoose";
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

const changeCurrentPassword= asyncHandler(async (req,res)=>{

   const {oldPassword,newPassword,confirmPassWord}= req.body
   
   if(!oldPassword){
    throw new Apierror(401,"Old Password Is Required")
   }
   if(newPassword !== confirmPassWord)
    {
        throw new Apierror(401,"Passwords Do not Match")
    }

    const user = await User.findById(req.user._id) 
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect)
        {
            throw new Apierror(401,"Old Password is Incorrect")
        }
        user.password = newPassword;
       await user.save({validateBeforeSave:false})

       return res
       .status(200)
       .json( new Apiresponse(200,{},"PassWord Updated SuccessFully"))

})

const getCurrentUser = asyncHandler(async (req,res) =>{
    return res
    .status(200)
    .json( new Apiresponse(200,req.user,"User Fetched SuccessFully"))
})

const updateAccountDetails = asyncHandler (async (req,res) => {

    const {fullname,email} = req.body

    if(!fullname || !email)
        {
            throw new Apierror(401,"All Fields Are Required")
        }
        
      const user = await User.findByIdAndUpdate(req.user?._id , {
            $set: {
                fullname,
                email
            }
        },
        {new:true}

    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new Apiresponse(200,user,"Fullname And Email Updates SuccessFully"))
})

const updateAvatar = asyncHandler( async (req,res) => {
    const AvatarLocalPath = req.file?.path

    if(!AvatarLocalPath){
        throw new Apierror(400,"Avatar File Is Missing ")
    }

    const Avatar = await uploadOnCloudinary(AvatarLocalPath)

    if(!Avatar.url)
        {
            throw new Apierror(400,"Error While Uploading Avatar")
        }

      const user =  await User.findByIdAndUpdate(req.user._id,
        {$set:{
            avatar: Avatar.url 
        }},
        {new:true}).select("-password")

        return res.status(200)
        .json(new Apiresponse(200,user,"Avatar Changes Successfully"))

} )

const updateCoverImage = asyncHandler( async (req,res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new Apierror(400,"CoverImage File Is Missing ")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url)
        {
            throw new Apierror(400,"Error While Uploading Cover Image")
        }

      const user =  await User.findByIdAndUpdate(req.user._id,
        {$set:{
            coverImage: coverImage.url 
        }},
        {new:true}).select("-password")

        return res.status(200)
        .json(new Apiresponse(200,user,"CoverImage Changes Successfull"))

} )

const getUserChannelProfile = asyncHandler( async (req,res)=>{

    const {username} = req.params

    if(!username?.trim()){
        throw new Apierror(400,"Username is Missing")
    }

   const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribed-to"
            }
        },
        {
            $addFields: {
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedTo:{
                    $size:"$subscribed-to"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedTo:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1


            }
        }

    ])
    if(!channel?.length)
        {
            throw new Apierror(404,"channel Does Not Exist")
        }
        return res.status(200).json(new Apiresponse(200,channel[0],"Channel Does Not Exist"))
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage

}