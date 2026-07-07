#!/usr/bin/env node
/**
 * find-duplicate-google-users.js
 *
 * Detects users in the Cognito User Pool that have DUPLICATE email addresses —
 * one native (email/password) account AND one Google_xxx account for the same email.
 *
 * These are accounts created BEFORE the Pre Sign-Up Lambda fix was deployed.
 * You can use this list to decide which pairs to manually merge via AdminLinkProviderForUser.
 *
 * Usage:
 *   node amplify/backend/find-duplicate-google-users.js
 *
 * Requirements:
 *   - AWS CLI configured (or AWS_PROFILE / AWS_ACCESS_KEY_ID env vars set)
 *   - AWS SDK v3 installed: npm install @aws-sdk/client-cognito-identity-provider
 *     (or run from infra/lambda/pre-signup-link-accounts where it's already installed)
 *
 * Output:
 *   Prints a table of duplicate pairs to the console and saves results to
 *   amplify/backend/duplicate-google-users-report.json
 */

'use strict';

const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const fs   = require('fs');
const path = require('path');

const REGION      = 'ap-southeast-1';
const USER_POOL_ID = 'ap-southeast-1_ShCajkmJd';

const client = new CognitoIdentityProviderClient({ region: REGION });

/**
 * Paginate through ALL users in the User Pool.
 * Cognito limits to 60 per page; we follow pagination tokens until done.
 */
async function listAllUsers() {
  const users = [];
  let paginationToken;

  do {
    const cmd = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Limit: 60,
      ...(paginationToken ? { PaginationToken: paginationToken } : {}),
    });

    const result = await client.send(cmd);
    users.push(...(result.Users || []));
    paginationToken = result.PaginationToken;

    process.stdout.write(`\r  Fetched ${users.length} users so far...`);
  } while (paginationToken);

  console.log(`\r  Total users fetched: ${users.length}              `);
  return users;
}

/**
 * Extract the email attribute from a Cognito user object.
 */
function getAttr(user, attrName) {
  const attr = (user.Attributes || []).find((a) => a.Name === attrName);
  return attr ? attr.Value : null;
}

/**
 * Determine the identity provider type for a user.
 * Returns 'Google', 'Facebook', 'native', or 'unknown'.
 */
function getProvider(user) {
  const username = user.Username || '';
  if (/^Google_/i.test(username))           return 'Google';
  if (/^Facebook_/i.test(username))         return 'Facebook';
  if (/^LoginWithAmazon_/i.test(username))  return 'Amazon';
  if (/^SignInWithApple_/i.test(username))  return 'Apple';
  return 'native';
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Duplicate Google User Detector — OpPoCareer Platform');
  console.log(`  Pool: ${USER_POOL_ID} | Region: ${REGION}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  let allUsers;
  try {
    console.log('📋 Fetching all users from Cognito...');
    allUsers = await listAllUsers();
  } catch (err) {
    console.error('❌ Failed to list users:', err.message);
    console.error('   Make sure AWS CLI is configured and you have cognito-idp:ListUsers permission.');
    process.exit(1);
  }

  // ── Group users by email ────────────────────────────────────────────────────
  const emailMap = {}; // email → [user, ...]

  for (const user of allUsers) {
    const email = getAttr(user, 'email');
    if (!email) continue;
    if (!emailMap[email]) emailMap[email] = [];
    emailMap[email].push(user);
  }

  // ── Find emails that have BOTH a native AND a Google user ───────────────────
  const duplicatePairs = [];

  for (const [email, usersWithEmail] of Object.entries(emailMap)) {
    if (usersWithEmail.length < 2) continue;

    const nativeUsers = usersWithEmail.filter((u) => getProvider(u) === 'native');
    const googleUsers = usersWithEmail.filter((u) => getProvider(u) === 'Google');

    if (nativeUsers.length > 0 && googleUsers.length > 0) {
      duplicatePairs.push({
        email,
        nativeAccounts: nativeUsers.map((u) => ({
          username:         u.Username,
          provider:         'native',
          userStatus:       u.UserStatus,
          enabled:          u.Enabled,
          userCreateDate:   u.UserCreateDate,
          userLastModified: u.UserLastModifiedDate,
          sub:              getAttr(u, 'sub'),
          name:             getAttr(u, 'name') || getAttr(u, 'given_name') || '',
        })),
        googleAccounts: googleUsers.map((u) => ({
          username:         u.Username,
          provider:         'Google',
          userStatus:       u.UserStatus,
          enabled:          u.Enabled,
          userCreateDate:   u.UserCreateDate,
          userLastModified: u.UserLastModifiedDate,
          sub:              getAttr(u, 'sub'),
          googleSub:        (u.Username || '').replace(/^Google_/i, ''),
        })),
      });
    }
  }

  // ── Print results ───────────────────────────────────────────────────────────
  console.log('');
  if (duplicatePairs.length === 0) {
    console.log('✅ No duplicate pairs found! Pool is clean.');
  } else {
    console.log(`⚠️  Found ${duplicatePairs.length} duplicate pair(s):\n`);
    console.log('─'.repeat(70));

    for (let i = 0; i < duplicatePairs.length; i++) {
      const pair = duplicatePairs[i];
      console.log(`\n[${i + 1}] Email: ${pair.email}`);
      console.log('    NATIVE account(s):');
      for (const a of pair.nativeAccounts) {
        console.log(`      username : ${a.username}`);
        console.log(`      sub      : ${a.sub}`);
        console.log(`      status   : ${a.userStatus} | enabled: ${a.enabled}`);
        console.log(`      created  : ${a.userCreateDate}`);
        if (a.name) console.log(`      name     : ${a.name}`);
      }
      console.log('    GOOGLE account(s):');
      for (const a of pair.googleAccounts) {
        console.log(`      username : ${a.username}`);
        console.log(`      googleSub: ${a.googleSub}`);
        console.log(`      status   : ${a.userStatus} | enabled: ${a.enabled}`);
        console.log(`      created  : ${a.userCreateDate}`);
      }
    }

    console.log('\n' + '─'.repeat(70));

    // ── Save to JSON file ─────────────────────────────────────────────────────
    const outputFile = path.join(__dirname, 'duplicate-google-users-report.json');
    const report = {
      generatedAt:       new Date().toISOString(),
      userPoolId:        USER_POOL_ID,
      region:            REGION,
      totalUsers:        allUsers.length,
      duplicatePairsCount: duplicatePairs.length,
      pairs:             duplicatePairs,
    };
    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`\n💾 Full report saved to: ${outputFile}`);

    // ── Print AdminLinkProviderForUser commands for each pair ─────────────────
    console.log('\n');
    console.log('─'.repeat(70));
    console.log('📋 AWS CLI commands to MANUALLY LINK each duplicate pair:');
    console.log('   (Run these to merge Google accounts into native accounts)');
    console.log('─'.repeat(70));

    for (const pair of duplicatePairs) {
      const native = pair.nativeAccounts[0];
      for (const google of pair.googleAccounts) {
        console.log(`\n# ${pair.email}`);
        console.log(`aws cognito-idp admin-link-provider-for-user \\`);
        console.log(`  --user-pool-id ${USER_POOL_ID} \\`);
        console.log(`  --destination-user ProviderName=Cognito,ProviderAttributeValue=${native.username} \\`);
        console.log(`  --source-user ProviderName=Google,ProviderAttributeName=Cognito_Subject,ProviderAttributeValue=${google.googleSub} \\`);
        console.log(`  --region ${REGION}`);
        console.log('');
        console.log(`# After linking, delete the orphaned Google account:`);
        console.log(`aws cognito-idp admin-delete-user \\`);
        console.log(`  --user-pool-id ${USER_POOL_ID} \\`);
        console.log(`  --username "${google.username}" \\`);
        console.log(`  --region ${REGION}`);
      }
    }
  }

  console.log('\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Done.');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
