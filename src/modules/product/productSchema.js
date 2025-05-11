import joi from 'joi';
import { isValidObjectId } from '../../middleware/validationMiddleware.js';
export const createProduct=joi.object({
    name:joi.string().min(2).max(200).required(),
    description:joi.string().min(10).max(200),
    price:joi.number().integer().min(1).required(),
    link:joi.string().min(2).required(),

}).required();

export const deleteProduct=joi.object({
    id:joi.string().custom(isValidObjectId).required(),
}).required();

export const updateProduct=joi.object({
        id:joi.string().custom(isValidObjectId).required(),

    name:joi.string().min(2).max(200),
    description:joi.string().min(10).max(200),
    price:joi.number().integer().min(1),
    link:joi.string().min(2),

}).required();