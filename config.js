// 펭귄의 북극 모험 - 온라인 랭킹 설정 (Supabase)
//
// 아래 두 값을 본인 Supabase 프로젝트 값으로 채우면 "전 세계 랭킹"이 켜집니다.
// 비워 두면 기존처럼 이 기기(localStorage)에만 기록이 저장됩니다.
//
// 값 얻는 곳: Supabase 대시보드 > Project Settings > API
//   - url    : Project URL            (예: https://abcdefgh.supabase.co)
//   - anonKey: Project API keys > anon (public) key
//
// 참고: anon 키는 브라우저에 공개되어도 되는 "공개 키"입니다(테이블 RLS로 보호).
//       그래서 이 파일에 넣어 배포해도 됩니다.
//
// Supabase에서 아래 SQL을 한 번 실행해 테이블과 접근 정책을 만들어 주세요:
//
//   create table if not exists scores (
//     id bigint generated always as identity primary key,
//     nick text not null,
//     score int not null default 0,
//     coins int not null default 0,
//     created_at timestamptz not null default now()
//   );
//   alter table scores enable row level security;
//   create policy "read scores"   on scores for select using (true);
//   create policy "insert scores" on scores for insert with check (true);
//
window.PENGUIN_SUPABASE = {
  url: "https://yahktwaabetayemhjech.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaGt0d2FhYmV0YXllbWhqZWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NDY3ODQsImV4cCI6MjEwMjUyMjc4NH0.0_mRro-jevcl_hL3ChKStURGReB1VzShLXr1U7lrntE",
};
