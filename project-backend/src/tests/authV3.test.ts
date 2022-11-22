import { authRequestResetToken } from '../authV1';
import {
  requestRegisterV3,
  requestLoginV3,
  requestLogoutV2,
  requestUserProfileV3,
  requestClearV1,
  requestUsersAllV2,
  requestPasswordResetV1,
  requestResetPasswordV1,
  requestAdminUserRemoveV1
} from './testRequestRoutes';

describe('authRegisterV3 Tests', () => {
  requestClearV1();

  test('Email in not valid', () => {
    expect(requestRegisterV3('notanemail', 'password', 'Test', 'User')).toEqual(400);
  });

  test('Password is to short', () => {
    expect(requestRegisterV3('test@test.com', 'short', 'Test', 'User')).toEqual(400);
  });

  test('firstname is to short', () => {
    expect(requestRegisterV3('test@test.com', 'password', '', 'User')).toEqual(400);
  });

  test('firstname is to long', () => {
    expect(requestRegisterV3('test@test.com', 'password', 't'.repeat(51), 'User')).toEqual(400);
  });

  test('lastname is to short', () => {
    expect(requestRegisterV3('test@test.com', 'password', 'Test', '')).toEqual(400);
  });

  test('lastname is to long', () => {
    expect(requestRegisterV3('test@test.com', 'password', 'Test', 'U'.repeat(51))).toEqual(400);
  });

  const user1 = requestRegisterV3('test@test.com', 'password', 'Test', 'User');
  const user1Profile = requestUserProfileV3(user1.token, user1.authUserId);

  test('valid Register', () => {
    expect(user1).toStrictEqual({ authUserId: expect.any(Number), token: expect.any(String) });
    const handleStr = user1Profile.user.handleStr;
    expect(handleStr).toStrictEqual('testuser');
  });

  const user2 = requestRegisterV3('test2@test.com', 'password', 'Test2', 'User');
  const user2Profile = requestUserProfileV3(user2.token, user2.authUserId);

  test('valid Register #2, checking for different id', () => {
    expect(user2).toStrictEqual({ authUserId: expect.any(Number), token: expect.any(String) });
    expect(user2 !== user1);
    const handleStr = user2Profile.user.handleStr;
    expect(handleStr).toStrictEqual('test2user');
  });

  const user3 = requestRegisterV3('test3@test.com', 'password', 'Test2', 'User');
  const user3Profile = requestUserProfileV3(user3.token, user3.authUserId);

  test('valid Register #3 Same Handle', () => {
    expect(user3).toStrictEqual({ authUserId: expect.any(Number), token: expect.any(String) });
    expect(user3 !== user2 && user3 !== user1);
    const handleStr = user3Profile.user.handleStr;
    expect(handleStr).toStrictEqual('test2user0');
  });

  const user4 = requestRegisterV3('test4@test.com', 'password', 'Test2', 'User');
  const user4Profile = requestUserProfileV3(user4.token, user4.authUserId);

  test('valid Register #4 Same Handle', () => {
    expect(user4).toStrictEqual({ authUserId: expect.any(Number), token: expect.any(String) });
    expect(user4 !== user1 && user4 !== user2 && user4 !== user3);
    const handleStr = user4Profile.user.handleStr;
    expect(handleStr).toStrictEqual('test2user1');
  });

  const user5 = requestRegisterV3('test5@test.com', 'password', 'ReallyLongTest', 'UserName');
  const user5Profile = requestUserProfileV3(user5.token, user5.authUserId);

  test('valid Register #5 Same Handle', () => {
    expect(user5).toStrictEqual({ authUserId: expect.any(Number), token: expect.any(String) });
    expect(user5 !== user1 && user5 !== user2 && user5 !== user3 && user5 !== user4);
    const handleStr = user5Profile.user.handleStr;
    expect(handleStr).toStrictEqual('reallylongtestuserna');
  });

  const user6 = requestRegisterV3('test6@test.com', 'password', 'ReallyLongTest', 'UserName');
  const user6Profile = requestUserProfileV3(user6.token, user6.authUserId);

  test('valid Register #6 Duplicate Long Handle', () => {
    expect(user6).toStrictEqual({ authUserId: expect.any(Number), token: expect.any(String) });
    expect(user6 !== user1 && user6 !== user2 && user6 !== user3 && user6 !== user4 && user6 !== user5);
    const handleStr = user6Profile.user.handleStr;
    expect(handleStr).toStrictEqual('reallylongtestuserna0');
  });

  test('Duplicate handle edge case (number at end of handle)', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'Test', 'User');
    const user2 = requestRegisterV3('test2@test.com', 'password', 'Test', 'User0');
    const user3 = requestRegisterV3('test3@test.com', 'password', 'Test', 'User');

    const result = requestUsersAllV2(user1.token);
    const expectedUserTest = [
      { email: 'test1@test.com', handleStr: 'testuser', nameFirst: 'Test', nameLast: 'User', uId: user1.authUserId, profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg' },
      { email: 'test2@test.com', handleStr: 'testuser0', nameFirst: 'Test', nameLast: 'User0', uId: user2.authUserId, profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg' },
      { email: 'test3@test.com', handleStr: 'testuser1', nameFirst: 'Test', nameLast: 'User', uId: user3.authUserId, profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg' }
    ];
    expect(result.users).toEqual(expectedUserTest);
  });

  test('authRegisterV1 already Registered', () => {
    requestClearV1();
    requestRegisterV3('test@test.com', 'password', 'Test', 'User');
    expect(requestRegisterV3('test@test.com', 'password', 'Test', 'User')).toEqual(400);
  });
});

describe('authLoginV3 Tests', () => {
  requestClearV1();
  test('Success login', () => {
    requestRegisterV3('test@test.com', 'password', 'Test', 'User');
    expect(requestLoginV3('test@test.com', 'password')).toStrictEqual({ token: expect.any(String), authUserId: expect.any(Number) });
  });

  test('User email does not exist', () => {
    expect(requestLoginV3('notauser@test.com', 'password')).toEqual(400);
  });

  test('User inactive', () => {
    requestClearV1();
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    expect(requestAdminUserRemoveV1(token.token, token2.authUserId)).toEqual({});
    expect(requestLoginV3('notauser@test.com', 'password')).toEqual(400);
  });

  test('Password Incorrect', () => {
    expect(requestLoginV3('test@test.com', 'wrongpassword')).toEqual(400);
  });
}
);

describe('authLogoutV2 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Logout Test', () => {
    const user = requestRegisterV3('test@test.com', 'password', 'Test', 'User');
    const userProfile = requestUserProfileV3(user.token, user.authUserId);
    const handleStr = userProfile.user.handleStr;
    expect(handleStr).toStrictEqual('testuser');
    expect(requestLogoutV2(user.token)).toStrictEqual({});
    expect(requestUserProfileV3(user.token, user.uId)).toStrictEqual(403);
    expect(requestLogoutV2(user.token)).toEqual(403);
  });

  test('Multiple session logout', () => {
    const user = requestRegisterV3('test10@test.com', 'password', 'Test', 'User');
    const token1 = user.token;
    const token2 = requestLoginV3('test10@test.com', 'password').token;

    const userProfile1 = requestUserProfileV3(token1, user.authUserId);
    const userProfile2 = requestUserProfileV3(token2, user.authUserId);
    expect(userProfile1).toStrictEqual(userProfile2);

    requestLogoutV2(token2);
    const userProfile3 = requestUserProfileV3(token2, user.authUserId);
    expect(userProfile3).toStrictEqual(403);
    const userProfile4 = requestUserProfileV3(token1, user.authUserId);
    const result1 = {
      user: {
        email: 'test10@test.com',
        handleStr: 'testuser',
        nameFirst: 'Test',
        nameLast: 'User',
        uId: user.authUserId,
        profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
      }
    };
    expect(userProfile4).toStrictEqual(result1);
  });

  test('Multiple session logout #2', () => {
    requestClearV1();
    const user = requestRegisterV3('test10@test.com', 'password', 'Test', 'User');
    const token1 = user.token;
    const token2 = requestLoginV3('test10@test.com', 'password').token;

    const userProfile1 = requestUserProfileV3(token1, user.authUserId);
    const userProfile2 = requestUserProfileV3(token2, user.authUserId);
    expect(userProfile1).toStrictEqual(userProfile2);

    requestLogoutV2(token1);
    const userProfile3 = requestUserProfileV3(token1, user.authUserId);
    expect(userProfile3).toStrictEqual(403);
    const userProfile4 = requestUserProfileV3(token2, user.authUserId);
    const result1 = {
      user: {
        email: 'test10@test.com',
        handleStr: 'testuser',
        nameFirst: 'Test',
        nameLast: 'User',
        uId: user.authUserId,
        profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
      }
    };
    expect(userProfile4).toStrictEqual(result1);
  });
});

describe('auth/passwordreset/request/v1', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Password Reset Request', () => {
    requestRegisterV3('test@test.com', 'password', 'Test', 'User');
    expect(requestPasswordResetV1('test@test.com')).toStrictEqual({});
  });

  test('Password Reset Request wrong email', () => {
    expect(requestPasswordResetV1('test@test.com')).toStrictEqual({});
  });
});

describe('auth/passwordreset/reset/v1', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('resetCode is not a valid reset code', () => {
    expect(requestResetPasswordV1('NotAToken', 'newPassword')).toEqual(400);
  });

  test('new password to short', () => {
    requestRegisterV3('test@test.com', 'password', 'Test', 'User');
    const resetToken = authRequestResetToken('test@test.com').token;
    expect(requestResetPasswordV1(resetToken, 'Pass')).toEqual(400);
  });

  test('validPasswordReset', () => {
    requestRegisterV3('test@test.com', 'password', 'Test', 'User');
    const resetToken = authRequestResetToken('test@test.com').token;
    requestResetPasswordV1(resetToken, 'newPassword');
  });

  // test('Email Password Reset Token', () => {
  //   requestRegisterV3('ethanivanier@gmail.com', 'password', 'Test', 'User');
  //   expect(requestPasswordResetV1('ethanivanier@gmail.com')).toEqual(200);
  // });
});
