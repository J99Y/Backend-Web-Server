const errorString = {
  // User detail errors
  emailNotFound: 'Email entered does not belong to a user',
  emailNotValid: 'Email entered is not a valid email',
  emailAlreadyUsed: 'Email address is already being used by another user',
  passwordIncorrect: 'password is not correct',
  passwordLength: 'Length of password is less than 6 characters or less then 200 characters',
  firstNameLength: 'Length of nameFirst is not between 1 and 50 characters inclusive',
  lastNameLength: 'Length of nameLast is not between 1 and 50 characters inclusive',
  handleStringLength: 'Length of Handle Str Not correct',
  handleStringNotAlpha: 'Handle String is not AlphaNumeric',
  handleAlreadyTaken: 'Handle Str already taken',
  // Id errors
  uIdNotValid: 'UserId not valid',
  invalidToken: 'Invalid Token',
  // Channel errors
  uIdAlreadyMember: 'User is already a member of the channel',
  uIdNotMember: 'UserId not a member of channel',
  chanIdNotValid: 'ChannelId not valid',
  chanPrivateuIDnotOwner: "Channel is private and user isn't a global owner",
  channelNameLength: 'Length of channel name is not between 1 and 20 inclusive',
  channelIsPublic: 'IsPublic must be true or false',
  uIdStandupStarter: 'The starter of an active standup cannot leave the channel',
  // Message errors
  startValInvalid: 'Start value is invalid',
  messageLength: 'Length of message is less than 1 characters or more than 1000 characters',
  invalidMessageId: 'Invalid MessageId',
  uIdNotOwnerMessage: 'User does not have permission to modify message',
  shareLocationUnspecified: 'Neither channelId nor dmId are -1',
  reactIdInvalid: 'Invalid react Id',
  reactedAlready: 'User already reacted with this emoji',
  notReacted: 'the message does not react from a the authorised',
  alreadyPinned: 'Message is already pinned',
  notPinned: 'Message is already unpinned',
  timeSentPast: 'Timesent cannot be a time in the past',
  // Dm errors
  dmNotMember: 'User not member of dm',
  notAnOwner: 'User is not an owner',
  noOwnerPermissions: 'Authorised user does not have owner permissions',
  lastOwner: 'User is the only owner left in the channel',
  uIdAlreadyOwner: 'User is already an owner',
  uIdsNotDmOwner: 'User not owner of dm',
  invalidDmId: 'Invalid dmId',
  OwnerAlreadyLeave: 'Authorised user is no longer in the dm',
  duplicateUIds: 'Duplicate in UIds',
  // Admin Errors
  permissionIdNotValid: 'PermissionId is not valid',
  onlyOneGlobalOwner: 'UId is the only global Owner cannot demoted',
  userAlreadyhasPermission: 'User already has the permissions level of permissionId',
  tokenNotGlobalOwner: 'Authorised user is not a global owner',
  unActiveUser: 'User inactive',
  // Standup errors
  invalidStandUpLength: 'Standup duration cannot be negative',
  standupAlreadyActive: 'Standup already in progress',
  standupNotActive: 'Standup not in progress',
  // Generic error
  error: 'Error',
  invalidPhoto: 'Photo Invalid'
};

interface ReturnError {
  error: string
}

export { ReturnError, errorString };
