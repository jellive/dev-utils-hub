use base64::{Engine as _, engine::general_purpose};
use hmac::{Hmac, Mac};
use md5::Md5;
use sha2::{Sha256, Sha512, Digest};

type HmacMd5 = Hmac<Md5>;
type HmacSha256 = Hmac<Sha256>;
type HmacSha512 = Hmac<Sha512>;

/// Encode a string to standard Base64.
#[tauri::command]
pub fn encode_base64(input: &str) -> String {
    general_purpose::STANDARD.encode(input.as_bytes())
}

/// Encode a string to URL-safe Base64 (no padding).
#[tauri::command]
pub fn encode_base64_url(input: &str) -> String {
    general_purpose::URL_SAFE_NO_PAD.encode(input.as_bytes())
}

/// Decode a standard Base64 string. Returns the decoded UTF-8 text or an error.
#[tauri::command]
pub fn decode_base64(input: &str) -> Result<String, String> {
    let bytes = general_purpose::STANDARD
        .decode(input)
        .map_err(|e| format!("Invalid Base64: {e}"))?;
    String::from_utf8(bytes).map_err(|e| format!("UTF-8 decode error: {e}"))
}

/// Decode a URL-safe Base64 string (accepts both padded and unpadded).
#[tauri::command]
pub fn decode_base64_url(input: &str) -> Result<String, String> {
    let bytes = general_purpose::URL_SAFE_NO_PAD
        .decode(input)
        .or_else(|_| general_purpose::URL_SAFE.decode(input))
        .map_err(|e| format!("Invalid URL-safe Base64: {e}"))?;
    String::from_utf8(bytes).map_err(|e| format!("UTF-8 decode error: {e}"))
}

/// Compute the MD5 hash of a string. Returns lowercase hex.
#[tauri::command]
pub fn hash_md5(input: &str) -> String {
    let mut hasher = Md5::new();
    hasher.update(input.as_bytes());
    hex::encode(hasher.finalize())
}

/// Compute the SHA-256 hash of a string. Returns lowercase hex.
#[tauri::command]
pub fn hash_sha256(input: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    hex::encode(hasher.finalize())
}

/// Compute the SHA-512 hash of a string. Returns lowercase hex.
#[tauri::command]
pub fn hash_sha512(input: &str) -> String {
    let mut hasher = Sha512::new();
    hasher.update(input.as_bytes());
    hex::encode(hasher.finalize())
}

/// Compute HMAC using the specified algorithm. Returns lowercase hex.
/// Supported algorithms: "md5", "sha256", "sha512".
#[tauri::command]
pub fn hash_hmac(input: &str, key: &str, algorithm: &str) -> Result<String, String> {
    match algorithm {
        "md5" => {
            let mut mac = HmacMd5::new_from_slice(key.as_bytes())
                .map_err(|e| e.to_string())?;
            mac.update(input.as_bytes());
            Ok(hex::encode(mac.finalize().into_bytes()))
        }
        "sha256" => {
            let mut mac = HmacSha256::new_from_slice(key.as_bytes())
                .map_err(|e| e.to_string())?;
            mac.update(input.as_bytes());
            Ok(hex::encode(mac.finalize().into_bytes()))
        }
        "sha512" => {
            let mut mac = HmacSha512::new_from_slice(key.as_bytes())
                .map_err(|e| e.to_string())?;
            mac.update(input.as_bytes());
            Ok(hex::encode(mac.finalize().into_bytes()))
        }
        other => Err(format!("Unsupported algorithm: {other}. Use md5, sha256, or sha512.")),
    }
}
