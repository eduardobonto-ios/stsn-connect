-- =============================================================================
-- STSN Connect / Theresian Connect
-- Accounting Module — Database Schema
-- Features: Chart of Accounts (Phase 1), Cost Centers (Phase 1),
--           Journal Entries (Phase 2)
--
-- Dialect: PostgreSQL 14+
-- MySQL 8.0+ notes are included as comments where syntax differs.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- UTILITIES
-- -----------------------------------------------------------------------------

-- PostgreSQL: gen_random_uuid() requires the pgcrypto extension on PG < 13,
-- or is built-in on PG 13+.
-- MySQL equivalent: DEFAULT (UUID())   — supported from MySQL 8.0.13

-- Trigger helper: auto-update updated_at on every row change.
-- (PostgreSQL only — MySQL uses ON UPDATE CURRENT_TIMESTAMP on the column.)
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- PHASE 1 — FOUNDATION
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CHART OF ACCOUNTS
-- -----------------------------------------------------------------------------

CREATE TABLE chart_of_accounts (
    id              UUID         NOT NULL DEFAULT gen_random_uuid(),
    -- MySQL: id CHAR(36) NOT NULL DEFAULT (UUID()),

    code            VARCHAR(20)  NOT NULL,
    name            VARCHAR(255) NOT NULL,
    type            VARCHAR(20)  NOT NULL,
    normal_balance  VARCHAR(10)  NOT NULL,
    parent_code     VARCHAR(20)  NULL,
    description     TEXT         NULL,
    is_header       BOOLEAN      NOT NULL DEFAULT FALSE,
    -- MySQL: is_header TINYINT(1) NOT NULL DEFAULT 0,

    status          VARCHAR(10)  NOT NULL DEFAULT 'Active',
    school_id       VARCHAR(50)  NULL,   -- NULL = applies to all schools

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_chart_of_accounts         PRIMARY KEY (id),
    CONSTRAINT uq_chart_of_accounts_code    UNIQUE (code),
    CONSTRAINT fk_coa_parent                FOREIGN KEY (parent_code)
                                              REFERENCES chart_of_accounts (code)
                                              ON UPDATE CASCADE
                                              ON DELETE RESTRICT,
    CONSTRAINT chk_coa_type                 CHECK (type IN (
                                              'Asset', 'Liability', 'Equity',
                                              'Revenue', 'Expense')),
    CONSTRAINT chk_coa_normal_balance       CHECK (normal_balance IN ('Debit', 'Credit')),
    CONSTRAINT chk_coa_status               CHECK (status IN ('Active', 'Inactive'))
);

CREATE INDEX idx_coa_parent_code ON chart_of_accounts (parent_code);
CREATE INDEX idx_coa_type        ON chart_of_accounts (type);
CREATE INDEX idx_coa_school_id   ON chart_of_accounts (school_id);

CREATE TRIGGER trg_coa_updated_at
BEFORE UPDATE ON chart_of_accounts
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
-- MySQL: add `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() ON UPDATE NOW()` on the column instead.

-- ── Seed Data ─────────────────────────────────────────────────────────────────
INSERT INTO chart_of_accounts (code, name, type, normal_balance, parent_code, description, is_header, status) VALUES
-- Assets
('1000', 'Assets',                                       'Asset',     'Debit',  NULL,   'All school assets',                              TRUE,  'Active'),
('1100', 'Current Assets',                               'Asset',     'Debit',  '1000', 'Assets expected within 12 months',               TRUE,  'Active'),
('1110', 'Cash on Hand',                                 'Asset',     'Debit',  '1100', 'Physical cash in the cashier vault',             FALSE, 'Active'),
('1120', 'Cash in Bank — BDO',                           'Asset',     'Debit',  '1100', 'BDO checking account',                           FALSE, 'Active'),
('1130', 'Accounts Receivable — Tuition',                'Asset',     'Debit',  '1100', 'Student tuition receivables',                    FALSE, 'Active'),
('1140', 'Advances to Suppliers',                        'Asset',     'Debit',  '1100', 'Prepaid amounts to vendors',                     FALSE, 'Active'),
('1200', 'Non-Current Assets',                           'Asset',     'Debit',  '1000', 'Long-term assets',                               TRUE,  'Active'),
('1210', 'Furniture & Fixtures',                         'Asset',     'Debit',  '1200', 'School furniture and equipment',                 FALSE, 'Active'),
('1220', 'Computers & IT Equipment',                     'Asset',     'Debit',  '1200', 'Computers, printers, projectors',               FALSE, 'Active'),
('1230', 'Buildings & Improvements',                     'Asset',     'Debit',  '1200', 'School building value',                          FALSE, 'Active'),
-- Liabilities
('2000', 'Liabilities',                                  'Liability', 'Credit', NULL,   'All school liabilities',                         TRUE,  'Active'),
('2100', 'Current Liabilities',                          'Liability', 'Credit', '2000', 'Obligations due within 12 months',              TRUE,  'Active'),
('2110', 'Accounts Payable',                             'Liability', 'Credit', '2100', 'Amounts owed to suppliers',                      FALSE, 'Active'),
('2120', 'SSS / PhilHealth / Pag-IBIG Payable',          'Liability', 'Credit', '2100', 'Government remittances due',                    FALSE, 'Active'),
('2130', 'Income Tax Payable',                           'Liability', 'Credit', '2100', 'BIR income tax due',                             FALSE, 'Active'),
('2140', 'Deferred Tuition Revenue',                     'Liability', 'Credit', '2100', 'Collected tuition for future periods',           FALSE, 'Active'),
-- Equity
('3000', 'Equity',                                       'Equity',    'Credit', NULL,   'Owner''s equity / retained surplus',             TRUE,  'Active'),
('3100', 'Retained Surplus',                             'Equity',    'Credit', '3000', 'Accumulated net income',                         FALSE, 'Active'),
('3200', 'Current Year Surplus / Deficit',               'Equity',    'Credit', '3000', 'Net income for the current year',               FALSE, 'Active'),
-- Revenue
('4000', 'Revenue',                                      'Revenue',   'Credit', NULL,   'All income accounts',                            TRUE,  'Active'),
('4100', 'Tuition Fees',                                 'Revenue',   'Credit', '4000', 'Tuition income from enrolled students',          FALSE, 'Active'),
('4110', 'Tuition Fees — Basic Ed',                      'Revenue',   'Credit', '4100', 'K-12 tuition fees',                             FALSE, 'Active'),
('4120', 'Tuition Fees — College',                       'Revenue',   'Credit', '4100', 'College / tertiary tuition fees',               FALSE, 'Active'),
('4200', 'Miscellaneous Fees',                           'Revenue',   'Credit', '4000', 'Lab, ID, and other school fees',                FALSE, 'Active'),
('4300', 'Book Package Revenue',                         'Revenue',   'Credit', '4000', 'Revenue from book package sales',               FALSE, 'Active'),
-- Expenses
('5000', 'Expenses',                                     'Expense',   'Debit',  NULL,   'All expense accounts',                           TRUE,  'Active'),
('5100', 'Personnel Costs',                              'Expense',   'Debit',  '5000', 'Salaries, wages, and benefits',                  TRUE,  'Active'),
('5110', 'Teachers'' Salaries',                          'Expense',   'Debit',  '5100', 'Teaching staff compensation',                    FALSE, 'Active'),
('5120', 'Admin Staff Salaries',                         'Expense',   'Debit',  '5100', 'Non-teaching staff compensation',               FALSE, 'Active'),
('5130', 'SSS / PhilHealth / Pag-IBIG — Employer Share', 'Expense',   'Debit',  '5100', 'Employer share of mandatory contributions',     FALSE, 'Active'),
('5200', 'Operating Expenses',                           'Expense',   'Debit',  '5000', 'Day-to-day operating costs',                     TRUE,  'Active'),
('5210', 'Utilities — Electricity',                      'Expense',   'Debit',  '5200', 'MERALCO and other electric bills',              FALSE, 'Active'),
('5220', 'Utilities — Water',                            'Expense',   'Debit',  '5200', 'Water utilities',                               FALSE, 'Active'),
('5230', 'Supplies & Materials',                         'Expense',   'Debit',  '5200', 'Office and classroom supplies',                  FALSE, 'Active'),
('5240', 'Repairs & Maintenance',                        'Expense',   'Debit',  '5200', 'Facility and equipment repairs',                FALSE, 'Active'),
('5250', 'Depreciation',                                 'Expense',   'Debit',  '5200', 'Asset depreciation charges',                    FALSE, 'Active');


-- -----------------------------------------------------------------------------
-- 2. COST CENTERS
-- -----------------------------------------------------------------------------

CREATE TABLE cost_centers (
    id              UUID         NOT NULL DEFAULT gen_random_uuid(),
    -- MySQL: id CHAR(36) NOT NULL DEFAULT (UUID()),

    code            VARCHAR(20)  NOT NULL,
    name            VARCHAR(255) NOT NULL,
    type            VARCHAR(20)  NOT NULL,
    description     TEXT         NULL,
    gl_account_code VARCHAR(20)  NULL,
    status          VARCHAR(10)  NOT NULL DEFAULT 'Active',
    school_id       VARCHAR(50)  NULL,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_cost_centers              PRIMARY KEY (id),
    CONSTRAINT uq_cost_centers_code         UNIQUE (code),
    CONSTRAINT fk_cc_gl_account             FOREIGN KEY (gl_account_code)
                                              REFERENCES chart_of_accounts (code)
                                              ON UPDATE CASCADE
                                              ON DELETE SET NULL,
    CONSTRAINT chk_cc_type                  CHECK (type IN (
                                              'Department', 'Program',
                                              'Project', 'Administrative')),
    CONSTRAINT chk_cc_status                CHECK (status IN ('Active', 'Inactive'))
);

CREATE INDEX idx_cc_type        ON cost_centers (type);
CREATE INDEX idx_cc_school_id   ON cost_centers (school_id);

CREATE TRIGGER trg_cc_updated_at
BEFORE UPDATE ON cost_centers
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Seed Data ─────────────────────────────────────────────────────────────────
INSERT INTO cost_centers (code, name, type, description, gl_account_code, status) VALUES
('CC-1000', 'Basic Education',          'Department',     'K-12 academic operations and programs',                      '4110', 'Active'),
('CC-1100', 'Grade School',             'Department',     'Grades 1–6 program costs',                                   NULL,   'Active'),
('CC-1200', 'Junior High School',       'Department',     'Grades 7–10 program costs',                                  NULL,   'Active'),
('CC-1300', 'Senior High School',       'Department',     'Grades 11–12 (STEM / ABM / HUMSS tracks)',                   NULL,   'Active'),
('CC-2000', 'College / Tertiary',       'Department',     'CDSTA tertiary programs (BSIT, BSBA, etc.)',                 '4120', 'Active'),
('CC-3000', 'Administrative',           'Administrative', 'Finance, HR, Registrar, and support offices',               '5200', 'Active'),
('CC-3100', 'Finance & Accounting',     'Administrative', 'Treasury, accounting, and cashier functions',                NULL,   'Active'),
('CC-3200', 'Human Resources',          'Administrative', 'Personnel management and payroll',                           '5100', 'Active'),
('CC-4000', 'Facilities & Maintenance', 'Administrative', 'Building, utilities, and equipment maintenance',             '5240', 'Active'),
('CC-5000', 'School Improvement Fund',  'Project',        'Capital improvement and special development projects',       NULL,   'Active'),
('CC-5100', 'Library Development',      'Project',        'Book acquisition, e-resources, and library infrastructure',  NULL,   'Active'),
('CC-6000', 'Scholarship Programs',     'Program',        'Discount, scholarship, and financial assistance programs',   NULL,   'Active'),
('CC-6100', 'Athletics & Sports',       'Program',        'Intramurals, sports teams, and physical education programs', NULL,   'Inactive');


-- =============================================================================
-- PHASE 2 — CORE DOUBLE-ENTRY
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3. JOURNAL ENTRIES
--    Two tables: journal_entries (header) + journal_entry_lines (detail).
--    Every posted entry must balance: SUM(debit) = SUM(credit).
-- -----------------------------------------------------------------------------

CREATE TABLE journal_entries (
    id              UUID         NOT NULL DEFAULT gen_random_uuid(),
    -- MySQL: id CHAR(36) NOT NULL DEFAULT (UUID()),

    entry_no        VARCHAR(30)  NOT NULL,   -- e.g. JE-2026-00001
    entry_date      DATE         NOT NULL,
    fiscal_year     VARCHAR(10)  NOT NULL,   -- e.g. '2025-2026'
    fiscal_period   VARCHAR(20)  NOT NULL,   -- e.g. 'June 2026'

    description     TEXT         NULL,
    reference_no    VARCHAR(100) NULL,       -- OR number, receipt no., etc.

    -- Source tracing: what created this entry (manual or system-generated)
    source_type     VARCHAR(50)  NULL,       -- 'Manual' | 'Payment' | 'Assessment' | 'Invoice'
    source_id       VARCHAR(36)  NULL,       -- FK to the originating record (loose reference)

    status          VARCHAR(20)  NOT NULL DEFAULT 'Draft',
    school_id       VARCHAR(50)  NULL,
    cost_center_id  UUID         NULL,

    created_by      VARCHAR(100) NOT NULL,
    posted_by       VARCHAR(100) NULL,
    posted_at       TIMESTAMPTZ  NULL,
    voided_by       VARCHAR(100) NULL,
    voided_at       TIMESTAMPTZ  NULL,
    void_reason     TEXT         NULL,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_journal_entries           PRIMARY KEY (id),
    CONSTRAINT uq_journal_entry_no          UNIQUE (entry_no),
    CONSTRAINT fk_je_cost_center            FOREIGN KEY (cost_center_id)
                                              REFERENCES cost_centers (id)
                                              ON DELETE SET NULL,
    CONSTRAINT chk_je_status               CHECK (status IN ('Draft', 'Posted', 'Void')),
    CONSTRAINT chk_je_posted_fields        CHECK (
        status <> 'Posted' OR (posted_by IS NOT NULL AND posted_at IS NOT NULL)
    ),
    CONSTRAINT chk_je_void_fields          CHECK (
        status <> 'Void' OR (voided_by IS NOT NULL AND voided_at IS NOT NULL)
    )
);

CREATE INDEX idx_je_entry_date   ON journal_entries (entry_date);
CREATE INDEX idx_je_fiscal_year  ON journal_entries (fiscal_year);
CREATE INDEX idx_je_status       ON journal_entries (status);
CREATE INDEX idx_je_school_id    ON journal_entries (school_id);
CREATE INDEX idx_je_source       ON journal_entries (source_type, source_id);

CREATE TRIGGER trg_je_updated_at
BEFORE UPDATE ON journal_entries
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


CREATE TABLE journal_entry_lines (
    id                UUID          NOT NULL DEFAULT gen_random_uuid(),
    -- MySQL: id CHAR(36) NOT NULL DEFAULT (UUID()),

    journal_entry_id  UUID          NOT NULL,
    line_no           SMALLINT      NOT NULL,   -- 1-based ordering within the entry

    account_code      VARCHAR(20)   NOT NULL,
    cost_center_id    UUID          NULL,       -- line-level cost center (overrides header)

    debit_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
    credit_amount     NUMERIC(15,2) NOT NULL DEFAULT 0,
    description       TEXT          NULL,

    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_journal_entry_lines       PRIMARY KEY (id),
    CONSTRAINT fk_jel_journal_entry         FOREIGN KEY (journal_entry_id)
                                              REFERENCES journal_entries (id)
                                              ON DELETE CASCADE,
    CONSTRAINT fk_jel_account              FOREIGN KEY (account_code)
                                              REFERENCES chart_of_accounts (code)
                                              ON UPDATE CASCADE
                                              ON DELETE RESTRICT,
    CONSTRAINT fk_jel_cost_center          FOREIGN KEY (cost_center_id)
                                              REFERENCES cost_centers (id)
                                              ON DELETE SET NULL,
    CONSTRAINT uq_jel_entry_line           UNIQUE (journal_entry_id, line_no),
    CONSTRAINT chk_jel_debit_credit        CHECK (
        -- Exactly one side must be non-zero; the other must be zero
        (debit_amount > 0 AND credit_amount = 0) OR
        (credit_amount > 0 AND debit_amount = 0)
    ),
    CONSTRAINT chk_jel_amounts_positive    CHECK (
        debit_amount  >= 0 AND
        credit_amount >= 0
    )
);

CREATE INDEX idx_jel_journal_entry_id ON journal_entry_lines (journal_entry_id);
CREATE INDEX idx_jel_account_code     ON journal_entry_lines (account_code);
CREATE INDEX idx_jel_cost_center_id   ON journal_entry_lines (cost_center_id);

CREATE TRIGGER trg_jel_updated_at
BEFORE UPDATE ON journal_entry_lines
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ── Balance validation function (PostgreSQL) ──────────────────────────────────
-- Call after inserting/updating lines on a Draft entry, or before posting.
-- Returns TRUE if debits = credits for the given journal entry.
CREATE OR REPLACE FUNCTION fn_je_is_balanced(p_journal_entry_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_total_debit  NUMERIC(15,2);
    v_total_credit NUMERIC(15,2);
BEGIN
    SELECT
        COALESCE(SUM(debit_amount),  0),
        COALESCE(SUM(credit_amount), 0)
    INTO v_total_debit, v_total_credit
    FROM journal_entry_lines
    WHERE journal_entry_id = p_journal_entry_id;

    RETURN v_total_debit = v_total_credit;
END;
$$ LANGUAGE plpgsql;


-- ── Posting guard trigger ─────────────────────────────────────────────────────
-- Prevents posting an unbalanced journal entry.
CREATE OR REPLACE FUNCTION trigger_guard_je_post()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Posted' AND OLD.status = 'Draft' THEN
        IF NOT fn_je_is_balanced(NEW.id) THEN
            RAISE EXCEPTION
                'Cannot post journal entry %: debits do not equal credits.',
                NEW.entry_no;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_je_guard_post
BEFORE UPDATE OF status ON journal_entries
FOR EACH ROW EXECUTE FUNCTION trigger_guard_je_post();


-- ── Entry number sequence (PostgreSQL) ────────────────────────────────────────
-- Generates entry numbers in the format JE-YYYY-NNNNN per fiscal year.
-- MySQL alternative: use AUTO_INCREMENT + application-layer formatting.
CREATE SEQUENCE IF NOT EXISTS seq_journal_entry_no START 1;

CREATE OR REPLACE FUNCTION fn_next_journal_entry_no(p_fiscal_year VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'JE-' || p_fiscal_year || '-' || LPAD(nextval('seq_journal_entry_no')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;
-- Usage: entry_no = fn_next_journal_entry_no('2025-2026')
--        → 'JE-2025-2026-00001'


-- =============================================================================
-- END OF SCRIPT
-- =============================================================================
