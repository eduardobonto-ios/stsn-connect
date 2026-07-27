-- Run against a current production-data clone before the finance migration.
-- This script is read-only and must return zero for every issue category.
begin transaction read only;

with issues as (
  select 'DUPLICATE_SCHOOL_OR' issue, count(*)::bigint issue_count
  from (
    select school_id, lower(btrim(or_number))
    from public.payments
    where nullif(btrim(or_number), '') is not null
    group by school_id, lower(btrim(or_number))
    having count(*) > 1
  ) x
  union all
  select 'MISSING_PAYMENT_OR', count(*) from public.payments
  where nullif(btrim(or_number), '') is null
  union all
  select 'MISSING_PAYMENT_SCHOOL', count(*) from public.payments where school_id is null
  union all
  select 'MISSING_ASSESSMENT_SCHOOL', count(*) from public.assessments where school_id is null
  union all
  select 'MISSING_PAYMENT_STUDENT', count(*)
  from public.payments p left join public.students s on s.id = p.student_id where s.id is null
  union all
  select 'MISSING_ASSESSMENT_STUDENT', count(*)
  from public.assessments a left join public.students s on s.id = a.student_id where s.id is null
  union all
  select 'ASSESSMENT_WITHOUT_FEE_LINES', count(*)
  from public.assessments a
  where not exists (select 1 from public.assessment_fees f where f.assessment_id = a.id)
  union all
  select 'INVALID_FEE_AMOUNT', count(*) from public.assessment_fees
  where amount < 0 or amount <> round(amount, 2)
  union all
  select 'INVALID_PAYMENT_AMOUNT', count(*) from public.payments where amount <= 0
  union all
  select 'MISSING_PAYMENT_METHOD_NAME', count(*) from public.payments
  where nullif(btrim(payment_method), '') is null
  union all
  select 'MISSING_DIRECT_COLLECTION_CATEGORY_NAME', count(*) from public.payments
  where transaction_type = 'OR'
    and nullif(btrim(payment_category), '') is null
  union all
  select 'MALFORMED_ACADEMIC_YEAR', count(*) from public.assessments
  where school_year !~ '^[0-9]{4}-[0-9]{4}$'
     or case when school_year ~ '^[0-9]{4}-[0-9]{4}$'
       then split_part(school_year, '-', 2)::integer
         <> split_part(school_year, '-', 1)::integer + 1
       else false
     end
  union all
  select 'UNSUPPORTED_PAYMENT_TERM', count(*) from public.assessments
  where coalesce(payment_term, 'Cash Basis') not in
    ('Cash Basis', 'Quarterly', 'Semestral',
     'Installment - 2 Payments', 'Installment - 4 Payments')
  union all
  select 'NEGATIVE_OR_OVERPAID_CACHED_BALANCE', count(*) from public.assessments
  where balance < 0 or balance > total_amount
  union all
  select 'UNEXPLAINED_CACHED_BALANCE', count(*)
  from public.assessments a
  where abs(
    a.balance - greatest(
      0,
      coalesce((select sum(f.amount) from public.assessment_fees f where f.assessment_id = a.id), 0)
      - coalesce(a.discount_amount, 0)
      - coalesce((select sum(p.amount) from public.payments p
          where p.assessment_id = a.id
            and p.transaction_type = 'AR'), 0)
    )
  ) > 0.01
  union all
  select 'DUPLICATE_ACTIVE_USER_EMAIL', count(*)
  from (
    select lower(btrim(email))
    from public.users
    where is_active and nullif(btrim(email), '') is not null
    group by lower(btrim(email))
    having count(*) > 1
  ) x
  union all
  select 'ACTIVE_USER_MISSING_EMAIL', count(*) from public.users
  where is_active and nullif(btrim(email), '') is null
  union all
  select 'ACTIVE_USER_WITHOUT_AUTH_LINK', count(*) from public.users
  where is_active and auth_user_id is null
  union all
  select 'AUTH_EMAIL_LINK_MISMATCH', count(*)
  from public.users u
  join auth.users a on a.id = u.auth_user_id
  where lower(btrim(u.email)) <> lower(btrim(a.email))
  union all
  select 'FINANCE_WRITES_NOT_DISABLED', count(*)
  from public.system_runtime_controls
  where control_key = 'student_finance_writes' and enabled
  union all
  select 'UNEXPECTED_LEGACY_CUTOVER_OBJECT', count(*)
  from unnest(array[
    'public.ledger_transactions_legacy',
    'public.student_ledger_summaries_legacy',
    'public.assessment_billing_summaries_legacy',
    'public.payment_collection_summaries_legacy',
    'public.payments_legacy',
    'public.payment_void_requests_legacy'
  ]) as x(object_name)
  where to_regclass(object_name) is not null
)
select issue, issue_count, (issue_count = 0) as passed
from issues
order by issue;

rollback;
