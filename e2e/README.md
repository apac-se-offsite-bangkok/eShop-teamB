# End-to-End Testing Guide

This directory contains end-to-end tests for the eShop application using Playwright.

## Prerequisites

Before running the E2E tests, ensure you have:

1. **Docker Desktop** running (required for the application)
2. **Node.js** installed (for Playwright dependencies)
3. **Environment variables** configured (see below)

## Required Environment Variables

The E2E tests require authentication credentials to test login functionality. These must be set before running the tests:

| Variable | Description | Example |
|----------|-------------|---------|
| `E2E_USERNAME` | Username for test authentication | `demouser@microsoft.com` |
| `E2E_PASSWORD` | Password for test authentication | `Pass@word1` |

### Setting Environment Variables

#### Option 1: Using a .env file (Recommended)

Create a `.env` file in the root directory of the project:

```bash
E2E_USERNAME=demouser@microsoft.com
E2E_PASSWORD=Pass@word1
```

The `.env` file is automatically loaded by the Playwright configuration and is excluded from version control.

#### Option 2: Export in your shell

For Unix-based systems (Linux/macOS):
```bash
export E2E_USERNAME=demouser@microsoft.com
export E2E_PASSWORD=Pass@word1
```

For Windows PowerShell:
```powershell
$env:E2E_USERNAME="demouser@microsoft.com"
$env:E2E_PASSWORD="Pass@word1"
```

For Windows Command Prompt:
```cmd
set E2E_USERNAME=demouser@microsoft.com
set E2E_PASSWORD=Pass@word1
```

#### Option 3: CI/CD Environment

For CI/CD pipelines, configure these as secrets in your CI system:
- GitHub Actions: Add as repository secrets
- Azure Pipelines: Add as pipeline variables (marked as secret)

## Running the Tests

### Install Dependencies

```bash
npm install
npx playwright install
```

### Run All Tests

```bash
npx playwright test
```

### Run Specific Test Suite

```bash
# Run only logged-in tests
npx playwright test --project="e2e tests logged in"

# Run only non-authenticated tests
npx playwright test --project="e2e tests without logged in"
```

### Run in UI Mode

```bash
npx playwright test --ui
```

### View Test Report

```bash
npx playwright show-report
```

## Test Structure

### Test Projects

The test suite is organized into three projects:

1. **setup** - Runs authentication setup (`login.setup.ts`)
2. **e2e tests logged in** - Tests requiring authentication (AddItemTest, RemoveItemTest)
3. **e2e tests without logged in** - Tests not requiring authentication (BrowseItemTest)

### Authentication Flow

The `login.setup.ts` file handles authentication:
- Validates that required environment variables are set
- Logs in using the provided credentials
- Saves authentication state to `playwright/.auth/user.json`
- Authenticated tests reuse this state for faster execution

## Test Files

- `login.setup.ts` - Authentication setup for logged-in tests
- `AddItemTest.spec.ts` - Tests for adding items to cart (requires login)
- `RemoveItemTest.spec.ts` - Tests for removing items from cart (requires login)
- `BrowseItemTest.spec.ts` - Tests for browsing catalog (no login required)

## Troubleshooting

### Error: "E2E_USERNAME is not set"

This means the environment variable is missing. Follow the instructions above to set it.

### Tests fail with "Timeout exceeded"

The application might not have started properly. Check:
- Docker Desktop is running
- No other service is using port 5045
- The application starts successfully with `dotnet run --project src/eShop.AppHost/eShop.AppHost.csproj`

### Authentication fails

Verify that:
- The credentials in your environment variables are correct
- The Identity service is running properly
- You're using valid test user credentials from the seeded data

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test Configuration](https://playwright.dev/docs/test-configuration)
- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
