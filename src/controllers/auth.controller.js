const httpStatus = require('http-status');
const axios = require('axios');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { authService, userService, tokenService, emailService } = require('../services');

const AUTH_URL = 'http://ace-hotel-backend-auth-user.vercel.app/v1/auth';
const register = catchAsync(async (req, res) => {
  // const user = await userService.createUser(req.body);
  // const tokens = await tokenService.generateAuthTokens(user);
  // res.status(httpStatus.CREATED).send({ user, tokens });

  // Microservices below
  await axios
    .post(`${AUTH_URL}/register`, req.body)
    .then(function (response) {
      res.status(response.status).send(response.data);
    })
    .catch(function (error) {
      throw new ApiError(error.response.status, error.response.data.message, true, error.response.data.stack);
    });
});

const login = catchAsync(async (req, res) => {
  // const { email, password } = req.body;
  // const user = await authService.loginUserWithEmailAndPassword(email, password);
  // const tokens = await tokenService.generateAuthTokens(user);
  // res.send({ user, tokens });

  // Microservices below
  await axios
    .post(`${AUTH_URL}/login`, req.body)
    .then(function (response) {
      res.status(response.status).send(response.data);
    })
    .catch(function (error) {
      throw new ApiError(error.response.status, error.response.data.message, true, error.response.data.stack);
    });
});

const logout = catchAsync(async (req, res) => {
  // await authService.logout(req.body.refreshToken);
  // res.status(httpStatus.NO_CONTENT).send();

  // Microservices below
  await axios
    .post(`${AUTH_URL}/logout`, req.body)
    .then(function (response) {
      res.status(response.status).send(response.data);
    })
    .catch(function (error) {
      throw new ApiError(error.response.status, error.response.data.message, true, error.response.data.stack);
    });
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
