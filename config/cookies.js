const isProd = () => process.env.NODE_ENV === 'production';

function cookieBase() {
  return {
    httpOnly: true,
    secure: isProd(),
    sameSite: 'lax',
    path: '/'
  };
}

function authCookieOptions() {
  return {
    ...cookieBase(),
    maxAge: 3 * 24 * 60 * 60 * 1000
  };
}

function authCookieClearOptions() {
  return cookieBase();
}

module.exports = { authCookieOptions, authCookieClearOptions, isProd };
