use serde_json::{json, Value};
use std::time::Duration;

const SEARCH_URL: &str = "https://search-core.defillama.com/multi-search";
const SEARCH_TIMEOUT: Duration = Duration::from_secs(8);

/// Public client token used by https://search.defillama.com/.
/// Override with DEFILLAMA_SEARCH_API_KEY if needed.
const PUBLIC_SEARCH_CORE_TOKEN: &str =
    "efccf2e832229a6c13152623ec436553aeb5dba7f18e9b9cfb193b32d4375074";

const USER_FACING_ERROR: &str = "Search failed";

#[tauri::command]
pub async fn search_directory(query: String) -> Result<Vec<Value>, String> {
    let query = query.trim().to_string();
    if query.is_empty() {
        return Ok(Vec::new());
    }

    let api_key = std::env::var("DEFILLAMA_SEARCH_API_KEY")
        .unwrap_or_else(|_| PUBLIC_SEARCH_CORE_TOKEN.to_string());

    let client = reqwest::Client::builder()
        .timeout(SEARCH_TIMEOUT)
        .user_agent("defillama-search/0.1.0")
        .build()
        .map_err(|_| USER_FACING_ERROR.to_string())?;

    let body = json!({
        "queries": [{
            "indexUid": "directory",
            "q": query,
            "limit": 20,
            "attributesToRetrieve": ["*"],
            "attributesToHighlight": ["name", "previousNames"],
            "highlightPreTag": "<mark>",
            "highlightPostTag": "</mark>"
        }]
    });

    let response = client
        .post(SEARCH_URL)
        .header("Authorization", format!("Bearer {api_key}"))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|_| USER_FACING_ERROR.to_string())?;

    if !response.status().is_success() {
        return Err(USER_FACING_ERROR.to_string());
    }

    let payload: Value = response
        .json()
        .await
        .map_err(|_| USER_FACING_ERROR.to_string())?;

    let hits = payload
        .pointer("/results/0/hits")
        .and_then(Value::as_array)
        .cloned()
        .ok_or_else(|| USER_FACING_ERROR.to_string())?;

    Ok(hits)
}
