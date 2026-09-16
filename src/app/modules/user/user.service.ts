import { StatusCodes } from 'http-status-codes';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../../config';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { jwtHelper } from '../../../helpers/jwtHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import QueryBuilder from '../../builder/QueryBuilder';
import {
  USER_AUTH_PROVIDER,
  userSearchableField,
} from './user.constant';
import { IUser } from './user.interface';
import { User } from './user.model';
import { getUserInfoWithToken } from './user.util';
import generateOTP from '../../../util/generateOTP';

const willBeDeleteUser = async (email: string, password: string) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (user.status === 'delete') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User Not Found !!');
  }

  const isPasswordMatch = await User.isMatchPassword(password, user.password);
  if (!isPasswordMatch) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Incorrect password');
  }

  user.status = 'delete';
  await user.save();
  return user;
};

const createUserToDB = async (
  payload: Partial<IUser>,
): Promise<IUser | { accessToken: string }> => {
  if (!payload.password && !payload.google_id_token) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Password or Google token is required',
    );
  }

  let isValid = false;
  let authorization: { oneTimeCode: string; expireAt: Date } | null = null;

  // GOOGLE
  if (
    payload.auth_provider === USER_AUTH_PROVIDER.GOOGLE &&
    payload.google_id_token
  ) {
    const tokenData = await getUserInfoWithToken(payload.google_id_token);
    if (!tokenData?.data?.email) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Google token');
    }

    payload.email = tokenData.data.email;
    payload.name = tokenData.data.name;
    isValid = true;
    payload.verified = true;

    const isGoogleUserExist = await User.findOne({ email: payload.email }).lean();

    if (isGoogleUserExist) {
      const createToken = jwtHelper.createToken(
        { id: isGoogleUserExist._id, role: isGoogleUserExist.role, email: isGoogleUserExist.email },
        config.jwt.jwt_secret as Secret,
        config.jwt.jwt_expire_in as string,
      );
      return { accessToken: createToken };
    }
  }
  // LOCAL
  else {
    if (
      (payload.auth_provider === USER_AUTH_PROVIDER.LOCAL || !payload.auth_provider) &&
      payload.password
    ) {
      isValid = true;
      payload.auth_provider = USER_AUTH_PROVIDER.LOCAL;

      const otp = generateOTP();
      authorization = {
        oneTimeCode: otp.toString(),
        expireAt: new Date(Date.now() + 3 * 60000),
      };
    }
  }

  const createUser = await User.create(payload);

  if (!createUser || !isValid) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
  }

  if (isValid && createUser && payload.auth_provider === USER_AUTH_PROVIDER.LOCAL) {
    if (!authorization?.oneTimeCode || !createUser?.email) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to generate OTP or missing email',
      );
    }
    const createAccountTemplate = emailTemplate.createAccount({
      otp: authorization.oneTimeCode,
      email: createUser.email,
    });
    emailHelper.sendEmail(createAccountTemplate);
    await User.findByIdAndUpdate(createUser._id, { $set: { authorization } });
    return createUser;
  } else {
    // create token
    const createToken = jwtHelper.createToken(
      { id: createUser._id, role: createUser.role, email: createUser.email },
      config.jwt.jwt_secret as Secret,
      config.jwt.jwt_expire_in as string,
    );
    return { accessToken: createToken };
  }
};

const getUserProfileFromDB = async (user: JwtPayload): Promise<any> => {
  console.log(user);
  const { id } = user;

  const isExistUser = await User.findById(id, '-status -authorization').lean();

  if (!isExistUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }

  return {
    ...isExistUser,
  };
};

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>,
): Promise<Partial<IUser | null> | undefined> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);

  if (!isExistUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true },
  ).lean();

  if (updatedUser) {
    delete (updatedUser as any).authorization;
    delete (updatedUser as any).status;
  }

  return updatedUser;
};

const getAllUsers = async (query: Record<string, any>, _role?: string) => {
  const baseQuery = User.find({ verified: true, status: 'active' });

  const userQuery = new QueryBuilder(baseQuery, query)
    .paginate()
    .search(userSearchableField)
    .fields()
    .sort();

  const result = await userQuery.modelQuery.lean();
  const pagination = await userQuery.getPaginationInfo();

  return {
    pagination,
    data: result,
  };
};

const unfollowUser = async (userId: string, targetId: string) => {
  if (userId === targetId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot unfollow yourself');
  }

  throw new ApiError(
    StatusCodes.NOT_IMPLEMENTED,
    'Follow/unfollow feature is not supported in the current user model',
  );
};

const getUserProfileByIdFromDB = async (
  userId: string,
  _requestUserId: string,
): Promise<any> => {
  const isExistUser = await User.findById(
    userId,
    '-status -role -authorization',
  ).lean();

  if (!isExistUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }

  return {
    ...isExistUser,
  };
};

const getUserActivityFromDB = async (
  _requestUserId: string,
  _myUserId: string,
  _query: Record<string, any>,
): Promise<{ data: any[]; pagination: any }> => {
  return {
    data: [],
    pagination: { page: 1, limit: 10, total: 0, totalPage: 1 },
  };
};

// DASHBOARD ANALYTICS

const getUserStatistics = async (year: number, _userId?: string) => {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  const newUsersAgg = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        verified: true,
      },
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
  ]);

  const monthToCount = Array(12).fill(0);
  newUsersAgg.forEach((item: any) => {
    monthToCount[item._id.month - 1] = item.count;
  });

  const now = new Date();
  const isThisYear = year === now.getFullYear();
  const limitMonth = isThisYear ? now.getMonth() + 1 : 12;

  let runningTotal = 0;
  const userStats = [];
  for (let i = 0; i < limitMonth; i++) {
    runningTotal += monthToCount[i];
    userStats.push({
      month: months[i],
      newUsers: monthToCount[i],
      cumulativeNewUsers: runningTotal,
    });
  }

  return {
    year,
    totalNewUsers: runningTotal,
    userStats,
  };
};

const statistics = async () => {
  const totalUser = await User.countDocuments({ verified: true });

  return {
    totalUser,
    totalRevenue: 0,
    totalOrder: 0,
  };
};

const getAllEarningStatistics = async (year: number) => {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const earningStats = months.map(month => ({
    month,
    earning: 0,
  }));

  return {
    year,
    totalEarning: 0,
    earningStats,
  };
};

const toggleProfileUpdate = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  user.status = user.status === 'active' ? 'delete' : 'active';
  await user.save();

  return user;
};

const deleteAccount = async (password: string, userId: string) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const isMatch = await User.isMatchPassword(password, user.password);
  if (!isMatch) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Incorrect password');
  }

  const deletedUser = await User.findByIdAndDelete(userId);
  if (!deletedUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return deletedUser;
};

export const UserService = {
  willBeDeleteUser,
  createUserToDB,
  getUserProfileFromDB,
  updateProfileToDB,
  unfollowUser,
  getAllUsers,
  getUserProfileByIdFromDB,
  getUserActivityFromDB,
  statistics,
  getUserStatistics,
  getAllEarningStatistics,
  toggleProfileUpdate,
  deleteAccount,
};
