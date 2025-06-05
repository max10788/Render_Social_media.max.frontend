from typing import Optional, Union
import base58
from solders.signature import Signature
import re
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class SignatureError(Exception):
    """Base exception for signature-related errors."""
    pass

class InvalidSignatureFormat(SignatureError):
    """Raised when signature format is invalid."""
    pass

class SignatureDecodingError(SignatureError):
    """Raised when signature cannot be decoded."""
    pass

def validate_signature(
    signature: str,
    strict: bool = True
) -> str:
    """
    Validate and normalize Solana transaction signature.
    
    Args:
        signature: The signature string to validate
        strict: Whether to apply strict validation rules
        
    Returns:
        str: Normalized signature string
        
    Raises:
        InvalidSignatureFormat: If signature format is invalid
    """
    if not signature:
        raise InvalidSignatureFormat("Empty signature provided")
        
    # Remove whitespace
    signature = signature.strip()
    
    # Basic format validation
    if strict:
        if not re.match(r"^[1-9A-HJ-NP-Za-km-z]{87,88}$", signature):
            raise InvalidSignatureFormat(
                "Signature must be 87-88 characters of base58 alphabet"
            )
    else:
        # More lenient validation for older formats
        if not re.match(r"^[1-9A-HJ-NP-Za-km-z]{32,88}$", signature):
            raise InvalidSignatureFormat(
                "Signature must be 32-88 characters of base58 alphabet"
            )
    
    return signature

def decode_signature(signature: str) -> bytes:
    """
    Decode base58 signature to bytes.
    
    Args:
        signature: The signature string to decode
        
    Returns:
        bytes: Decoded signature bytes
        
    Raises:
        SignatureDecodingError: If signature cannot be decoded
    """
    try:
        decoded = base58.b58decode(signature)
        if len(decoded) != 64:
            raise SignatureDecodingError(
                f"Invalid decoded length: {len(decoded)}, expected 64"
            )
        return decoded
    except Exception as e:
        raise SignatureDecodingError(f"Failed to decode signature: {e}")

def create_signature_object(
    signature: Union[str, bytes]
) -> Signature:
    """
    Create a Solana Signature object from string or bytes.
    
    Args:
        signature: The signature as string or bytes
        
    Returns:
        Signature: Solana Signature object
        
    Raises:
        SignatureError: If signature cannot be converted
    """
    try:
        if isinstance(signature, str):
            signature = decode_signature(signature)
        return Signature.from_bytes(signature)
    except Exception as e:
        raise SignatureError(f"Failed to create Signature object: {e}")

def normalize_signature(
    signature: str,
    repair: bool = False
) -> str:
    """
    Normalize signature format with optional repair.
    
    Args:
        signature: The signature to normalize
        repair: Whether to attempt repairing invalid signatures
        
    Returns:
        str: Normalized signature string
        
    Raises:
        InvalidSignatureFormat: If signature cannot be normalized
    """
    try:
        # Basic cleaning
        signature = signature.strip()
        
        if repair:
            # Remove invalid characters
            signature = ''.join(
                c for c in signature
                if c in '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
            )
        
        # Validate final format
        return validate_signature(signature, strict=not repair)
        
    except Exception as e:
        raise InvalidSignatureFormat(f"Failed to normalize signature: {e}")

def log_signature_operation(
    operation: str,
    signature: str,
    success: bool,
    error: Optional[Exception] = None
) -> None:
    """
    Log signature operation with consistent format.
    
    Args:
        operation: Type of operation performed
        signature: The signature being processed
        success: Whether operation was successful
        error: Optional exception if operation failed
    """
    log_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "operation": operation,
        "signature": signature[:10] + "...",
        "success": success,
        "error": str(error) if error else None
    }
    
    if success:
        logger.debug(f"Signature operation: {log_data}")
    else:
        logger.error(f"Signature operation failed: {log_data}")

class SignatureValidator:
    """Utility class for signature validation and conversion."""
    
    def __init__(self, strict_mode: bool = True):
        self.strict_mode = strict_mode
        self._valid_signatures: Set[str] = set()
        
    def validate(self, signature: str) -> bool:
        """
        Validate a signature.
        
        Args:
            signature: The signature to validate
            
        Returns:
            bool: Whether signature is valid
        """
        try:
            normalized = validate_signature(
                signature,
                strict=self.strict_mode
            )
            self._valid_signatures.add(normalized)
            return True
        except SignatureError:
            return False
            
    def get_valid_signatures(self) -> set[str]:
        """Get set of validated signatures."""
        return self._valid_signatures.copy()
        
    def clear_cache(self) -> None:
        """Clear cached valid signatures."""
        self._valid_signatures.clear()
