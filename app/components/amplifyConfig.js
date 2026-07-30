import { Amplify } from "aws-amplify";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { CookieStorage } from "aws-amplify/utils";

export function initAmplify() {
  const userPoolId =
    process.env.NEXT_PUBLIC_USER_POOL_ID;

  const userPoolClientId =
    process.env
      .NEXT_PUBLIC_USER_POOL_CLIENT_ID;

  if (!userPoolId || !userPoolClientId) {
    console.error(
      "Amplify configuration missing"
    );
    return false;
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
      },
    },
  });

  // cognitoUserPoolsTokenProvider.setKeyValueStorage(
  //   new CookieStorage({
  //     domain: ".revealnext.com",
  //     secure: true,
  //     sameSite: "lax",
  //     path: "/",
  //     expires: 30, // days
  //   })
  // );

  return true;
}