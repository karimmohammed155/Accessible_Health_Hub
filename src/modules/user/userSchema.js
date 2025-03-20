import joi from 'joi';

export const register=joi.object({
    name:joi.string().min(2).max(25).required(),
    email:joi.string().email().required(),
    password:joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/).required(),
    confirmPassword:joi.string().valid(joi.ref("password")).required(),
}).required();

export const activate_account=joi.object({
    token:joi.string().required()
}).required();

export const login=joi.object({
    email:joi.string().email().required(),
    password:joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/).required(),
}).required();

export const forgetPassword=joi.object({
    email:joi.string().email().required(),
}).required();

export const resetPassword=joi.object({
    email:joi.string().email().required(),
    password:joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/).required(),
    confirmPassword:joi.string().valid(joi.ref("password")).required(),
    forgetCode:joi.string().length(5).required(),
}).required();

export const updateUser=joi.object({
    name:joi.string().min(2).max(25),
});