-- Money Saver database schema (Microsoft SQL Server / T-SQL)

-- Create tables only if they don't exist
IF OBJECT_ID(N'dbo.accounts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.accounts (
        id NVARCHAR(64) NOT NULL CONSTRAINT PK_accounts PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        type NVARCHAR(50) NOT NULL,
        balance DECIMAL(12,2) NOT NULL CONSTRAINT DF_accounts_balance DEFAULT (0),
        status NVARCHAR(10) NOT NULL CONSTRAINT DF_accounts_status DEFAULT ('active'),
        closed_reason NVARCHAR(500) NULL,
        stash_type NVARCHAR(50) NOT NULL CONSTRAINT DF_accounts_stash_type DEFAULT ('Bank'),  -- ← new
        goal_amount DECIMAL(12,2) NULL,
        goal_date DATE NULL,
        last_tx_date DATETIME2 NULL
    );
END;
GO

IF OBJECT_ID(N'dbo.transactions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.transactions (
        id NVARCHAR(64) NOT NULL CONSTRAINT PK_transactions PRIMARY KEY,
        [date] DATETIME2 NOT NULL CONSTRAINT DF_transactions_date DEFAULT (SYSUTCDATETIME()),
        [type] NVARCHAR(20) NOT NULL CONSTRAINT CK_transactions_type CHECK ([type] IN ('deposit','withdrawal','transfer')),
        amount DECIMAL(12,2) NOT NULL,
        [description] NVARCHAR(500) NOT NULL,
        account_id NVARCHAR(64) NULL,
        from_account_id NVARCHAR(64) NULL,
        to_account_id NVARCHAR(64) NULL,
        -- Allow deleting a single-linked account to null out its reference
        CONSTRAINT FK_transactions_account FOREIGN KEY (account_id) REFERENCES dbo.accounts(id) ON DELETE SET NULL,
        -- Avoid multiple cascade paths: do NOT cascade for transfer links
        CONSTRAINT FK_transactions_from_account FOREIGN KEY (from_account_id) REFERENCES dbo.accounts(id),
        CONSTRAINT FK_transactions_to_account FOREIGN KEY (to_account_id) REFERENCES dbo.accounts(id),
        CONSTRAINT CK_transactions_relations CHECK ( (
            [type] IN ('deposit','withdrawal') AND account_id IS NOT NULL
        ) OR (
            [type] = 'transfer' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL
        ))
    );
END;
GO

IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.users (
        id NVARCHAR(64) NOT NULL CONSTRAINT PK_users PRIMARY KEY,
        first_name NVARCHAR(100) NOT NULL,
        last_name NVARCHAR(100) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL
    );
END;
GO

-- Add user_id column to accounts if missing
IF COL_LENGTH('dbo.accounts','user_id') IS NULL
BEGIN
    ALTER TABLE dbo.accounts ADD user_id NVARCHAR(64) NOT NULL DEFAULT '';
    ALTER TABLE dbo.accounts ADD CONSTRAINT FK_accounts_user FOREIGN KEY (user_id) REFERENCES dbo.users(id);
END;
GO

-- Add user_id column to transactions if missing
IF COL_LENGTH('dbo.transactions','user_id') IS NULL
BEGIN
    ALTER TABLE dbo.transactions ADD user_id NVARCHAR(64) NOT NULL DEFAULT '';
    ALTER TABLE dbo.transactions ADD CONSTRAINT FK_transactions_user FOREIGN KEY (user_id) REFERENCES dbo.users(id);
END;
GO

-- Add goal_frequency column
IF COL_LENGTH('dbo.accounts','goal_frequency') IS NULL
BEGIN
    ALTER TABLE dbo.accounts ADD goal_frequency NVARCHAR(10) NULL;
END;
GO

-- Add status column
IF COL_LENGTH('dbo.accounts','status') IS NULL
BEGIN
    ALTER TABLE dbo.accounts ADD status NVARCHAR(10) NOT NULL CONSTRAINT DF_accounts_status DEFAULT ('active');
END;
GO

-- Add closed_reason column
IF COL_LENGTH('dbo.accounts','closed_reason') IS NULL
BEGIN
    ALTER TABLE dbo.accounts ADD closed_reason NVARCHAR(500) NULL;
END;
GO
