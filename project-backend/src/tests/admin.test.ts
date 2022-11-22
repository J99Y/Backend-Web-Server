import {
  requestRegisterV3,
  requestUsersAllV2,
  requestChannelsCreateV3,
  requestDmCreateV2,
  requestChannelMessagesV3,
  requestSendDm,
  requestMessageSendV2,
  requestClearV1,
  requestChannelJoinV3,
  requestChannelDetailsV3,
  requestUserProfileV3,
  requestDmDetailsV2,
  requestMessagesDm,
  requestAdminUserRemoveV1,
  requestAdminUserperimissionV1
} from './testRequestRoutes';

describe('/admin/user/remove/v1 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  describe('General Error handling', () => {
    test('invalid token', () => {
      expect(requestAdminUserRemoveV1('abd', 42)).toEqual(403);
    });
    test('uId does not refer to a valid user', () => {
      const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
      expect(requestAdminUserRemoveV1(user1.token, 42)).toEqual(400);
    });
    test('uId is the only global owner', () => {
      const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
      expect(requestAdminUserRemoveV1(user1.token, user1.authUserId)).toEqual(400);
    });
    test('the authorised user is not a global owner (token does not refer to global owner', () => {
      requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
      // create a user that is global member and wants to remove user
      const user2 = requestRegisterV3('test2@test.com', 'password', 'test1', 'user');
      expect(requestAdminUserRemoveV1(user2.token, user2.authUserId)).toEqual(403);
    });
    test('inactive user', () => {
      const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
      const user2 = requestRegisterV3('test2@test.com', 'password', 'test1', 'user');
      expect(requestAdminUserRemoveV1(user1.token, user2.authUserId)).toEqual({});
      expect(requestAdminUserRemoveV1(user1.token, user2.authUserId)).toEqual(403);
    });
  });

  describe('Success remove', () => {
    test('dm: success remove the channel + modify message user 2 is in', () => {
      //  user 1 is the global owner
      const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
      // user 2 is to remove
      const user2 = requestRegisterV3('test2@test.com', 'password', 'test2', 'user');
      const user3 = requestRegisterV3('test3@test.com', 'password', 'test3', 'user');
      // user 1 create channel
      const dm1 = requestDmCreateV2(user1.token, [user2.authUserId, user3.authUserId]);
      const dm2 = requestDmCreateV2(user1.token, [user2.authUserId]);

      // user 2 send some message in user1's dm
      requestSendDm(user2.token, dm1.dmId, "user2's message1");
      requestSendDm(user2.token, dm1.dmId, "user2's message2");
      requestSendDm(user1.token, dm1.dmId, "user1's message");
      requestSendDm(user2.token, dm2.dmId, "user2's message1");
      requestSendDm(user2.token, dm2.dmId, "user2's message2");
      requestSendDm(user1.token, dm2.dmId, "user1's message");
      // check after admin remove
      requestAdminUserRemoveV1(user1.token, user2.authUserId);
      // 1. the dm does not include user2
      expect(requestDmDetailsV2(user1.token, dm1.dmId)).toStrictEqual(
        {
          name: expect.any(String),
          members: [
            {
              email: 'test1@test.com',
              handleStr: 'test1user',
              nameFirst: 'test1',
              nameLast: 'user',
              uId: 1,
              profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
            },
            {
              email: 'test3@test.com',
              handleStr: 'test3user',
              nameFirst: 'test3',
              nameLast: 'user',
              uId: 3,
              profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
            },
          ]
        }
      );

      // 2. message of the channel with message by user2 is set to removed user
      const input1 = requestMessagesDm(user1.token, dm1.dmId, 0);

      expect(input1.messages[0].message).toStrictEqual("user1's message");
      expect(input1.messages[1].message).toStrictEqual('Removed user');
      expect(input1.messages[2].message).toStrictEqual('Removed user');

      const input2 = requestMessagesDm(user1.token, dm2.dmId, 0);

      expect(input2.messages[0].message).toStrictEqual("user1's message");
      expect(input2.messages[1].message).toStrictEqual('Removed user');
      expect(input2.messages[2].message).toStrictEqual('Removed user');

      // 3. users/all does not return user2
      expect(requestUsersAllV2(user1.token)).toStrictEqual({
        users: [
          {
            uId: user1.authUserId,
            email: 'test1@test.com',
            nameFirst: 'test1',
            nameLast: 'user',
            handleStr: 'test1user',
            profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
          },
          {
            uId: user3.authUserId,
            email: 'test3@test.com',
            nameFirst: 'test3',
            nameLast: 'user',
            handleStr: 'test3user',
            profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
          },

        ]
      });
      // 4. userprofile is retrievable
      expect(requestUserProfileV3(user1.token, user2.authUserId)).toStrictEqual({
        user: {
          uId: user2.authUserId,
          email: 'test2@test.com',
          nameFirst: 'Removed',
          nameLast: 'user',
          handleStr: 'test2user',
          profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'

        }
      });
      // 5. the email and handle is reusable
      expect(requestRegisterV3('test2@test.com', 'password', 'test2', 'user')).toEqual(expect.any(Object));
    });

    test('channel: success remove the channel + modify message user 2 is in', () => {
      //  user 1 is the global owner
      const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
      // user 2 is to remove
      const user2 = requestRegisterV3('test2@test.com', 'password', 'test2', 'user');
      // user 1 create channel
      const public1 = requestChannelsCreateV3(user1.token, "user1's channel", true);
      const public2 = requestChannelsCreateV3(user1.token, "user1's channel", true);

      // user2 join user1's channel
      requestChannelJoinV3(user2.token, public1.channelId);
      requestChannelJoinV3(user2.token, public2.channelId);

      // user 2 send some message in user1's public channel and its both his private and public channel
      requestMessageSendV2(user2.token, public1.channelId, "user2's message1");
      requestMessageSendV2(user2.token, public1.channelId, "user2's message2");
      requestMessageSendV2(user1.token, public1.channelId, "user1's message");
      requestMessageSendV2(user2.token, public2.channelId, "user2's message1");
      requestMessageSendV2(user2.token, public2.channelId, "user2's message2");
      requestMessageSendV2(user1.token, public2.channelId, "user1's message");

      // check after admin remove
      expect(requestAdminUserRemoveV1(user1.token, user2.authUserId)).toEqual({});
      // 1. the channel does not include user2
      expect(requestChannelDetailsV3(user1.token, public1.channelId)).toStrictEqual(
        {
          name: 'user1\'s channel',
          isPublic: true,
          ownerMembers: [
            {
              email: 'test1@test.com',
              handleStr: 'test1user',
              nameFirst: 'test1',
              nameLast: 'user',
              uId: 1,
              profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
            },

          ],
          allMembers: [
            {
              email: 'test1@test.com',
              handleStr: 'test1user',
              nameFirst: 'test1',
              nameLast: 'user',
              uId: 1,
              profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
            },
          ]
        });

      // 2. message of the channel with message by user2 is set to removed user
      const input1 = requestChannelMessagesV3(user1.token, public1.channelId, 0);

      expect(input1.messages[0].message).toStrictEqual("user1's message");
      expect(input1.messages[1].message).toStrictEqual('Removed user');
      expect(input1.messages[2].message).toStrictEqual('Removed user');

      const input2 = requestChannelMessagesV3(user1.token, public1.channelId, 0);

      expect(input2.messages[0].message).toStrictEqual("user1's message");
      expect(input2.messages[1].message).toStrictEqual('Removed user');
      expect(input2.messages[2].message).toStrictEqual('Removed user');

      // 3. users/all does not return user2
      expect(requestUsersAllV2(user1.token)).toStrictEqual({
        users: [
          {
            uId: user1.authUserId,
            email: 'test1@test.com',
            nameFirst: 'test1',
            nameLast: 'user',
            handleStr: 'test1user',
            profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
          },

        ]
      });
      // 4. userprofile is retrievable
      expect(requestUserProfileV3(user1.token, user2.authUserId)).toStrictEqual({
        user: {
          uId: user2.authUserId,
          email: 'test2@test.com',
          nameFirst: 'Removed',
          nameLast: 'user',
          handleStr: expect.any(String),
          profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
        }
      });
      // 5. the email and handle is reusable
      expect(requestRegisterV3('test2@test.com', 'password', 'test2', 'user')).toEqual(expect.any(Object));
    });

    test('remove a global owner where there is more than 1 global owner in the dataStore', () => {
      //  user 1 is the global owner
      const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
      // user 2 is to remove
      const user2 = requestRegisterV3('test2@test.com', 'password', 'test2', 'user');
      // user2 become global owner
      expect(requestAdminUserperimissionV1(user1.token, user2.authUserId, 1)).toEqual({});
      expect(requestAdminUserRemoveV1(user1.token, user2.authUserId)).toEqual({});
      // 3. users/all does not return user2
      expect(requestUsersAllV2(user1.token)).toStrictEqual({
        users: [
          {
            uId: user1.authUserId,
            email: 'test1@test.com',
            nameFirst: 'test1',
            nameLast: 'user',
            handleStr: 'test1user',
            profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
          }
        ]
      });
      // 4. userprofile is retrievable
      expect(requestUserProfileV3(user1.token, user2.authUserId)).toStrictEqual({
        user: {
          uId: user2.authUserId,
          email: 'test2@test.com',
          nameFirst: 'Removed',
          nameLast: 'user',
          handleStr: expect.any(String),
          profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
        }
      });
    });
  });
});

/// admin/userpermission/chane/v1

describe('admin/userpermission/chane/v1 testing', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });
  test('token is not valid', () => {
    expect(requestAdminUserperimissionV1('abd', 42, 1)).toEqual(403);
  });

  test('uId is not valid', () => {
    //  user 1 is the global owner
    const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');

    expect(requestAdminUserperimissionV1(user1.token, 42, 1)).toEqual(400);
  });

  test('User is inactive', () => {
    //  user 1 is the global owner
    const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
    const user2 = requestRegisterV3('test2@test.com', 'password', 'test2', 'user');
    expect(requestAdminUserRemoveV1(user1.token, user2.authUserId)).toEqual({});
    expect(requestAdminUserperimissionV1(user1.token, user2.authUserId, 1)).toEqual(403);
  });

  test('uId is the only global owner and is demoted to a user', () => {
    //  user 1 is the global owner
    const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
    // user 2 is to remove
    // user1 is the only global owner
    expect(requestAdminUserperimissionV1(user1.token, user1.authUserId, 2)).toEqual(400);
  });

  test('token is not a global owner', () => {
    //  user 1 is the global owner
    requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
    const user2 = requestRegisterV3('test2@test.com', 'password', 'test1', 'user');
    // user 2 is to remove
    // user1 is the only global owner
    expect(requestAdminUserperimissionV1(user2.token, user2.authUserId, 1)).toEqual(403);
  });

  test('permissionId is invalid', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');

    // user 2 is to remove
    const user2 = requestRegisterV3('test2@test.com', 'password', 'test2', 'user');
    // permission Id is not valid
    expect(requestAdminUserperimissionV1(user1.token, user2.authUserId, 42)).toEqual(400);
  });

  test('user already has the perssions level of permissionId: already member', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
    // user 2 is to remove
    const user2 = requestRegisterV3('test2@test.com', 'password', 'test2', 'user');
    // user1 is the only global owner

    expect(requestAdminUserperimissionV1(user1.token, user2.authUserId, 2)).toEqual(400);
  });

  test('authorised user is not a global owner', () => {
    requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
    // user 2 is to remove
    const user2 = requestRegisterV3('test2@test.com', 'password', 'test2', 'user');
    // user1 is the only global owner
    expect(requestAdminUserperimissionV1(user2.token, user2.authUserId, 1)).toEqual(403);
  });

  test('Success change permission to global owner', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
    // user 2 is to remove
    const user2 = requestRegisterV3('test2@test.com', 'password', 'test2', 'user');
    // user1 is the only global owner
    expect(requestAdminUserperimissionV1(user1.token, user2.authUserId, 1)).toEqual({});
  });
  test('Success change permission to global member where there are 2 global owner in Beans', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
    // user 2 is to remove
    const user2 = requestRegisterV3('test2@test.com', 'password', 'test2', 'user');
    const user3 = requestRegisterV3('test3@test.com', 'password', 'test2', 'user');
    // change user 2 and 3 to global owner
    expect(requestAdminUserperimissionV1(user1.token, user2.authUserId, 1)).toEqual({});
    expect(requestAdminUserperimissionV1(user1.token, user3.authUserId, 1)).toEqual({});
    // user1 to global member
    expect(requestAdminUserperimissionV1(user1.token, user2.authUserId, 2)).toEqual({});
  });

  test('Success change permission to global member', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
    // user 2 is to remove
    const user2 = requestRegisterV3('test2@test.com', 'password', 'test2', 'user');
    requestAdminUserperimissionV1(user1.token, user2.authUserId, 1);
    // user1 is the only global owner
    expect(requestAdminUserperimissionV1(user1.token, user1.authUserId, 2)).toEqual({});
  });
});
