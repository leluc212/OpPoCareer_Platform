import json
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

try:
    from featured_percent_rules import (
        build_profile_reminder_notification,
        calculate_profile_percent,
        summarize_featured_percent,
    )
except ImportError:
    from amplify.backend.featured_percent_rules import (
        build_profile_reminder_notification,
        calculate_profile_percent,
        summarize_featured_percent,
    )


dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "ap-southeast-1"))
candidates_table = dynamodb.Table(os.environ.get("CANDIDATE_PROFILES_TABLE", "CandidateProfiles"))
applications_table = dynamodb.Table(os.environ.get("APPLICATIONS_TABLE", "StandardApplications"))
notifications_table = dynamodb.Table(os.environ.get("NOTIFICATIONS_TABLE", "Notifications"))


def get_cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Credentials": "true",
        "Content-Type": "application/json; charset=utf-8",
    }


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super().default(obj)


def create_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": get_cors_headers(),
        "body": json.dumps(body, ensure_ascii=False, cls=DecimalEncoder),
    }


def normalize_path(path):
    segments = [segment for segment in (path or "").split("/") if segment]
    if segments and segments[0] in ["prod", "test"]:
        segments = segments[1:]
    return "/" + "/".join(segments)


def get_claims(event):
    authorizer = event.get("requestContext", {}).get("authorizer", {})
    return authorizer.get("claims", {}) or authorizer.get("jwt", {}).get("claims", {}) or {}


def get_claim_roles(claims):
    roles = set()
    for key in ["custom:role", "role", "userRole"]:
        value = claims.get(key)
        if value:
            roles.add(str(value).lower())

    groups = claims.get("cognito:groups") or claims.get("groups")
    if isinstance(groups, str):
        for group in groups.replace(",", " ").split():
            roles.add(group.lower())
    elif isinstance(groups, list):
        for group in groups:
            if group:
                roles.add(str(group).lower())

    return roles


def is_authorized_for_candidate(candidate_id, claims):
    if not candidate_id:
        return False

    if candidate_id == claims.get("sub"):
        return True

    roles = get_claim_roles(claims)
    return bool(roles.intersection({"admin", "employer"}))


def get_candidate_id_from_path(path):
    parts = [part for part in path.split("/") if part]
    if len(parts) >= 3 and parts[0] == "featured-percent" and parts[1] == "candidates":
        return parts[2]
    return None


def query_candidate_applications(candidate_id):
    try:
        response = applications_table.query(
            IndexName="CandidateIndex",
            KeyConditionExpression=Key("candidateId").eq(candidate_id),
            ScanIndexForward=False,
        )
        items = response.get("Items", [])
        while "LastEvaluatedKey" in response:
            response = applications_table.query(
                IndexName="CandidateIndex",
                KeyConditionExpression=Key("candidateId").eq(candidate_id),
                ExclusiveStartKey=response["LastEvaluatedKey"],
                ScanIndexForward=False,
            )
            items.extend(response.get("Items", []))
        return items
    except Exception as err:
        print(f"Could not query applications for {candidate_id}: {err}")
        return []


def get_summary(candidate_id):
    profile_response = candidates_table.get_item(Key={"userId": candidate_id})
    profile = profile_response.get("Item")
    if not profile:
        return None

    profile_result = calculate_profile_percent(profile)
    applications = query_candidate_applications(candidate_id)
    summary = summarize_featured_percent(profile_result, applications)
    summary["candidateId"] = candidate_id
    return summary


def find_existing_profile_reminder(candidate_id):
    try:
        response = notifications_table.query(
            IndexName="RecipientIndex",
            KeyConditionExpression=Key("recipientId").eq(candidate_id) & Key("recipientRole").eq("candidate"),
        )
        for item in response.get("Items", []):
            if (
                item.get("type") == "featured_profile_missing"
                and item.get("read") is not True
                and item.get("deleted") is not True
            ):
                return item
    except Exception as err:
        print(f"Could not query existing profile reminder for {candidate_id}: {err}")
    return None


def save_or_update_profile_reminder(candidate_id, profile_result):
    if not profile_result.get("missingFields"):
        return {"created": False, "updated": False, "skipped": True}

    now_iso = datetime.now(timezone.utc).isoformat()
    notification = build_profile_reminder_notification(candidate_id, profile_result)
    existing = find_existing_profile_reminder(candidate_id)

    if existing:
        notifications_table.update_item(
            Key={"notificationId": existing["notificationId"]},
            UpdateExpression=(
                "SET title = :title, titleEn = :titleEn, message = :message, messageEn = :messageEn, "
                "#data = :data, updatedAt = :updatedAt, actionUrl = :actionUrl, actionText = :actionText, "
                "actionTextEn = :actionTextEn, icon = :icon, color = :color"
            ),
            ExpressionAttributeNames={"#data": "data"},
            ExpressionAttributeValues={
                ":title": notification["title"],
                ":titleEn": notification["titleEn"],
                ":message": notification["message"],
                ":messageEn": notification["messageEn"],
                ":data": notification["data"],
                ":updatedAt": now_iso,
                ":actionUrl": notification["actionUrl"],
                ":actionText": notification["actionText"],
                ":actionTextEn": notification["actionTextEn"],
                ":icon": notification["icon"],
                ":color": notification["color"],
            },
        )
        return {"created": False, "updated": True, "notificationId": existing["notificationId"]}

    notification_id = f"NOTIF-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"
    notification_item = {
        **notification,
        "notificationId": notification_id,
        "read": False,
        "deleted": False,
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }
    notifications_table.put_item(Item=notification_item)
    return {"created": True, "updated": False, "notificationId": notification_id}


def lambda_handler(event, context):
    print("Event:", json.dumps(event, ensure_ascii=False, default=str))
    method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "")
    path = normalize_path(event.get("path") or event.get("rawPath") or "")

    if method == "OPTIONS":
        return create_response(200, {"message": "OK"})

    try:
        claims = get_claims(event)
        authed_user_id = claims.get("sub")
        candidate_id = get_candidate_id_from_path(path)

        if candidate_id == "me":
            candidate_id = authed_user_id

        if not candidate_id:
            return create_response(400, {"success": False, "message": "candidateId is required"})

        if not is_authorized_for_candidate(candidate_id, claims):
            return create_response(403, {"success": False, "message": "Not authorized to view this candidate"})

        if method == "GET" and path.startswith("/featured-percent/candidates/"):
            summary = get_summary(candidate_id)
            if not summary:
                return create_response(404, {"success": False, "message": "Candidate profile not found"})
            return create_response(200, {"success": True, "data": summary})

        if method == "POST" and path.endswith("/profile-reminder"):
            summary = get_summary(candidate_id)
            if not summary:
                return create_response(404, {"success": False, "message": "Candidate profile not found"})
            result = save_or_update_profile_reminder(candidate_id, summary["profile"])
            return create_response(200, {"success": True, "data": result, "summary": summary})

        return create_response(404, {"success": False, "message": f"Route not found: {method} {path}"})
    except Exception as err:
        print(f"Featured percent error: {err}")
        import traceback

        traceback.print_exc()
        return create_response(500, {"success": False, "message": str(err)})
