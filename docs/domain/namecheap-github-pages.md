## 目标

把 `lavitanomad.com` 绑定到 GitHub Pages（仓库：`Kelsidreamland/nomadic`），并启用 HTTPS。

## GitHub Pages（先做）

1. 打开仓库 → Settings → Pages
2. Custom domain 填：`lavitanomad.com` → Save
3. 等待显示 Verified（DNS 生效后才会通过）
4. Verified 后再打开 Enforce HTTPS

## Namecheap DNS

前提：Nameservers 使用 Namecheap BasicDNS（否则要去你实际的 DNS 服务商改）。

进入：Domain List → `lavitanomad.com` → Manage → Advanced DNS → HOST RECORDS

### A 记录（根域 apex）

新增 4 条（TTL：Automatic）：

- Type: A Record | Host: `@` | Value: `185.199.108.153`
- Type: A Record | Host: `@` | Value: `185.199.109.153`
- Type: A Record | Host: `@` | Value: `185.199.110.153`
- Type: A Record | Host: `@` | Value: `185.199.111.153`

### CNAME（www）

新增 1 条（TTL：Automatic）：

- Type: CNAME Record | Host: `www` | Value: `lavitanomad.com`

## 冲突排查

- `@` 不能同时存在 A Record 和 CNAME Record
- `www` 不要同时存在多条 CNAME，也不要和 A/URL Redirect 冲突
- 如果 `Host` 填 `@` 提示 invalid host name，先清空再输入，避免末尾空格或全角符号

## 生效时间

- 常见 10 分钟到数小时，最慢 24–48 小时

