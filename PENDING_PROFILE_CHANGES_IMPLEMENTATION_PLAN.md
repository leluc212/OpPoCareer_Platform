# Pending Profile Changes Implementation Plan

## ✅ Completed Tasks

### 1. Backend (Lambda + DynamoDB) ✅
- **File**: `amplify/backend/employer-profile.cjs`
  - ✅ Added `submitPendingChanges(userId, changes)` - Store pending changes without updating main profile
  - ✅ Added `getAllPendingChanges()` - Admin query all pending requests  
  - ✅ Added `approvePendingChanges(userId)` - Apply changes to main profile
  - ✅ Added `rejectPendingChanges(userId, rejectionReason)` - Reject changes, mark as REJECTED

### 2. Lambda API Routes ✅
- **File**: `amplify/backend/lambda-deployment/api-employer-profile.cjs`
  - ✅ Added `PUT /profile/{userId}/submit-changes` - Submit pending changes for review
  - ✅ Added `GET /admin/employers/pending-changes` - List all pending profile changes
  - ✅ Added `POST /admin/employers/{userId}/approve-changes` - Approve pending changes
  - ✅ Added `POST /admin/employers/{userId}/reject-changes` - Reject pending changes

### 3. Frontend Service Layer ✅
- **File**: `src/services/employerProfileService.js`
  - ✅ Added `submitPendingChanges(changes)` - Submit profile changes for admin approval

- **File**: `src/services/adminEmployerService.js`
  - ✅ Added `getPendingProfileChanges()` - Get all pending requests
  - ✅ Added `approveProfileChanges(userId)` - Approve profile changes
  - ✅ Added `rejectProfileChanges(userId, rejectionReason)` - Reject profile changes

### 4. Notification Service ✅
- **File**: `src/services/notificationService.js`
  - ✅ Added `createProfileChangeRequestNotification(payload)` - Notify admin when employer submits
  - ✅ Added `createProfileChangeApprovedNotification(employerId, companyName)` - Notify employer on approval
  - ✅ Added `createProfileChangeRejectedNotification(employerId, companyName, reason)` - Notify employer on rejection

### 5. Employer Profile Page ✅
- **File**: `src/pages/employer/EmployerProfile.jsx`
  - ✅ Added `hasPendingChanges` state
  - ✅ Added `PendingChangesBanner` styled component (yellow banner with Clock icon)
  - ✅ Updated `handleSave()` logic:
    - New profiles → create directly (no approval needed)
    - Existing profiles → submit pending changes for admin approval
    - Send notification to admin after submission
  - ✅ Updated useEffect to check `profile.pendingProfileChanges.status === 'PENDING_REVIEW'`
  - ✅ Updated "Chỉnh Sửa" button to disable when `hasPendingChanges === true`
  - ✅ Added banner display when `hasPendingChanges === true`
  - ✅ Import `Clock` icon from lucide-react
  - ✅ Import `createProfileChangeRequestNotification` from notificationService

---

## 🔧 Remaining Tasks

### 6. Admin Page - Add New Tab "Yêu cầu chỉnh sửa hồ sơ" ⏳
- **File**: `src/pages/admin/EmployersManagement.jsx`
  - ⏳ Add state: `const [profileChangeRequests, setProfileChangeRequests] = useState([])`
  - ⏳ Add function: `loadProfileChangeRequests()` - Call `adminEmployerService.getPendingProfileChanges()`
  - ⏳ Add function: `handleApproveProfileChange(userId, companyName)`:
    - Call `adminEmployerService.approveProfileChanges(userId)`
    - Send notification to employer: `createProfileChangeApprovedNotification(employerId, companyName)`
    - Reload pending requests
  - ⏳ Add function: `handleRejectProfileChange(userId, companyName, reason)`:
    - Call `adminEmployerService.rejectProfileChanges(userId, reason)`
    - Send notification to employer: `createProfileChangeRejectedNotification(employerId, companyName, reason)`
    - Reload pending requests
  - ⏳ Add new Main Tab button "Yêu cầu chỉnh sửa hồ sơ công ty" (icon: Edit3 or FileText)
  - ⏳ Add rendering for `activeTab === 'profile_changes'`:
    - Display table with columns: Company Name, Submitted At, Status, Actions
    - For each request, show comparison modal (old value vs new value) for fields that changed
    - Actions: "Duyệt" (Approve) and "Từ chối" (Reject) buttons
  - ⏳ Update `useEffect` to load profile change requests when tab is active
  - ⏳ Compute `pendingProfileChangesCount` for badge display

### 7. Admin Page - Comparison Modal ⏳
- **Component**: Create `ProfileChangesComparisonModal.jsx` (or inline in EmployersManagement)
  - ⏳ Display side-by-side comparison: OLD value | NEW value
  - ⏳ Highlight only fields that changed (filter unchanged fields)
  - ⏳ Support all profile fields:
    - companyName, phone, address, website, industry, companySize, foundedYear, taxCode, businessLicense, description
    - companyLogo, companyBanner, companyVideo, companyImages
  - ⏳ For images: show old image vs new image (thumbnail preview)
  - ⏳ For arrays (companyImages): show added/removed items
  - ⏳ Action buttons at bottom: "Duyệt" (green) / "Từ chối" (red)
  - ⏳ Rejection: show textarea input for reason before confirming

### 8. Deploy Lambda Changes ⏳
- **Script**: `amplify/backend/deploy-employer-profile-lambda.ps1`
  - ⏳ Run deployment script to update Lambda with new routes:
    ```powershell
    cd d:\OpPoCareer_Platform\amplify\backend
    .\deploy-employer-profile-lambda.ps1
    ```
  - ⏳ Verify API Gateway routes are updated (check AWS Console or test with Postman)

### 9. Testing ⏳
- **Employer Side**:
  - ⏳ Create a new profile → should save directly without admin approval
  - ⏳ Edit existing profile → should show "Đã gửi yêu cầu chỉnh sửa..." toast
  - ⏳ Banner should appear: "Nội dung chỉnh sửa của bạn đang được admin duyệt"
  - ⏳ "Chỉnh Sửa" button should be disabled while pending
  - ⏳ Admin should receive notification

- **Admin Side**:
  - ⏳ See pending profile change requests in new tab
  - ⏳ Open comparison modal, review old vs new values
  - ⏳ Approve → employer profile updated, employer receives notification, banner disappears, "Chỉnh Sửa" button enabled again
  - ⏳ Reject → employer profile stays unchanged, employer receives notification with reason, banner disappears, "Chỉnh Sửa" button enabled again

---

## File Locations Summary

### Backend
- `amplify/backend/employer-profile.cjs` ✅
- `amplify/backend/lambda-deployment/api-employer-profile.cjs` ✅

### Frontend Services
- `src/services/employerProfileService.js` ✅
- `src/services/adminEmployerService.js` ✅
- `src/services/notificationService.js` ✅

### Frontend Pages
- `src/pages/employer/EmployerProfile.jsx` ✅
- `src/pages/admin/EmployersManagement.jsx` ⏳ (partial update done, needs full tab implementation)

### DynamoDB Schema
- **Table**: `EmployerProfiles`
- **New Field**: `pendingProfileChanges` (Object)
  ```json
  {
    "requestId": "uuid",
    "employerId": "cognito-user-id",
    "changes": { /* all changed fields */ },
    "status": "PENDING_REVIEW" | "APPROVED" | "REJECTED",
    "submittedAt": "ISO timestamp",
    "approvedAt": "ISO timestamp" (optional),
    "rejectedAt": "ISO timestamp" (optional),
    "rejectionReason": "string" (optional)
  }
  ```

---

## Next Steps

1. ⏳ Complete admin tab UI in `EmployersManagement.jsx`
2. ⏳ Create comparison modal component
3. ⏳ Deploy Lambda changes
4. ⏳ Test end-to-end flow (employer submit → admin approve/reject → notifications)
5. ⏳ Update this document as tasks are completed

---

## Notes
- **Banner color**: Yellow (#FEF9C3) with amber border (#FDE047)
- **Icons**: Clock for pending banner, Edit3 for tab, CheckCircle for approve, XCircle for reject
- **Notifications**: Admin gets notification on submit, Employer gets notification on approve/reject
- **Text**: All Vietnamese by default (based on `language === 'vi'`)
