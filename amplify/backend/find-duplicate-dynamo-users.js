#!/usr/bin/env node
/**
 * find-duplicate-dynamo-users.js
 *
 * Scans the DynamoDB Users table, groups records by email, and prints all emails
 * that have MORE THAN ONE record — these are duplicate user rows created before
 * the Pre Sign-Up Lambda fix was fully deployed.
 *
 * This script is READ-ONLY. It never modifies or deletes anything.
 * Review the output manually before deciding how to merge/clean records.
 *
 * Usage:
 *   node amplify/backend/find-duplicate-dynamo-users.js
 *
 *   # Override table name:
 *   USERS_TABLE=MyUsers node amplify/backend/find-duplicate-dynamo-users.js
 *
 * Requirements:
 *   - AWS credentials configured (aws configure / env vars)
 *   - @aws-sdk/lib-dynamodb + @aws-sdk/client-dynamodb installed
 *     (already available in infra/lambda/pre-signup-link-accounts/node_modules)
 *
 * Output:
 *   - Console table of duplicate groups
 *   - JSON report saved to amplify/backend/duplicate-dynamo-users-report.json
 */

'use strict';

const { DynamoDBClient }              = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const REGION      = process.env.AWS_REGION  || 'ap-southeast-1';
const TABLE_NAME  = process.env.USERS_TABLE || 'Users';
const OUTPUT_FILE = path.join(__dirname, 'duplicate-dynamo-users-report.json');

// ── DynamoDB client ────────────────────────────────────────────────────────────
const raw    = new DynamoDBClient({ region: REGION });
const client = DynamoDBDocumentClient.from(raw, {
  marshallOptions:   { removeUndefinedValues: true },
  unmarshallOptions: { wrapNumbers: false },
});

/**
 * Full table scan with pagination.
 * Yields all items from the Users table.
 */
async function scanAll() {
  const items = [];
  let lastKey;

  do {
    const cmd = new ScanCommand({
      TableName: TABLE_NAME,
      // Only project the fields we need — cheaper read units
      ProjectionExpression: 'userId, email, #r, provider, createdAt, updatedAt, fullName',
      ExpressionAttributeNames: { '#r': 'role' },
      ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
    });

    const result = await client.send(cmd);
    items.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;

    process.stdout.write(`\r  Scanned ${items.length} items so far...`);
  } while (lastKey);

  console.log(`\r  Total items scanned: ${items.length}              `);
  return items;
}

async function main() {
  console.log('');
  console.log('══════════════════════════════════════════════════════════');
  console.log('  DynamoDB Duplicate User Detector — OpPoCareer Platform');
  console.log(`  Table: ${TABLE_NAME} | Region: ${REGION}`);
  console.log('══════════════════════════════════════════════════════════');
  console.log('');

  let items;
  try {
    console.log(`📋 Scanning DynamoDB table "${TABLE_NAME}"...`);
    items = await scanAll();
  } catch (err) {
    console.error('❌ Scan failed:', err.message);
    console.error('   Make sure AWS credentials are configured and the table exists.');
    process.exit(1);
  }

  // ── Group by email ──────────────────────────────────────────────────────────
  const emailMap = {};   // email → [item, ...]
  const noEmail  = [];   // items without email field

  for (const item of items) {
    const email = (item.email || '').trim().toLowerCase();
    if (!email) {
      noEmail.push(item);
      continue;
    }
    if (!emailMap[email]) emailMap[email] = [];
    emailMap[email].push(item);
  }

  // ── Find duplicate groups ───────────────────────────────────────────────────
  const duplicateGroups = Object.entries(emailMap)
    .filter(([, group]) => group.length > 1)
    .map(([email, group]) => {
      // Sort: native (COGNITO provider) first, Google last
      group.sort((a, b) => {
        const pa = (a.provider || '').toUpperCase();
        const pb = (b.provider || '').toUpperCase();
        if (pa === 'COGNITO' && pb !== 'COGNITO') return -1;
        if (pb === 'COGNITO' && pa !== 'COGNITO') return  1;
        // Older record first within same provider
        return (a.createdAt || '') < (b.createdAt || '') ? -1 : 1;
      });

      return { email, count: group.length, records: group };
    });

  // ── Print results ───────────────────────────────────────────────────────────
  console.log('');

  if (duplicateGroups.length === 0) {
    console.log('✅ No duplicate email groups found in DynamoDB. Table is clean.');
  } else {
    console.log(`⚠️  Found ${duplicateGroups.length} email(s) with multiple DynamoDB records:\n`);
    console.log('─'.repeat(72));

    for (let i = 0; i < duplicateGroups.length; i++) {
      const { email, records } = duplicateGroups[i];
      console.log(`\n[${i + 1}] Email: ${email}  (${records.length} records)`);

      for (const rec of records) {
        console.log(`    ┌─ userId   : ${rec.userId}`);
        console.log(`    │  provider : ${rec.provider || '(none)'}`);
        console.log(`    │  role     : ${rec.role || '(none)'}`);
        console.log(`    │  fullName : ${rec.fullName || '(none)'}`);
        console.log(`    │  created  : ${rec.createdAt || '(none)'}`);
        console.log(`    └─ updated  : ${rec.updatedAt || '(none)'}`);
      }

      // Identify likely "keeper" record (oldest COGNITO provider, or oldest overall)
      const keeper = records[0];
      const orphans = records.slice(1);
      console.log(`\n    → SUGGESTED keeper  : ${keeper.userId} (${keeper.provider || '?'}, created ${keeper.createdAt || '?'})`);
      for (const o of orphans) {
        console.log(`    → SUGGESTED orphan  : ${o.userId} (${o.provider || '?'}) — review & delete after merging`);
      }
    }

    console.log('\n' + '─'.repeat(72));

    if (noEmail.length > 0) {
      console.log(`\n⚠️  ${noEmail.length} record(s) have no email field (userId only — cannot group):`);
      for (const r of noEmail) {
        console.log(`    userId: ${r.userId}  role: ${r.role || '?'}  provider: ${r.provider || '?'}`);
      }
      console.log('');
    }

    // ── Save JSON report ────────────────────────────────────────────────────
    const report = {
      generatedAt:        new Date().toISOString(),
      table:              TABLE_NAME,
      region:             REGION,
      totalItems:         items.length,
      itemsWithoutEmail:  noEmail.length,
      duplicateEmailCount: duplicateGroups.length,
      groups:             duplicateGroups,
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`\n💾 Full report saved to: ${OUTPUT_FILE}`);

    // ── Print suggested merge strategy ─────────────────────────────────────
    console.log('');
    console.log('─'.repeat(72));
    console.log('📋 Suggested merge approach for each duplicate group:');
    console.log('─'.repeat(72));
    console.log('');
    console.log('  For each group:');
    console.log('  1. Keep the OLDEST record (shown as "keeper" above) — it has the');
    console.log('     canonical userId that other tables (Applications, etc.) reference.');
    console.log('  2. If the orphan record has a role/profile that the keeper lacks,');
    console.log('     copy those fields to the keeper manually.');
    console.log('  3. Delete the orphan record from DynamoDB:');
    console.log('');
    console.log('     aws dynamodb delete-item \\');
    console.log(`       --table-name ${TABLE_NAME} \\`);
    console.log('       --key \'{"userId":{"S":"<ORPHAN_USER_ID"}}\' \\');
    console.log(`       --region ${REGION}`);
    console.log('');
    console.log('  4. In Cognito, link the orphan Google account into the keeper if not');
    console.log('     already done (see find-duplicate-google-users.js output).');
    console.log('');
    console.log('  ⚠️  Do NOT delete records until you have verified the keeper has all');
    console.log('      the necessary data (role, profile, applications, etc.).');
  }

  console.log('');
  console.log('══════════════════════════════════════════════════════════');
  console.log('Done.');
  console.log('══════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
