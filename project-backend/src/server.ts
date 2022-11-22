import express, { json, Request, Response } from 'express';
import { echo } from './echo';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
// auth imports
import { authRequestResetToken, authResetPasswordV1 } from './authV1';
import { authLogoutV2 } from './authV2';
import { authLoginV3, authRegisterV3 } from './authV3';
// channels imports
import { channelsCreateV3, channelsListV3, channelsListAllV3 } from './channelsV3';
// user imports
import { userProfileV3 } from './userV3';
import { getAllUsersV2, setEmailV2, setHandleStrV2, setNameV2 } from './userV2';
import { uploadphoto, userStats } from './userV1';
import { usersStats } from './usersV1';
// message imports
import { messageSendV2, messageEditV2, messageRemoveV2 } from './messagesV2';
import { messageReactV1, messageUnReactV1, messageSendLaterDmV1, messageSendLaterV1, messagePinV1, messageUnpinV1, messageShareV1 } from './messageV1';
import { clearV1 } from './other';
// channel
import { channelDetailsV3, channelJoinV3, channelInviteV3, channelMessagesV3 } from './channelV3';
import { channelLeaveV2, channelRemoveOwnerV2, channelAddOwnerV2 } from './channelV2';
// dm imports
import { dmCreateV1, dmRemoveV1, dmLeaveV1, dmSendV2, dmListV2, dmDetailsV1, dmMessagesV2 } from './dmV2';
// import { convertCompilerOptionsFromJson } from 'typescript';
import { adminUserRemoveV1, adminUserpermissionChangeV1 } from './adminV1';
// standup imports
import { standupActiveV1, standupSendV1, standupStartV1 } from './standupV1';
// search import
import { searchV1 } from './searchV1';
// notification import
import { notificationsV1 } from './notificationsV1';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
app.use(morgan('dev'));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

// Example get request
app.get('/echo', (req: Request, res: Response, next) => {
  try {
    const data = req.query.echo as string;
    return res.json(echo(data));
  } catch (err) {
    next(err);
  }
});

// -------------------------------- //
// ------Auth Server Requests------ //

app.post('/auth/register/v3', (req: Request, res: Response, next) => {
  try {
    const registerReturn = authRegisterV3(req.body?.email, req.body?.password, req.body?.nameFirst, req.body?.nameLast);
    return res.json(registerReturn);
  } catch (err) {
    next(err);
  }
});

app.post('/auth/login/v3', (req: Request, res: Response, next) => {
  try {
    const loginReturn = authLoginV3(req.body?.email, req.body?.password);
    return res.json(loginReturn);
  } catch (err) {
    next(err);
  }
});

app.post('/auth/logout/v2', (req: Request, res: Response, next) => {
  try {
    const logoutReturn = authLogoutV2(req.headers.token as string);
    return res.json(logoutReturn);
  } catch (err) {
    next(err);
  }
});

app.post('/auth/passwordreset/request/v1', (req: Request, res: Response, next) => {
  try {
    authRequestResetToken(req.body?.email);
    return res.json({});
  } catch (err) {
    next(err);
  }
});

app.post('/user/profile/uploadphoto/v1', async (req: Request, res: Response, next) => {
  try {
    return res.json(await uploadphoto(req.body?.imgUrl, req.body?.xStart, req.body?.yStart, req.body?.xEnd, req.body?.yEnd, req.headers.token as string));
  } catch (err) {
    next(err);
  }
});

app.post('/auth/passwordreset/reset/v1', (req: Request, res: Response, next) => {
  try {
    const resetReturn = authResetPasswordV1(req.body?.resetCode, req.body?.newPassword);
    return res.json(resetReturn);
  } catch (err) {
    next(err);
  }
});

// -------------------------------- //
// ------User Server Requests------ //

app.get('/user/profile/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    const uId = parseInt(req.query?.uId as string);
    return res.json(userProfileV3(token, uId));
  } catch (err) {
    next(err);
  }
});

app.put('/user/profile/setname/v2', (req: Request, res: Response, next) => {
  try {
    const setNameReturn = setNameV2(req.headers.token as string, req.body?.nameFirst, req.body?.nameLast);
    return res.json(setNameReturn);
  } catch (err) {
    next(err);
  }
});

app.use(express.static('public'));

app.put('/user/profile/setemail/v2', (req: Request, res: Response, next) => {
  try {
    const setEmailReturn = setEmailV2(req.headers.token as string, req.body?.email);
    return res.json(setEmailReturn);
  } catch (err) {
    next(err);
  }
});

app.put('/user/profile/sethandle/v2', (req: Request, res: Response, next) => {
  try {
    const setHandleReturn = setHandleStrV2(req.headers.token as string, req.body?.handleStr);
    return res.json(setHandleReturn);
  } catch (err) {
    next(err);
  }
});

app.get('/user/stats/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    return res.json(userStats(token));
  } catch (err) {
    next(err);
  }
});

// -------------------------------- //
// ------Users Server Requests------ //

app.get('/users/all/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    return res.json(getAllUsersV2(token));
  } catch (err) {
    next(err);
  }
});

app.get('/users/stats/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    return res.json(usersStats(token));
  } catch (err) {
    next(err);
  }
});

// -------------------------------- //
// ----Channels Server Requests---- //

app.post('/channels/create/v3', (req: Request, res: Response, next) => {
  try {
    const createReturn = channelsCreateV3(req.headers.token as string, req.body.name, req.body.isPublic);
    return res.json(createReturn);
  } catch (err) {
    next(err);
  }
});

app.get('/channels/list/v3', (req: Request, res: Response, next) => {
  try {
    const ListReturn = channelsListV3(req.headers.token as string);
    return res.json(ListReturn);
  } catch (err) {
    next(err);
  }
});

app.get('/channels/listAll/v3', (req: Request, res: Response, next) => {
  try {
    const listAllReturn = channelsListAllV3(req.headers.token as string);
    return res.json(listAllReturn);
  } catch (err) {
    next(err);
  }
});

// -------------------------------- //
// ----Channel Server Requests---- //

app.get('/channel/details/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    const channelId = parseInt(req.query.channelId as string);
    const createReturn = channelDetailsV3(token, channelId);
    return res.json(createReturn);
  } catch (err) {
    next(err);
  }
});

app.post('/channel/join/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    const channelId = parseInt(req.body.channelId as string);
    const createReturn = channelJoinV3(token, channelId);
    return res.json(createReturn);
  } catch (err) {
    next(err);
  }
});

app.post('/channel/invite/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    const channelId = parseInt(req.body.channelId as string);
    const uId = parseInt(req.body.uId as string);
    const createReturn = channelInviteV3(token, channelId, uId);
    return res.json(createReturn);
  } catch (err) {
    next(err);
  }
});

app.get('/channel/messages/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    const channelId = parseInt(req.query.channelId as string);
    const start = parseInt(req.query.start as string);
    return res.json(channelMessagesV3(token, channelId, start));
  } catch (err) {
    next(err);
  }
});

app.post('/channel/leave/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    const channelId = parseInt(req.body.channelId as string);
    const createReturn = channelLeaveV2(token, channelId);
    return res.json(createReturn);
  } catch (err) {
    next(err);
  }
});

app.post('/channel/addowner/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    const channelId = parseInt(req.body.channelId as string);
    const uId = parseInt(req.body.uId as string);
    const createReturn = channelAddOwnerV2(token, channelId, uId);
    return res.json(createReturn);
  } catch (err) {
    next(err);
  }
});

app.post('/channel/removeowner/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    const channelId = parseInt(req.body.channelId as string);
    const uId = parseInt(req.body.uId as string);
    const createReturn = channelRemoveOwnerV2(token, channelId, uId);
    return res.json(createReturn);
  } catch (err) {
    next(err);
  }
});

// -------------------------------- //
// ----Message Server Requests----- //

app.post('/message/send/v2', (req: Request, res: Response, next) => {
  try {
    const send = messageSendV2(req.headers.token as string, req.body.channelId, req.body.message);
    return res.json(send);
  } catch (err) {
    next(err);
  }
});

app.put('/message/edit/v2', (req: Request, res: Response, next) => {
  try {
    const edit = messageEditV2(req.headers.token as string, req.body?.messageId, req.body?.message);
    return res.json(edit);
  } catch (err) {
    next(err);
  }
});

app.delete('/message/remove/v2', (req: Request, res: Response, next) => {
  try {
    const remove = messageRemoveV2(req.headers.token as string, parseInt(req.query?.messageId as string));
    return res.json(remove);
  } catch (err) {
    next(err);
  }
});

app.post('/message/senddm/v2', (req:Request, res: Response, next) => {
  try {
    const token = req.headers?.token as string;
    const dmId = parseInt(req.body?.dmId as string);
    const message = req.body.message as string;
    const dmSend = dmSendV2(token, dmId, message);
    return res.json(dmSend);
  } catch (err) {
    next(err);
  }
});

app.post('/message/share/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    const ogMessageId = parseInt(req.body.ogMessageId as string);
    const message = req.body?.message as string;
    const channelId = parseInt(req.body.channelId as string);
    const dmId = parseInt(req.body.dmId as string);
    const share = messageShareV1(token, ogMessageId, message, channelId, dmId);
    return res.json(share);
  } catch (err) {
    next(err);
  }
});

app.post('/message/react/v1', (req:Request, res: Response, next) => {
  try {
    const token = req.headers?.token as string;
    const messageId = parseInt(req.body?.messageId as string);
    const reactId = parseInt(req.body.reactId as string);
    const react = messageReactV1(token, messageId, reactId);
    return res.json(react);
  } catch (err) {
    next(err);
  }
});

app.post('/message/unreact/v1', (req:Request, res: Response, next) => {
  try {
    const token = req.headers?.token as string;
    const messageId = parseInt(req.body?.messageId as string);
    const reactId = parseInt(req.body.reactId as string);
    const react = messageUnReactV1(token, messageId, reactId);
    return res.json(react);
  } catch (err) {
    next(err);
  }
});

app.post('/message/pin/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    const messageId = parseInt(req.body.messageId as string);
    const pin = messagePinV1(token, messageId);
    return res.json(pin);
  } catch (err) {
    next(err);
  }
});

app.post('/message/unpin/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    const messageId = parseInt(req.body.messageId as string);
    const unpin = messageUnpinV1(token, messageId);
    return res.json(unpin);
  } catch (err) {
    next(err);
  }
});

app.post('/message/sendlater/v1', async (req: Request, res: Response, next) => {
  try {
    const send = await messageSendLaterV1(req.headers.token as string, req.body?.channelId, req.body?.message, req.body?.timeSent);
    return res.json(send);
  } catch (err) {
    next(err);
  }
});

app.post('/message/sendlaterdm/v1', async (req: Request, res: Response, next) => {
  try {
    const send = await messageSendLaterDmV1(req.headers.token as string, req.body?.dmId, req.body?.message, req.body?.timeSent);
    return res.json(send);
  } catch (err) {
    next(err);
  }
});

// -------------------------------- //
// -------Dm Server Requests------- //

app.post('/dm/create/v2', (req:Request, res: Response, next) => {
  try {
    const dmCreatereturn = dmCreateV1(req.headers.token as string, req.body.uIds);
    return res.json(dmCreatereturn);
  } catch (err) {
    next(err);
  }
});

app.get('/dm/list/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.headers?.token as string;
    return res.json(dmListV2(token));
  } catch (err) {
    next(err);
  }
});

app.delete('/dm/remove/v2', (req: Request, res: Response, next) => {
  try {
    const dmId = parseInt(req.query.dmId as string);
    return res.json(dmRemoveV1(req.headers.token as string, dmId));
  } catch (err) {
    next(err);
  }
});

app.get('/dm/details/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.headers?.token as string;
    const dmId = parseInt(req.query?.dmId as string);
    return res.json(dmDetailsV1(token, dmId));
  } catch (err) {
    next(err);
  }
});

app.post('/dm/leave/v2', (req:Request, res: Response, next) => {
  try {
    const dmLeavereturn = dmLeaveV1(req.headers.token as string, req.body.dmId);
    return res.json(dmLeavereturn);
  } catch (err) {
    next(err);
  }
});

app.get('/dm/messages/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.headers?.token as string;
    const dmId = parseInt(req.query?.dmId as string);
    const start = parseInt(req.query?.start as string);
    return res.json(dmMessagesV2(token, dmId, start));
  } catch (err) {
    next(err);
  }
});

// -------------------------------- //
// --------Standup Requests-------- //

app.post('/standup/start/v1', (req: Request, res: Response, next) => {
  const channelId = parseInt(req.body.channelId as string);
  const length = parseInt(req.body.length as string);
  try {
    return res.json(standupStartV1(req.headers.token as string, channelId, length));
  } catch (err) {
    next(err);
  }
});

app.get('/standup/active/v1', (req: Request, res: Response, next) => {
  try {
    const channelId = parseInt(req.query.channelId as string);
    return res.json(standupActiveV1(req.headers.token as string, channelId));
  } catch (err) {
    next(err);
  }
});

app.post('/standup/send/v1', (req: Request, res: Response, next) => {
  try {
    const channelId = parseInt(req.body.channelId as string);
    const message = req.body.message as string;
    return res.json(standupSendV1(req.headers.token as string, channelId, message));
  } catch (err) {
    next(err);
  }
});

// -------------------------------- //
// ------Clear Server Request------ //

app.delete('/clear/v1', (req: Request, res: Response) => {
  clearV1();
  return res.json({});
});

// ----------------------------------- //
// ---Notifications Server Request--- //
app.get('/notifications/get/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    return res.json(notificationsV1(token));
  } catch (err) {
    next(err);
  }
});

// ----------------------------- //
// ---Search Server Requests--- //
app.get('/search/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    const queryStr = req.query.queryStr as string;
    return res.json(searchV1(token, queryStr));
  } catch (err) {
    next(err);
  }
});

// ----------------------------- //
// ---Admin Request--- //
app.delete('/admin/user/remove/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    const uId = parseInt(req.query.uId as string);
    return res.json(adminUserRemoveV1(token, uId));
  } catch (err) {
    next(err);
  }
});

app.post('/admin/userpermission/change/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.headers.token as string;
    const uId = parseInt(req.body.uId as string);
    const permissionId = parseInt(req.body.permissionId as string);
    return res.json(adminUserpermissionChangeV1(token, uId, permissionId));
  } catch (err) {
    next(err);
  }
});

// handles errors nicely
app.use(errorHandler());

// Starting server below
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server listening on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
