import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { model, Schema, Model, Types } from 'mongoose';
import config from '../../../config';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { USER_AUTH_PROVIDER } from './user.constant';
import { IUser, UserModel } from './user.interface';

const userSchema = new Schema<IUser, UserModel>(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      sparse: true,
    },

    image: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'delete'],
      default: 'active',
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    authorization: {
      oneTimeCode: { type: String },
      expireAt: { type: Date },
    },
    google_id_token: {
      type: String,
      select: false,
    },
    auth_provider: {
      type: String,
      enum: Object.values(USER_AUTH_PROVIDER),
      default: USER_AUTH_PROVIDER.LOCAL,
      select: false,
      required: true,
    },
  },
  { timestamps: true }
);

/* ---------- Static Methods ---------- */

// Check if user exists by ID
userSchema.statics.isExistUserById = async function (id: string) {
  return await this.findById(id);
};

// Check if user exists by email
userSchema.statics.isExistUserByEmail = async function (email: string) {
  return await this.findOne({ email });
};

// Compare passwords
userSchema.statics.isMatchPassword = async function (
  password: string,
  hashPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashPassword);
};

/* ---------- Middleware ---------- */

userSchema.pre('save', async function (next) {
  const user = this as IUser;
  // Only check for duplicate on create, not on update
  if (this.isNew) {
    if (user.email) {
      const isExist = await User.exists({ email: user.email });
      if (isExist) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, 'Account already exists!')
        );
      }
    }
  }

  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds)
  );

  next();
});

export const User = model<IUser, UserModel>('User', userSchema);
