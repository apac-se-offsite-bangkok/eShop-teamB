# Copilot Coding Agent Instructions

This file tells GitHub Copilot how to autonomously work on issues in this repository.

## Repository Overview

eShop is a .NET Aspire microservices e-commerce application with:
- **Backend**: Multiple .NET 10 APIs (Catalog, Ordering, Basket, Identity, Webhooks)
- **Frontend**: Blazor WebApp
- **Infrastructure**: PostgreSQL, Redis, RabbitMQ
- **Architecture**: DDD in Ordering, simple CRUD in Catalog

## Build Commands

```bash
# Build the entire solution
dotnet build eShop.Web.slnf

# Build a specific project
dotnet build src/Catalog.API/Catalog.API.csproj
```

## Test Commands

```bash
# Run all tests
dotnet test eShop.Web.slnf

# Run specific test project
dotnet test tests/Ordering.UnitTests/Ordering.UnitTests.csproj

# Run with verbose output
dotnet test eShop.Web.slnf --logger "console;verbosity=detailed"
```

**Note**: Functional tests require Docker to be running (they spin up PostgreSQL containers).

## Run the Application

```bash
# Start the Aspire host (requires Docker)
dotnet run --project src/eShop.AppHost/eShop.AppHost.csproj
```

## Project Structure

```
src/
├── eShop.AppHost/           # Aspire orchestration (startup project)
├── eShop.ServiceDefaults/   # Shared service configurations
├── Catalog.API/             # Product catalog (Minimal APIs, direct DbContext)
├── Ordering.API/            # Orders (CQRS, MediatR, DDD)
├── Ordering.Domain/         # Domain entities, aggregates, events
├── Ordering.Infrastructure/ # EF Core, repositories
├── Basket.API/              # Shopping basket (gRPC, Redis)
├── Identity.API/            # Authentication (Duende IdentityServer)
├── WebApp/                  # Blazor frontend
└── EventBusRabbitMQ/        # Integration events

tests/
├── Ordering.UnitTests/      # MSTest + NSubstitute
├── Ordering.FunctionalTests/# Aspire integration tests
├── Catalog.FunctionalTests/ # Aspire integration tests
└── Basket.UnitTests/        # MSTest + NSubstitute
```

## Code Conventions

### General
- Target framework: `net10.0`
- Nullable reference types: enabled
- Implicit usings: enabled
- Warnings as errors: enabled

### Package Management
- Uses Central Package Management (`Directory.Packages.props`)
- Do NOT add version numbers to `<PackageReference>` in `.csproj` files
- Add new package versions to `Directory.Packages.props`

### API Development
- Use Minimal APIs (not Controllers)
- Use typed results: `Results<Ok<T>, NotFound, BadRequest<ProblemDetails>>`
- Use `[AsParameters]` for dependency aggregation
- Include OpenAPI metadata: `.WithName()`, `.WithSummary()`, `.WithTags()`

### Domain Layer (Ordering)
- Entities inherit from `Entity` base class
- Aggregate roots implement `IAggregateRoot`
- Use private setters, expose read-only collections
- Raise domain events via `AddDomainEvent()`

### Testing
- Framework: MSTest with `[TestClass]` and `[TestMethod]`
- Mocking: NSubstitute
- Naming: `MethodName_Scenario_ExpectedResult`
- Functional tests use Aspire `WebApplicationFactory<Program>`

## Making Changes

### Adding a New API Endpoint

1. Add endpoint method in `*Api.cs` file (e.g., `CatalogApi.cs`)
2. Use typed results and proper HTTP methods
3. Add OpenAPI metadata
4. Register in the `Map*Api()` extension method

### Adding a New Entity (Ordering Domain)

1. Create entity in `src/Ordering.Domain/AggregatesModel/`
2. If aggregate root, implement `IAggregateRoot`
3. Add DbSet to `OrderingContext`
4. Create repository if needed
5. Add unit tests

### Adding a New Test

1. Create test class with `[TestClass]` attribute
2. Use constructor for test setup and mocking
3. Follow naming convention
4. Use `Assert.*` methods from MSTest

## PR Guidelines

### Commit Messages
- Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
- Keep messages concise but descriptive

### PR Description
- Explain what changed and why
- Reference the issue being fixed: `Fixes #123`
- List any breaking changes

### Before Submitting
1. Run `dotnet build eShop.Web.slnf` — must pass
2. Run `dotnet test eShop.Web.slnf` — must pass
3. No new warnings (warnings are errors)

## Common Tasks

### "Add a new field to CatalogItem"
1. Update `src/Catalog.API/Model/CatalogItem.cs`
2. Add EF migration if needed
3. Update any DTOs/projections
4. Update tests

### "Add a new endpoint to Ordering API"
1. Add command/query in `src/Ordering.API/Application/`
2. Add handler with MediatR
3. Add endpoint in `src/Ordering.API/Apis/OrdersApi.cs`
4. Add unit tests for handler
5. Add functional test if needed

### "Fix a bug in Basket service"
1. Reproduce with a test first (TDD)
2. Fix the code
3. Verify test passes
4. Check related tests still pass

## Environment Requirements

- .NET 10 SDK
- Docker Desktop (for running app and functional tests)
- PostgreSQL, Redis, RabbitMQ (provided via Docker/Aspire)
