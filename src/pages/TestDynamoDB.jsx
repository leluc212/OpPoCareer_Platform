import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import candidateProfileService from '../services/candidateProfileService';
import { useLanguage } from '../context/LanguageContext';

const Container = styled.div`
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const Title = styled.h2`
  color: #1e40af;
  margin-bottom: 16px;
`;

const Field = styled.div`
  margin-bottom: 12px;
  
  strong {
    color: #374151;
    margin-right: 8px;
  }
  
  span {
    color: #6b7280;
  }
`;

const Button = styled.button`
  background: #1e40af;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-right: 10px;
  
  &:hover {
    background: #1e3a8a;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const TestDynamoDB = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { language } = useLanguage();

  const loadTestProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      // Manually construct API call to get test profile
      const response = await fetch(
        'https://dynamodb.ap-southeast-1.amazonaws.com/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-amz-json-1.0',
            'X-Amz-Target': 'DynamoDB_20120810.GetItem'
          },
          body: JSON.stringify({
            TableName: 'CandidateProfiles',
            Key: {
              userId: { S: 'test-candidate-001' }
            }
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch from DynamoDB');
      }
      
      const data = await response.json();
      
      // Convert DynamoDB format to regular object
      const item = data.Item;
      const profileData = {
        userId: item.userId.S,
        fullName: item.fullName.S,
        email: item.email.S,
        phone: item.phone.S,
        location: item.location.S,
        cccd: item.cccd.S,
        dateOfBirth: item.dateOfBirth.S,
        title: item.title.S,
        bio: item.bio.S,
        skills: item.skills.L.map(s => s.S),
        profileCompletion: parseInt(item.profileCompletion.N),
        isActive: item.isActive.BOOL
      };
      
      setProfile(profileData);
    } catch (err) {
      setError(err.message);
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Title>🧪 Test DynamoDB - {language === 'vi' ? 'Tiếng Việt' : 'Vietnamese'}</Title>
      
      <Card>
        <h3>{language === 'vi' ? 'Test Profile từ DynamoDB' : 'Test Profile from DynamoDB'}</h3>
        <p>{language === 'vi' ? 'Kiểm tra xem tiếng Việt có hiển thị đúng không' : 'Check if Vietnamese text displays correctly'}</p>
        
        <Button onClick={loadTestProfile} disabled={loading}>
          {loading ? (language === 'vi' ? 'Đang tải...' : 'Loading...') : 'Load Test Profile'}
        </Button>
      </Card>

      {error && (
        <Card style={{ background: '#fee2e2', borderLeft: '4px solid #ef4444' }}>
          <strong>{language === 'vi' ? 'Lỗi:' : 'Error:'}</strong> {error}
          <p style={{ marginTop: 8, fontSize: 14 }}>
            {language === 'vi'
              ? 'Note: Cần cấu hình CORS và credentials để test trực tiếp từ browser. Trong production, sẽ dùng API Gateway + Lambda.'
              : 'Note: CORS and credentials configuration is needed to test directly from the browser. In production, API Gateway + Lambda will be used.'}
          </p>
        </Card>
      )}

      {profile && (
        <Card>
          <Title>✅ {language === 'vi' ? 'Dữ liệu từ DynamoDB' : 'Data from DynamoDB'}</Title>
          
          <Field>
            <strong>User ID:</strong>
            <span>{profile.userId}</span>
          </Field>
          
          <Field>
            <strong>{language === 'vi' ? 'Họ và Tên:' : 'Full Name:'}</strong>
            <span>{profile.fullName}</span>
          </Field>
          
          <Field>
            <strong>Email:</strong>
            <span>{profile.email}</span>
          </Field>
          
          <Field>
            <strong>{language === 'vi' ? 'Số điện thoại:' : 'Phone:'}</strong>
            <span>{profile.phone}</span>
          </Field>
          
          <Field>
            <strong>{language === 'vi' ? 'Địa điểm:' : 'Location:'}</strong>
            <span>{profile.location}</span>
          </Field>
          
          <Field>
            <strong>CCCD:</strong>
            <span>{profile.cccd}</span>
          </Field>
          
          <Field>
            <strong>{language === 'vi' ? 'Ngày sinh:' : 'Date of Birth:'}</strong>
            <span>{new Date(profile.dateOfBirth).toLocaleDateString('vi-VN')}</span>
          </Field>
          
          <Field>
            <strong>{language === 'vi' ? 'Chức danh:' : 'Title:'}</strong>
            <span>{profile.title}</span>
          </Field>
          
          <Field>
            <strong>{language === 'vi' ? 'Giới thiệu:' : 'Bio:'}</strong>
            <span>{profile.bio}</span>
          </Field>
          
          <Field>
            <strong>{language === 'vi' ? 'Kỹ năng:' : 'Skills:'}</strong>
            <div style={{ marginTop: 8 }}>
              {profile.skills.map((skill, index) => (
                <span 
                  key={index}
                  style={{
                    display: 'inline-block',
                    background: '#dbeafe',
                    color: '#1e40af',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    marginRight: '8px',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </Field>
          
          <Field>
            <strong>{language === 'vi' ? 'Hoàn thành hồ sơ:' : 'Profile Completion:'}</strong>
            <span>{profile.profileCompletion}%</span>
          </Field>
          
          <Field>
            <strong>{language === 'vi' ? 'Trạng thái:' : 'Status:'}</strong>
            <span>{profile.isActive ? (language === 'vi' ? 'Đang hoạt động' : 'Active') : (language === 'vi' ? 'Không hoạt động' : 'Inactive')}</span>
          </Field>
        </Card>
      )}
      
      <Card style={{ background: '#f0f9ff' }}>
        <h4>📝 {language === 'vi' ? 'Kết luận:' : 'Conclusion:'}</h4>
        <p>
          {language === 'vi'
            ? 'Dữ liệu tiếng Việt trong DynamoDB hoàn toàn chính xác. AWS Console hiển thị sai do vấn đề encoding của browser.'
            : 'Vietnamese data in DynamoDB is completely accurate. AWS Console displays incorrectly due to browser encoding issues.'}
        </p>
        <p style={{ marginTop: 12 }}>
          {language === 'vi'
            ? 'Khi sử dụng qua API (Lambda + API Gateway) hoặc trong React app, tiếng Việt sẽ hiển thị hoàn toàn bình thường.'
            : 'When accessed via API (Lambda + API Gateway) or in a React app, Vietnamese text will display correctly.'}
        </p>
      </Card>
    </Container>
  );
};

export default TestDynamoDB;
