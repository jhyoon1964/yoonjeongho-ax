-- ============================================================
--  『AI 격차』 판매 사이트 - 데이터베이스 설계
--  사용법: 슈파베이스 → SQL Editor 에 통째로 붙여넣고 [Run] 클릭
-- ============================================================
--  표(테이블) 4개를 만듭니다.
--   1) profiles    : 회원 추가정보 (이름 등)
--   2) login_logs  : 로그인할 때마다 한 줄씩 기록
--   3) products    : 판매 도서 정보
--   4) orders      : 구매(주문) 이력  ← 사람(ID)별로 쌓임
-- ============================================================


-- 1) 회원 추가정보 -------------------------------------------
-- 로그인 계정 자체는 슈파베이스가 'auth.users'에 자동 보관합니다.
-- 여기에는 이름 같은 추가 정보만 보관해요.
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  name       text,
  created_at timestamptz default now()
);

-- 2) 로그인 기록 ---------------------------------------------
-- 누가 언제 로그인했는지 한 줄씩 남깁니다.
create table public.login_logs (
  id           bigint generated always as identity primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  email        text,
  user_agent   text,                    -- 어떤 브라우저/기기로 접속했는지
  logged_in_at timestamptz default now()
);

-- 3) 상품(도서) ----------------------------------------------
create table public.products (
  id         bigint generated always as identity primary key,
  title      text    not null,
  price      integer not null,          -- 가격 (원)
  created_at timestamptz default now()
);

-- 4) 구매(주문) 이력 -----------------------------------------
-- 사람(user_id)별로 어떤 책을 얼마에 샀는지 쌓입니다.
create table public.orders (
  id         bigint generated always as identity primary key,
  user_id    uuid    references auth.users(id) on delete cascade,
  product_id bigint  references public.products(id),
  amount     integer not null,          -- 결제 금액 (원)
  status     text    default 'paid',    -- 상태: paid(결제완료) 등
  created_at timestamptz default now()
);


-- ============================================================
--  보안 설정 (RLS: 내 데이터는 나만 보기)
--  ※ 이 설정이 없으면 남의 구매내역까지 보일 수 있어 꼭 필요합니다.
-- ============================================================
alter table public.profiles   enable row level security;
alter table public.login_logs enable row level security;
alter table public.orders     enable row level security;
alter table public.products   enable row level security;

-- profiles: 본인 것만 보고/수정/생성
create policy "본인 프로필 조회" on public.profiles
  for select using (auth.uid() = id);
create policy "본인 프로필 수정" on public.profiles
  for update using (auth.uid() = id);
create policy "본인 프로필 생성" on public.profiles
  for insert with check (auth.uid() = id);

-- login_logs: 본인 것만 보고/남기기
create policy "본인 로그인기록 조회" on public.login_logs
  for select using (auth.uid() = user_id);
create policy "본인 로그인기록 생성" on public.login_logs
  for insert with check (auth.uid() = user_id);

-- orders: 본인 것만 보고/생성
create policy "본인 주문 조회" on public.orders
  for select using (auth.uid() = user_id);
create policy "본인 주문 생성" on public.orders
  for insert with check (auth.uid() = user_id);

-- products: 상품은 누구나 볼 수 있음
create policy "상품 공개 조회" on public.products
  for select using (true);


-- ============================================================
--  회원가입하면 profiles 한 줄 자동 생성 (편의 장치)
-- ============================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
--  판매할 책 정보 1개 넣기
-- ============================================================
insert into public.products (title, price)
values ('AI 격차', 19800);

-- 끝! 왼쪽 메뉴 [Table Editor]에서 표 4개가 생겼는지 확인하세요.
