from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import json
import logging
from decimal import Decimal
import base58
import re

logger = logging.getLogger(__name__)

class ParserError(Exception):
    """Base exception for parsing errors."""
    pass

def parse_timestamp(
    timestamp: Union[int, str, datetime]
) -> datetime:
    """
    Parse timestamp into datetime object.
    
    Args:
        timestamp: Unix timestamp, ISO string, or datetime
        
    Returns:
        datetime: Parsed datetime object
        
    Raises:
        ParserError: If timestamp cannot be parsed
    """
    try:
        if isinstance(timestamp, datetime):
            return timestamp
            
        if isinstance(timestamp, int):
            return datetime.fromtimestamp(timestamp)
            
        if isinstance(timestamp, str):
            try:
                return datetime.fromisoformat(timestamp)
            except ValueError:
                # Try parsing as Unix timestamp
                return datetime.fromtimestamp(float(timestamp))
                
        raise ValueError(f"Unsupported timestamp format: {type(timestamp)}")
        
    except Exception as e:
        raise ParserError(f"Failed to parse timestamp: {e}")

def parse_amount(
    amount: Union[str, int, float, Decimal],
    decimals: int = 9
) -> Decimal:
    """
    Parse and normalize amount with proper decimal places.
    
    Args:
        amount: Amount to parse
        decimals: Number of decimal places
        
    Returns:
        Decimal: Normalized amount
        
    Raises:
        ParserError: If amount cannot be parsed
    """
    try:
        if isinstance(amount, str):
            # Remove any non-numeric characters except decimal point
            amount = re.sub(r'[^\d.]', '', amount)
            
        amount_decimal = Decimal(str(amount))
        return round(amount_decimal, decimals)
        
    except Exception as e:
        raise ParserError(f"Failed to parse amount: {e}")

def parse_instruction_data(data: bytes) -> Dict[str, Any]:
    """
    Parse Solana instruction data.
    
    Args:
        data: Raw instruction data bytes
        
    Returns:
        Dict[str, Any]: Parsed instruction data
        
    Raises:
        ParserError: If data cannot be parsed
    """
    try:
        if len(data) < 1:
            return {"instruction": "unknown"}
            
        instruction_type = data[0]
        instruction_data = data[1:]
        
        # Common instruction types
        INSTRUCTION_TYPES = {
            0: "initialize",
            1: "transfer",
            2: "approve",
            3: "revoke",
            # Add more instruction types...
        }
        
        result = {
            "instruction": INSTRUCTION_TYPES.get(
                instruction_type,
                f"unknown_{instruction_type}"
            )
        }
        
        # Parse instruction-specific data
        if instruction_type == 1:  # Transfer
            result.update(parse_transfer_data(instruction_data))
            
        return result
        
    except Exception as e:
        raise ParserError(f"Failed to parse instruction data: {e}")

def parse_transfer_data(data: bytes) -> Dict[str, Any]:
    """Parse transfer instruction data."""
    try:
        if len(data) < 8:
            raise ValueError("Invalid transfer data length")
            
        amount = int.from_bytes(data[:8], 'little')
        
        return {
            "amount": amount,
            "decimals": 9  # Default SOL decimals
        }
        
    except Exception as e:
        raise ParserError(f"Failed to parse transfer data: {e}")

def parse_account_data(
    data: bytes,
    encoding: str = "base58"
) -> Dict[str, Any]:
    """
    Parse Solana account data.
    
    Args:
        data: Raw account data bytes
        encoding: Data encoding format
        
    Returns:
        Dict[str, Any]: Parsed account data
        
    Raises:
        ParserError: If data cannot be parsed
    """
    try:
        if encoding == "base58":
            data = base58.b58decode(data)
            
        if len(data) < 1:
            return {"type": "unknown"}
            
        account_type = data[0]
        account_data = data[1:]
        
        # Common account types
        ACCOUNT_TYPES = {
            0: "system",
            1: "stake",
            2: "token",
            # Add more account types...
        }
        
        result = {
            "type": ACCOUNT_TYPES.get(
                account_type,
                f"unknown_{account_type}"
            )
        }
        
        # Parse type-specific data
        if account_type == 2:  # Token account
            result.update(parse_token_account_data(account_data))
            
        return result
        
    except Exception as e:
        raise ParserError(f"Failed to parse account data: {e}")

def parse_token_account_data(data: bytes) -> Dict[str, Any]:
    """Parse token account data."""
    try:
        if len(data) < 165:  # Minimum token account data length
            raise ValueError("Invalid token account data length")
            
        return {
            "mint": base58.b58encode(data[0:32]).decode('ascii'),
            "owner": base58.b58encode(data[32:64]).decode('ascii'),
            "amount": int.from_bytes(data[64:72], 'little'),
            "delegate_present": bool(data[72]),
            # Add more fields...
        }
        
    except Exception as e:
        raise ParserError(f"Failed to parse token account data: {e}")

def log_parse_operation(
    operation: str,
    input_data: Any,
    success: bool,
    error: Optional[Exception] = None
) -> None:
    """
    Log parsing operation with consistent format.
    
    Args:
        operation: Type of operation performed
        input_data: Input being parsed (truncated if needed)
        success: Whether operation was successful
        error: Optional exception if operation failed
    """
    log_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "operation": operation,
        "input_preview": str(input_data)[:100],
        "success": success,
        "error": str(error) if error else None
    }
    
    if success:
        logger.debug(f"Parse operation: {log_data}")
    else:
        logger.error(f"Parse operation failed: {log_data}")
