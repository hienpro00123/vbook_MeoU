function execute(url) {
  var response = fetch(url, {
    headers: {
      "Referer": "https://mangadex.org/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  });
  if (response.ok) {
    return response.base64();
  }
  return null;
}
