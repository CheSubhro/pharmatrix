
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: "SUPER_ADMIN" | "ADMIN" | "PHARMACIST" | "BILLING_STAFF" | "RECEPTIONIST";
    isActive: boolean;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
        type: String,
        required: true,
        trim: true,
        },

        email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        },

        password: {
        type: String,
        required: true,
        minlength: 6,
        },

        role: {
        type: String,
        enum: [
            "SUPER_ADMIN",
            "ADMIN",
            "PHARMACIST",
            "BILLING_STAFF",
            "RECEPTIONIST",
        ],
        default: "BILLING_STAFF",
        },

        isActive: {
        type: Boolean,
        default: true,
        },
    },
    {
        timestamps: true,
    }
);

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;