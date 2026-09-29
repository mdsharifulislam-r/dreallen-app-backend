import { Types } from "mongoose";
import { IPackage } from "./package.interface";
import { Package } from "./package.model";
import stripe from "../../../config/stripe";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";


const createPackageIntoDB = async (data:IPackage,user:JwtPayload)=>{

    const result = await Package.create({...data})
    return result
}

const getAllPackagesFromDB = async ()=>{
    const result = await Package.find({status:"active"})
    return result

    return result
}

const updatePackageToDB = async (id:Types.ObjectId,payload:Partial<IPackage>,user:JwtPayload)=>{
    const plan = await Package.findById(id)
    if(!plan){
        throw new ApiError(StatusCodes.BAD_REQUEST, "Package doesn't exist!");
    }
    const result = await Package.findOneAndUpdate({_id:id},payload,{new:true})
    return result
}

const deletePackageFromDB = async (id:Types.ObjectId,user:JwtPayload)=>{
    const result = await Package.findOneAndUpdate({_id:id},{status:'delete'})
    return result
}

export const PackageService = {
    createPackageIntoDB,
    getAllPackagesFromDB,
    updatePackageToDB,
    deletePackageFromDB
}