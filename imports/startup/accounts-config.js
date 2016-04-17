import { Accounts } from 'meteor/accounts-base';

// EmailではなくUsernameをログインに使用するための設定
Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY',
});
