export enum USER_AUTH_PROVIDER {
  LOCAL = 'local',
  GOOGLE = 'google',
  MOBILE = 'apple',
}

export enum PROFILE_MODE {
  PRIVATE = 'private',
  PUBLIC = 'public',
}

export enum ACTIVITY_TYPE {
  POST = 'post',
  VIDEO = 'video',
  LIKE = 'like',
  SAVE = 'save',
  STORY = 'story',
}

export const userSearchableField = ['name', 'email'];
