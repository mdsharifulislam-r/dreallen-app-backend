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
import { Song } from '../song/song.model';
import { Video } from '../video/video.model';
import { Bts } from '../bts/bts.model';
import { Subscription } from '../subscription/subscription.model';

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
): Promise<{ accessToken: string }> => {
  if (!payload.password && !payload.google_id_token) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Password or Google token is required',
    );
  }

  // GOOGLE
  if (
    payload.auth_provider === USER_AUTH_PROVIDER.GOOGLE &&
    payload.google_id_token
  ) {
    const tokenData = await getUserInfoWithToken(payload.google_id_token);

    if (!tokenData?.data?.email) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Invalid Google token',
      );
    }

    payload.email = tokenData.data.email;
    payload.name = tokenData.data.name;
    payload.verified = true;
    payload.auth_provider = USER_AUTH_PROVIDER.GOOGLE;

    const existingUser = await User.findOne({
      email: payload.email,
    });

    if (existingUser) {
      const accessToken = jwtHelper.createToken(
        {
          id: existingUser._id,
          role: existingUser.role,
          email: existingUser.email,
        },
        config.jwt.jwt_secret as Secret,
        config.jwt.jwt_expire_in as string,
      );

      return { accessToken };
    }
  }

  // LOCAL
  if (
    (payload.auth_provider === USER_AUTH_PROVIDER.LOCAL ||
      !payload.auth_provider) &&
    payload.password
  ) {
    payload.auth_provider = USER_AUTH_PROVIDER.LOCAL;
    payload.verified = true;
  }

  const createUser = await User.create(payload);

  if (!createUser) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create user',
    );
  }

  // Create token immediately after registration
  const accessToken = jwtHelper.createToken(
    {
      id: createUser._id,
      role: createUser.role,
      email: createUser.email,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string,
  );

  return { accessToken };
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
  const totalSongs = await Song.countDocuments({});
  const totalVideos = await Video.countDocuments({});
  const totalBTs = await Bts.countDocuments({});
  const totalRavanue = await Subscription.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: '$price' },
      },
    }
  ])


  return {
    totalUser,
    totalSongs,
    totalVideos,
    totalBTs,
    totalRavanue: totalRavanue.length > 0 ? totalRavanue[0].total : 0
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

  const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  const earningsByMonth = await Subscription.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' } },
        earning: { $sum: '$price' },
      },
    },
  ]);

  const monthToEarning = Array(12).fill(0);
  earningsByMonth.forEach((item: any) => {
    monthToEarning[item._id.month - 1] = item.earning;
  });

  const now = new Date();
  const isThisYear = year === now.getFullYear();
  const limitMonth = isThisYear ? now.getMonth() + 1 : 12;

  const earningStats = [];
  let totalEarning = 0;
  for (let i = 0; i < limitMonth; i++) {
    const earning = monthToEarning[i];
    totalEarning += earning;
    earningStats.push({ month: months[i], earning });
  }

  return {
    year,
    totalEarning,
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
