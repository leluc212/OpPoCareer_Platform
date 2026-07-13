const AWS = require('aws-sdk');

const cognito = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });
const docClient = new AWS.DynamoDB.DocumentClient();

// ── Constants ──────────────────────────────────────────────────────────────────
const USERS_TABLE = process.env.USERS_TABLE_NAME || process.env.USERS_TABLE || 'Users';
// GSI name on the Users table that indexes by email (must exist in DynamoDB).
// If the GSI does not exist yet, this lookup will throw and we fall through to
// the normal sub-based upsert (fail-open).
const EMAIL_GSI = process.env.EMAIL_GSI_NAME || 'email-index';

function parseIdentityProvider(attrs) {
  // Social users often include `identities` claim; fallback to Cognito local.
  try {
    const identitiesRaw = attrs.identities;
    if (!identitiesRaw) return 'COGNITO';
    const identities = JSON.parse(identitiesRaw);
    const providerName = identities && identities[0] && identities[0].providerName;
    return providerName ? providerName.toUpperCase() : 'COGNITO';
  } catch (err) {
    console.warn('Could not parse identities attribute', err && err.message);
    return 'COGNITO';
  }
}

function isExternalProvider(username) {
  return /^(Google|Facebook|LoginWithAmazon|SignInWithApple)_/i.test(username || '');
}

async function assignGroup(userPoolId, username, role) {
  const groupName = role === 'employer' ? 'Employer' : 'Candidate';
  console.log(`Adding user ${username} to group ${groupName} in pool ${userPoolId}`);
  await cognito.adminAddUserToGroup({
    UserPoolId: userPoolId,
    Username: username,
    GroupName: groupName,
  }).promise();
}

/**
 * Look up an existing user record in DynamoDB by email via the email GSI.
 * Returns the record (plain object) or null if not found / GSI unavailable.
 */
async function findUserByEmail(email) {
  if (!email) return null;
  try {
    const result = await docClient.query({
      TableName: USERS_TABLE,
      IndexName: EMAIL_GSI,
      KeyConditionExpression: '#email = :email',
      ExpressionAttributeNames: { '#email': 'email' },
      ExpressionAttributeValues: { ':email': email },
      Limit: 1,
    }).promise();
    return (result.Items && result.Items.length > 0) ? result.Items[0] : null;
  } catch (err) {
    // GSI may not exist yet — log and return null so we fall through to sub-based upsert.
    console.warn('[postConfirmation] findUserByEmail failed (GSI may not exist):', err.message);
    return null;
  }
}

/**
 * Upsert the user record in DynamoDB.
 *
 * Key invariant: we ALWAYS write to the NATIVE user's sub (userId).
 *
 * When this trigger fires for a Google user (PostConfirmation_ConfirmFederatedIdentity),
 * the email may already belong to a native user whose sub is DIFFERENT from the
 * Google user's sub.  In that case we update the existing native record instead of
 * inserting a new row — preventing duplicate DynamoDB records even if the Pre Sign-Up
 * linking step failed for any reason.
 */
async function upsertUserRecord(attrs, role, triggerSource, username) {
  const googleSub = attrs.sub;   // sub from the event — may be Google user's sub
  const email     = attrs.email || '';
  const fullName  = attrs.name || attrs.given_name || '';
  const provider  = parseIdentityProvider(attrs);
  const now       = new Date().toISOString();

  if (!googleSub) {
    console.warn('[postConfirmation] Missing sub claim, skipping user upsert');
    return;
  }

  // ── For external-provider confirmations, check if a native record already
  //    exists for this email.  If yes, update THAT record (not a new one).
  let resolvedUserId = googleSub;
  const isSocial = isExternalProvider(username) ||
                   triggerSource === 'PostConfirmation_ConfirmFederatedIdentity';

  if (isSocial && email) {
    console.log(`[postConfirmation] Social user detected. Looking up existing record for email: ${email}`);
    const existing = await findUserByEmail(email);
    if (existing && existing.userId && existing.userId !== googleSub) {
      console.log(`[postConfirmation] Found existing native record (userId: ${existing.userId}) for email ${email}. ` +
                  `Using native userId instead of Google sub ${googleSub}.`);
      resolvedUserId = existing.userId;
    } else if (!existing) {
      console.log(`[postConfirmation] No existing record for email ${email}. Creating new record with sub ${googleSub}.`);
    }
  }

  console.log(`[postConfirmation] Upserting userId=${resolvedUserId} email=${email || '(none)'}`);

  await docClient.update({
    TableName: USERS_TABLE,
    Key: { userId: resolvedUserId },
    UpdateExpression: [
      'SET #email = :email',
      '#fullName = if_not_exists(#fullName, :fullName)',
      '#role = if_not_exists(#role, :role)',
      '#provider = :provider',
      '#isActive = :isActive',
      '#updatedAt = :updatedAt',
      '#lastLoginAt = :lastLoginAt',
      '#createdAt = if_not_exists(#createdAt, :createdAt)',
    ].join(', '),
    ExpressionAttributeNames: {
      '#email':       'email',
      '#fullName':    'fullName',
      '#role':        'role',
      '#provider':    'provider',
      '#isActive':    'isActive',
      '#updatedAt':   'updatedAt',
      '#lastLoginAt': 'lastLoginAt',
      '#createdAt':   'createdAt',
    },
    ExpressionAttributeValues: {
      ':email':       email,
      ':fullName':    fullName,
      ':role':        role,
      ':provider':    provider,
      ':isActive':    true,
      ':updatedAt':   now,
      ':lastLoginAt': now,
      ':createdAt':   now,
    },
  }).promise();

  console.log(`[postConfirmation] ✅ Upserted user profile in ${USERS_TABLE} for ${email || resolvedUserId}`);
}

exports.handler = async (event) => {
  // Post-confirmation: assign default group and persist user profile in DynamoDB.
  const userPoolId     = event.userPoolId;
  const username       = event.userName;
  const triggerSource  = event.triggerSource || '';
  const attrs          = event.request && event.request.userAttributes
    ? event.request.userAttributes
    : {};

  console.log(`[postConfirmation] triggerSource: ${triggerSource} | username: ${username}`);

  // For social login where custom:role is absent, default to candidate.
  const role = (attrs['custom:role'] || attrs.role || 'candidate').toLowerCase() === 'employer'
    ? 'employer'
    : 'candidate';

  try {
    await assignGroup(userPoolId, username, role);
  } catch (err) {
    // Do not block sign-in flow if group assignment fails.
    console.error('[postConfirmation] Failed assigning user to group', err);
  }

  try {
    await upsertUserRecord(attrs, role, triggerSource, username);
  } catch (err) {
    // Do not block sign-in flow if DB upsert fails.
    console.error('[postConfirmation] Failed upserting user profile', err);
  }

  return event;
};
