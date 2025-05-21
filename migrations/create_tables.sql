CREATE TABLE IF NOT EXISTS crypto_transactions (
    id SERIAL PRIMARY KEY,
    hash VARCHAR(255) NOT NULL UNIQUE,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount FLOAT,
    amount_converted FLOAT,
    fee FLOAT,
    fee_converted FLOAT,
    currency VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    direction VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);