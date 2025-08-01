# app/core/backend_crypto_tracker/api/controllers/token_controller.py
# from ...database.manager import DatabaseManager # Injected oder global

# db_manager = None # Injected dependency

# async def get_tokens(limit: int = 50, min_score: float = 0, chain: str = None, search: str = None):
#     if not db_manager:
#         raise RuntimeError("DatabaseManager nicht injiziert.")
#     return await db_manager.get_tokens(limit, min_score, chain, search)

# async def get_token_detail(token_address: str):
#     if not db_manager:
#         raise RuntimeError("DatabaseManager nicht injiziert.")
#     return await db_manager.get_token_analysis(token_address)

# async def get_token_wallets(token_address: str):
#     if not db_manager:
#         raise RuntimeError("DatabaseManager nicht injiziert.")
#     # Implementiere Logik zum Abrufen der Wallets
#     return []
