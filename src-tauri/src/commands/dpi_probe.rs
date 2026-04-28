use serde::Serialize;
use std::time::{Duration, Instant};

#[derive(Serialize)]
pub struct ProbeResult {
    pub status: Option<u16>,
    pub total_ms: u128,
    pub error: Option<String>,
    pub error_kind: Option<String>,
}

fn classify_error(err: &reqwest::Error) -> &'static str {
    if err.is_timeout() {
        "timeout"
    } else if err.is_connect() {
        "connect"
    } else if err.is_request() {
        "request"
    } else if err.is_body() {
        "body"
    } else if err.is_decode() {
        "decode"
    } else {
        "other"
    }
}

#[tauri::command]
pub async fn probe_native(url: String) -> ProbeResult {
    let client = match reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .user_agent("dev-utils-hub/dpi-probe")
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            return ProbeResult {
                status: None,
                total_ms: 0,
                error: Some(format!("client build error: {e}")),
                error_kind: Some("client_build".into()),
            };
        }
    };

    let start = Instant::now();
    let result = client.get(&url).send().await;
    let total_ms = start.elapsed().as_millis();

    match result {
        Ok(resp) => ProbeResult {
            status: Some(resp.status().as_u16()),
            total_ms,
            error: None,
            error_kind: None,
        },
        Err(e) => ProbeResult {
            status: None,
            total_ms,
            error_kind: Some(classify_error(&e).into()),
            error: Some(format!("{e}")),
        },
    }
}

#[tauri::command]
pub async fn probe_curl(url: String) -> ProbeResult {
    let start = Instant::now();
    let output = tokio::process::Command::new("curl")
        .args([
            "-sS",
            "-o",
            "/dev/null",
            "-w",
            "%{http_code}",
            "--max-time",
            "10",
            &url,
        ])
        .output()
        .await;
    let total_ms = start.elapsed().as_millis();

    match output {
        Ok(out) if out.status.success() => {
            let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
            let status = stdout.parse::<u16>().ok();
            ProbeResult {
                status,
                total_ms,
                error: None,
                error_kind: None,
            }
        }
        Ok(out) => {
            let stderr = String::from_utf8_lossy(&out.stderr).trim().to_string();
            ProbeResult {
                status: None,
                total_ms,
                error: Some(if stderr.is_empty() {
                    format!("curl exited with {}", out.status)
                } else {
                    stderr
                }),
                error_kind: Some("curl_failure".into()),
            }
        }
        Err(e) => ProbeResult {
            status: None,
            total_ms,
            error: Some(format!("curl spawn error: {e}")),
            error_kind: Some("spawn".into()),
        },
    }
}
