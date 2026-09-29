import mongoose from "mongoose";
import { IPackage, PackageModel } from "./package.interface";


const packageSchema = new mongoose.Schema<IPackage,PackageModel>({
    productId:{type: String,required:true},
    referenceId:{type: String,required:true},
    label:{type: String,required:true},
    status:{type: String,required:false,default:'active'},
    features:{type: [String],required:true},
    recommended:{type: Boolean,required:false,default:false},
    price:{type: Number,required:true},
    recurring:{type: String,
        enum: ['monthly', 'yearly', 'buisness'],
        required:true},
},{
    timestamps: true
})

export const Package = mongoose.model<IPackage, PackageModel>("Package", packageSchema);