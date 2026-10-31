# VBook Agents Configuration

## Available Agents

### Extension Developer
- **Role**: Tạo mới và phát triển extensions vBook
- **Skills**: `vbook-extensions`, `vbook-analyzer`
- **Triggers**: Khi user yêu cầu tạo extension mới, viết script, thêm nguồn

### Extension Debugger
- **Role**: Debug và sửa lỗi extensions
- **Skills**: `vbook-debugger`, `vbook-extensions`
- **Triggers**: Khi extension bị lỗi, không load được, data sai

### Extension Publisher
- **Role**: Build, validate, và publish extensions
- **Skills**: `vbook-publish`, `vbook-extensions`
- **Triggers**: Khi cần build ZIP, cập nhật catalog, chuẩn bị commit

### Website Analyzer
- **Role**: Phân tích website nguồn để tạo extension
- **Skills**: `vbook-analyzer`
- **Triggers**: Khi user cung cấp URL website mới cần hỗ trợ

## Agent Workflow

```
User Request
    │
    ├── "Tạo extension cho site X"
    │   └── Analyzer → Developer → Publisher
    │
    ├── "Extension Y bị lỗi"
    │   └── Debugger → (fix) → Publisher
    │
    ├── "Build/deploy extension Z"
    │   └── Publisher
    │
    └── "Thêm tính năng vào extension"
        └── Developer → Publisher
```

## Skill Dependencies

```
vbook-extensions (master)
    ├── vbook-analyzer (website analysis)
    ├── vbook-debugger (debugging)
    └── vbook-publish  (build & deploy)
```

