use std::time::{SystemTime, UNIX_EPOCH};

fn main() {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    println!("cargo:rustc-env=BUILD_TIME={}", format_utc(secs));
    tauri_build::build()
}

/// Format a Unix timestamp as "YYYY-MM-DD HH:MM UTC" without external crates.
/// Uses Hinnant's civil_from_days algorithm for the date portion.
fn format_utc(secs: u64) -> String {
    let h = (secs % 86400) / 3600;
    let m = (secs % 3600) / 60;
    let z = (secs / 86400) as i64 + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = (z - era * 146097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let mon = if mp < 10 { mp + 3 } else { mp - 9 };
    let yr = yoe as i64 + era * 400 + if mon <= 2 { 1 } else { 0 };
    format!("{:04}-{:02}-{:02} {:02}:{:02} UTC", yr, mon, d, h, m)
}
