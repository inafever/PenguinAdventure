// 펭귄의 북극 모험 - 온라인 랭킹 설정 (Supabase)
//
// 아래 두 값을 본인 Supabase 프로젝트 값으로 채우면 "전 세계 랭킹"이 켜집니다.
// 비워 두면 기존처럼 이 기기(localStorage)에만 기록이 저장됩니다.
//
// 값 얻는 곳: Supabase 대시보드 > Project Settings > API
//   - url    : Project URL            (예: https://abcdefgh.supabase.co)
//   - anonKey: Project API keys > anon (public) key
//
// 참고: anon 키는 브라우저에 공개되어도 되는 "공개 키"입니다(여기서는 랭킹 "읽기"에만 사용).
//       점수 "쓰기"는 위변조 방지를 위해 서버리스 함수(api/submit-score.js)로만 처리하며,
//       비밀 키(service_role)는 Vercel 환경변수에만 두고 절대 커밋하지 않습니다.
//
// Supabase에서 아래 SQL을 한 번 실행해 테이블과 "읽기 전용" 공개 정책을 만들어 주세요.
// (anon 은 select 만 가능. insert 정책은 만들지 않아 클라이언트 직접 쓰기를 차단)
//
//   create table if not exists scores (
//     id bigint generated always as identity primary key,
//     nick text not null,
//     score int not null default 0,
//     coins int not null default 0,
//     created_at timestamptz not null default now()
//   );
//   alter table scores enable row level security;
//   create policy "read scores" on scores for select using (true);
//   -- 이전에 insert 정책을 만들었다면 제거: drop policy if exists "insert scores" on scores;
//
// 그리고 Vercel 환경변수에 아래 두 값을 설정하세요(서버 전용, 비공개):
//   - SUPABASE_URL              = 위 url 과 동일
//   - SUPABASE_SERVICE_ROLE_KEY = Supabase > Project Settings > API > service_role (secret)
//
window.PENGUIN_SUPABASE = {
  url: "https://yahktwaabetayemhjech.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaGt0d2FhYmV0YXllbWhqZWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NDY3ODQsImV4cCI6MjEwMjUyMjc4NH0.0_mRro-jevcl_hL3ChKStURGReB1VzShLXr1U7lrntE",
};
