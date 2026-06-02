import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Globe, ChevronDown, Star } from 'lucide-react';

const DownloadAppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
`;

const Header = styled.header`
  padding: 16px 90px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
`;

const LogoIcon = styled.div`
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #FFB800 0%, #FF9500 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 900;
  color: white;
  letter-spacing: -1px;
`;

const LogoText = styled.span`
  font-size: 28px;
  font-weight: 900;
  color: #002e9d;
  letter-spacing: -0.5px;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 40px;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 32px;
  align-items: center;
`;

const NavLink = styled(Link)`
  color: #1f2937;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none;
  transition: color 0.2s;
  
  &:hover {
    color: #FFB800;
  }
`;

const DropdownLink = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #1f2937;
  font-weight: 600;
  font-size: 15px;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: #FFB800;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const DownloadButton = styled.button`
  background: linear-gradient(135deg, #FFB800 0%, #FF9500 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px rgba(255, 184, 0, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 184, 0, 0.4);
  }
`;

const LanguageToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  color: #1f2937;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #FFB800;
    color: #FFB800;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const HeroSection = styled.section`
  padding: 120px 90px 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  gap: 80px;
  min-height: 90vh;
  
  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
    padding: 100px 40px 60px;
  }
`;

const LeftContent = styled.div`
  flex: 1;
  max-width: 600px;
`;

const Title = styled(motion.h1)`
  font-size: 64px;
  font-weight: 900;
  color: #1f2937;
  margin-bottom: 16px;
  line-height: 1.1;
  
  @media (max-width: 768px) {
    font-size: 48px;
  }
`;

const Subtitle = styled(motion.p)`
  font-size: 20px;
  color: #6b7280;
  margin-bottom: 48px;
  font-weight: 500;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const DownloadOptions = styled.div`
  display: flex;
  gap: 32px;
  align-items: center;
  margin-bottom: 48px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 24px;
    align-items: center;
  }
`;

const QRCodeSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const QRCode = styled.div`
  width: 150px;
  height: 150px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 16px;
  
  img {
    width: 100%;
    height: 100%;
  }
`;

const QRText = styled.p`
  font-size: 14px;
  color: #0066cc;
  font-weight: 600;
`;

const StoreButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
`;

const StoreButton = styled.a`
  display: block;
  transition: transform 0.2s;
  cursor: pointer;
  width: 150px;
  height: 50px;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 8px;
  }
`;

const AppleIcon = styled.div`
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`;

const GoogleIcon = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
`;

const StoreButtonText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const StoreButtonLabel = styled.span`
  font-size: 11px;
  color: white;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StoreButtonName = styled.span`
  font-size: 18px;
  color: white;
  font-weight: 700;
`;

const Stats = styled.div`
  display: flex;
  gap: 60px;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StatValue = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Stars = styled.div`
  display: flex;
  gap: 4px;
  color: #FFB800;
`;

const StatLabel = styled.span`
  font-size: 14px;
  color: #6b7280;
  font-weight: 600;
`;

const RightContent = styled(motion.div)`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
`;

const PhoneMockup = styled.div`
  width: 350px;
  height: 700px;
  background: #1f2937;
  border-radius: 40px;
  padding: 12px;
  box-shadow: 
    0 50px 100px rgba(0, 0, 0, 0.25),
    0 20px 40px rgba(0, 0, 0, 0.15),
    inset 0 0 0 2px rgba(255, 255, 255, 0.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 30px;
    background: #1f2937;
    border-radius: 0 0 20px 20px;
    z-index: 10;
  }
  
  @media (max-width: 768px) {
    width: 280px;
    height: 560px;
  }
`;

const PhoneScreen = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #FFB800 0%, #FF9500 100%);
  border-radius: 32px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const AppPreview = styled.div`
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  padding: 60px 20px 20px;
  gap: 16px;
`;

const SearchBar = styled.div`
  background: #f3f4f6;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  color: #9ca3af;
  font-weight: 500;
`;

const ServiceCard = styled.div`
  background: linear-gradient(135deg, #FFB800 0%, #FF9500 100%);
  padding: 24px;
  border-radius: 16px;
  color: white;
  
  h3 {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  p {
    font-size: 13px;
    opacity: 0.9;
  }
`;

const FloatingElement = styled(motion.div)`
  position: absolute;
  background: linear-gradient(135deg, rgba(255, 184, 0, 0.1) 0%, rgba(255, 149, 0, 0.1) 100%);
  border-radius: 50%;
  filter: blur(40px);
`;

const DownloadApp = () => {
  return (
    <DownloadAppContainer>
      <Header>
        <Logo to="/">
          <LogoIcon>ÓP</LogoIcon>
        </Logo>
        
        <Nav>
          <NavLinks>
            <DropdownLink>
              <DropdownButton>
                Công ty <ChevronDown />
              </DropdownButton>
            </DropdownLink>
            <DropdownLink>
              <DropdownButton>
                Khách hàng cá nhân <ChevronDown />
              </DropdownButton>
            </DropdownLink>
            <DropdownLink>
              <DropdownButton>
                Khách hàng doanh nghiệp <ChevronDown />
              </DropdownButton>
            </DropdownLink>
            <NavLink to="/driver">Tài xế</NavLink>
            <NavLink to="/partner">Đối tác nhà hàng</NavLink>
            <NavLink to="/support">Hỗ trợ</NavLink>
          </NavLinks>
          
          <DownloadButton>TẢI ỨNG DỤNG NGAY</DownloadButton>
          
          <LanguageToggle>
            <Globe /> VN
          </LanguageToggle>
        </Nav>
      </Header>

      <HeroSection>
        <LeftContent>
          <Title
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Tải ứng dụng
          </Title>
          
          <Subtitle
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            để trải nghiệm các dịch vụ của chúng tôi
          </Subtitle>
          
          <DownloadOptions>
            <QRCodeSection>
              <QRCode>
                <svg viewBox="0 0 100 100" fill="none">
                  <rect width="100" height="100" fill="white"/>
                  <rect x="10" y="10" width="15" height="15" fill="black"/>
                  <rect x="30" y="10" width="5" height="5" fill="black"/>
                  <rect x="40" y="10" width="5" height="5" fill="black"/>
                  <rect x="50" y="10" width="5" height="5" fill="black"/>
                  <rect x="60" y="10" width="5" height="5" fill="black"/>
                  <rect x="75" y="10" width="15" height="15" fill="black"/>
                  <rect x="10" y="30" width="5" height="5" fill="black"/>
                  <rect x="20" y="30" width="5" height="5" fill="black"/>
                  <rect x="30" y="30" width="10" height="10" fill="black"/>
                  <rect x="45" y="30" width="5" height="5" fill="black"/>
                  <rect x="55" y="30" width="10" height="10" fill="black"/>
                  <rect x="70" y="30" width="5" height="5" fill="black"/>
                  <rect x="85" y="30" width="5" height="5" fill="black"/>
                  <rect x="10" y="40" width="5" height="5" fill="black"/>
                  <rect x="20" y="40" width="5" height="5" fill="black"/>
                  <rect x="75" y="40" width="5" height="5" fill="black"/>
                  <rect x="85" y="40" width="5" height="5" fill="black"/>
                  <rect x="10" y="50" width="5" height="5" fill="black"/>
                  <rect x="20" y="50" width="5" height="5" fill="black"/>
                  <rect x="35" y="50" width="5" height="5" fill="black"/>
                  <rect x="45" y="50" width="10" height="10" fill="black"/>
                  <rect x="60" y="50" width="5" height="5" fill="black"/>
                  <rect x="75" y="50" width="5" height="5" fill="black"/>
                  <rect x="85" y="50" width="5" height="5" fill="black"/>
                  <rect x="30" y="60" width="5" height="5" fill="black"/>
                  <rect x="40" y="60" width="5" height="5" fill="black"/>
                  <rect x="60" y="60" width="10" height="10" fill="black"/>
                  <rect x="10" y="75" width="15" height="15" fill="black"/>
                  <rect x="30" y="75" width="5" height="5" fill="black"/>
                  <rect x="40" y="75" width="5" height="5" fill="black"/>
                  <rect x="50" y="75" width="5" height="5" fill="black"/>
                  <rect x="60" y="75" width="5" height="5" fill="black"/>
                  <rect x="75" y="75" width="15" height="15" fill="black"/>
                </svg>
              </QRCode>
              <QRText>Quét mã QR</QRText>
            </QRCodeSection>
            
            <StoreButtons>
              <StoreButton href="https://apps.apple.com" target="_blank">
                <img src="/images/appstore1.jpg" alt="App Store" />
              </StoreButton>
              
              <StoreButton href="https://play.google.com" target="_blank">
                <img src="/images/chplay.jpg" alt="Google Play" />
              </StoreButton>
            </StoreButtons>
          </DownloadOptions>
          
          <Stats>
            <StatItem>
              <StatValue>
                <Stars>
                  <Star fill="#FFB800" strokeWidth={0} size={20} />
                  <Star fill="#FFB800" strokeWidth={0} size={20} />
                  <Star fill="#FFB800" strokeWidth={0} size={20} />
                  <Star fill="#FFB800" strokeWidth={0} size={20} />
                  <Star fill="#FFB800" strokeWidth={0} size={20} />
                </Stars>
              </StatValue>
              <StatLabel>Đánh giá ứng dụng</StatLabel>
            </StatItem>
          </Stats>
        </LeftContent>
        
        <RightContent
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <FloatingElement
            style={{ width: 300, height: 300, top: -100, right: -50 }}
            animate={{ 
              y: [0, 30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <FloatingElement
            style={{ width: 200, height: 200, bottom: -50, left: -30 }}
            animate={{ 
              y: [0, -20, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <PhoneMockup>
            <PhoneScreen>
              <AppPreview>
                <SearchBar>be</SearchBar>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    background: 'linear-gradient(135deg, #FFB800 0%, #FF9500 100%)',
                    borderRadius: '12px'
                  }}></div>
                  <ServiceCard>
                    <h3>Mời bạn ăn trưa</h3>
                    <p>Giảm ngay 20% mỗi ngày</p>
                    <p style={{ marginTop: '12px', fontSize: '11px' }}>Đặt món ngay</p>
                  </ServiceCard>
                </div>
              </AppPreview>
            </PhoneScreen>
          </PhoneMockup>
        </RightContent>
      </HeroSection>
    </DownloadAppContainer>
  );
};

export default DownloadApp;

