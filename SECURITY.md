# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### Do NOT

- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before it has been addressed

### Do

1. **Email us directly** at the maintainer's email with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)

2. **Allow time for response** - We will acknowledge receipt within 48 hours

3. **Coordinate disclosure** - We will work with you to understand and address the issue

## Security Best Practices for Contributors

When contributing code, please ensure:

- No hardcoded credentials or API keys
- Input validation on all user inputs
- Proper error handling (no sensitive info in error messages)
- Dependencies are from trusted sources
- No data collection without explicit user consent

## Security Features

Focus-Lock implements several security measures:

- **Local-only data storage** - All data stays on your machine
- **No telemetry** - We do not collect any usage data
- **Encrypted sensitive data** - Passwords are hashed, not stored in plain text
- **Process isolation** - Restricted app monitoring uses minimal permissions

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who help improve our project.
