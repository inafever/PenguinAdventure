// 펭귄의 북극 모험 - 온라인 랭킹 설정 (Supabase)
//
// 아래 두 값을 본인 Supabase 프로젝트 값으로 채우면 "전 세계 랭킹"이 켜집니다.
// 비워 두면 기존처럼 이 기기(localStorage)에만 기록이 저장됩니다.
//
// 값 얻는 곳: Supabase 대시보드 > Project Settings > API
//   - url    : Project URL            (예: https://abcdefgh.supabase.co)
//   - anonKey: Project API keys > anon (public) key
//
// 참고: anon 키는 브라우저에 공개되어도 되는 "공개 키"입니다(여기서는 랭킹 "읽기"와
//       서버 함수 submit_score 호출에만 사용). 테이블 직접 INSERT 는 RLS로 막고,
//       쓰기는 아래 SQL의 submit_score 함수가 범위 검사 후에만 수행합니다.
//
// Supabase SQL Editor에서 아래를 한 번 실행하세요.
//
//   create table if not exists scores (
//     id bigint generated always as identity primary key,
//     nick text not null,
//     score int not null default 0,
//     coins int not null default 0,
//     created_at timestamptz not null default now()
//   );
//   alter table scores enable row level security;
//   drop policy if exists "insert scores" on scores;
//   drop policy if exists "read scores" on scores;
//   create policy "read scores" on scores for select using (true);
//
//   create or replace function submit_score(p_nick text, p_score int, p_coins int)
//   returns json
//   language plpgsql
//   security definer
//   set search_path = public
//   as $$
//   declare
//     n text;
//   begin
//     n := trim(both from coalesce(p_nick, ''));
//     if char_length(n) < 1 or char_length(n) > 10 then
//       raise exception 'invalid nick';
//     end if;
//     if p_score is null or p_score < 0 or p_score > 99999999 then
//       raise exception 'invalid score';
//     end if;
//     if p_coins is null or p_coins < 0 or p_coins > 99999999 then
//       raise exception 'invalid coins';
//     end if;
//     insert into public.scores (nick, score, coins) values (n, p_score, p_coins);
//     return json_build_object('ok', true);
//   end;
//   $$;
//
//   revoke all on function public.submit_score(text, int, int) from public;
//   grant execute on function public.submit_score(text, int, int) to anon, authenticated;
//
// 이미 submit_score 를 만들어 두었다면, 10만점 초과가 거절되지 않게
// SQL Editor에서 아래만 다시 실행하세요.
//
//   create or replace function submit_score(p_nick text, p_score int, p_coins int)
//   returns json
//   language plpgsql
//   security definer
//   set search_path = public
//   as $$
//   declare
//     n text;
//   begin
//     n := trim(both from coalesce(p_nick, ''));
//     if char_length(n) < 1 or char_length(n) > 10 then
//       raise exception 'invalid nick';
//     end if;
//     if p_score is null or p_score < 0 or p_score > 99999999 then
//       raise exception 'invalid score';
//     end if;
//     if p_coins is null or p_coins < 0 or p_coins > 99999999 then
//       raise exception 'invalid coins';
//     end if;
//     insert into public.scores (nick, score, coins) values (n, p_score, p_coins);
//     return json_build_object('ok', true);
//   end;
//   $$;
//
window.PENGUIN_SUPABASE = {
  url: "https://yahktwaabetayemhjech.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaGt0d2FhYmV0YXllbWhqZWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NDY3ODQsImV4cCI6MjEwMjUyMjc4NH0.0_mRro-jevcl_hL3ChKStURGReB1VzShLXr1U7lrntE",
};
