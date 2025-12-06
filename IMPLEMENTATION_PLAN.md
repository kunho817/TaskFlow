# TaskFlow 리코딩 구현 계획

## 개요
습관 형성 중심 TODO 관리 앱을 Shadcn/ui + 하단 탭바 네비게이션으로 리코딩

---

## Phase 1: Shadcn/ui 설치 및 기본 설정

### 작업 내용
1. `npx shadcn@latest init` 실행
2. 필요한 컴포넌트 설치:
   - Button, Card, Input, Badge, Progress
   - Dialog, Sheet, Tabs, Avatar
   - Checkbox, Select, DropdownMenu
3. 기존 index.css와 통합

### 결과물
- `components/ui/` 폴더에 Shadcn 컴포넌트들
- `lib/utils.ts` 업데이트 (cn 함수)

---

## Phase 2: 공통 레이아웃 및 네비게이션

### 폴더 구조
```
src/
├── components/
│   ├── ui/              # Shadcn/ui 컴포넌트
│   ├── layout/          # 레이아웃 컴포넌트
│   │   ├── AppLayout.tsx
│   │   ├── BottomNav.tsx
│   │   └── Header.tsx
│   ├── common/          # 공통 재사용 컴포넌트
│   │   ├── StreakBadge.tsx
│   │   ├── PriorityBadge.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingSpinner.tsx
│   ├── dashboard/       # 대시보드 전용
│   │   ├── TodayGoals.tsx
│   │   ├── WeeklyChart.tsx
│   │   ├── StreakCard.tsx
│   │   └── AIEncouragement.tsx
│   ├── todo/            # TODO 관련
│   │   ├── TodoItem.tsx
│   │   ├── TodoList.tsx
│   │   ├── AddTodoForm.tsx
│   │   └── TodoFilters.tsx
│   ├── project/         # 프로젝트 관련
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectList.tsx
│   │   └── CreateProjectModal.tsx
│   ├── roadmap/         # 로드맵 관련
│   │   ├── RoadmapTimeline.tsx
│   │   ├── MilestoneItem.tsx
│   │   └── AddMilestoneModal.tsx
│   └── ai/              # AI 관련
│       ├── TaskBreakdownModal.tsx
│       └── AISuggestionCard.tsx
├── pages/
│   ├── Dashboard.tsx    # 오늘의 집중 + 스트릭
│   ├── Projects.tsx     # 프로젝트/TODO 관리
│   ├── Roadmap.tsx      # 타임라인 뷰
│   └── Profile.tsx      # 설정 + GitHub
├── hooks/
├── store/
├── services/
├── lib/
└── types/
```

### BottomNav 구조
```
┌─────────────────────────────────────┐
│                                     │
│           Page Content              │
│                                     │
├─────────────────────────────────────┤
│  🏠       📋       🗺️       👤     │
│ Dashboard Projects Roadmap Profile  │
└─────────────────────────────────────┘
```

### 라우팅
- `/` → Dashboard
- `/projects` → Projects (TODO 관리)
- `/roadmap` → Roadmap
- `/profile` → Profile (GitHub 설정 포함)

---

## Phase 3: Dashboard 페이지

### UI 구성
1. **Header**: 날짜 + 인사말
2. **StreakCard**: 연속 달성일 + 불꽃 애니메이션
3. **TodayGoals**: 오늘 할 일 요약 (3개)
4. **AIEncouragement**: AI 격려 메시지
5. **WeeklyChart**: 주간 활동 막대 그래프
6. **QuickAdd**: 빠른 TODO 추가 버튼 (FAB)

### 스트릭 로직
- todoStore에서 완료된 TODO의 날짜 기반 계산
- 연속 일수 카운트
- 오늘 최소 1개 완료 시 스트릭 유지

---

## Phase 4: Projects 페이지

### UI 구성
1. **Header**: 프로젝트 선택 드롭다운 + 필터
2. **TodoFilters**: 상태/우선순위 필터 탭
3. **TodoList**: TODO 목록 (기존 로직 재사용)
4. **AddTodoForm**: 빠른 추가 폼
5. **FAB**: AI 분해 버튼

### 기존 기능 유지
- 프로젝트별 TODO 필터링
- 우선순위 정렬
- 완료 토글
- GitHub 연동 자동 완료

---

## Phase 5: Roadmap 페이지

### UI 구성
1. **Header**: 월 네비게이션
2. **Timeline**: 월별 그룹화된 타임라인
3. **MilestoneItem**: 마일스톤 카드
   - 타입별 아이콘 (Feature, Bug, Research)
   - 진행률 바
   - 담당자/브랜치 정보

### 신규 Store
- `roadmapStore.ts` - 마일스톤 CRUD

### 타입 정의 (이미 types/index.ts에 있음)
```typescript
interface RoadmapItem {
  id: string;
  title: string;
  type: 'feature' | 'milestone' | 'bugfix' | 'research';
  startDate: string;
  endDate: string;
  progress: number;
  priority: Priority;
  description?: string;
  assignee?: string;
  githubBranch?: string;
  linkedTodoIds: string[];
}
```

---

## Phase 6: Profile 페이지

### UI 구성
1. **UserCard**: 아바타 + 이름 (GitHub 연동 시)
2. **StatsOverview**: 총 완료 수, 최대 스트릭 등
3. **GitHubSection**: 연동 상태 + 설정
4. **SettingsSection**: 알림, 테마 등

### 기존 GitHubSettings 페이지 통합
- Profile 페이지 내 GitHub 섹션으로 이동

---

## Phase 7: Store 업데이트

### streakStore.ts (신규)
```typescript
interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  todayCompleted: boolean;
}
```

### roadmapStore.ts (신규)
```typescript
interface RoadmapState {
  items: RoadmapItem[];
  addItem, updateItem, deleteItem, loadItems
}
```

### statsStore.ts (신규)
```typescript
interface StatsState {
  totalCompleted: number;
  weeklyStats: { date: string; count: number }[];
}
```

---

## 컴포넌트 재사용 전략

### Shadcn/ui 활용
| 용도 | 컴포넌트 |
|------|----------|
| 버튼 | Button (variants: default, outline, ghost) |
| 카드 | Card, CardHeader, CardContent, CardFooter |
| 입력 | Input, Textarea |
| 선택 | Select, Checkbox |
| 모달 | Dialog |
| 드로어 | Sheet |
| 탭 | Tabs |
| 배지 | Badge |
| 진행바 | Progress |
| 아바타 | Avatar |

### 커스텀 공통 컴포넌트
| 컴포넌트 | 용도 |
|----------|------|
| StreakBadge | 스트릭 숫자 + 불꽃 |
| PriorityBadge | 우선순위 표시 (색상 구분) |
| EmptyState | 빈 상태 메시지 |
| LoadingSpinner | 로딩 표시 |
| PageHeader | 페이지 제목 + 액션 버튼 |

---

## 구현 순서

1. **Phase 1**: Shadcn/ui 설치 (5분)
2. **Phase 2**: 레이아웃 + BottomNav (30분)
3. **Phase 3**: 공통 컴포넌트 (20분)
4. **Phase 4**: Dashboard 리빌드 (40분)
5. **Phase 5**: Projects 리빌드 (30분)
6. **Phase 6**: Roadmap 신규 (40분)
7. **Phase 7**: Profile 신규 (20분)
8. **Phase 8**: Store 업데이트 + 연동 (30분)

---

## 주의사항

1. **기존 데이터 유지**: LocalStorage 키 동일하게 유지
2. **점진적 마이그레이션**: 기존 store 로직 최대한 재사용
3. **모바일 우선**: 모든 UI 375px 기준 디자인
4. **다크모드**: Shadcn 기본 다크모드 지원 활용
