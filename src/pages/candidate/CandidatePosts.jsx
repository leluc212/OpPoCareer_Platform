import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import {
  TrendingUp,
  MessageSquare,
  Heart,
  Share2,
  MoreVertical,
  Plus,
  Filter,
  Search,
  Bookmark,
  Users,
  Clock,
  MapPin,
  Briefcase,
  Zap,
  X
} from 'lucide-react';

/* ── Keyframes ─────────────────────────────────── */
const scanLine = keyframes`
  0%   { transform: translateY(-100%); opacity: 0; }
  10%  { opacity: 0.6; }
  90%  { opacity: 0.6; }
  100% { transform: translateY(400%); opacity: 0; }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
`;

const dotPulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.5); opacity: 0.6; }
`;

const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── Page shell ─────────────────────────────────── */
const PageContainer = styled(motion.div)`
  max-width: 900px;
  margin: 0 auto;
`;

/* ── Header ─────────────────────────────────────── */
const PageHeader = styled.div`
  margin-bottom: 28px;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 16px;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const TitleIconBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 13px;
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;

  /* subtle scan line */
  &::after {
    content: '';
    position: absolute;
    left: 0; right: 0;
    height: 2px;
    background: #1e40af;
    opacity: 0;
    animation: ${scanLine} 3s ease-in-out infinite;
  }

  svg { width: 22px; height: 22px; color: #1e40af; }
`;

const TitleBlock = styled.div`
  h1 {
    font-size: 24px;
    font-weight: 800;
    color: ${p => p.theme.colors.text};
    letter-spacing: -0.4px;
    line-height: 1.2;
    margin-bottom: 3px;
  }
  p {
    font-size: 13px;
    font-weight: 500;
    color: ${p => p.theme.colors.textLight};
  }
`;

const LiveBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 700;
  color: #1e40af;
  white-space: nowrap;
  align-self: flex-start;

  span.dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #1e40af;
    animation: ${dotPulse} 1.8s ease-in-out infinite;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const PrimaryBtn = styled(motion.button)`
  padding: 10px 18px;
  border-radius: 10px;
  background: #1e40af;
  color: white;
  font-size: 13.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(30, 64, 175, 0.28);
  transition: box-shadow 0.2s ease, filter 0.2s ease;
  white-space: nowrap;

  &:hover {
    filter: brightness(1.08);
    box-shadow: 0 5px 18px rgba(30, 64, 175, 0.38);
  }

  svg { width: 15px; height: 15px; }
`;

const GhostBtn = styled(motion.button)`
  padding: 10px 16px;
  border-radius: 10px;
  background: ${p => p.theme.colors.bgLight};
  color: ${p => p.theme.colors.text};
  font-size: 13.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1.5px solid ${p => p.theme.colors.border};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    border-color: #BFDBFE;
    background: #EFF6FF;
    color: #1e40af;
  }

  svg { width: 15px; height: 15px; }
`;

/* ── Search bar ──────────────────────────────────── */
const SearchWrap = styled.div`
  position: relative;

  svg.search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 17px;
    height: 17px;
    color: ${p => p.theme.colors.textLight};
    pointer-events: none;
  }

  input {
    width: 100%;
    padding: 12px 44px 12px 42px;
    border: 1.5px solid ${p => p.theme.colors.border};
    border-radius: 11px;
    font-size: 14px;
    font-weight: 500;
    background: ${p => p.theme.colors.bgLight};
    color: ${p => p.theme.colors.text};
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &::placeholder { color: ${p => p.theme.colors.textLight}; }
    &:focus {
      outline: none;
      border-color: #1e40af;
      box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.12);
    }
  }
`;

const ClearBtn = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: ${p => p.theme.colors.bgDark};
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${p => p.theme.colors.textLight};
  transition: all 0.15s ease;

  &:hover { background: #BFDBFE; color: #1e40af; }
  svg { width: 11px; height: 11px; }
`;

/* ── Post list ───────────────────────────────────── */
const PostsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

/* ── Post card ───────────────────────────────────── */
const PostCard = styled(motion.article)`
  background: ${p => p.theme.colors.bgLight};
  border: 1.5px solid ${p => p.theme.colors.border};
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;

  /* left accent bar */
  &::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    border-radius: 18px 0 0 18px;
    background: #1e40af;
    opacity: 0;
    transition: opacity 0.22s ease;
  }

  &:hover {
    border-color: #BFDBFE;
    box-shadow: 0 8px 28px rgba(30, 64, 175, 0.11);
    transform: translateY(-2px);

    &::before { opacity: 1; }
  }
`;

const CardInner = styled.div`
  padding: 22px 24px 18px;
`;

/* ── Author row ───────────────────────────────────── */
const AuthorRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 16px;
`;

const Avatar = styled.div`
  width: 46px;
  height: 46px;
  min-width: 46px;
  border-radius: 13px;
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  color: #1e40af;
  letter-spacing: -0.5px;
  transition: all 0.2s ease;

  ${PostCard}:hover & {
    background: #1e40af;
    color: white;
    border-color: #1e40af;
  }
`;

const AuthorInfo = styled.div`
  flex: 1;
  min-width: 0;

  .name {
    font-size: 15px;
    font-weight: 700;
    color: ${p => p.theme.colors.text};
    margin-bottom: 4px;
  }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 14px;
  font-size: 12.5px;
  color: ${p => p.theme.colors.textLight};
  font-weight: 500;
`;

const MetaChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;

  svg { width: 12px; height: 12px; color: #1e40af; opacity: 0.75; }
`;

const MoreBtn = styled.button`
  padding: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  color: ${p => p.theme.colors.textLight};
  transition: all 0.18s ease;
  flex-shrink: 0;

  &:hover {
    background: #EFF6FF;
    color: #1e40af;
  }
  svg { width: 18px; height: 18px; display: block; }
`;

/* ── Post content ─────────────────────────────────── */
const PostTitle = styled.h2`
  font-size: 16.5px;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
  margin: 0 0 8px 0;
  line-height: 1.4;
  letter-spacing: -0.2px;
  transition: color 0.2s ease;

  ${PostCard}:hover & { color: #1e40af; }
`;

const PostText = styled.p`
  font-size: 13.5px;
  line-height: 1.68;
  color: ${p => p.theme.colors.textLight};
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/* ── Tags ─────────────────────────────────────────── */
const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 14px 0 0;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  color: #1e40af;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.18s ease;
  cursor: default;

  &:hover {
    background: #1e40af;
    color: white;
    border-color: #1e40af;
    transform: translateY(-1px);
  }
`;

/* ── Divider ──────────────────────────────────────── */
const Divider = styled.div`
  height: 1px;
  background: ${p => p.theme.colors.border};
  margin: 0 24px;
`;

/* ── Actions bar ──────────────────────────────────── */
const ActionsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
`;

const ActionBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: none;
  background: transparent;
  color: ${p => p.theme.colors.textLight};
  cursor: pointer;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.18s ease;

  &:hover {
    background: #EFF6FF;
    color: #1e40af;
  }

  ${p => p.$active && css`
    color: #1e40af;
    background: #EFF6FF;
  `}

  svg { width: 16px; height: 16px; }
`;

const SaveBtn = styled(ActionBtn)`
  margin-left: auto;

  ${p => p.$active && css`
    color: #1e40af;
    background: #EFF6FF;
  `}
`;

/* ── Stats strip ──────────────────────────────────── */
const StatsStrip = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 24px 14px;
`;

const StatItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: ${p => p.theme.colors.textLight};

  svg {
    width: 13px;
    height: 13px;
    color: #1e40af;
    opacity: 0.65;
  }
`;

/* ── Empty state ──────────────────────────────────── */
const EmptyState = styled(motion.div)`
  text-align: center;
  padding: 64px 16px;
  background: ${p => p.theme.colors.bgLight};
  border: 1.5px dashed ${p => p.theme.colors.border};
  border-radius: 18px;

  svg { width: 48px; height: 48px; color: #BFDBFE; margin-bottom: 14px; }
  h3 { font-size: 17px; font-weight: 700; color: ${p => p.theme.colors.text}; margin-bottom: 6px; }
  p  { font-size: 14px; color: ${p => p.theme.colors.textLight}; }
`;

/* ═══════════════════════  COMPONENT  ════════════════════════ */
const CandidatePosts = () => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [likedPosts, setLikedPosts] = useState(new Set([2]));
  const [savedPosts, setSavedPosts] = useState(new Set([2]));

  const posts = [
    {
      id: 1,
      author: 'Nguyễn Văn An',
      avatar: 'NVA',
      position: 'Nhân viên Pha Chế',
      location: 'TP. Hồ Chí Minh',
      time: '2 giờ trước',
      title: 'Tìm việc Nhân viên Pha Chế - Có kinh nghiệm 2 năm',
      content: 'Mình có 2 năm kinh nghiệm làm việc tại các quán cafe lớn, thành thạo các loại máy pha, có khả năng latte art tốt. Mong muốn tìm được một môi trường làm việc chuyên nghiệp và lâu dài.',
      tags: ['Pha Chế', 'Cafe', 'Toàn thời gian', 'TP.HCM'],
      likes: 24, comments: 8, shares: 3
    },
    {
      id: 2,
      author: 'Trần Thị Bình',
      avatar: 'TTB',
      position: 'Nhân viên Phục Vụ',
      location: 'Hà Nội',
      time: '5 giờ trước',
      title: 'Tìm việc bán thời gian - Nhân viên Phục Vụ',
      content: 'Sinh viên năm 3, muốn tìm công việc bán thời gian vào buổi tối và cuối tuần. Có kinh nghiệm 6 tháng làm việc tại nhà hàng, nhiệt tình, thân thiện.',
      tags: ['Phục Vụ', 'Bán thời gian', 'Nhà hàng', 'Hà Nội'],
      likes: 15,
      comments: 5,
      shares: 2,
      isLiked: true,
      isSaved: true
    },
    {
      id: 3,
      author: 'Lê Minh Châu',
      avatar: 'LMC',
      position: 'Nhân viên kho',
      location: 'Đà Nẵng',
      time: '1 ngày trước',
      title: 'Tìm việc nhân viên kho - Có bằng lái xe máy',
      content: 'Có kinh nghiệm làm việc tại kho hàng, sắp xếp hàng hóa, kiểm kê. Có bằng lái xe máy, có thể giao hàng. Sẵn sàng làm ca tối và cuối tuần.',
      tags: ['Kho hàng', 'Giao hàng', 'Ca tối', 'Đà Nẵng'],
      likes: 32,
      comments: 12,
      shares: 5,
      isLiked: false,
      isSaved: false
    }
  ];

  return (
    <DashboardLayout>
      <PageContainer
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* ── Header ── */}
        <PageHeader>
          <HeaderTop>
            <TitleGroup>
              <TitleIconBox>
                <Zap />
              </TitleIconBox>
              <TitleBlock>
                <h1>Bảng Tin Việc Làm</h1>
                <p>{filtered.length} bài đăng đang hiển thị</p>
              </TitleBlock>
            </TitleGroup>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <LiveBadge>
                <span className="dot" />
                {posts.length} bài đăng
              </LiveBadge>
              <HeaderActions>
                <GhostBtn
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Filter />
                  Lọc
                </GhostBtn>
                <PrimaryBtn
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Plus />
                  Đăng bài
                </PrimaryBtn>
              </HeaderActions>
            </div>
          </HeaderTop>

          {/* ── Search ── */}
          <SearchWrap>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm bài đăng, tác giả, kỹ năng..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <ClearBtn onClick={() => setSearchQuery('')}>
                <X />
              </ClearBtn>
            )}
          </SearchWrap>
        </PageHeader>

        {/* ── Post list ── */}
        <PostsGrid>
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <EmptyState
                key="empty"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <Search />
                <h3>Không tìm thấy kết quả</h3>
                <p>Thử thay đổi từ khoá tìm kiếm</p>
              </EmptyState>
            ) : (
              filtered.map((post, index) => {
                const isLiked = likedPosts.has(post.id);
                const isSaved = savedPosts.has(post.id);
                const likeCount = post.likes + (isLiked && !([2].includes(post.id)) ? 1 : 0);

                return (
                  <PostCard
                    key={post.id}
                    layout
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.26, delay: index * 0.07, ease: [0.4, 0, 0.2, 1] }}
                    whileHover={{ y: -2 }}
                  >
                    <CardInner>
                      {/* Author */}
                      <AuthorRow>
                        <Avatar>{post.avatar}</Avatar>
                        <AuthorInfo>
                          <div className="name">{post.author}</div>
                          <MetaRow>
                            <MetaChip><Briefcase />{post.position}</MetaChip>
                            <MetaChip><MapPin />{post.location}</MetaChip>
                            <MetaChip><Clock />{post.time}</MetaChip>
                          </MetaRow>
                        </AuthorInfo>
                        <MoreBtn aria-label="Thêm tùy chọn">
                          <MoreVertical />
                        </MoreBtn>
                      </AuthorRow>

                      {/* Content */}
                      <PostTitle>{post.title}</PostTitle>
                      <PostText>{post.content}</PostText>

                      {/* Tags */}
                      <TagsRow>
                        {post.tags.map((tag, i) => (
                          <Tag key={i}>{tag}</Tag>
                        ))}
                      </TagsRow>
                    </CardInner>

                    {/* Stats */}
                    <StatsStrip>
                      <StatItem><Heart />{post.likes} {language === 'vi' ? 'lượt thích' : 'likes'}</StatItem>
                      <StatItem><MessageSquare />{post.comments} {language === 'vi' ? 'bình luận' : 'comments'}</StatItem>
                      <StatItem><Share2 />{post.shares} {language === 'vi' ? 'chia sẻ' : 'shares'}</StatItem>
                    </StatsStrip>

                    <Divider />

                    {/* Actions */}
                    <ActionsBar>
                      <ActionBtn
                        $active={isLiked}
                        onClick={() => toggleLike(post.id)}
                      >
                        <Heart
                          style={{ transition: 'all 0.2s ease' }}
                          fill={isLiked ? 'currentColor' : 'none'}
                          strokeWidth={isLiked ? 0 : 2}
                        />
                        {isLiked ? (language === 'vi' ? 'Đã thích' : 'Liked') : (language === 'vi' ? 'Thích' : 'Like')}
                      </ActionBtn>

                      <ActionBtn>
                        <MessageSquare />
                        Bình luận
                      </ActionBtn>

                      <ActionBtn>
                        <Share2 />
                        Chia sẻ
                      </ActionBtn>

                      <SaveBtn
                        $active={isSaved}
                        onClick={() => toggleSave(post.id)}
                      >
                        <Bookmark
                          style={{ transition: 'all 0.2s ease' }}
                          fill={isSaved ? 'currentColor' : 'none'}
                          strokeWidth={isSaved ? 0 : 2}
                        />
                        {isSaved ? (language === 'vi' ? 'Đã lưu' : 'Saved') : (language === 'vi' ? 'Lưu' : 'Save')}
                      </SaveBtn>
                    </ActionsBar>
                  </PostCard>
                );
              })
            )}
          </AnimatePresence>
        </PostsGrid>
      </PageContainer>
    </DashboardLayout>
  );
};

export default CandidatePosts;
