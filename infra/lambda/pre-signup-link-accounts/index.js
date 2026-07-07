/**
 * Pre Sign-Up Lambda Trigger — Auto-link Google accounts to existing email/password accounts
 *
 * Cognito User Pool: ap-southeast-1_ShCajkmJd (OpPoWebUserPool)
 * Region: ap-southeast-1
 *
 * Problem solved:
 *   When a user who already has a native email/password account (e.g. abc@gmail.com)
 *   signs in via Google with the same email, Cognito creates a BRAND NEW user (Google_xxxxx)
 *   instead of reusing the existing account. This Lambda detects that scenario and
 *   links the Google identity to the existing native account, preventing duplicate users.
 *
 * How it works:
 *   1. Fires only for external provider sign-ups (PreSignUp_ExternalProvider)
 *   2. Extracts the email from the incoming Google user attributes
 *   3. Searches the User Pool for an existing native user with the same email
 *   4. If found, calls AdminLinkProviderForUser to merge the Google identity into
 *      the existing native account — no new user is created
 *   5. Returns event with autoConfirmUser=true so Cognito doesn't block the flow
 *   6. All errors are caught and logged to CloudWatch; the flow is never blocked
 *      even if the link operation fails (fail-open strategy)
 */

'use strict';

const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminLinkProviderForUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });

/**
 * Parse the Google "sub" (subject ID) from the event.
 *
 * Cognito sets event.userName to something like:
 *   "Google_105123456789012345678"
 * The part after "Google_" is the Google subject ID used for linking.
 */
function extractGoogleSub(event) {
  // Prefer the explicit sub attribute when available
  const subFromAttr = event.request?.userAttributes?.sub;
  if (subFromAttr) return subFromAttr;

  // Fall back to parsing from userName
  const userName = event.userName || '';
  const match = userName.match(/^Google_(.+)$/i);
  return match ? match[1] : null;
}

exports.handler = async (event) => {
  console.log('[PreSignUp] Trigger fired. triggerSource:', event.triggerSource, '| userName:', event.userName);

  // ── Only act on external provider sign-ups ────────────────────────────────
  if (event.triggerSource !== 'PreSignUp_ExternalProvider') {
    console.log('[PreSignUp] Not an external provider sign-up, skipping.');
    return event;
  }

  // ── Extract email ─────────────────────────────────────────────────────────
  const email = event.request?.userAttributes?.email;
  if (!email) {
    console.warn('[PreSignUp] No email in userAttributes, skipping link attempt.');
    return event;
  }

  const userPoolId = event.userPoolId;
  console.log(`[PreSignUp] Processing Google sign-in for email: ${email} | Pool: ${userPoolId}`);

  // ── Always set these so Cognito doesn't block the flow ───────────────────
  event.response.autoConfirmUser  = true;
  event.response.autoVerifyEmail  = true;

  try {
    // ── Search for existing native (email/password) user with same email ────
    console.log(`[PreSignUp] Searching for existing native user with email: ${email}`);

    const listResult = await client.send(new ListUsersCommand({
      UserPoolId: userPoolId,
      Filter: `email = "${email}"`,
      Limit: 10,
    }));

    const users = listResult.Users || [];
    console.log(`[PreSignUp] ListUsers returned ${users.length} user(s) for email ${email}`);

    // Find a native user (username does NOT start with "Google_" or other provider prefix)
    const nativeUser = users.find((u) => {
      const uname = u.Username || '';
      // Native Cognito users typically have a UUID username or the email itself.
      // External provider users always have a prefix like "Google_", "Facebook_", etc.
      return !uname.match(/^(Google|Facebook|LoginWithAmazon|SignInWithApple)_/i);
    });

    if (!nativeUser) {
      console.log(`[PreSignUp] No existing native user found for ${email}. New Google account will be created normally.`);
      return event;
    }

    console.log(`[PreSignUp] Found existing native user: "${nativeUser.Username}" — will link Google identity.`);

    // ── Extract Google sub for the SourceUser ────────────────────────────────
    const googleSub = extractGoogleSub(event);
    if (!googleSub) {
      console.warn('[PreSignUp] Could not extract Google sub from event. Skipping link.');
      return event;
    }

    console.log(`[PreSignUp] Google sub: ${googleSub}`);

    // ── Link Google identity → existing native account ───────────────────────
    await client.send(new AdminLinkProviderForUserCommand({
      UserPoolId: userPoolId,
      DestinationUser: {
        // The existing native Cognito user to link TO
        ProviderName: 'Cognito',
        ProviderAttributeValue: nativeUser.Username,
      },
      SourceUser: {
        // The incoming Google user to link FROM
        ProviderName: 'Google',
        ProviderAttributeName: 'Cognito_Subject',
        ProviderAttributeValue: googleSub,
      },
    }));

    console.log(`[PreSignUp] ✅ Successfully linked Google_${googleSub} → native user "${nativeUser.Username}" (email: ${email})`);

  } catch (err) {
    // Log the error but do NOT re-throw — we must not block the user's login flow.
    // The worst case is the user gets a duplicate account; the best case is the link
    // works and they see their existing data.
    console.error('[PreSignUp] ❌ Error during account linking:', err?.name, err?.message);
    console.error('[PreSignUp] Full error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
  }

  return event;
};
