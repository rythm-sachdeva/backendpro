const asyncHandler = (requestHandler) => {
    Promise.resolve(requestHandler(req,res,next)).
    catch((err) => next(err))

}

export {asyncHandler}