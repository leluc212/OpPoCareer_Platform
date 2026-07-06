# Hướng Dẫn Thêm Rendering cho Tab "Yêu cầu chỉnh sửa hồ sơ" trong Admin

## Tổng Quan
Phần backend và functions đã hoàn tất. Bây giờ cần thêm UI rendering trong file `src/pages/admin/EmployersManagement.jsx` để hiển thị bảng danh sách yêu cầu chỉnh sửa hồ sơ công ty.

---

## Vị Trí Thêm Code

Trong file `src/pages/admin/EmployersManagement.jsx`, tìm đoạn code hiển thị table cho các tabs. Tìm đoạn:

```jsx
) : activeTab === 'change_requests' ? (
  <Table>
    {/* Hiển thị change_requests table */}
  </Table>
)
```

Sau đoạn này, **thêm condition mới** cho `activeTab === 'profile_changes'`:

```jsx
) : activeTab === 'profile_changes' ? (
  <Table>
    <thead>
      <tr>
        <th>{language === 'vi' ? 'Công Ty' : 'Company'}</th>
        <th>{language === 'vi' ? 'Ngày Gửi' : 'Submitted At'}</th>
        <th>{language === 'vi' ? 'Trạng Thái' : 'Status'}</th>
        <th>{language === 'vi' ? 'Hành Động' : 'Actions'}</th>
      </tr>
    </thead>
    <tbody>
      {profileChangeRequests
        .filter(r => r.pendingProfileChanges && r.pendingProfileChanges.status === 'PENDING_REVIEW')
        .map((employer, index) => {
          const colorScheme = getColorScheme(index);
          const initials = getCompanyInitials(employer.companyName);
          const changes = employer.pendingProfileChanges?.changes || {};
          const submittedAt = employer.pendingProfileChanges?.submittedAt || '';

          return (
            <tr key={employer.userId}>
              <td>
                <CompanyInfo>
                  <CompanyLogo $bgColor={colorScheme.bg} $color={colorScheme.color}>
                    {employer.companyLogo ? (
                      <img src={employer.companyLogo} alt={employer.companyName} />
                    ) : (
                      initials
                    )}
                  </CompanyLogo>
                  <CompanyDetails>
                    <CompanyName>{employer.companyName || 'Không rõ'}</CompanyName>
                    <CompanyMeta>
                      <Mail size={12} />
                      {employer.email || 'N/A'}
                    </CompanyMeta>
                  </CompanyDetails>
                </CompanyInfo>
              </td>
              <td>
                <div style={{ fontSize: '13px', color: '#64748B' }}>
                  <Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {submittedAt ? new Date(submittedAt).toLocaleString('vi-VN') : 'N/A'}
                </div>
              </td>
              <td>
                <StatusBadge $status="pending">
                  <Clock size={14} />
                  {language === 'vi' ? 'Chờ Duyệt' : 'Pending Review'}
                </StatusBadge>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <IconButton
                    onClick={() => setSelectedProfileChange(employer)}
                    title={language === 'vi' ? 'Xem chi tiết' : 'View details'}
                    style={{ background: '#EFF6FF', color: '#1e40af' }}
                  >
                    <Eye size={16} />
                  </IconButton>
                  <IconButton
                    onClick={() => handleApproveProfileChange(employer)}
                    disabled={isProcessingProfileChange}
                    title={language === 'vi' ? 'Duyệt' : 'Approve'}
                    style={{ background: '#DCFCE7', color: '#16A34A' }}
                  >
                    <CheckCircle size={16} />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setRejectTargetUserId(employer.userId);
                      setRejectTargetCompanyName(employer.companyName);
                      setShowRejectReasonModal(true);
                    }}
                    disabled={isProcessingProfileChange}
                    title={language === 'vi' ? 'Từ chối' : 'Reject'}
                    style={{ background: '#FEE2E2', color: '#DC2626' }}
                  >
                    <XCircle size={16} />
                  </IconButton>
                </div>
              </td>
            </tr>
          );
        })}
      {profileChangeRequests.filter(r => r.pendingProfileChanges && r.pendingProfileChanges.status === 'PENDING_REVIEW').length === 0 && (
        <tr>
          <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
            {language === 'vi' 
              ? 'Không có yêu cầu chỉnh sửa hồ sơ nào đang chờ duyệt'
              : 'No pending profile change requests'}
          </td>
        </tr>
      )}
    </tbody>
  </Table>
)
```

---

## Thêm Modal So Sánh (Comparison Modal)

Thêm modal hiển thị so sánh giá trị cũ/mới. Tìm đoạn code render các modal khác (ví dụ modal verification), thêm modal mới ngay sau đó:

```jsx
{/* Profile Change Comparison Modal */}
{selectedProfileChange && (
  <ModalOverlay onClick={() => setSelectedProfileChange(null)}>
    <ModalContent
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}
    >
      <ModalHeader>
        <h2>
          {language === 'vi' ? 'Chi Tiết Yêu Cầu Chỉnh Sửa Hồ Sơ' : 'Profile Change Request Details'}
        </h2>
        <ModalCloseButton onClick={() => setSelectedProfileChange(null)}>
          <X size={24} />
        </ModalCloseButton>
      </ModalHeader>

      <ModalBody>
        <div style={{ marginBottom: '20px', padding: '16px', background: '#F8FAFC', borderRadius: '8px' }}>
          <strong>{language === 'vi' ? 'Công ty:' : 'Company:'}</strong> {selectedProfileChange.companyName}<br />
          <strong>{language === 'vi' ? 'Ngày gửi:' : 'Submitted:'}</strong> {new Date(selectedProfileChange.pendingProfileChanges?.submittedAt || '').toLocaleString('vi-VN')}
        </div>

        <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
          {language === 'vi' ? 'So Sánh Thay Đổi (Cũ → Mới)' : 'Comparison (Old → New)'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(() => {
            const changes = selectedProfileChange.pendingProfileChanges?.changes || {};
            const oldProfile = selectedProfileChange;
            const changedFields = [];

            // Compare all fields
            const fieldLabels = {
              companyName: language === 'vi' ? 'Tên công ty' : 'Company Name',
              phone: language === 'vi' ? 'Số điện thoại' : 'Phone',
              address: language === 'vi' ? 'Địa chỉ' : 'Address',
              website: 'Website',
              industry: language === 'vi' ? 'Ngành nghề' : 'Industry',
              companySize: language === 'vi' ? 'Quy mô' : 'Company Size',
              foundedYear: language === 'vi' ? 'Năm thành lập' : 'Founded Year',
              taxCode: language === 'vi' ? 'Mã số thuế' : 'Tax Code',
              businessLicense: language === 'vi' ? 'Giấy phép KD' : 'Business License',
              description: language === 'vi' ? 'Mô tả' : 'Description',
              companyLogo: 'Logo',
              companyBanner: 'Banner',
              companyVideo: 'Video',
              companyImages: language === 'vi' ? 'Hình ảnh công ty' : 'Company Images'
            };

            Object.keys(changes).forEach(key => {
              const oldValue = oldProfile[key];
              const newValue = changes[key];

              // Skip if no change
              if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;

              changedFields.push({ key, label: fieldLabels[key] || key, oldValue, newValue });
            });

            if (changedFields.length === 0) {
              return (
                <p style={{ color: '#64748B', fontStyle: 'italic' }}>
                  {language === 'vi' ? 'Không có thay đổi nào được ghi nhận.' : 'No changes detected.'}
                </p>
              );
            }

            return changedFields.map(({ key, label, oldValue, newValue }) => (
              <div
                key={key}
                style={{
                  padding: '12px',
                  background: '#FFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px'
                }}
              >
                <strong style={{ display: 'block', marginBottom: '6px', color: '#334155' }}>
                  {label}
                </strong>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ flex: 1, padding: '8px', background: '#FEE2E2', borderRadius: '6px', fontSize: '13px' }}>
                    <strong>{language === 'vi' ? 'Cũ:' : 'Old:'}</strong> {oldValue || <em>Trống</em>}
                  </div>
                  <span style={{ color: '#64748B' }}>→</span>
                  <div style={{ flex: 1, padding: '8px', background: '#DCFCE7', borderRadius: '6px', fontSize: '13px' }}>
                    <strong>{language === 'vi' ? 'Mới:' : 'New:'}</strong> {newValue || <em>Trống</em>}
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          onClick={() => handleApproveProfileChange(selectedProfileChange)}
          disabled={isProcessingProfileChange}
          style={{
            background: '#16A34A',
            color: 'white',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          <CheckCircle size={16} style={{ marginRight: '6px' }} />
          {language === 'vi' ? 'Duyệt' : 'Approve'}
        </Button>
        <Button
          onClick={() => {
            setRejectTargetUserId(selectedProfileChange.userId);
            setRejectTargetCompanyName(selectedProfileChange.companyName);
            setShowRejectReasonModal(true);
            setSelectedProfileChange(null); // Close comparison modal
          }}
          disabled={isProcessingProfileChange}
          style={{
            background: '#DC2626',
            color: 'white',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          <XCircle size={16} style={{ marginRight: '6px' }} />
          {language === 'vi' ? 'Từ chối' : 'Reject'}
        </Button>
        <Button
          onClick={() => setSelectedProfileChange(null)}
          style={{
            background: '#E2E8F0',
            color: '#334155',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {language === 'vi' ? 'Đóng' : 'Close'}
        </Button>
      </ModalFooter>
    </ModalContent>
  </ModalOverlay>
)}
```

---

## Thêm Modal Nhập Lý Do Từ Chối

Thêm modal cho phép admin nhập lý do từ chối:

```jsx
{/* Reject Reason Modal */}
{showRejectReasonModal && (
  <ModalOverlay onClick={() => setShowRejectReasonModal(false)}>
    <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
      <ModalHeader>
        <h2>{language === 'vi' ? 'Lý Do Từ Chối' : 'Rejection Reason'}</h2>
        <ModalCloseButton onClick={() => setShowRejectReasonModal(false)}>
          <X size={24} />
        </ModalCloseButton>
      </ModalHeader>

      <ModalBody>
        <p style={{ marginBottom: '12px', color: '#64748B', fontSize: '14px' }}>
          {language === 'vi'
            ? 'Vui lòng nhập lý do từ chối yêu cầu chỉnh sửa hồ sơ:'
            : 'Please enter the reason for rejecting this profile change request:'}
        </p>
        <textarea
          value={rejectReasonInput}
          onChange={(e) => setRejectReasonInput(e.target.value)}
          placeholder={language === 'vi' ? 'Nhập lý do từ chối...' : 'Enter rejection reason...'}
          rows={4}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
      </ModalBody>

      <ModalFooter>
        <Button
          onClick={() => {
            const employer = profileChangeRequests.find(r => r.userId === rejectTargetUserId);
            if (employer) {
              handleRejectProfileChange(employer, rejectReasonInput);
            }
          }}
          disabled={isProcessingProfileChange || !rejectReasonInput.trim()}
          style={{
            background: '#DC2626',
            color: 'white',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {language === 'vi' ? 'Từ Chối' : 'Reject'}
        </Button>
        <Button
          onClick={() => {
            setShowRejectReasonModal(false);
            setRejectReasonInput('');
          }}
          style={{
            background: '#E2E8F0',
            color: '#334155',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {language === 'vi' ? 'Hủy' : 'Cancel'}
        </Button>
      </ModalFooter>
    </ModalContent>
  </ModalOverlay>
)}
```

---

## Test Checklist

1. ✅ Backend đã hoàn tất (submitPendingChanges, approvePendingChanges, rejectPendingChanges)
2. ✅ Frontend service methods đã hoàn tất
3. ✅ Notifications đã hoàn tất
4. ✅ Employer profile page đã update (submit pending changes, banner, disable edit button)
5. ⏳ Admin tab rendering - **cần thêm code ở trên vào EmployersManagement.jsx**
6. ⏳ Test end-to-end flow

---

## Lưu Ý

- Các styled components (`ModalOverlay`, `ModalContent`, `ModalHeader`, `ModalBody`, `ModalFooter`, `CompanyInfo`, `CompanyLogo`, `CompanyDetails`, `CompanyName`, `CompanyMeta`, `IconButton`, `StatusBadge`) đã được định nghĩa sẵn trong file `EmployersManagement.jsx`
- Function `getColorScheme(index)` và `getCompanyInitials(name)` cũng đã có sẵn
- Language context được quản lý qua `const { language } = useLanguage()`

---

## Deploy

Sau khi hoàn tất UI, nhớ deploy Lambda để API routes hoạt động:

```powershell
cd d:\OpPoCareer_Platform\amplify\backend
.\deploy-employer-profile-lambda.ps1
```

Verify API routes trong AWS Console hoặc dùng Postman để test.
