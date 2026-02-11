# eShop Copilot Instructions

## Project Overview

This is **eShop**, a reference .NET application implementing an e-commerce website using a microservices-based architecture with [.NET Aspire](https://learn.microsoft.com/dotnet/aspire/).

## Technology Stack

- **.NET Version**: .NET 10 (SDK 10.0.100)
- **Framework**: .NET Aspire 13.1.0
- **Language**: C# with nullable reference types enabled
- **Database**: PostgreSQL with pgvector extension
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **API Communication**: gRPC and REST APIs
- **Authentication**: Duende IdentityServer with ASP.NET Core Identity
- **Testing**: MSTest (unit tests) and xUnit (functional tests)

## Solution Structure

```
src/
├── eShop.AppHost/          # Aspire orchestration host (startup project)
├── eShop.ServiceDefaults/  # Shared service configurations
├── Basket.API/             # Shopping basket microservice (gRPC)
├── Catalog.API/            # Product catalog microservice
├── Identity.API/           # Authentication service
├── Ordering.API/           # Order management microservice
├── Ordering.Domain/        # Domain layer for ordering
├── Ordering.Infrastructure/# Infrastructure layer for ordering
├── OrderProcessor/         # Background order processing service
├── PaymentProcessor/       # Payment handling service
├── WebApp/                 # Blazor web frontend
├── WebhookClient/          # Webhook consumer client
├── Webhooks.API/           # Webhook management service
├── EventBus/               # Event bus abstractions
├── EventBusRabbitMQ/       # RabbitMQ event bus implementation
└── IntegrationEventLogEF/  # EF Core integration event logging

tests/
├── Basket.UnitTests/
├── Catalog.FunctionalTests/
├── Ordering.UnitTests/
└── Ordering.FunctionalTests/
```

## Build & Run Commands

### Prerequisites
- Docker Desktop must be running
- .NET 10 SDK installed

### Build the solution
```bash
dotnet build eShop.Web.slnf
```

### Run the application
```bash
dotnet run --project src/eShop.AppHost/eShop.AppHost.csproj
```

### Run tests
```bash
dotnet test eShop.Web.slnf
```

## Project Conventions

### Code Style
- **Implicit usings**: Enabled globally
- **Nullable reference types**: Enabled (`<Nullable>enable</Nullable>`)
- **Warnings as errors**: `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`

### Package Management
- Uses **Central Package Management** (`Directory.Packages.props`)
- Do not specify package versions in individual `.csproj` files

### Project SDK Types
- **Web APIs**: `Microsoft.NET.Sdk.Web`
- **Class Libraries**: `Microsoft.NET.Sdk`
- **Aspire Host**: `Aspire.AppHost.Sdk/13.1.0`
- **MSTest Projects**: `MSTest.Sdk`

### Testing
- **Unit tests**: Use MSTest framework with NSubstitute for mocking
- **Functional tests**: Use xUnit with Aspire test host (requires Docker)
- Test analysis mode: `<MSTestAnalysisMode>Recommended</MSTestAnalysisMode>`

### Architecture Patterns
- **Domain-Driven Design (DDD)**: Applied in Ordering bounded context
- **CQRS with MediatR**: Used in Ordering.API
- **Integration Events**: For cross-service communication via RabbitMQ
- **Repository Pattern**: For data access abstraction

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `Aspire.*` | .NET Aspire hosting and components |
| `MediatR` | CQRS and mediator pattern (v13.0.0) |
| `FluentValidation` | Request validation |
| `Grpc.AspNetCore` | gRPC services |
| `Duende.IdentityServer` | OAuth/OIDC authentication |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | PostgreSQL EF Core provider |
| `Pgvector` | Vector similarity search for AI features |

## OpenAI/Ollama Integration

AI features are disabled by default. To enable:
1. Set `useOpenAI = true` or `useOllama = true` in `src/eShop.AppHost/Program.cs`
2. Configure connection strings in `appsettings.json`

## Adding New Services

1. Create project under `src/` with appropriate SDK
2. Reference `eShop.ServiceDefaults` for standard configurations
3. Register in `src/eShop.AppHost/Program.cs` using Aspire builder
4. Add to solution filter `eShop.Web.slnf` if web-related
