## GitHub Code Search with grep-mcp

**Use grep-mcp to find real-world code examples from 1M+ public GitHub repositories.** See how production code implements patterns, APIs, and integrations.

### When to Use grep-mcp

| Situation | Action |
|-----------|--------|
| Implementing unfamiliar API | Search for real usage patterns |
| Unsure about syntax/parameters | Find production examples |
| Need integration patterns | See how libraries work together |
| Looking for best practices | Find code from popular repos |

### Key Principle

**Search for literal code patterns, not keywords:**
- `useState(` - actual code that appears in files
- `import React from` - real import statements
- `async function` - actual syntax
- `react tutorial` - keywords (won't work well)

### Workflow

```python
# Basic search
searchGitHub(query="FastMCP", language=["Python"])

# With regex for flexible patterns (prefix with (?s) for multiline)
searchGitHub(query="(?s)useEffect\\(.*cleanup", useRegexp=True, language=["TypeScript"])

# Filter by repository
searchGitHub(query="getServerSession", repo="vercel/next-auth")

# Filter by file path
searchGitHub(query="middleware", path="/route.ts")
```

### Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `query` | Code pattern to search | `"useState("` |
| `language` | Filter by language | `["Python", "TypeScript"]` |
| `repo` | Filter by repository | `"facebook/react"` |
| `path` | Filter by file path | `"src/components"` |
| `useRegexp` | Enable regex patterns | `true` |
| `matchCase` | Case-sensitive search | `true` |

### Examples

**React patterns:**
```python
searchGitHub(query="ErrorBoundary", language=["TSX"])
searchGitHub(query="(?s)useEffect\\(\\(\\) => {.*removeEventListener", useRegexp=True)
```

**Python patterns:**
```python
searchGitHub(query="FastMCP", language=["Python"])
searchGitHub(query="@pytest.fixture", language=["Python"])
```

**API integrations:**
```python
searchGitHub(query="CORS(", language=["Python"], matchCase=True)
searchGitHub(query="getServerSession", language=["TypeScript", "TSX"])
```

### Tool Selection Guide

| Need | Best Tool |
|------|-----------|
| Library documentation | Context7 |
| Production code examples | **grep-mcp** |
| Local codebase patterns | Vexor |
| General web research | WebSearch |

### Tips

- Use `(?s)` prefix in regex to match across multiple lines
- Filter by language to reduce noise
- Filter by popular repos (`repo="vercel/"`) for quality examples
- Combine with Context7: docs first, then grep-mcp for real usage
