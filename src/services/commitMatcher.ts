import type { GitHubCommit, Todo } from '../types';

/**
 * 커밋 메시지와 TODO를 매칭하는 알고리즘
 */
export function matchCommitToTodos(commit: GitHubCommit, todos: Todo[]): Todo[] {
    const commitMessage = commit.commit.message.toLowerCase();
    const matchedTodos: Todo[] = [];

    // 완료되지 않은 TODO만 대상
    const pendingTodos = todos.filter(t => t.status !== 'completed');

    for (const todo of pendingTodos) {
    const matchScore = calculateMatchScore(commitMessage, todo);

    // 매칭 점수가 충분히 높을 때만 매칭
    if (matchScore >= 2) {  // 최소 2개 이상의 매칭 조건 충족
        matchedTodos.push(todo);
        console.log(`Matched: "${todo.title}" with score ${matchScore}`);
    }
    }

    return matchedTodos;
}

/**
 * 커밋과 TODO의 매칭 점수 계산 (0-5점)
 */
function calculateMatchScore(commitMessage: string, todo: Todo): number {
    let score = 0;
    const todoTitle = todo.title.toLowerCase();

    // 1. TODO ID 명시적 매칭 (최우선, +3점)
    const todoIdPattern = new RegExp(`#${todo.id}|\\[${todo.id}\\]|todo[:-]?${todo.id}`, 'i');
    if (todoIdPattern.test(commitMessage)) {
    score += 3;
    }

    // 2. 브랜치명 매칭 (+2점)
    if (todo.githubBranch && commitMessage.includes(todo.githubBranch.toLowerCase())) {
    score += 2;
    }

    // 3. 제목 완전 일치 (+3점)
    if (commitMessage.includes(todoTitle)) {
    score += 3;
    }

    // 4. 키워드 매칭 (최소 50% 일치 시 +1점)
    const todoWords = extractKeywords(todoTitle);
    if (todoWords.length > 0) {
    const keywordMatches = todoWords.filter(word =>
        commitMessage.includes(word)
    ).length;

    const matchRatio = keywordMatches / todoWords.length;

    if (matchRatio >= 0.7) {  // 70% 이상 일치
        score += 2;
    } else if (matchRatio >= 0.5) {  // 50% 이상 일치
        score += 1;
    }
    }

    // 5. 유사도 매칭 (높은 유사도만 +1점)
    const similarity = calculateSimilarity(todoTitle, commitMessage);
    if (similarity > 0.75) {  // 0.6 → 0.75로 상향
    score += 1;
    }

    return score;
}

/**
 * 제목에서 의미있는 키워드 추출
 */
function extractKeywords(text: string): string[] {
    // 불용어 제거 (확장)
    const stopWords = [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    '을', '를', '이', '가', '은', '는', '의', '에', '에서', '으로', '로', '와', '과',
    '하기', '만들기', '구현', '추가', '수정', '삭제', '생성'  // 너무 일반적인 단어
    ];

    const words = text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.includes(word));

    return words;
}

/**
 * 두 문자열 간의 유사도 계산 (Jaccard similarity)
 */
function calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(extractKeywords(str1));
    const words2 = new Set(extractKeywords(str2));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;

    return intersection.size / union.size;
}