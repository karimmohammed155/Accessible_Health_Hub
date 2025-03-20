import { Types } from "mongoose";

export const isValidObjectId=(value,helper)=>{
    if(Types.ObjectId.isValid(value))return true;
    return helper.message("Invalid objectId");
}


export const validation=(schema)=>{
    return (req,res,next)=>{
        const data={...req.body,...req.params,...req.query};
        console.log(data)
        const validationResult=schema.validate(data,{abortEarly:false});

        if(validationResult.error){
            const errorMessages=validationResult.error.details.map((errorObj)=>
                {
                    return errorObj.message;
                }
            );
            return next(new Error(errorMessages,{cause:400}));
        };
        return next();
    };
};