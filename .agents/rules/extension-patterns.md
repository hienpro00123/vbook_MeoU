# VBook Extension Patterns — Best Practices

## Fetch Pattern
Every HTTP call MUST check response status:
```javascript
var res = fetch(url, options);
if (!res.ok) return Response.error("HTTP " + res.status);
```

## Response Pattern
Every script MUST return via Response helper:
```javascript
return Response.success(data);        // success with data
return Response.success(data, data2); // success with pagination token
return Response.error("message");     // error with description
```

## Null Safety Pattern
Always guard against missing elements:
```javascript
var el = doc.select("selector");
var text = el.isEmpty() ? "" : el.text();
```

## URL Resolution Pattern
Handle relative URLs:
```javascript
var link = el.attr("href");
if (link && link.indexOf("http") !== 0) {
    link = DOMAIN + (link.indexOf("/") === 0 ? "" : "/") + link;
}
```

## Pagination Pattern
Use data2 for next-page tokens:
```javascript
var hasNext = !doc.select(".next-page").isEmpty();
return Response.success(items, hasNext ? String(parseInt(page) + 1) : "");
```

## Search Pattern
Always provide default values for parameters:
```javascript
function execute(query, page) {
    query = query || "";
    page = page || "1";
    // ...
}
```

